// Intent classifier to detect questions vs answers from plain transcripts
// Enhanced to distinguish interviewer questions from candidate clarifying questions

export type SpeakerIntent = 'interviewer_question' | 'candidate_clarification' | 'answer' | 'filler' | 'continuation' | 'unknown';

export interface IntentResult {
  intent: SpeakerIntent;
  isInterviewerQuestion: boolean; // Main interview question from interviewer
  isCandidateClarification: boolean; // Clarifying question from candidate (part of answer)
  isAnswer: boolean;
  shouldTriggerAnalysis: boolean;
  shouldContinue: boolean;
  confidence: number;
  reason: string;
  // Legacy compatibility
  isQuestion: boolean;
}

export interface ConversationState {
  hasActiveQuestion: boolean; // Is there a pending interviewer question?
  lastSpeaker: 'interviewer' | 'candidate' | null;
  answerWordCount: number; // How many words in current answer
  turnsSinceQuestion: number; // How many utterances since last question
}

// Interviewer question patterns - formal, probing questions
const INTERVIEWER_QUESTION_PATTERNS = [
  /^(tell me about|describe|explain|walk me through|give me an example)\b/i,
  /^(what|how|why|when|where)\s+(is|are|was|were|do|does|did|would|could|can|have|has|had)\s+(your|the|a|an)\b/i,
  /^(what|how|why)\s+(would|do|did|have|has|can|could)\s+you\b/i,
  /^(can|could|would)\s+you\s+(tell|describe|explain|share|walk)\b/i,
  /^(have you|do you have|did you)\s+(ever|experience|work|handle|manage|deal)\b/i,
  /^(what's|what is)\s+(your|the)\s+(experience|approach|strategy|process)\b/i,
];

// Candidate clarification patterns - seeking clarity, confirming understanding
const CANDIDATE_CLARIFICATION_PATTERNS = [
  /^(do you mean|are you asking|you mean|so you're asking|just to clarify)\b/i,
  /^(is that|would that be|does that|should i|do you want me to)\b/i,
  /^(like|such as|for example|for instance)\s*\?/i,
  /^(sorry|excuse me),?\s*(what|could you|can you)\b/i,
  /^(could you|can you)\s+(repeat|clarify|rephrase|explain)\b/i,
  /\b(right|correct|yeah)\s*\?$/i, // Confirmation seeking at end
  /^(so|okay|alright),?\s*(you('re| are)|the|it('s| is))\b.*\?$/i, // Restating for confirmation
];

// Short clarification phrases that are part of answer flow
const INLINE_CLARIFICATION_PATTERNS = [
  /^(you know what i mean|does that make sense|if that makes sense)\s*\??$/i,
  /^(right|yeah|you know)\s*\?$/i,
  /^(am i|is that|was that)\s+(making sense|on the right track|what you('re| are) looking for)\s*\??$/i,
];

// Question patterns (generic)
const QUESTION_STARTERS = [
  /^(what|when|where|who|why|how|which|whose|whom)\b/i,
  /^(can|could|would|will|shall|should|do|does|did|is|are|was|were|have|has|had)\s+(you|we|i|they|he|she|it)\b/i,
  /^(tell me|explain|describe|walk me through|give me|show me)\b/i,
  /^(have you|do you|can you|could you|would you|are you|were you)\b/i,
];

const QUESTION_ENDERS = [
  /\?$/,
  /\b(right|correct|isn't it|aren't you|don't you|wouldn't you|couldn't you)[\?\.]?$/i,
];

// Answer patterns - typically longer, declarative statements
const ANSWER_PATTERNS = [
  /^(yes|no|yeah|yep|nope|sure|absolutely|definitely|certainly|of course)\b/i,
  /^(i think|i believe|i would|i have|i've|i am|i'm|in my experience|from my perspective)\b/i,
  /^(so|well|basically|actually|honestly|frankly)\b/i,
  /^(the|my|our|we|they|it|this|that)\b/i,
];

// Filler patterns - short non-substantive utterances
const FILLER_PATTERNS = [
  /^(um+|uh+|er+|ah+|hmm+|mm+)$/i,
  /^(okay|ok|alright|right|sure|yes|no|yeah|yep|nope)$/i,
  /^(i see|got it|understood|makes sense)$/i,
];

// Continuation indicators - speaker is mid-thought
const CONTINUATION_PATTERNS = [
  /\b(and|but|so|because|however|also|additionally|furthermore|moreover|then|therefore)\s*$/i,
  /,\s*$/,
  /:\s*$/,
  /\.\.\.*$/,
];

export function classifyIntent(
  text: string, 
  conversationState?: ConversationState,
  wordCount?: number
): IntentResult {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const count = wordCount ?? words.length;
  
  // Default conversation state if not provided
  const state: ConversationState = conversationState ?? {
    hasActiveQuestion: false,
    lastSpeaker: null,
    answerWordCount: 0,
    turnsSinceQuestion: 0,
  };

  // Empty or very short
  if (!trimmed || count === 0) {
    return {
      intent: 'unknown',
      isInterviewerQuestion: false,
      isCandidateClarification: false,
      isQuestion: false,
      isAnswer: false,
      shouldTriggerAnalysis: false,
      shouldContinue: false,
      confidence: 0,
      reason: 'Empty text',
    };
  }

  // Check for fillers first (1-3 words)
  if (count <= 3) {
    const isFiller = FILLER_PATTERNS.some(p => p.test(trimmed));
    if (isFiller) {
      return {
        intent: 'filler',
        isInterviewerQuestion: false,
        isCandidateClarification: false,
        isQuestion: false,
        isAnswer: false,
        shouldTriggerAnalysis: false,
        shouldContinue: false,
        confidence: 0.9,
        reason: 'Filler word detected',
      };
    }
  }

  // Check for continuation (incomplete thought)
  const isContinuation = CONTINUATION_PATTERNS.some(p => p.test(trimmed));
  if (isContinuation) {
    return {
      intent: 'continuation',
      isInterviewerQuestion: false,
      isCandidateClarification: false,
      isQuestion: false,
      isAnswer: false,
      shouldTriggerAnalysis: false,
      shouldContinue: true,
      confidence: 0.8,
      reason: 'Continuation indicator - waiting for more',
    };
  }

  // Check if it looks like a question
  const startsWithQuestion = QUESTION_STARTERS.some(p => p.test(trimmed));
  const endsWithQuestion = QUESTION_ENDERS.some(p => p.test(trimmed));
  const looksLikeQuestion = startsWithQuestion || endsWithQuestion;

  if (looksLikeQuestion) {
    // Now determine: is this an interviewer question or candidate clarification?
    
    // Check for explicit candidate clarification patterns
    const isCandidateClarification = CANDIDATE_CLARIFICATION_PATTERNS.some(p => p.test(trimmed));
    const isInlineClarification = INLINE_CLARIFICATION_PATTERNS.some(p => p.test(trimmed));
    const isInterviewerPattern = INTERVIEWER_QUESTION_PATTERNS.some(p => p.test(trimmed));
    
    // Context-based decision:
    // 1. If there's an active question and candidate has been answering, likely clarification
    // 2. If it matches interviewer patterns strongly, it's an interviewer question
    // 3. Short questions during answer are likely clarifications
    
    if (isCandidateClarification || isInlineClarification) {
      return {
        intent: 'candidate_clarification',
        isInterviewerQuestion: false,
        isCandidateClarification: true,
        isQuestion: false, // Don't treat as main question
        isAnswer: true, // Treat as part of answer flow
        shouldTriggerAnalysis: false,
        shouldContinue: true,
        confidence: 0.85,
        reason: 'Candidate clarification question detected',
      };
    }
    
    if (isInterviewerPattern) {
      return {
        intent: 'interviewer_question',
        isInterviewerQuestion: true,
        isCandidateClarification: false,
        isQuestion: true,
        isAnswer: false,
        shouldTriggerAnalysis: false,
        shouldContinue: false,
        confidence: 0.9,
        reason: 'Interviewer question pattern detected',
      };
    }
    
    // Context-based: if we have an active question and answer is building, 
    // short questions are likely clarifications
    if (state.hasActiveQuestion && state.answerWordCount > 5 && count < 15) {
      return {
        intent: 'candidate_clarification',
        isInterviewerQuestion: false,
        isCandidateClarification: true,
        isQuestion: false,
        isAnswer: true, // Part of answer
        shouldTriggerAnalysis: false,
        shouldContinue: true,
        confidence: 0.7,
        reason: 'Short question during answer - likely clarification',
      };
    }
    
    // Longer questions without active context are likely interviewer questions
    if (count >= 8 || !state.hasActiveQuestion) {
      return {
        intent: 'interviewer_question',
        isInterviewerQuestion: true,
        isCandidateClarification: false,
        isQuestion: true,
        isAnswer: false,
        shouldTriggerAnalysis: false,
        shouldContinue: false,
        confidence: endsWithQuestion ? 0.85 : 0.7,
        reason: endsWithQuestion ? 'Ends with question mark' : 'Question pattern detected',
      };
    }
    
    // Default for ambiguous short questions: treat as clarification if in answer mode
    if (state.hasActiveQuestion) {
      return {
        intent: 'candidate_clarification',
        isInterviewerQuestion: false,
        isCandidateClarification: true,
        isQuestion: false,
        isAnswer: true,
        shouldTriggerAnalysis: false,
        shouldContinue: true,
        confidence: 0.6,
        reason: 'Ambiguous question during answer - treating as clarification',
      };
    }
    
    // No context, treat as interviewer question
    return {
      intent: 'interviewer_question',
      isInterviewerQuestion: true,
      isCandidateClarification: false,
      isQuestion: true,
      isAnswer: false,
      shouldTriggerAnalysis: false,
      shouldContinue: false,
      confidence: 0.6,
      reason: 'Question without context - assuming interviewer',
    };
  }

  // Check for answer patterns
  const matchesAnswerPattern = ANSWER_PATTERNS.some(p => p.test(trimmed));
  
  // Answers are typically longer (5+ words) and declarative
  if (count >= 5 || matchesAnswerPattern) {
    const endsWithPunctuation = /[.!]$/.test(trimmed);
    const isSubstantial = count >= 8;
    
    return {
      intent: 'answer',
      isInterviewerQuestion: false,
      isCandidateClarification: false,
      isQuestion: false,
      isAnswer: true,
      shouldTriggerAnalysis: endsWithPunctuation || isSubstantial,
      shouldContinue: !endsWithPunctuation && !isSubstantial,
      confidence: isSubstantial ? 0.85 : 0.7,
      reason: isSubstantial 
        ? 'Substantial answer detected' 
        : endsWithPunctuation 
          ? 'Complete sentence detected'
          : 'Possible answer, waiting for more',
    };
  }

  // Short statement - unclear
  return {
    intent: 'unknown',
    isInterviewerQuestion: false,
    isCandidateClarification: false,
    isQuestion: false,
    isAnswer: false,
    shouldTriggerAnalysis: false,
    shouldContinue: true,
    confidence: 0.5,
    reason: 'Short utterance, waiting for more context',
  };
}

// Patterns that indicate the speaker is still thinking/continuing
const INCOMPLETE_ANSWER_PATTERNS = [
  /\b(and|but|so|because|however|also|then|like|you know|i mean)\s*$/i,
  /,\s*$/,
  /:\s*$/,
  /\.\.\.*$/,
  /-\s*$/,
];

// Patterns that strongly indicate a complete thought
const COMPLETE_ANSWER_PATTERNS = [
  /[.!]\s*$/,  // Ends with period or exclamation
  /\b(that's it|that's all|yeah|so yeah|basically)\s*[.!]?\s*$/i,
  /\b(does that (make sense|answer|help))\s*\??\s*$/i,
];

// Analyze accumulated text to decide if we should trigger analysis
export function shouldAutoTrigger(
  accumulatedText: string,
  lastQuestionText: string,
  silenceMs: number,
  options: {
    consecutiveSilentUtterances?: number;
    avgConfidence?: number;
    timeSinceLastSpeech?: number;
  } = {}
): { trigger: boolean; reason: string; confidence: number } {
  const {
    consecutiveSilentUtterances = 0,
    avgConfidence = 1.0,
    timeSinceLastSpeech = 0,
  } = options;

  const words = accumulatedText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // No accumulated text
  if (wordCount === 0) {
    return { trigger: false, reason: 'No text accumulated', confidence: 0 };
  }

  // Must have a question first
  if (!lastQuestionText) {
    return { trigger: false, reason: 'No question asked yet', confidence: 0 };
  }

  // Low confidence transcripts - wait for better data
  if (avgConfidence < 0.7) {
    return { trigger: false, reason: 'Low transcript confidence', confidence: avgConfidence };
  }

  // Minimum word threshold - raised to reduce false triggers on short utterances
  if (wordCount < 8) {
    return { trigger: false, reason: `Answer too short (${wordCount} < 8 words)`, confidence: 0.3 };
  }

  // Check for incomplete patterns - speaker is mid-thought
  const looksIncomplete = INCOMPLETE_ANSWER_PATTERNS.some(p => p.test(accumulatedText.trim()));
  if (looksIncomplete && silenceMs < 3000) {
    return { trigger: false, reason: 'Answer appears incomplete', confidence: 0.4 };
  }

  // Check for complete patterns - strong signal to trigger
  const looksComplete = COMPLETE_ANSWER_PATTERNS.some(p => p.test(accumulatedText.trim()));
  
  // Strong completion signal with substantial content
  if (looksComplete && wordCount >= 12) {
    return { trigger: true, reason: 'Complete answer detected', confidence: 0.9 };
  }

  // Very long answer = trigger regardless (but require longer silence)
  if (wordCount >= 50 && silenceMs >= 1500) {
    return { trigger: true, reason: 'Long answer with pause', confidence: 0.85 };
  }

  // Substantial answer with extended silence (raised from 1000ms to 2500ms)
  if (silenceMs >= 2500 && wordCount >= 15) {
    return { trigger: true, reason: `Extended silence (${silenceMs}ms) with ${wordCount} words`, confidence: 0.8 };
  }

  // Multiple consecutive silent utterance-end events = speaker likely done
  if (consecutiveSilentUtterances >= 2 && wordCount >= 12 && silenceMs >= 1500) {
    return { trigger: true, reason: 'Multiple pauses indicate completion', confidence: 0.75 };
  }

  // Long silence (3+ seconds) with moderate content
  if (silenceMs >= 3000 && wordCount >= 10) {
    return { trigger: true, reason: `Long silence (${silenceMs}ms)`, confidence: 0.7 };
  }

  // Default: don't trigger, wait for more signal
  return { 
    trigger: false, 
    reason: `Waiting for completion signal (${wordCount} words, ${silenceMs}ms silence)`,
    confidence: 0.5 
  };
}
