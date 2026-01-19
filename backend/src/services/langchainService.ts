import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config } from '../config';
import type { Turn, InterviewContext } from '../types';

// Model cache with TTL
interface CachedModel {
  model: BaseChatModel;
  createdAt: number;
  lastUsed: number;
}

const MODEL_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_SIZE = 3;
const CACHE_CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

// Active generation tracking for cancellation
const activeGenerations = new Set<string>();

// FIX: Timeout for LLM streaming to prevent hanging connections
const LLM_STREAM_TIMEOUT_MS = 60000; // 60 seconds

// Helper to create a timeout promise
function createTimeout(ms: number, generationId: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      activeGenerations.delete(generationId);
      reject(new Error(`LLM stream timeout after ${ms}ms`));
    }, ms);
  });
}

class LangChainService {
  private modelCache = new Map<string, CachedModel>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCacheCleanup();
  }

  private startCacheCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.modelCache.entries()) {
        if (now - cached.lastUsed > MODEL_TTL_MS) {
          this.modelCache.delete(key);
          console.log(`[LangChain] Evicted stale model: ${key}`);
        }
      }
    }, CACHE_CLEANUP_INTERVAL_MS);
  }

  private getModel(modelName: string): BaseChatModel {
    const cached = this.modelCache.get(modelName);
    if (cached) {
      cached.lastUsed = Date.now();
      return cached.model;
    }

    // Evict LRU if at capacity
    if (this.modelCache.size >= MAX_CACHE_SIZE) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      for (const [key, c] of this.modelCache.entries()) {
        if (c.lastUsed < oldestTime) {
          oldestTime = c.lastUsed;
          oldestKey = key;
        }
      }
      if (oldestKey) {
        this.modelCache.delete(oldestKey);
        console.log(`[LangChain] Evicted LRU model: ${oldestKey}`);
      }
    }

    let model: BaseChatModel;

    if (modelName.startsWith('gpt-')) {
      model = new ChatOpenAI({
        modelName,
        apiKey: config.openaiApiKey,
        streaming: true,
        temperature: 0.7,
      });
    } else if (modelName.startsWith('gemini-')) {
      model = new ChatGoogleGenerativeAI({
        model: modelName,
        apiKey: config.googleApiKey,
        streaming: true,
        temperature: 0.7,
      });
    } else {
      model = new ChatOpenAI({
        modelName: 'gpt-4o-mini',
        apiKey: config.openaiApiKey,
        streaming: true,
        temperature: 0.7,
      });
    }

    this.modelCache.set(modelName, {
      model,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    });

    return model;
  }

  // Safe content extraction from different provider chunks
  private extractContent(chunk: any): string {
    // LangChain AIMessageChunk
    if (chunk?.content !== undefined) {
      if (typeof chunk.content === 'string') {
        return chunk.content;
      }
      if (Array.isArray(chunk.content)) {
        return chunk.content
          .map((c: any) => (typeof c === 'string' ? c : c?.text || ''))
          .join('');
      }
    }
    // Fallback for raw text
    if (typeof chunk === 'string') {
      return chunk;
    }
    // Gemini format
    if (chunk?.text) {
      return chunk.text;
    }
    return '';
  }

  // Register generation for cancellation tracking
  registerGeneration(generationId: string): void {
    activeGenerations.add(generationId);
  }

  // Cancel a generation
  cancelGeneration(generationId: string): void {
    activeGenerations.delete(generationId);
  }

  // Check if generation is still active
  isGenerationActive(generationId: string): boolean {
    return activeGenerations.has(generationId);
  }

  // Single combined analysis - reduces parallel calls
  async *streamCombinedAnalysis(
    question: string,
    answer: string,
    turns: Turn[],
    interviewContext: InterviewContext,
    language: string,
    generationId: string,
    modelName: string = 'gpt-4o-mini'
  ): AsyncGenerator<{ type: 'analysis' | 'questions' | 'rating'; content: string }> {
    this.registerGeneration(generationId);
    const model = this.getModel(modelName);

    const recentContext = turns.slice(-4).map(t => 
      `${t.speaker === 'interviewer' ? 'Q' : 'A'}: ${t.text.substring(0, 150)}`
    ).join('\n');

    const systemPrompt = `You are an expert interview analyst for a ${interviewContext.role} position (${interviewContext.experienceLevel} level).
Required Skills: ${interviewContext.requiredSkills.join(', ')}

Analyze the Q&A and respond in this EXACT format:

===ANALYSIS===
**Score: X/5**
**Strengths:** [bullet points]
**Concerns:** [bullet points or "None"]
**Probe:** [what to dig deeper on]

===QUESTIONS===
• [Follow-up question 1]
• [Follow-up question 2]
• [Follow-up question 3]

===RATING===
**Rating: X/5**
**Reason:** [1-2 sentences]

Be specific. Reference the actual answer content.
Language: ${language}`;

    const userMessage = recentContext 
      ? `Context:\n${recentContext}\n\n---\n\nQuestion: ${question}\n\nAnswer: ${answer}`
      : `Question: ${question}\n\nAnswer: ${answer}`;

    try {
      // FIX: Add timeout wrapper to prevent hanging streams
      const streamPromise = model.stream([
        new SystemMessage(systemPrompt),
        new HumanMessage(userMessage)
      ]);
      
      const stream = await Promise.race([
        streamPromise,
        createTimeout(LLM_STREAM_TIMEOUT_MS, generationId)
      ]);

      let buffer = '';
      let currentSection: 'analysis' | 'questions' | 'rating' = 'analysis';
      let lastChunkTime = Date.now();

      for await (const chunk of stream) {
        // Check cancellation
        if (!this.isGenerationActive(generationId)) {
          console.log(`[LangChain] Generation cancelled: ${generationId}`);
          break;
        }
        
        // FIX: Check for chunk-level timeout (no data for 30 seconds)
        const now = Date.now();
        if (now - lastChunkTime > 30000) {
          console.log(`[LangChain] Chunk timeout: ${generationId}`);
          break;
        }
        lastChunkTime = now;

        const content = this.extractContent(chunk);
        if (!content) continue;

        buffer += content;

        // FIX: Improved section detection and streaming
        // Only process section markers when we have complete markers
        while (true) {
          // Check for QUESTIONS section marker
          if (currentSection === 'analysis' && buffer.includes('===QUESTIONS===')) {
            const parts = buffer.split('===QUESTIONS===');
            const analysisContent = parts[0].replace('===ANALYSIS===', '').trim();
            if (analysisContent) {
              yield { type: 'analysis', content: analysisContent };
            }
            buffer = parts.slice(1).join('===QUESTIONS==='); // Handle edge case of multiple markers
            currentSection = 'questions';
            continue;
          }
          
          // Check for RATING section marker
          if (currentSection === 'questions' && buffer.includes('===RATING===')) {
            const parts = buffer.split('===RATING===');
            const questionsContent = parts[0].trim();
            if (questionsContent) {
              yield { type: 'questions', content: questionsContent };
            }
            buffer = parts.slice(1).join('===RATING===');
            currentSection = 'rating';
            continue;
          }
          
          break; // No more section markers to process
        }
        
        // Stream content incrementally for better UX (but not too frequently)
        // Only flush if we have substantial content and no pending section marker
        const hasPendingMarker = buffer.includes('===') || buffer.includes('==');
        if (buffer.length > 100 && !hasPendingMarker) {
          yield { type: currentSection, content: buffer };
          buffer = '';
        }
      }

      // Flush remaining content
      const finalContent = buffer.replace(/^===\w+===\s*/, '').trim();
      if (finalContent) {
        yield { type: currentSection, content: finalContent };
      }

    } catch (error) {
      console.error('Error in streamCombinedAnalysis:', error);
      throw error;
    } finally {
      this.cancelGeneration(generationId);
    }
  }

  // Legacy individual methods for backward compatibility
  async *streamAnalysis(
    turns: Turn[],
    currentQuestion: string,
    candidateAnswer: string,
    interviewContext: InterviewContext,
    language: string,
    modelName: string = 'gpt-4o-mini'
  ): AsyncGenerator<string> {
    const generationId = `analysis-${Date.now()}`;
    this.registerGeneration(generationId);
    const model = this.getModel(modelName);

    const recentContext = turns.slice(-4).map(t => 
      `${t.speaker === 'interviewer' ? 'Q' : 'A'}: ${t.text.substring(0, 150)}`
    ).join('\n');

    const systemPrompt = `Analyze this ${interviewContext.role} interview response (${interviewContext.experienceLevel} level).
Skills: ${interviewContext.requiredSkills.join(', ')}

Format:
**Score: X/5**
**Strengths:** [bullet points]
**Concerns:** [bullet points or "None"]
**Probe:** [what to explore next]

Be specific. Language: ${language}`;

    try {
      const userMessage = recentContext 
        ? `Context:\n${recentContext}\n\n---\n\nQ: ${currentQuestion}\n\nA: ${candidateAnswer}`
        : `Q: ${currentQuestion}\n\nA: ${candidateAnswer}`;

      const stream = await model.stream([
        new SystemMessage(systemPrompt),
        new HumanMessage(userMessage)
      ]);

      for await (const chunk of stream) {
        if (!this.isGenerationActive(generationId)) break;
        const content = this.extractContent(chunk);
        if (content) yield content;
      }
    } catch (error) {
      console.error('Error in streamAnalysis:', error);
      throw error;
    } finally {
      this.cancelGeneration(generationId);
    }
  }

  async *streamQuestionSuggestions(
    turns: Turn[],
    interviewContext: InterviewContext,
    coveredTopics: string[],
    language: string,
    modelName: string = 'gpt-4o-mini'
  ): AsyncGenerator<string> {
    const generationId = `questions-${Date.now()}`;
    this.registerGeneration(generationId);
    const model = this.getModel(modelName);

    const recentQA = turns.slice(-6).map(t => 
      `${t.speaker === 'interviewer' ? 'Q' : 'A'}: ${t.text.substring(0, 100)}`
    ).join('\n');

    const systemPrompt = `Suggest 3 follow-up questions for a ${interviewContext.role} interview (${interviewContext.experienceLevel}).
Skills: ${interviewContext.requiredSkills.join(', ')}
Covered: ${coveredTopics.join(', ') || 'None'}

Format: One question per line with bullet point.
Be specific, not generic. Language: ${language}`;

    try {
      const stream = await model.stream([
        new SystemMessage(systemPrompt),
        new HumanMessage(recentQA || 'Interview starting. Suggest opening questions.')
      ]);

      for await (const chunk of stream) {
        if (!this.isGenerationActive(generationId)) break;
        const content = this.extractContent(chunk);
        if (content) yield content;
      }
    } catch (error) {
      console.error('Error in streamQuestionSuggestions:', error);
      throw error;
    } finally {
      this.cancelGeneration(generationId);
    }
  }

  async *streamRatingSuggestion(
    question: string,
    answer: string,
    competency: string,
    interviewContext: InterviewContext,
    modelName: string = 'gpt-4o-mini'
  ): AsyncGenerator<string> {
    const generationId = `rating-${Date.now()}`;
    this.registerGeneration(generationId);
    const model = this.getModel(modelName);

    const systemPrompt = `Rate this ${interviewContext.role} response for "${competency}" (${interviewContext.experienceLevel} level).

Scale: 1=Poor, 2=Below Avg, 3=Average, 4=Good, 5=Excellent

Format:
**Rating: X/5**
**Reason:** [1-2 sentences with specific references]`;

    try {
      const stream = await model.stream([
        new SystemMessage(systemPrompt),
        new HumanMessage(`Q: ${question}\n\nA: ${answer}`)
      ]);

      for await (const chunk of stream) {
        if (!this.isGenerationActive(generationId)) break;
        const content = this.extractContent(chunk);
        if (content) yield content;
      }
    } catch (error) {
      console.error('Error in streamRatingSuggestion:', error);
      throw error;
    } finally {
      this.cancelGeneration(generationId);
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.modelCache.clear();
    activeGenerations.clear();
  }
}

export const langchainService = new LangChainService();
