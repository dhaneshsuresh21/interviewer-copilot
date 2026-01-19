import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useInterviewStore } from '../store';
import type { Turn, InterviewContext } from '../types';
import { API_BASE_URL } from '../constants';

export function useSocketAnalysis() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const currentTxRef = useRef<string>('');

  const {
    appendAnalysisChunk,
    appendQuestionsChunk,
    appendRatingChunk,
    setIsAnalyzing,
    setIsGeneratingQuestions,
    setIsGeneratingRating,
    clearAnalysis,
    clearQuestions,
    clearRating,
  } = useInterviewStore();

  useEffect(() => {
    if (socketRef.current) return;

    console.log('[Socket] Connecting to', API_BASE_URL);
    
    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      setIsConnected(false);
    });

    // Combined analysis events
    socket.on('analysis:chunk', ({ type, chunk, txId }) => {
      if (txId !== currentTxRef.current) return;
      
      switch (type) {
        case 'analysis': appendAnalysisChunk(chunk); break;
        case 'questions': appendQuestionsChunk(chunk); break;
        case 'rating': appendRatingChunk(chunk); break;
      }
    });

    socket.on('analysis:complete', ({ type, txId }) => {
      if (txId !== currentTxRef.current) return;
      
      switch (type) {
        case 'analysis': setIsAnalyzing(false); break;
        case 'questions': setIsGeneratingQuestions(false); break;
        case 'rating': setIsGeneratingRating(false); break;
      }
    });

    socket.on('analysis:error', ({ type, error, txId }) => {
      if (txId !== currentTxRef.current) return;
      console.error(`[Socket] ${type} error:`, error);
      
      setIsAnalyzing(false);
      setIsGeneratingQuestions(false);
      setIsGeneratingRating(false);
    });

    // Legacy handlers
    socket.on('analyze:chunk', ({ chunk, generationId }) => {
      if (generationId.startsWith(currentTxRef.current)) {
        appendAnalysisChunk(chunk);
      }
    });
    socket.on('analyze:complete', ({ generationId }) => {
      if (generationId.startsWith(currentTxRef.current)) {
        setIsAnalyzing(false);
      }
    });
    socket.on('analyze:error', ({ generationId }) => {
      if (generationId.startsWith(currentTxRef.current)) {
        setIsAnalyzing(false);
      }
    });

    socket.on('questions:chunk', ({ chunk, generationId }) => {
      if (generationId.startsWith(currentTxRef.current)) {
        appendQuestionsChunk(chunk);
      }
    });
    socket.on('questions:complete', ({ generationId }) => {
      if (generationId.startsWith(currentTxRef.current)) {
        setIsGeneratingQuestions(false);
      }
    });
    socket.on('questions:error', ({ generationId }) => {
      if (generationId.startsWith(currentTxRef.current)) {
        setIsGeneratingQuestions(false);
      }
    });

    socket.on('rating:chunk', ({ chunk, generationId }) => {
      if (generationId.startsWith(currentTxRef.current)) {
        appendRatingChunk(chunk);
      }
    });
    socket.on('rating:complete', ({ generationId }) => {
      if (generationId.startsWith(currentTxRef.current)) {
        setIsGeneratingRating(false);
      }
    });
    socket.on('rating:error', ({ generationId }) => {
      if (generationId.startsWith(currentTxRef.current)) {
        setIsGeneratingRating(false);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Single analyze call - uses combined endpoint
  const analyze = useCallback((
    question: string,
    answer: string,
    turns: Turn[],
    interviewContext: InterviewContext,
    coveredTopics: string[],
    language: string
  ) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      console.error('[Socket] Not connected');
      return null;
    }

    // FIX: Validate interviewContext has required fields
    if (!interviewContext?.role || !interviewContext?.experienceLevel) {
      console.error('[Socket] Invalid interview context');
      return null;
    }

    // Cancel previous
    if (currentTxRef.current) {
      socket.emit('analyze:cancel', { txId: currentTxRef.current });
    }

    const txId = `tx-${Date.now()}`;
    currentTxRef.current = txId;

    // Clear all panels
    clearAnalysis();
    clearQuestions();
    clearRating();

    // Set loading states
    setIsAnalyzing(true);
    setIsGeneratingQuestions(true);
    setIsGeneratingRating(true);

    // FIX: Wrap emit in try-catch to handle disconnection between check and emit
    try {
      // Use combined endpoint (single LLM call)
      socket.emit('analyze:batch', {
        txId,
        question,
        answer,
        turns,
        interviewContext,
        coveredTopics,
        language,
        competency: interviewContext.requiredSkills?.[0] || 'General',
      });
    } catch (error) {
      console.error('[Socket] Emit failed:', error);
      setIsAnalyzing(false);
      setIsGeneratingQuestions(false);
      setIsGeneratingRating(false);
      return null;
    }

    return txId;
  }, [clearAnalysis, clearQuestions, clearRating, setIsAnalyzing, setIsGeneratingQuestions, setIsGeneratingRating]);

  const cancel = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || !currentTxRef.current) return;

    socket.emit('analyze:cancel', { txId: currentTxRef.current });
    
    currentTxRef.current = '';
    setIsAnalyzing(false);
    setIsGeneratingQuestions(false);
    setIsGeneratingRating(false);
  }, [setIsAnalyzing, setIsGeneratingQuestions, setIsGeneratingRating]);

  return {
    analyze,
    cancel,
    isConnected,
  };
}
