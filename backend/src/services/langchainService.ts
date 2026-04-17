/**
 * LangChain service — LLM streaming for interview analysis.
 * Supports OpenAI (gpt-*) and Google (gemini-*) models with an LRU cache,
 * per-generation cancellation, and chunk-level timeout protection.
 */

import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { config } from "../config";
import type { Turn, InterviewContext, TopicProgress, InterviewStage } from "../types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODEL_TTL_MS = 10 * 60 * 1_000;       // 10 min
const MAX_CACHE_SIZE = 3;
const CACHE_CLEANUP_INTERVAL_MS = 60 * 1_000; // 1 min
const LLM_STREAM_TIMEOUT_MS = 60_000;          // 60 s initial connect
const CHUNK_IDLE_TIMEOUT_MS = 30_000;          // 30 s between chunks

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CachedModel {
  model: BaseChatModel;
  createdAt: number;
  lastUsed: number;
}

export type AnalysisSection = "analysis" | "questions" | "rating";

export interface AnalysisChunk {
  type: AnalysisSection;
  content: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Rejects after `ms` milliseconds and removes the generation from the set. */
function rejectAfter(ms: number, label: string): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`[LangChain] Timed out after ${ms} ms (${label})`)),
      ms
    )
  );
}

/** Extracts a text string from any LangChain / Gemini chunk shape. */
function extractContent(chunk: unknown): string {
  if (typeof chunk === "string") return chunk;
  if (chunk === null || typeof chunk !== "object") return "";

  const c = chunk as Record<string, unknown>;

  if (c.content !== undefined) {
    if (typeof c.content === "string") return c.content;
    if (Array.isArray(c.content)) {
      return (c.content as unknown[])
        .map((item) =>
          typeof item === "string"
            ? item
            : typeof item === "object" && item !== null
            ? String((item as Record<string, unknown>).text ?? "")
            : ""
        )
        .join("");
    }
  }

  if (typeof c.text === "string") return c.text;
  return "";
}

/** Truncates a turn to a readable summary line. */
function summariseTurn(t: Turn, maxChars = 150): string {
  const prefix = t.speaker === "interviewer" ? "Q" : "A";
  return `${prefix}: ${t.text.substring(0, maxChars)}`;
}

// ---------------------------------------------------------------------------
// Model factory
// ---------------------------------------------------------------------------

function buildModel(modelName: string): BaseChatModel {
  const shared = { streaming: true, temperature: 0.7 } as const;

  if (modelName.startsWith("gpt-")) {
    return new ChatOpenAI({ modelName, apiKey: config.openaiApiKey, ...shared });
  }

  if (modelName.startsWith("gemini-")) {
    return new ChatGoogleGenerativeAI({
      model: modelName,
      apiKey: config.googleApiKey,
      ...shared,
    });
  }

  // Unknown model — fall back to a cheap default and warn.
  console.warn(
    `[LangChain] Unknown model "${modelName}", falling back to gpt-4o-mini`
  );
  return new ChatOpenAI({
    modelName: "gpt-4o-mini",
    apiKey: config.openaiApiKey,
    ...shared,
  });
}

// ---------------------------------------------------------------------------
// LangChainService
// ---------------------------------------------------------------------------

class LangChainService {
  private readonly modelCache = new Map<string, CachedModel>();
  /** IDs of in-flight generations. Removal = cancellation signal. */
  private readonly activeGenerations = new Set<string>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startCacheCleanup();
  }

  // -------------------------------------------------------------------------
  // Model cache
  // -------------------------------------------------------------------------

  private startCacheCleanup(): void {
    this.cleanupTimer = setInterval(() => {
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

    // Evict LRU entry if at capacity.
    if (this.modelCache.size >= MAX_CACHE_SIZE) {
      let lruKey: string | null = null;
      let lruTime = Infinity;
      for (const [key, c] of this.modelCache.entries()) {
        if (c.lastUsed < lruTime) {
          lruTime = c.lastUsed;
          lruKey = key;
        }
      }
      if (lruKey) {
        this.modelCache.delete(lruKey);
        console.log(`[LangChain] Evicted LRU model: ${lruKey}`);
      }
    }

    const model = buildModel(modelName);
    this.modelCache.set(modelName, {
      model,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    });
    return model;
  }

  // -------------------------------------------------------------------------
  // Generation lifecycle
  // -------------------------------------------------------------------------

  registerGeneration(id: string): void {
    this.activeGenerations.add(id);
  }

  cancelGeneration(id: string): void {
    this.activeGenerations.delete(id);
  }

  isGenerationActive(id: string): boolean {
    return this.activeGenerations.has(id);
  }

  // -------------------------------------------------------------------------
  // Low-level streaming wrapper
  // -------------------------------------------------------------------------

  /**
   * Streams chunks from the model, handling:
   * - Initial connect timeout
   * - Per-chunk idle timeout
   * - Cancellation
   */
  private async *streamModel(
    model: BaseChatModel,
    messages: [SystemMessage, HumanMessage],
    generationId: string
  ): AsyncGenerator<string> {
    console.log(`[LangChain] streamModel START | genId=${generationId} sysPromptLen=${messages[0].content.toString().length} userMsgLen=${messages[1].content.toString().length}`);
    const streamStartTime = Date.now();
    const stream = await Promise.race([
      model.stream(messages),
      rejectAfter(LLM_STREAM_TIMEOUT_MS, `connect:${generationId}`),
    ]);
    console.log(`[LangChain] Stream connected in ${Date.now() - streamStartTime}ms | genId=${generationId}`);

    let lastChunk = Date.now();
    let chunkCount = 0;
    let totalChars = 0;

    for await (const chunk of stream) {
      if (!this.isGenerationActive(generationId)) {
        console.log(`[LangChain] Cancelled after ${chunkCount} chunks: ${generationId}`);
        return;
      }

      const now = Date.now();
      if (now - lastChunk > CHUNK_IDLE_TIMEOUT_MS) {
        console.warn(`[LangChain] Chunk idle timeout after ${chunkCount} chunks: ${generationId}`);
        return;
      }
      lastChunk = now;

      const text = extractContent(chunk);
      if (text) {
        chunkCount++;
        totalChars += text.length;
        if (chunkCount === 1) {
          console.log(`[LangChain] First chunk (${text.length} chars): "${text.substring(0, 60)}" | genId=${generationId}`);
        }
        yield text;
      }
    }
    console.log(`[LangChain] streamModel END | genId=${generationId} chunks=${chunkCount} totalChars=${totalChars} elapsed=${Date.now() - streamStartTime}ms`);
  }

  // -------------------------------------------------------------------------
  // Combined analysis (primary method)
  // -------------------------------------------------------------------------

  /**
   * Streams a structured analysis, follow-up questions, and a rating in one
   * LLM call. Yields typed chunks as each section is parsed out.
   *
   * Section delimiters in the model response: `===ANALYSIS===`,
   * `===QUESTIONS===`, `===RATING===`.
   */
  async *streamCombinedAnalysis(
    question: string,
    answer: string,
    turns: Turn[],
    interviewContext: InterviewContext,
    language: string,
    generationId: string,
    modelName = "gpt-4o-mini"
  ): AsyncGenerator<AnalysisChunk> {
    console.log(`[LangChain] streamCombinedAnalysis START | genId=${generationId} model=${modelName}`);
    console.log(`[LangChain]   Q: "${question?.substring(0, 80)}"`);
    console.log(`[LangChain]   A: "${answer?.substring(0, 80)}"`);
    console.log(`[LangChain]   turns: ${turns?.length || 0}, role: ${interviewContext?.role}`);
    this.registerGeneration(generationId);
    const model = this.getModel(modelName);

    const recentContext = turns
      .slice(-4)
      .map((t) => summariseTurn(t))
      .join("\n");

    const systemPrompt = buildCombinedSystemPrompt(interviewContext, language);
    const userMessage = recentContext
      ? `Context:\n${recentContext}\n\n---\n\nQuestion: ${question}\n\nAnswer: ${answer}`
      : `Question: ${question}\n\nAnswer: ${answer}`;
    console.log(`[LangChain]   systemPromptLen=${systemPrompt.length} userMsgLen=${userMessage.length}`);

    try {
      let buffer = "";
      let currentSection: AnalysisSection = "analysis";

      for await (const text of this.streamModel(
        model,
        [new SystemMessage(systemPrompt), new HumanMessage(userMessage)],
        generationId
      )) {
        buffer += text;

        // Flush complete sections as they arrive.
        let advanced = true;
        while (advanced) {
          advanced = false;

          if (currentSection === "analysis" && buffer.includes("===QUESTIONS===")) {
            const [before, ...rest] = buffer.split("===QUESTIONS===");
            const content = before.replace("===ANALYSIS===", "").trim();
            if (content) yield { type: "analysis", content };
            buffer = rest.join("===QUESTIONS===");
            currentSection = "questions";
            advanced = true;
          }

          if (currentSection === "questions" && buffer.includes("===RATING===")) {
            const [before, ...rest] = buffer.split("===RATING===");
            const content = before.trim();
            if (content) yield { type: "questions", content };
            buffer = rest.join("===RATING===");
            currentSection = "rating";
            advanced = true;
          }
        }

        // Incrementally yield within-section content to keep the UI responsive,
        // but only when there is no partial section marker in the buffer.
        const hasPartialMarker = buffer.includes("=");
        if (buffer.length > 100 && !hasPartialMarker) {
          yield { type: currentSection, content: buffer };
          buffer = "";
        }
      }

      // Flush anything remaining.
      const tail = buffer.replace(/^===\w+===\s*/, "").trim();
      if (tail) yield { type: currentSection, content: tail };
    } catch (error) {
      console.error("[LangChain] streamCombinedAnalysis error:", error);
      throw error;
    } finally {
      this.cancelGeneration(generationId);
    }
  }

  // -------------------------------------------------------------------------
  // Individual methods (legacy — kept for backward compatibility)
  // -------------------------------------------------------------------------

  async *streamAnalysis(
    turns: Turn[],
    currentQuestion: string,
    candidateAnswer: string,
    interviewContext: InterviewContext,
    language: string,
    modelName = "gpt-4o-mini"
  ): AsyncGenerator<string> {
    const generationId = `analysis-${Date.now()}`;
    this.registerGeneration(generationId);
    const model = this.getModel(modelName);

    const recentContext = turns
      .slice(-4)
      .map((t) => summariseTurn(t))
      .join("\n");

    const systemPrompt = `Analyze this ${interviewContext.role} interview response (${interviewContext.experienceLevel} level).
Skills: ${interviewContext.requiredSkills.join(", ")}

Format:
**Score: X/5**
**Strengths:** [bullet points]
**Concerns:** [bullet points or "None"]
**Probe:** [what to explore next]

Be specific. Language: ${language}`;

    const userMessage = recentContext
      ? `Context:\n${recentContext}\n\n---\n\nQ: ${currentQuestion}\n\nA: ${candidateAnswer}`
      : `Q: ${currentQuestion}\n\nA: ${candidateAnswer}`;

    try {
      yield* this.streamModel(
        model,
        [new SystemMessage(systemPrompt), new HumanMessage(userMessage)],
        generationId
      );
    } catch (error) {
      console.error("[LangChain] streamAnalysis error:", error);
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
    modelName = "gpt-4o-mini"
  ): AsyncGenerator<string> {
    const generationId = `questions-${Date.now()}`;
    this.registerGeneration(generationId);
    const model = this.getModel(modelName);

    const recentQA = turns
      .slice(-6)
      .map((t) => summariseTurn(t, 100))
      .join("\n");

    const systemPrompt = `Suggest 3 follow-up questions for a ${interviewContext.role} interview (${interviewContext.experienceLevel}).
Skills: ${interviewContext.requiredSkills.join(", ")}
Covered: ${coveredTopics.join(", ") || "None"}

Format: One question per line with bullet point.
Be specific, not generic. Language: ${language}`;

    try {
      yield* this.streamModel(
        model,
        [
          new SystemMessage(systemPrompt),
          new HumanMessage(
            recentQA || "Interview starting. Suggest opening questions."
          ),
        ],
        generationId
      );
    } catch (error) {
      console.error("[LangChain] streamQuestionSuggestions error:", error);
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
    modelName = "gpt-4o-mini"
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
      yield* this.streamModel(
        model,
        [
          new SystemMessage(systemPrompt),
          new HumanMessage(`Q: ${question}\n\nA: ${answer}`),
        ],
        generationId
      );
    } catch (error) {
      console.error("[LangChain] streamRatingSuggestion error:", error);
      throw error;
    } finally {
      this.cancelGeneration(generationId);
    }
  }

  // -------------------------------------------------------------------------
  // Structured next-question generation (Co-Pilot)
  // -------------------------------------------------------------------------

  /**
   * Streams a single structured next-question recommendation based on
   * interview progress, topic coverage, stage, and adaptive difficulty.
   * Output is a JSON object matching NextQuestionResponse.
   */
  async *streamStructuredNextQuestion(
    interviewContext: InterviewContext,
    turns: Turn[],
    topicProgress: TopicProgress[],
    pendingTopics: string[],
    questionsAsked: string[],
    lastAnswerSummary: string | undefined,
    lastAnswerScore: number | undefined,
    currentStage: InterviewStage,
    totalQuestionsAsked: number,
    language: string,
    generationId: string,
    modelName = "gpt-4o-mini"
  ): AsyncGenerator<string> {
    console.log(`[LangChain] streamStructuredNextQuestion START | genId=${generationId} model=${modelName}`);
    console.log(`[LangChain]   stage=${currentStage} totalQ=${totalQuestionsAsked} pending=[${pendingTopics?.join(',')}] lastScore=${lastAnswerScore}`);
    this.registerGeneration(generationId);
    const model = this.getModel(modelName);

    const systemPrompt = buildNextQuestionSystemPrompt(
      interviewContext,
      topicProgress,
      pendingTopics,
      questionsAsked,
      lastAnswerSummary,
      lastAnswerScore,
      currentStage,
      totalQuestionsAsked,
      language
    );
    console.log(`[LangChain]   systemPromptLen=${systemPrompt.length}`);

    const recentContext = turns
      .slice(-6)
      .map((t) => summariseTurn(t, 120))
      .join("\n");

    const userMessage = recentContext
      ? `Recent interview transcript:\n${recentContext}\n\nGenerate the next question.`
      : "Interview is starting. Generate the first question.";
    console.log(`[LangChain]   userMsgLen=${userMessage.length} recentTurns=${turns?.slice(-6).length || 0}`);

    try {
      yield* this.streamModel(
        model,
        [new SystemMessage(systemPrompt), new HumanMessage(userMessage)],
        generationId
      );
    } catch (error) {
      console.error("[LangChain] streamStructuredNextQuestion error:", error);
      throw error;
    } finally {
      this.cancelGeneration(generationId);
    }
  }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  destroy(): void {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    this.modelCache.clear();
    this.activeGenerations.clear();
  }
}

// ---------------------------------------------------------------------------
// Prompt builders (top-level so they are easy to test/tweak independently)
// ---------------------------------------------------------------------------

function buildCombinedSystemPrompt(
  ctx: InterviewContext,
  language: string
): string {
  const resumeSection = ctx.candidateResume
    ? `\nCandidate Resume:\n${ctx.candidateResume.substring(0, 3000)}\n`
    : "";
  const jdSection = ctx.jobDescription
    ? `\nJob Description:\n${ctx.jobDescription.substring(0, 500)}\n`
    : "";

  return `You are an expert interview analyst for a ${ctx.role} position (${ctx.experienceLevel} level).
Required Skills: ${ctx.requiredSkills.join(", ")}${resumeSection}${jdSection}

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
Align your analysis with the job requirements and required skills.
Language: ${language}`;
}

// ---------------------------------------------------------------------------
// Structured next-question prompt builder (Co-Pilot system prompt)
// ---------------------------------------------------------------------------

function buildNextQuestionSystemPrompt(
  ctx: InterviewContext,
  topicProgress: TopicProgress[],
  pendingTopics: string[],
  questionsAsked: string[],
  lastAnswerSummary: string | undefined,
  lastAnswerScore: number | undefined,
  currentStage: InterviewStage,
  totalQuestionsAsked: number,
  language: string
): string {
  const jdSection = ctx.jobDescription
    ? `Job Description Summary:\n${ctx.jobDescription.substring(0, 600)}`
    : `Role: ${ctx.role} at ${ctx.company}`;

  const resumeSection = ctx.candidateResume
    ? `Candidate Resume Summary:\n${ctx.candidateResume.substring(0, 600)}`
    : `Candidate: ${ctx.candidateName} (${ctx.experienceLevel} level)`;

  const coveredSection = topicProgress.length > 0
    ? topicProgress.map(tp =>
        `- ${tp.topic}: ${tp.questionsAsked} questions asked, depth=${tp.depth}${tp.lastScore ? `, last score=${tp.lastScore}/5` : ""}`
      ).join("\n")
    : "None yet";

  const pendingSection = pendingTopics.length > 0
    ? pendingTopics.join(", ")
    : "All topics covered";

  const previousQuestions = questionsAsked.length > 0
    ? questionsAsked.slice(-10).map((q, i) => `${i + 1}. ${q}`).join("\n")
    : "None yet";

  const lastAnswerSection = lastAnswerSummary
    ? `Last Answer Evaluation: Score ${lastAnswerScore ?? "N/A"}/5\n${lastAnswerSummary.substring(0, 300)}`
    : "No previous answer evaluated yet";

  const difficultyGuidance = lastAnswerScore !== undefined
    ? lastAnswerScore <= 2
      ? "The candidate struggled with the last question. Ask a SIMPLER or CLARIFYING question on the same or related topic."
      : lastAnswerScore >= 4
        ? "The candidate answered strongly. INCREASE difficulty or go DEEPER on the topic."
        : "The candidate gave an average answer. Maintain current difficulty level."
    : "This is the start of the interview. Begin with an appropriate question for the current stage.";

  return `You are a structured AI Interview Co-Pilot assisting a human interviewer.
Your job is to generate the SINGLE best next interview question.

## CONTEXT
${jdSection}
${resumeSection}
Required Skills: ${ctx.requiredSkills.join(", ")}
Experience Level: ${ctx.experienceLevel}
Current Stage: ${currentStage}
Total Questions Asked: ${totalQuestionsAsked}
Language: ${language}

## COVERED TOPICS
${coveredSection}

## PENDING TOPICS
${pendingSection}

## PREVIOUS QUESTIONS (for dedup)
${previousQuestions}

## LAST ANSWER EVALUATION
${lastAnswerSection}

## ADAPTIVE DIFFICULTY
${difficultyGuidance}

## STRICT RULES
1. JD + Resume Awareness: Align questions with job requirements. Prioritize candidate\'s experience.
2. Topic Coverage: Ensure all important topics are covered. Do NOT focus on only one topic. Ask max 2-3 questions per topic, then switch.
3. Controlled Topic Switching: Switch topics only when enough depth (2-3 questions) OR topic is exhausted. Transitions must be logical (e.g., Java → Spring → Microservices, NOT Java → HR → Finance).
4. No Repetition: Do NOT repeat any question from the PREVIOUS QUESTIONS list. Do NOT ask similar variations unless deep probing is needed.
5. Stage-Based Flow: Follow this progression: Intro → Basic → Core → Advanced → Behavioral. Current stage is ${currentStage}.
6. Adaptive Difficulty: ${difficultyGuidance}
7. Depth vs Breadth: Ensure both follow-up depth AND multi-topic breadth.
8. Real-World Focus: Prefer practical, scenario-based questions. Avoid purely theoretical questions.
9. Bias-Free: Do not assume candidate ability. Focus only on provided inputs.

## DECISION LOGIC
Before generating, decide:
- If current topic has < 3 questions AND depth is not "deep" → continue current topic with a deeper question
- If current topic has >= 3 questions OR depth is "deep" → switch to the highest-priority pending topic
- Priority order for pending topics: topics listed in required skills that haven\'t been covered yet

## OUTPUT FORMAT
Respond with ONLY a valid JSON object (no markdown fencing, no explanation):
{
  "question": "The exact interview question to ask",
  "topic": "The topic/skill this question targets",
  "difficulty": "Basic" | "Intermediate" | "Advanced",
  "rationale": "Brief reason for choosing this question (1 sentence)",
  "stage": "${currentStage}",
  "followUpHint": "If candidate struggles, ask this simpler version instead"
}

Do NOT generate multiple questions. Do NOT explain beyond the JSON.`;
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const langchainService = new LangChainService();