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
import type { Turn, InterviewContext } from "../types";

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
    const stream = await Promise.race([
      model.stream(messages),
      rejectAfter(LLM_STREAM_TIMEOUT_MS, `connect:${generationId}`),
    ]);

    let lastChunk = Date.now();

    for await (const chunk of stream) {
      if (!this.isGenerationActive(generationId)) {
        console.log(`[LangChain] Cancelled: ${generationId}`);
        return;
      }

      const now = Date.now();
      if (now - lastChunk > CHUNK_IDLE_TIMEOUT_MS) {
        console.warn(`[LangChain] Chunk idle timeout: ${generationId}`);
        return;
      }
      lastChunk = now;

      const text = extractContent(chunk);
      if (text) yield text;
    }
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

  return `You are an expert interview analyst for a ${ctx.role} position (${ctx.experienceLevel} level).
Required Skills: ${ctx.requiredSkills.join(", ")}${resumeSection}

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
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const langchainService = new LangChainService();