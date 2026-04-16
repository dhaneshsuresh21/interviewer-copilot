/**
 * Intent classifier for interview transcript analysis.
 * Detects interviewer questions vs candidate answers/clarifications.
 */

// ---------------------------------------------------------------------------
// Shared thresholds (single source of truth for all components)
// ---------------------------------------------------------------------------

export const CONFIDENCE_THRESHOLD = 0.65;

/** Minimum confidence for an utterance to be treated as an interviewer question.
 *  Garbage ASR fragments (e.g. "stop? Do you want? Get?") have low confidence
 *  and must not be accepted as questions even if they end with "?".
 */
export const MIN_QUESTION_CONFIDENCE = 0.60;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SpeakerIntent =
  | "interviewer_question"
  | "candidate_clarification"
  | "answer"
  | "filler"
  | "continuation"
  | "unknown";

export interface IntentResult {
  intent: SpeakerIntent;
  /** Main interview question from the interviewer. */
  isInterviewerQuestion: boolean;
  /** Candidate is asking for clarification mid-answer. */
  isCandidateClarification: boolean;
  isAnswer: boolean;
  shouldTriggerAnalysis: boolean;
  shouldContinue: boolean;
  confidence: number;
  reason: string;
  /** @deprecated Use isInterviewerQuestion instead. */
  isQuestion: boolean;
}

export interface ConversationState {
  /** Is there a pending, unanswered interviewer question? */
  hasActiveQuestion: boolean;
  lastSpeaker: "interviewer" | "candidate" | null;
  /** Word count accumulated in the current answer. */
  answerWordCount: number;
  /** Utterances since the last interviewer question. */
  turnsSinceQuestion: number;
}

// ---------------------------------------------------------------------------
// Pattern groups
// ---------------------------------------------------------------------------

/** Patterns typical of a formal interviewer opening a question. */
const INTERVIEWER_QUESTION_PATTERNS: RegExp[] = [
  /^(tell me about|describe|explain|walk me through|give me an example)\b/i,
  /^(what|how|why|when|where)\s+(is|are|was|were|do|does|did|would|could|can|have|has|had)\s+(your|the|a|an)\b/i,
  /^(what|how|why)\s+(would|do|did|have|has|can|could)\s+you\b/i,
  /^(can|could|would)\s+you\s+(tell|describe|explain|share|walk)\b/i,
  /^(have you|do you have|did you)\s+(ever|experience|work|handle|manage|deal)\b/i,
  /^(what's|what is)\s+(your|the)\s+(experience|approach|strategy|process)\b/i,
  // Imperative-form interview questions ("Please give...", "Let me know...", "Share with me...")
  /^(please)\s+(give|tell|share|describe|explain|walk|talk|introduce|discuss|elaborate)\b/i,
  /^(let me know|let's talk about|let's discuss|share with me|talk me through)\b/i,
  /^(introduce yourself|tell us about yourself|tell me about yourself)\b/i,
];

/** Patterns where the candidate is seeking clarification, not opening a new topic. */
const CANDIDATE_CLARIFICATION_PATTERNS: RegExp[] = [
  /^(do you mean|are you asking|so you('re| are) asking|just to clarify)\b/i,
  /^(is that|would that be|does that|should i|do you want me to)\b/i,
  /^(sorry|excuse me),?\s*(what|could you|can you)\b/i,
  /^(could you|can you)\s+(repeat|clarify|rephrase|explain that)\b/i,
  /\b(right|correct|yeah)\s*\?$/i,
  /^(so|okay|alright),?\s*(you('re| are)|the|it('s| is))\b.*\?$/i,
];

/** Very short in-flow checks that a candidate embeds while answering. */
const INLINE_CLARIFICATION_PATTERNS: RegExp[] = [
  /^(you know what i mean|does that make sense|if that makes sense)\s*\??$/i,
  /^(right|yeah|you know)\s*\?$/i,
  /^(am i|is that|was that)\s+(making sense|on the right track|what you('re| are) looking for)\s*\??$/i,
];

/** Generic question openers (used as a secondary signal, not the primary classifier). */
const QUESTION_STARTERS: RegExp[] = [
  /^(what|when|where|who|why|how|which|whose|whom)\b/i,
  // Auxiliary inversions — only match when a pronoun immediately follows.
  /^(can|could|would|will|shall|should|do|does|did|is|are|was|were|have|has|had)\s+(you|we|i|they|he|she|it)\b/i,
  // Direct imperatives that open a question from the interviewer side.
  /^(have you|do you|can you|could you|would you|are you|were you)\b/i,
];

const QUESTION_ENDERS: RegExp[] = [
  /\?$/,
  /\b(right|correct|isn't it|aren't you|don't you|wouldn't you|couldn't you)[?.]?$/i,
];

const ANSWER_STARTERS: RegExp[] = [
  /^(yes|no|yeah|yep|nope|sure|absolutely|definitely|certainly|of course)\b/i,
  /^(i think|i believe|i would|i have|i've|i am|i'm|in my experience|from my perspective),?\s+\w/i,
  /^(so|well|basically|actually|honestly|frankly),?\s+\w/i,
];

const FILLER_PATTERNS: RegExp[] = [
  /^(um+|uh+|er+|ah+|hmm+|mm+)$/i,
  /^(okay|ok|alright|right|sure|yes|no|yeah|yep|nope)$/i,
  /^(i see|got it|understood|makes sense)$/i,
];

/**
 * Indicates the speaker is mid-thought.
 * The trailing-comma pattern is intentionally excluded — a comma inside
 * a well-formed sentence should not mark the whole utterance as incomplete.
 */
const CONTINUATION_PATTERNS: RegExp[] = [
  /\b(and|but|so|because|however|also|additionally|furthermore|moreover|then|therefore)\s*$/i,
  /:\s*$/,
  /\.{2,}\s*$/,   // two or more dots (ellipsis variants)
  /-\s*$/,        // trailing dash / em-dash
];

/** Strong signals that a thought is complete. */
const COMPLETE_ANSWER_ENDINGS: RegExp[] = [
  /[.!]\s*$/,
  /\b(that's it|that's all|yeah|so yeah|basically)\s*[.!]?\s*$/i,
  /\b(does that (make sense|answer|help))\s*\??\s*$/i,
];

/** Signals that the candidate is still mid-thought (used in shouldAutoTrigger). */
const INCOMPLETE_ANSWER_ENDINGS: RegExp[] = [
  /\b(and|but|so|because|however|also|then|like|you know|i mean)\s*$/i,
  /:\s*$/,
  /\.{2,}\s*$/,
  /-\s*$/,
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Returns the first sentence of a multi-sentence string (split on . ! ?),
 * or the full string if it is a single sentence.
 */
function extractFirstSentence(text: string): string {
  const match = text.match(/^.+?[.!?](?:\s|$)/);
  return match ? match[0].trim() : text;
}

/**
 * Strip leading discourse markers that interviewers commonly prepend to
 * questions ("So", "Now", "Well", "Okay", "Right", "Tell me," etc.) before
 * testing against QUESTION_STARTERS / INTERVIEWER_QUESTION_PATTERNS.
 * This handles Deepgram cases like "So why should a company hire you?".
 */
function stripDiscourseMarkers(text: string): string {
  return text
    .replace(/^(so|now|well|okay|ok|right|alright|good|great|next|also|and|but|tell me[,.]?|let me ask[,.]?),?\s+/i, '')
    .trim();
}

function makeResult(
  intent: SpeakerIntent,
  overrides: Partial<Omit<IntentResult, "intent" | "isQuestion">>
): IntentResult {
  const base: IntentResult = {
    intent,
    isInterviewerQuestion: false,
    isCandidateClarification: false,
    isAnswer: false,
    shouldTriggerAnalysis: false,
    shouldContinue: false,
    confidence: 0.5,
    reason: "",
    // Legacy field — always derived from isInterviewerQuestion.
    get isQuestion() {
      return this.isInterviewerQuestion;
    },
  };
  return Object.assign(base, overrides);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function classifyIntent(
  text: string,
  conversationState?: ConversationState,
  wordCount?: number
): IntentResult {
  const trimmed = text.trim();
  const words = countWords(trimmed);
  const count = wordCount ?? words;

  const state: ConversationState = conversationState ?? {
    hasActiveQuestion: false,
    lastSpeaker: null,
    answerWordCount: 0,
    turnsSinceQuestion: 0,
  };

  if (!trimmed || count === 0) {
    return makeResult("unknown", { confidence: 0, reason: "Empty text" });
  }

  // --- Filler (1–3 words) ---
  if (count <= 3 && matchesAny(trimmed, FILLER_PATTERNS)) {
    return makeResult("filler", {
      confidence: 0.9,
      reason: "Filler word detected",
    });
  }

  // --- Multi-speaker fusion guard ---
  // Deepgram captures both speakers on one mic, so a single transcript chunk
  // can contain "Please give a brief introduction. Sure, my name is..."
  // Split on sentence boundaries and check if the FIRST sentence alone is a
  // question — if so, classify on the first sentence rather than the whole blob.
  if (!state.hasActiveQuestion) {
    const firstSentence = extractFirstSentence(trimmed);
    if (firstSentence && firstSentence !== trimmed) {
      const fsStripped = stripDiscourseMarkers(firstSentence);
      const fsCount = countWords(fsStripped);
      const fsStartsAsQ = matchesAny(fsStripped, QUESTION_STARTERS);
      const fsEndsAsQ = matchesAny(firstSentence, QUESTION_ENDERS);
      const fsIsInterviewerQ = matchesAny(fsStripped, INTERVIEWER_QUESTION_PATTERNS);
      if (fsIsInterviewerQ || (fsStartsAsQ && fsCount >= 4) || (fsEndsAsQ && fsCount >= 3)) {
        return makeResult("interviewer_question", {
          isInterviewerQuestion: true,
          confidence: fsIsInterviewerQ ? 0.9 : 0.8,
          reason: "Question detected in first sentence of multi-speaker utterance",
        });
      }
    }
  }

  // --- Question detection (checked before continuation so questions
  //     ending with conjunctions like "and"/"so" are not swallowed) ---
  const startsAsQuestion = matchesAny(trimmed, QUESTION_STARTERS);
  const endsAsQuestion = matchesAny(trimmed, QUESTION_ENDERS);
  const looksLikeQuestion = startsAsQuestion || endsAsQuestion;

  if (looksLikeQuestion) {
    return classifyQuestion(trimmed, count, state, endsAsQuestion);
  }

  // --- Continuation (speaker mid-thought, only when not a question) ---
  if (matchesAny(trimmed, CONTINUATION_PATTERNS)) {
    return makeResult("continuation", {
      shouldContinue: true,
      confidence: 0.8,
      reason: "Continuation indicator — waiting for more",
    });
  }

  // --- Answer detection ---
  const matchesAnswerStart = matchesAny(trimmed, ANSWER_STARTERS);
  if (count >= 5 || matchesAnswerStart) {
    const endsComplete = /[.!]$/.test(trimmed);
    const isSubstantial = count >= 8;
    return makeResult("answer", {
      isAnswer: true,
      shouldTriggerAnalysis: endsComplete || isSubstantial,
      shouldContinue: !endsComplete && !isSubstantial,
      confidence: isSubstantial ? 0.85 : 0.7,
      reason: isSubstantial
        ? "Substantial answer detected"
        : endsComplete
        ? "Complete sentence detected"
        : "Possible answer — waiting for more",
    });
  }

  // --- Alternation fallback — interviews cycle Q → A → Q → A.
  //     If the last speaker was the candidate (or no one has spoken yet),
  //     an ambiguous utterance is likely the interviewer's next question.
  if (!state.hasActiveQuestion && (state.lastSpeaker === "candidate" || state.lastSpeaker === null)) {
    return makeResult("interviewer_question", {
      isInterviewerQuestion: true,
      confidence: 0.6,
      reason: "Expected question turn by alternation",
    });
  }

  // --- Short or ambiguous ---
  return makeResult("unknown", {
    shouldContinue: true,
    confidence: 0.5,
    reason: "Short utterance — waiting for more context",
  });
}

/**
 * Decides whether a question-shaped utterance originates from the interviewer
 * or is a clarification mid-answer by the candidate.
 */
function classifyQuestion(
  trimmed: string,
  count: number,
  state: ConversationState,
  endsWithQuestionMark: boolean
): IntentResult {
  // Explicit candidate-clarification surface forms take top priority.
  if (
    matchesAny(trimmed, CANDIDATE_CLARIFICATION_PATTERNS) ||
    matchesAny(trimmed, INLINE_CLARIFICATION_PATTERNS)
  ) {
    return makeResult("candidate_clarification", {
      isCandidateClarification: true,
      isAnswer: true,
      shouldContinue: true,
      confidence: 0.85,
      reason: "Candidate clarification pattern detected",
    });
  }

  // Strip leading discourse markers ("So", "Now", "Well", etc.) before
  // testing patterns — Deepgram often includes these as the first word.
  const stripped = stripDiscourseMarkers(trimmed);
  const strippedCount = countWords(stripped);

  // Strong interviewer-question surface form (test both original and stripped).
  if (matchesAny(stripped, INTERVIEWER_QUESTION_PATTERNS) || matchesAny(trimmed, INTERVIEWER_QUESTION_PATTERNS)) {
    return makeResult("interviewer_question", {
      isInterviewerQuestion: true,
      confidence: 0.9,
      reason: "Interviewer question pattern detected",
    });
  }

  // If the answer is already substantial (>30 words), a new wh-question or
  // ends-with-? utterance is very likely the interviewer's next question.
  // Use stripped text for QUESTION_STARTERS so "So why..." still matches.
  if (state.hasActiveQuestion && state.answerWordCount > 30) {
    const isNewInterviewerQ =
      matchesAny(stripped, QUESTION_STARTERS) ||
      endsWithQuestionMark;
    if (isNewInterviewerQ && strippedCount >= 4) {
      return makeResult("interviewer_question", {
        isInterviewerQuestion: true,
        confidence: 0.85,
        reason: "New interviewer question after substantial answer",
      });
    }
  }

  // Contextual: short question while answering → treat as clarification.
  if (state.hasActiveQuestion && state.answerWordCount > 5 && count < 15) {
    return makeResult("candidate_clarification", {
      isCandidateClarification: true,
      isAnswer: true,
      shouldContinue: true,
      confidence: 0.7,
      reason: "Short question during active answer — likely candidate clarification",
    });
  }

  // Longer questions (or no active context) → treat as a new interviewer question.
  if (count >= 8 || !state.hasActiveQuestion) {
    return makeResult("interviewer_question", {
      isInterviewerQuestion: true,
      confidence: endsWithQuestionMark ? 0.85 : 0.7,
      reason: endsWithQuestionMark
        ? "Ends with question mark"
        : "Question pattern without explicit marker",
    });
  }

  // Ambiguous short question within an active answer: default to clarification.
  if (state.hasActiveQuestion) {
    return makeResult("candidate_clarification", {
      isCandidateClarification: true,
      isAnswer: true,
      shouldContinue: true,
      confidence: 0.6,
      reason: "Ambiguous short question during answer — treating as clarification",
    });
  }

  // No context at all: assume interviewer.
  return makeResult("interviewer_question", {
    isInterviewerQuestion: true,
    confidence: 0.6,
    reason: "Question without conversation context — assuming interviewer",
  });
}

// ---------------------------------------------------------------------------
// Auto-trigger decision
// ---------------------------------------------------------------------------

export interface AutoTriggerOptions {
  consecutiveSilentUtterances?: number;
  avgConfidence?: number;
  timeSinceLastSpeech?: number;
}

export interface AutoTriggerResult {
  trigger: boolean;
  reason: string;
  confidence: number;
}

/**
 * Decides whether accumulated answer text warrants analysis.
 *
 * Trigger thresholds (in priority order):
 *  1. Low transcript confidence → hold.
 *  2. No question on record → hold.
 *  3. Fewer than 8 words → hold.
 *  4. Ends mid-thought and silence < 3 s → hold.
 *  5. Looks complete AND ≥ 12 words → trigger.
 *  6. Very long (≥ 50 words) with ≥ 1.5 s silence → trigger.
 *  7. Substantial (≥ 15 words) with ≥ 1.8 s silence → trigger.
 *  8. Multiple pauses, ≥ 12 words, ≥ 1.5 s silence → trigger.
 *  9. Long silence (≥ 3 s) with ≥ 10 words → trigger.
 */
export function shouldAutoTrigger(
  accumulatedText: string,
  lastQuestionText: string,
  silenceMs: number,
  options: AutoTriggerOptions = {}
): AutoTriggerResult {
  const {
    consecutiveSilentUtterances = 0,
    avgConfidence = 1.0,
  } = options;

  const trimmed = accumulatedText.trim();
  const wordCount = countWords(trimmed);

  if (wordCount === 0) {
    return { trigger: false, reason: "No text accumulated", confidence: 0 };
  }

  if (!lastQuestionText) {
    return { trigger: false, reason: "No question asked yet", confidence: 0 };
  }

  if (avgConfidence < CONFIDENCE_THRESHOLD) {
    return {
      trigger: false,
      reason: "Low transcript confidence",
      confidence: avgConfidence,
    };
  }

  if (wordCount < 8) {
    return {
      trigger: false,
      reason: `Answer too short (${wordCount} < 8 words)`,
      confidence: 0.3,
    };
  }

  const looksIncomplete = matchesAny(trimmed, INCOMPLETE_ANSWER_ENDINGS);
  if (looksIncomplete && silenceMs < 3_000) {
    return {
      trigger: false,
      reason: "Answer appears incomplete",
      confidence: 0.4,
    };
  }

  const looksComplete = matchesAny(trimmed, COMPLETE_ANSWER_ENDINGS);

  // Require both a completion signal AND meaningful silence (≥1.5 s) AND
  // enough words — a period ending a single sentence mid-answer must not fire.
  if (looksComplete && wordCount >= 20 && silenceMs >= 1_500) {
    return {
      trigger: true,
      reason: "Complete answer detected",
      confidence: 0.9,
    };
  }

  if (wordCount >= 50 && silenceMs >= 2_000) {
    return {
      trigger: true,
      reason: "Long answer with pause",
      confidence: 0.85,
    };
  }

  if (silenceMs >= 1_500 && wordCount >= 20) {
    return {
      trigger: true,
      reason: `Extended silence (${silenceMs} ms) with ${wordCount} words`,
      confidence: 0.8,
    };
  }

  if (consecutiveSilentUtterances >= 2 && wordCount >= 12 && silenceMs >= 1_500) {
    return {
      trigger: true,
      reason: "Multiple pauses indicate completion",
      confidence: 0.75,
    };
  }

  if (silenceMs >= 3_000 && wordCount >= 10) {
    return {
      trigger: true,
      reason: `Long silence (${silenceMs} ms)`,
      confidence: 0.7,
    };
  }

  return {
    trigger: false,
    reason: `Waiting for completion signal (${wordCount} words, ${silenceMs} ms silence)`,
    confidence: 0.5,
  };
}