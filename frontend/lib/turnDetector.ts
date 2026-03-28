/**
 * Turn detector — classifies utterances using conversation context.
 * Deepgram's `speechFinal` is the authoritative completion signal;
 * text patterns are secondary confirmation only.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TurnType = "question" | "answer" | "incomplete" | "unknown";

export interface TurnDetection {
  type: TurnType;
  confidence: number;
  isComplete: boolean;
  reason: string;
}

export interface ConversationContext {
  lastTurnType: TurnType | null;
  turnCount: number;
  lastSpeechEndTime: number;
}

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

/** Utterances that open a new interview question from the interviewer. */
const QUESTION_STARTERS =
  /^(what|when|where|who|why|how|which|can|could|would|do|does|did|is|are|have|tell|explain|describe)\b/i;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function make(
  type: TurnType,
  confidence: number,
  isComplete: boolean,
  reason: string
): TurnDetection {
  return { type, confidence, isComplete, reason };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classifies a finalized (or in-progress) utterance.
 *
 * Decision priority:
 *  1. Not yet final → `incomplete`.
 *  2. Too short → `unknown`.
 *  3. Strong text signal (question mark / question word) → `question`.
 *  4. Conversation context (last turn was a question) → `answer`.
 *  5. Long declarative → `answer`.
 *  6. Alternation fallback → mirrors the expected interview rhythm.
 */
export function detectTurn(
  text: string,
  speechFinal: boolean,
  context: ConversationContext
): TurnDetection {
  // 1. Deepgram hasn't committed to this utterance yet.
  if (!speechFinal) {
    return make("incomplete", 1.0, false, "Waiting for speech to complete");
  }

  const trimmed = text.trim();
  const words = countWords(trimmed);

  // 2. Too short to carry meaning — filler, acknowledgement, etc.
  if (words < 3) {
    return make("unknown", 0.5, true, "Too short to classify");
  }

  // 3. Text signals (secondary, but high-confidence when present).
  const endsWithQuestionMark = trimmed.endsWith("?");
  const startsWithQuestionWord = QUESTION_STARTERS.test(trimmed);

  if (endsWithQuestionMark) {
    return make("question", 0.95, true, "Ends with question mark");
  }

  if (startsWithQuestionWord) {
    return make("question", 0.8, true, "Starts with question word");
  }

  // 4. Conversation context: a reply to a question is an answer.
  if (context.lastTurnType === "question") {
    // Require at least 5 words so very short acknowledgements don't consume
    // the "answer" slot and confuse the alternation tracker.
    const confidence = words >= 5 ? 0.85 : 0.65;
    return make("answer", confidence, true, "Response to preceding question");
  }

  // 5. Long declarative statement with no active question context.
  if (words >= 8) {
    return make("answer", 0.7, true, "Substantial declarative statement");
  }

  // 6. Alternation fallback — interviews cycle Q → A → Q → A.
  if (context.lastTurnType === "answer" || context.lastTurnType === null) {
    return make("question", 0.6, true, "Expected question turn by alternation");
  }

  return make("unknown", 0.5, true, "Could not determine turn type");
}