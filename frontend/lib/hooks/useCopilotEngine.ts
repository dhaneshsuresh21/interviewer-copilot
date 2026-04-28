import { useEffect, useRef, useCallback, useState } from 'react';
import { useInterviewStore } from '../store';
import { useDeepgram } from './useDeepgram';
import { useSocketAnalysis } from './useSocketAnalysis';
import { useUtteranceBuilder } from './useUtteranceBuilder';
import { ConversationStateMachine } from '../ConversationStateMachine';
import { classifyIntent, shouldAutoTrigger, ConversationState, CONFIDENCE_THRESHOLD, MIN_QUESTION_CONFIDENCE } from '../intentClassifier';
import type { DeepgramResult, Utterance } from '../types';
import { logTranscriptEvent } from '../transcriptLogger';

export function useCopilotEngine() {
  const {
    interviewContext,
    isInterviewActive,
    turns,
    addTurn,
    addUtterance,
    setCurrentAnswer,
    setCurrentQuestion,
    setInterimText,
    setInterviewStartTime, // FIX: Add start time setter
    language,
    coveredTopics,
    setInterviewActive,
    resetInterview,
    isAnalyzing,
    isGeneratingQuestions,
    isGeneratingRating,
    updateLastActivity, // Add inactivity timer
    analysisText,
    topicProgress,
    questionsAsked,
    updateTopicProgress,
    addQuestionAsked,
    setLastAnswerScore,
    clearNextQuestion,
    setIsGeneratingNextQuestion,
  } = useInterviewStore();

  const { analyze, requestNextQuestion, cancel, isConnected: socketConnected } = useSocketAnalysis();

  const fsmRef = useRef(new ConversationStateMachine());
  const hasStartedRef = useRef(false);
  
  // Question/answer tracking
  const questionRef = useRef('');
  const answerRef = useRef('');
  const questionReceivedTimeRef = useRef(0);
  
  // Enhanced trigger tracking
  const lastTriggerTimeRef = useRef(0);
  const lastSpeechTimeRef = useRef(0);
  const consecutiveSilentEventsRef = useRef(0);
  const utteranceEndCountRef = useRef(0);
  const confidenceSamplesRef = useRef<number[]>([]);
  
  // Debounce between consecutive triggers
  const TRIGGER_DEBOUNCE_MS = 5000;
  // Minimum time after a question is received before analysis can fire.
  // Prevents triggering on the first sentence of a multi-sentence answer.
  const MIN_ANSWER_ACCUMULATION_MS = 5_000;
  const MIN_WORDS = 8;
  
  const [fsmState, setFsmState] = useState(fsmRef.current.getState());

  // Ref for trigger function
  const triggerRef = useRef<() => boolean>(() => false);

  // Get average confidence from samples
  const getAvgConfidence = useCallback(() => {
    const samples = confidenceSamplesRef.current;
    if (samples.length === 0) return 1.0;
    return samples.reduce((a, b) => a + b, 0) / samples.length;
  }, []);

  // Analysis trigger with enhanced validation
  const triggerAnalysisInternal = useCallback(() => {
    const question = questionRef.current.trim();
    const answer = answerRef.current.trim();

    const now = Date.now();

    // Debounce between consecutive triggers
    if (now - lastTriggerTimeRef.current < TRIGGER_DEBOUNCE_MS) {
      console.log('[Engine] Trigger debounced');
      return false;
    }

    // Minimum accumulation window — don't fire on the first sentence of a long answer
    if (now - questionReceivedTimeRef.current < MIN_ANSWER_ACCUMULATION_MS) {
      console.log('[Engine] Too soon after question received');
      logTranscriptEvent({ event: 'TRIGGER_DECISION', trigger: false, triggerReason: 'Too soon after question received', silenceMs: 0 });
      return false;
    }

    if (!question || !answer || !interviewContext || !socketConnected) {
      console.log('[Engine] Missing data for trigger');
      return false;
    }

    if (isAnalyzing || isGeneratingQuestions || isGeneratingRating) {
      console.log('[Engine] Already analyzing');
      return false;
    }

    const wordCount = answer.split(/\s+/).filter(Boolean).length;
    if (wordCount < MIN_WORDS) {
      console.log('[Engine] Answer too short:', wordCount);
      return false;
    }

    const avgConfidence = getAvgConfidence();
    if (avgConfidence < CONFIDENCE_THRESHOLD) {
      console.log('[Engine] Confidence too low:', avgConfidence.toFixed(2));
      return false;
    }
    
    // FIX: Validate interviewContext has required fields
    if (!interviewContext.role || !interviewContext.experienceLevel) {
      console.log('[Engine] Invalid interview context');
      return false;
    }

    console.log('[Engine] === TRIGGERING ANALYSIS ===');
    console.log('  Q:', question.substring(0, 60));
    console.log('  A:', answer.substring(0, 60), `(${wordCount} words, conf: ${avgConfidence.toFixed(2)})`);

    // Show "Generating next question..." placeholder immediately
    clearNextQuestion();
    setIsGeneratingNextQuestion(true);

    logTranscriptEvent({
      event: 'ANALYSIS_TRIGGERED',
      meta: {
        question: question.substring(0, 120),
        answer: answer.substring(0, 120),
        wordCount,
        avgConfidence,
      },
    });

    lastTriggerTimeRef.current = now;

    const questionTurn = {
      id: `q-${Date.now()}`,
      speaker: 'interviewer' as const,
      text: question,
      timestamp: Date.now() - 2000,
    };

    const answerTurn = {
      id: `a-${Date.now()}`,
      speaker: 'candidate' as const,
      text: answer,
      timestamp: Date.now(),
    };

    addTurn(questionTurn);
    addTurn(answerTurn);

    // FIX: Pass the updated turns array including the new Q&A
    // to avoid stale closure issue with React state batching
    const updatedTurns = [...turns, questionTurn, answerTurn];
    analyze(question, answer, updatedTurns, interviewContext, coveredTopics, language);

    // Fire next-question generation in PARALLEL with analysis
    const coveredTopicNames = topicProgress.map(tp => tp.topic);
    const pendingTopics = (interviewContext.requiredSkills || []).filter(
      skill => !coveredTopicNames.includes(skill)
    );
    const totalQ = questionsAsked.length + 1;
    addQuestionAsked(question);
    requestNextQuestion(
      interviewContext,
      updatedTurns,
      topicProgress,
      pendingTopics,
      questionsAsked,
      answer.substring(0, 300),
      undefined,
      totalQ,
      language
    );

    fsmRef.current.dispatch('ANALYZE');
    setFsmState(fsmRef.current.getState());

    // Reset tracking state — clear both question and answer so post-analysis
    // speech cannot accumulate against the stale question and cause re-triggers.
    questionRef.current = '';
    answerRef.current = '';
    setCurrentQuestion('');
    setCurrentAnswer('');
    consecutiveSilentEventsRef.current = 0;
    utteranceEndCountRef.current = 0;
    confidenceSamplesRef.current = [];

    return true;
  }, [interviewContext, turns, language, coveredTopics, analyze, isAnalyzing, isGeneratingQuestions, isGeneratingRating, socketConnected, addTurn, setCurrentQuestion, setCurrentAnswer, getAvgConfidence, requestNextQuestion, topicProgress, questionsAsked, addQuestionAsked]);

  useEffect(() => {
    triggerRef.current = triggerAnalysisInternal;
  }, [triggerAnalysisInternal]);

  // Handle completed utterance
  const handleUtteranceComplete = useCallback((utterance: Utterance) => {
    const text = utterance.text.trim();
    if (!text) return;

    addUtterance(utterance);
    lastSpeechTimeRef.current = Date.now();
    
    // Track confidence
    if (utterance.confidence > 0) {
      confidenceSamplesRef.current.push(utterance.confidence);
      if (confidenceSamplesRef.current.length > 10) {
        confidenceSamplesRef.current.shift();
      }
    }

    // Build conversation state for context-aware classification
    const conversationState: ConversationState = {
      hasActiveQuestion: !!questionRef.current,
      lastSpeaker: fsmRef.current.hasQuestion() ? 'candidate' : 'interviewer',
      answerWordCount: answerRef.current.split(/\s+/).filter(Boolean).length,
      turnsSinceQuestion: utteranceEndCountRef.current,
    };

    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const intent = classifyIntent(text, conversationState);
    console.log(`[Engine] Utterance: "${text.substring(0, 50)}..." -> ${intent.intent} (conf: ${utterance.confidence.toFixed(2)})`);

    logTranscriptEvent({
      event: 'UTTERANCE_FINALIZED',
      text,
      confidence: utterance.confidence,
      wordCount,
    });

    logTranscriptEvent({
      event: 'INTENT_CLASSIFIED',
      text,
      wordCount,
      intent: intent.intent,
      intentConf: intent.confidence,
      reason: intent.reason,
      isQuestion: intent.isInterviewerQuestion,
      isAnswer: intent.isAnswer,
      fsmState: fsmRef.current.getState(),
      meta: {
        hasActiveQuestion: conversationState.hasActiveQuestion,
        answerWordCount: conversationState.answerWordCount,
        isCandidateClarification: intent.isCandidateClarification,
      },
    });

    // Only treat as main question if it's an interviewer question (not candidate clarification)
    // and the utterance has sufficient confidence — garbage ASR fragments ending
    // with '?' must not reset the Q&A cycle.
    if (intent.isInterviewerQuestion && utterance.confidence >= MIN_QUESTION_CONFIDENCE) {
      // Flush any substantial pending answer before accepting the new question.
      // This is the primary safety net when the silence-based trigger misses.
      const pendingAnswer = answerRef.current.trim();
      const pendingWords = pendingAnswer.split(/\s+/).filter(Boolean).length;
      if (questionRef.current && pendingWords >= MIN_WORDS) {
        console.log(`[Engine] New question — flushing ${pendingWords}-word pending answer`);
        logTranscriptEvent({ event: 'ANALYSIS_TRIGGERED', meta: { trigger: 'new_question_flush', pendingWords } });
        triggerRef.current();
      }

      utteranceBuilder.reset();
      
      questionRef.current = text;
      answerRef.current = '';
      questionReceivedTimeRef.current = Date.now();
      setCurrentQuestion(text);
      setCurrentAnswer('');
      consecutiveSilentEventsRef.current = 0;
      utteranceEndCountRef.current = 0;
      
      fsmRef.current.dispatch('QUESTION_RECEIVED');
      setFsmState(fsmRef.current.getState());

      logTranscriptEvent({
        event: 'FSM_TRANSITION',
        fsmState: fsmRef.current.getState(),
        meta: { event: 'QUESTION_RECEIVED', question: text.substring(0, 120) },
      });
      
    } else if (questionRef.current) {
      // Accumulate answer (including candidate clarifications as part of answer)
      if (answerRef.current) {
        answerRef.current += ' ' + text;
      } else {
        answerRef.current = text;
      }
      setCurrentAnswer(answerRef.current);
      
      if (intent.isAnswer) {
        fsmRef.current.dispatch('ANSWER_RECEIVED');
        setFsmState(fsmRef.current.getState());

        logTranscriptEvent({
          event: 'FSM_TRANSITION',
          fsmState: fsmRef.current.getState(),
          meta: { event: 'ANSWER_RECEIVED', answerSoFar: answerRef.current.substring(0, 120) },
        });
      }
    }
  }, [addUtterance, setCurrentQuestion, setCurrentAnswer]);

  // Single utterance builder — speaker is assigned *after* classification,
  // breaking the circular dependency where FSM state decided the speaker
  // label before classification could update the FSM.
  const utteranceBuilder = useUtteranceBuilder({
    onUtteranceComplete: handleUtteranceComplete,
    speaker: 'interviewer', // default; overridden in handleUtteranceComplete
  });

  // Handle Deepgram transcript
  const handleTranscript = useCallback((result: DeepgramResult) => {
    if (!result.text.trim()) return;
    lastSpeechTimeRef.current = Date.now();
    consecutiveSilentEventsRef.current = 0; // Reset on any speech
    
    if (!result.isFinal) {
      const currentText = utteranceBuilder.getCurrentText();
      const interimDisplay = currentText ? `${currentText} ${result.text}` : result.text;
      setInterimText(interimDisplay);
    } else {
      setInterimText('');
    }
    
    utteranceBuilder.processResult(result);
  }, [utteranceBuilder, setInterimText]);

  // Handle Deepgram utterance end - improved auto-trigger logic
  const handleUtteranceEnd = useCallback(() => {
    console.log('[Engine] UtteranceEnd fired');
    utteranceEndCountRef.current++;
    
    // Force finalize any pending utterance in the builder
    const pendingText = utteranceBuilder.getCurrentText();
    if (pendingText && utteranceBuilder.getWordCount() >= 3) {
      console.log('[Engine] Forcing utterance finalization on UtteranceEnd');
      utteranceBuilder.forceFinalize();
    }
    
    if (!questionRef.current) {
      console.log('[Engine] No question yet');
      return;
    }
    
    if (!answerRef.current) {
      console.log('[Engine] No answer yet');
      consecutiveSilentEventsRef.current++;
      return;
    }

    const answer = answerRef.current.trim();
    const wordCount = answer.split(/\s+/).filter(Boolean).length;
    const silenceMs = Date.now() - lastSpeechTimeRef.current;
    const avgConfidence = getAvgConfidence();
    
    consecutiveSilentEventsRef.current++;
    
    console.log(`[Engine] Answer: ${wordCount} words, silence: ${silenceMs}ms, silent events: ${consecutiveSilentEventsRef.current}, conf: ${avgConfidence.toFixed(2)}`);

    // Use the improved shouldAutoTrigger function
    const triggerResult = shouldAutoTrigger(
      answer,
      questionRef.current,
      silenceMs,
      {
        consecutiveSilentUtterances: consecutiveSilentEventsRef.current,
        avgConfidence,
        timeSinceLastSpeech: silenceMs,
      }
    );

    console.log(`[Engine] Trigger decision: ${triggerResult.trigger ? 'YES' : 'NO'} - ${triggerResult.reason} (conf: ${triggerResult.confidence.toFixed(2)})`);

    logTranscriptEvent({
      event: 'TRIGGER_DECISION',
      trigger: triggerResult.trigger,
      triggerReason: triggerResult.reason,
      silenceMs,
      meta: {
        wordCount,
        avgConfidence,
        consecutiveSilentUtterances: consecutiveSilentEventsRef.current,
        triggerConfidence: triggerResult.confidence,
      },
    });

    if (triggerResult.trigger && triggerResult.confidence >= CONFIDENCE_THRESHOLD) {
      triggerRef.current();
    }
  }, [getAvgConfidence, utteranceBuilder]);

  // Deepgram hook
  const deepgram = useDeepgram({
    onTranscript: handleTranscript,
    onUtteranceEnd: handleUtteranceEnd,
    onError: (err) => console.error('[Deepgram]', err),
  });

  // Start interview
  useEffect(() => {
    if (isInterviewActive && !hasStartedRef.current && interviewContext) {
      hasStartedRef.current = true;
      console.log('[Engine] Starting interview');

      // FIX: Set interview start time
      const now = Date.now();
      setInterviewStartTime(now);
      updateLastActivity(); // Initialize inactivity timer

      fsmRef.current.dispatch('START');
      setFsmState(fsmRef.current.getState());

      deepgram.connect(language);
    }
  }, [isInterviewActive, interviewContext, language, deepgram, setInterviewStartTime]);

  // Update FSM when analysis completes
  useEffect(() => {
    if (!isAnalyzing && !isGeneratingQuestions && !isGeneratingRating) {
      if (fsmRef.current.isAnalyzing()) {
        fsmRef.current.dispatch('ANALYSIS_DONE');
        setFsmState(fsmRef.current.getState());
      }
    }
  }, [isAnalyzing, isGeneratingQuestions, isGeneratingRating]);

  // ── Post-analysis: parse score, update topic progress ──
  const prevAnalyzingRef = useRef(false);
  useEffect(() => {
    const wasAnalyzing = prevAnalyzingRef.current;
    prevAnalyzingRef.current = isAnalyzing;

    // Fire only on the transition isAnalyzing: true → false
    if (wasAnalyzing && !isAnalyzing && analysisText && interviewContext) {
      console.log('[Engine] Analysis completed — updating topic progress');

      // 1. Parse score from analysisText (look for **Score: X/5**)
      const scoreMatch = analysisText.match(/\*\*Score:\s*(\d(?:\.\d)?)\s*\/\s*5\*\*/);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : undefined;
      if (score !== undefined) {
        setLastAnswerScore(score);
        console.log(`[Engine] Parsed score: ${score}/5`);
      }

      // 2. Update topic progress for the current question's topic
      const lastQuestion = questionsAsked[questionsAsked.length - 1];
      if (lastQuestion) {
        const topic = interviewContext.requiredSkills?.[0] || 'General';
        updateTopicProgress(topic, score);
      }
    }
  }, [isAnalyzing]);

  // Manual trigger
  const triggerAnalysis = useCallback(() => {
    const question = questionRef.current.trim();
    const answer = answerRef.current.trim();

    if (!question || !answer || !interviewContext || !socketConnected) {
      return false;
    }

    if (isAnalyzing || isGeneratingQuestions || isGeneratingRating) {
      return false;
    }

    lastTriggerTimeRef.current = Date.now();

    // Show "Generating next question..." placeholder immediately
    clearNextQuestion();
    setIsGeneratingNextQuestion(true);

    const questionTurn = {
      id: `q-${Date.now()}`,
      speaker: 'interviewer' as const,
      text: question,
      timestamp: Date.now() - 2000,
    };

    const answerTurn = {
      id: `a-${Date.now()}`,
      speaker: 'candidate' as const,
      text: answer,
      timestamp: Date.now(),
    };

    addTurn(questionTurn);
    addTurn(answerTurn);

    // FIX: Pass the updated turns array including the new Q&A
    const updatedTurns = [...turns, questionTurn, answerTurn];
    analyze(question, answer, updatedTurns, interviewContext, coveredTopics, language);

    // Fire next-question generation in PARALLEL with analysis
    const coveredTopicNames = topicProgress.map(tp => tp.topic);
    const pendingTopics = (interviewContext.requiredSkills || []).filter(
      skill => !coveredTopicNames.includes(skill)
    );
    const totalQ = questionsAsked.length + 1;
    addQuestionAsked(question);
    requestNextQuestion(
      interviewContext,
      updatedTurns,
      topicProgress,
      pendingTopics,
      questionsAsked,
      answer.substring(0, 300),
      undefined,
      totalQ,
      language
    );

    fsmRef.current.dispatch('ANALYZE');
    setFsmState(fsmRef.current.getState());

    answerRef.current = '';
    setCurrentAnswer('');
    consecutiveSilentEventsRef.current = 0;
    utteranceEndCountRef.current = 0;

    return true;
  }, [interviewContext, turns, language, coveredTopics, analyze, isAnalyzing, isGeneratingQuestions, isGeneratingRating, socketConnected, addTurn, setCurrentAnswer, clearNextQuestion, setIsGeneratingNextQuestion, requestNextQuestion, topicProgress, questionsAsked, addQuestionAsked]);

  const clearAnswer = useCallback(() => {
    answerRef.current = '';
    utteranceBuilder.reset();
    setCurrentAnswer('');
    consecutiveSilentEventsRef.current = 0;
    utteranceEndCountRef.current = 0;
    confidenceSamplesRef.current = [];
  }, [setCurrentAnswer, utteranceBuilder]);

  const canStartAnalysis = useCallback(() => {
    return !isAnalyzing && !isGeneratingQuestions && !isGeneratingRating &&
           !!answerRef.current.trim() &&
           !!questionRef.current.trim();
  }, [isAnalyzing, isGeneratingQuestions, isGeneratingRating]);

  const endInterview = useCallback(() => {
    console.log('[Engine] Ending interview');

    deepgram.stopMicrophone();
    deepgram.disconnect();
    cancel();
    utteranceBuilder.destroy();

    fsmRef.current.dispatch('END');
    fsmRef.current.reset();

    hasStartedRef.current = false;
    answerRef.current = '';
    questionRef.current = '';
    consecutiveSilentEventsRef.current = 0;
    utteranceEndCountRef.current = 0;
    confidenceSamplesRef.current = [];

    setInterviewActive(false);
    resetInterview();
  }, [deepgram, cancel, utteranceBuilder, setInterviewActive, resetInterview]);

  const getCurrentState = useCallback(() => fsmState, [fsmState]);

  return {
    isConnected: deepgram.isConnected,
    connect: deepgram.connect,
    startMicrophone: deepgram.startMicrophone,
    stopMicrophone: deepgram.stopMicrophone,
    triggerAnalysis,
    clearAnswer,
    canStartAnalysis,
    endInterview,
    getCurrentState,
  };
}
