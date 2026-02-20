import { useEffect, useRef, useCallback, useState } from 'react';
import { useInterviewStore } from '../store';
import { useDeepgram } from './useDeepgram';
import { useSocketAnalysis } from './useSocketAnalysis';
import { useUtteranceBuilder } from './useUtteranceBuilder';
import { ConversationStateMachine } from '../ConversationStateMachine';
import { classifyIntent, shouldAutoTrigger, ConversationState } from '../intentClassifier';
import type { DeepgramResult, Utterance } from '../types';

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
  } = useInterviewStore();

  const { analyze, cancel, isConnected: socketConnected } = useSocketAnalysis();

  const fsmRef = useRef(new ConversationStateMachine());
  const hasStartedRef = useRef(false);
  
  // Question/answer tracking
  const questionRef = useRef('');
  const answerRef = useRef('');
  
  // Enhanced trigger tracking
  const lastTriggerTimeRef = useRef(0);
  const lastSpeechTimeRef = useRef(0);
  const consecutiveSilentEventsRef = useRef(0);
  const utteranceEndCountRef = useRef(0);
  const confidenceSamplesRef = useRef<number[]>([]);
  
  // Increased debounce and minimum words
  const TRIGGER_DEBOUNCE_MS = 5000;
  const MIN_WORDS = 8;
  const MIN_CONFIDENCE = 0.65;
  
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

    // Debounce - increased to 5 seconds
    const now = Date.now();
    if (now - lastTriggerTimeRef.current < TRIGGER_DEBOUNCE_MS) {
      console.log('[Engine] Trigger debounced');
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

    // FIX: Use consistent confidence threshold (MIN_CONFIDENCE = 0.65)
    const avgConfidence = getAvgConfidence();
    if (avgConfidence < MIN_CONFIDENCE) {
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

    fsmRef.current.dispatch('ANALYZE');
    setFsmState(fsmRef.current.getState());

    // Reset tracking state
    answerRef.current = '';
    setCurrentAnswer('');
    consecutiveSilentEventsRef.current = 0;
    utteranceEndCountRef.current = 0;
    confidenceSamplesRef.current = [];

    return true;
  }, [interviewContext, turns, language, coveredTopics, analyze, isAnalyzing, isGeneratingQuestions, isGeneratingRating, socketConnected, addTurn, setCurrentAnswer, getAvgConfidence]);

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

    const intent = classifyIntent(text, conversationState);
    console.log(`[Engine] Utterance: "${text.substring(0, 50)}..." -> ${intent.intent} (conf: ${utterance.confidence.toFixed(2)})`);

    // Only treat as main question if it's an interviewer question (not candidate clarification)
    if (intent.isInterviewerQuestion) {
      // FIX: Reset the candidate utterance builder when new question arrives
      candidateUtteranceBuilder.reset();
      
      questionRef.current = text;
      answerRef.current = '';
      setCurrentQuestion(text);
      setCurrentAnswer('');
      consecutiveSilentEventsRef.current = 0;
      utteranceEndCountRef.current = 0;
      
      fsmRef.current.dispatch('QUESTION_RECEIVED');
      setFsmState(fsmRef.current.getState());
      
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
      }
    }
  }, [addUtterance, setCurrentQuestion, setCurrentAnswer]);

  // Utterance builder - FIX: Create separate builders for interviewer and candidate
  // to properly track speaker context
  const interviewerUtteranceBuilder = useUtteranceBuilder({
    onUtteranceComplete: handleUtteranceComplete,
    speaker: 'interviewer',
  });

  const candidateUtteranceBuilder = useUtteranceBuilder({
    onUtteranceComplete: handleUtteranceComplete,
    speaker: 'candidate',
  });

  // Get the active utterance builder based on FSM state
  const getActiveUtteranceBuilder = useCallback(() => {
    return fsmRef.current.hasQuestion() ? candidateUtteranceBuilder : interviewerUtteranceBuilder;
  }, [interviewerUtteranceBuilder, candidateUtteranceBuilder]);

  // Handle Deepgram transcript
  const handleTranscript = useCallback((result: DeepgramResult) => {
    if (!result.text.trim()) return;
    lastSpeechTimeRef.current = Date.now();
    consecutiveSilentEventsRef.current = 0; // Reset on any speech
    
    // FIX: Show interim results in real-time for better UX
    if (!result.isFinal) {
      // Update interim text for real-time display
      const activeBuilder = getActiveUtteranceBuilder();
      const currentText = activeBuilder.getCurrentText();
      const interimDisplay = currentText ? `${currentText} ${result.text}` : result.text;
      setInterimText(interimDisplay);
    } else {
      // Clear interim text when we get final result
      setInterimText('');
    }
    
    // FIX: Route to correct utterance builder based on current FSM state
    const activeBuilder = getActiveUtteranceBuilder();
    activeBuilder.processResult(result);
  }, [getActiveUtteranceBuilder, setInterimText]);

  // Handle Deepgram utterance end - improved auto-trigger logic
  const handleUtteranceEnd = useCallback(() => {
    console.log('[Engine] UtteranceEnd fired');
    utteranceEndCountRef.current++;
    
    // FIX: Force finalize any pending utterance in the active builder
    const activeBuilder = getActiveUtteranceBuilder();
    const pendingText = activeBuilder.getCurrentText();
    if (pendingText && activeBuilder.getWordCount() >= 3) {
      console.log('[Engine] Forcing utterance finalization on UtteranceEnd');
      activeBuilder.forceFinalize();
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

    // FIX: Use consistent confidence threshold (MIN_CONFIDENCE = 0.65 instead of 0.7)
    if (triggerResult.trigger && triggerResult.confidence >= MIN_CONFIDENCE) {
      triggerRef.current();
    }
  }, [getAvgConfidence, getActiveUtteranceBuilder]);

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
      setInterviewStartTime(Date.now());

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

    fsmRef.current.dispatch('ANALYZE');
    setFsmState(fsmRef.current.getState());

    answerRef.current = '';
    setCurrentAnswer('');
    consecutiveSilentEventsRef.current = 0;
    utteranceEndCountRef.current = 0;

    return true;
  }, [interviewContext, turns, language, coveredTopics, analyze, isAnalyzing, isGeneratingQuestions, isGeneratingRating, socketConnected, addTurn, setCurrentAnswer]);

  const clearAnswer = useCallback(() => {
    answerRef.current = '';
    candidateUtteranceBuilder.reset();
    setCurrentAnswer('');
    consecutiveSilentEventsRef.current = 0;
    utteranceEndCountRef.current = 0;
    confidenceSamplesRef.current = [];
  }, [setCurrentAnswer, candidateUtteranceBuilder]);

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
    interviewerUtteranceBuilder.destroy();
    candidateUtteranceBuilder.destroy();

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
  }, [deepgram, cancel, interviewerUtteranceBuilder, candidateUtteranceBuilder, setInterviewActive, resetInterview]);

  const getCurrentState = useCallback(() => fsmState, [fsmState]);

  return {
    isConnected: deepgram.isConnected,
    startMicrophone: deepgram.startMicrophone,
    stopMicrophone: deepgram.stopMicrophone,
    triggerAnalysis,
    clearAnswer,
    canStartAnalysis,
    endInterview,
    getCurrentState,
  };
}
