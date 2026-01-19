// Turn detector - uses conversation context, not just text patterns
// Replaces fragile regex-based intent classifier

export type TurnType = 'question' | 'answer' | 'incomplete' | 'unknown';

export interface TurnDetection {
  type: TurnType;
  confidence: number;
  isComplete: boolean;
  reason: string;
}

interface ConversationContext {
  lastTurnType: TurnType | null;
  turnCount: number;
  lastSpeechEndTime: number;
}

// Deepgram's speechFinal is the authoritative signal for utterance completion
// We only classify AFTER Deepgram says the utterance is done
export function detectTurn(
  text: string,
  speechFinal: boolean,
  context: ConversationContext
): TurnDetection {
  const trimmed = text.trim();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

  // If Deepgram hasn't finalized, it's incomplete
  if (!speechFinal) {
    return {
      type: 'incomplete',
      confidence: 1.0,
      isComplete: false,
      reason: 'Waiting for speech to complete',
    };
  }

  // Very short utterances - likely filler, wait for more
  if (wordCount < 3) {
    return {
      type: 'unknown',
      confidence: 0.5,
      isComplete: true,
      reason: 'Too short to classify',
    };
  }

  // Use conversation flow as primary signal
  // Interviews alternate: Q -> A -> Q -> A
  // First turn or after answer = likely question
  // After question = likely answer
  
  const endsWithQuestion = /\?$/.test(trimmed);
  const startsWithQuestionWord = /^(what|when|where|who|why|how|which|can|could|would|do|does|did|is|are|have|tell|explain|describe)\b/i.test(trimmed);

  // Strong question signals
  if (endsWithQuestion || startsWithQuestionWord) {
    return {
      type: 'question',
      confidence: endsWithQuestion ? 0.95 : 0.8,
      isComplete: true,
      reason: endsWithQuestion ? 'Ends with question mark' : 'Question pattern',
    };
  }

  // Context-based: if last turn was a question, this is likely an answer
  if (context.lastTurnType === 'question' && wordCount >= 5) {
    return {
      type: 'answer',
      confidence: 0.85,
      isComplete: true,
      reason: 'Response to question',
    };
  }

  // Longer declarative statements are likely answers
  if (wordCount >= 8) {
    return {
      type: 'answer',
      confidence: 0.7,
      isComplete: true,
      reason: 'Substantial statement',
    };
  }

  // Default: use conversation alternation
  if (context.lastTurnType === 'question') {
    return {
      type: 'answer',
      confidence: 0.6,
      isComplete: true,
      reason: 'Expected answer turn',
    };
  }

  if (context.lastTurnType === 'answer' || context.lastTurnType === null) {
    return {
      type: 'question',
      confidence: 0.6,
      isComplete: true,
      reason: 'Expected question turn',
    };
  }

  return {
    type: 'unknown',
    confidence: 0.5,
    isComplete: true,
    reason: 'Could not determine turn type',
  };
}
