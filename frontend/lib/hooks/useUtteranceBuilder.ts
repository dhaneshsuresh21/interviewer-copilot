import { useRef, useCallback, useEffect } from 'react';
import type { DeepgramResult, Utterance } from '../types';

interface UseUtteranceBuilderProps {
  onUtteranceComplete: (utterance: Utterance) => void;
  speaker: 'interviewer' | 'candidate';
}

// Increased silence threshold to reduce false triggers from natural pauses
const SILENCE_CHECK_MS = 2500;

// Minimum confidence to consider a transcript reliable
const MIN_CONFIDENCE_THRESHOLD = 0.65;

// Minimum words before we consider finalizing
const MIN_WORDS_TO_FINALIZE = 3;

// FIX: Maximum confidence samples to prevent unbounded growth
const MAX_CONFIDENCE_SAMPLES = 20;

export function useUtteranceBuilder({ onUtteranceComplete, speaker }: UseUtteranceBuilderProps) {
  const accumulatorRef = useRef<string>('');
  const startTimeRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  // FIX: Use fixed-size circular buffer for confidence samples
  const confidenceSamplesRef = useRef<number[]>([]);
  const confidenceIndexRef = useRef<number>(0);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wordCountRef = useRef<number>(0);
  const speechFinalCountRef = useRef<number>(0);
  
  // FIX: Store speaker in ref to avoid stale closure issues
  const speakerRef = useRef(speaker);
  speakerRef.current = speaker;
  
  // FIX: Store callback in ref to avoid stale closure
  const onUtteranceCompleteRef = useRef(onUtteranceComplete);
  onUtteranceCompleteRef.current = onUtteranceComplete;

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const getAverageConfidence = useCallback(() => {
    const samples = confidenceSamplesRef.current;
    if (samples.length === 0) return 0;
    return samples.reduce((a, b) => a + b, 0) / samples.length;
  }, []);

  const finalizeUtterance = useCallback(() => {
    const text = accumulatorRef.current.trim();
    const avgConfidence = getAverageConfidence();
    
    // Don't finalize if text is too short or confidence is too low
    if (!text || wordCountRef.current < MIN_WORDS_TO_FINALIZE) {
      console.log(`[UtteranceBuilder] Skipping finalize: ${wordCountRef.current} words`);
      return;
    }

    if (avgConfidence < MIN_CONFIDENCE_THRESHOLD) {
      console.log(`[UtteranceBuilder] Skipping finalize: low confidence ${avgConfidence.toFixed(2)}`);
      return;
    }

    // FIX: Use refs to get current values, avoiding stale closures
    const utterance: Utterance = {
      id: `utt-${Date.now()}`,
      speaker: speakerRef.current,
      text,
      startTime: startTimeRef.current,
      endTime: Date.now(),
      confidence: avgConfidence,
    };
    
    console.log(`[UtteranceBuilder] Finalizing: "${text.substring(0, 50)}..." (${wordCountRef.current} words, conf: ${avgConfidence.toFixed(2)})`);
    onUtteranceCompleteRef.current(utterance);

    // Reset state
    accumulatorRef.current = '';
    startTimeRef.current = 0;
    lastUpdateRef.current = 0;
    confidenceSamplesRef.current = [];
    confidenceIndexRef.current = 0;
    wordCountRef.current = 0;
    speechFinalCountRef.current = 0;
    clearSilenceTimer();
  }, [clearSilenceTimer, getAverageConfidence]); // FIX: Removed speaker and onUtteranceComplete from deps

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      // Only finalize on silence if we have substantial content
      if (wordCountRef.current >= MIN_WORDS_TO_FINALIZE) {
        finalizeUtterance();
      }
    }, SILENCE_CHECK_MS);
  }, [clearSilenceTimer, finalizeUtterance]);

  const processResult = useCallback((result: DeepgramResult) => {
    const now = Date.now();

    // Start new utterance if needed
    if (!startTimeRef.current) {
      startTimeRef.current = now;
    }

    lastUpdateRef.current = now;

    // FIX: Track confidence samples using circular buffer (O(1) instead of O(n) shift)
    if (result.confidence > 0) {
      if (confidenceSamplesRef.current.length < MAX_CONFIDENCE_SAMPLES) {
        confidenceSamplesRef.current.push(result.confidence);
      } else {
        // Circular buffer: overwrite oldest sample
        confidenceSamplesRef.current[confidenceIndexRef.current] = result.confidence;
        confidenceIndexRef.current = (confidenceIndexRef.current + 1) % MAX_CONFIDENCE_SAMPLES;
      }
    }

    // Handle final transcripts
    if (result.isFinal) {
      const newText = result.text.trim();
      if (newText) {
        if (accumulatorRef.current) {
          accumulatorRef.current += ' ' + newText;
        } else {
          accumulatorRef.current = newText;
        }
        wordCountRef.current = accumulatorRef.current.split(/\s+/).filter(Boolean).length;
      }

      // Track speechFinal events - multiple in a row suggests speaker is done
      if (result.speechFinal) {
        speechFinalCountRef.current++;
        
        // Only finalize on speechFinal if we have enough content
        // and confidence is good
        const avgConfidence = getAverageConfidence();
        if (wordCountRef.current >= MIN_WORDS_TO_FINALIZE && avgConfidence >= MIN_CONFIDENCE_THRESHOLD) {
          clearSilenceTimer();
          finalizeUtterance();
        } else {
          // Not enough content yet, start silence timer
          startSilenceTimer();
        }
      } else {
        // Reset speechFinal counter on non-final speech
        speechFinalCountRef.current = 0;
        // Reset silence timer on new speech
        startSilenceTimer();
      }
    }
  }, [clearSilenceTimer, finalizeUtterance, startSilenceTimer, getAverageConfidence]);

  const getCurrentText = useCallback(() => accumulatorRef.current, []);
  
  const getWordCount = useCallback(() => wordCountRef.current, []);
  
  const getConfidence = useCallback(() => getAverageConfidence(), [getAverageConfidence]);

  const reset = useCallback(() => {
    accumulatorRef.current = '';
    startTimeRef.current = 0;
    lastUpdateRef.current = 0;
    confidenceSamplesRef.current = [];
    confidenceIndexRef.current = 0;
    wordCountRef.current = 0;
    speechFinalCountRef.current = 0;
    clearSilenceTimer();
  }, [clearSilenceTimer]);

  // FIX: Force finalize any pending utterance (called on Deepgram UtteranceEnd)
  const forceFinalize = useCallback(() => {
    const text = accumulatorRef.current.trim();
    if (!text || wordCountRef.current < MIN_WORDS_TO_FINALIZE) {
      return false;
    }
    
    const avgConfidence = getAverageConfidence();
    // Lower threshold for force finalize since Deepgram says utterance is done
    if (avgConfidence < 0.5) {
      console.log(`[UtteranceBuilder] Force finalize skipped: very low confidence ${avgConfidence.toFixed(2)}`);
      return false;
    }

    const utterance: Utterance = {
      id: `utt-${Date.now()}`,
      speaker: speakerRef.current,
      text,
      startTime: startTimeRef.current,
      endTime: Date.now(),
      confidence: avgConfidence,
    };
    
    console.log(`[UtteranceBuilder] Force finalizing: "${text.substring(0, 50)}..." (${wordCountRef.current} words, conf: ${avgConfidence.toFixed(2)})`);
    onUtteranceCompleteRef.current(utterance);

    // Reset state
    accumulatorRef.current = '';
    startTimeRef.current = 0;
    lastUpdateRef.current = 0;
    confidenceSamplesRef.current = [];
    confidenceIndexRef.current = 0;
    wordCountRef.current = 0;
    speechFinalCountRef.current = 0;
    clearSilenceTimer();
    
    return true;
  }, [clearSilenceTimer, getAverageConfidence]);

  const destroy = useCallback(() => {
    clearSilenceTimer();
  }, [clearSilenceTimer]);

  // FIX: Cleanup silence timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };
  }, []);

  return {
    processResult,
    getCurrentText,
    getWordCount,
    getConfidence,
    reset,
    forceFinalize,
    destroy,
  };
}
