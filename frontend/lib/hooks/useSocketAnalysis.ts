import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useInterviewStore } from '../store';
import type { Turn, InterviewContext, TopicProgress, InterviewStage } from '../types';
import { API_BASE_URL } from '../constants';

export function useSocketAnalysis() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const currentTxRef = useRef<string>('');

  const {
    appendAnalysisChunk,
    appendQuestionsChunk,
    appendRatingChunk,
    appendNextQuestionChunk,
    setIsAnalyzing,
    setIsGeneratingQuestions,
    setIsGeneratingRating,
    setIsGeneratingNextQuestion,
    clearAnalysis,
    clearQuestions,
    clearRating,
    clearNextQuestion,
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
    let chunkCounts = { analysis: 0, questions: 0, rating: 0 };
    socket.on('analysis:chunk', ({ type, chunk, txId }) => {
      if (txId !== currentTxRef.current) {
        console.log(`[Socket] Ignoring stale chunk | type=${type} txId=${txId} current=${currentTxRef.current}`);
        return;
      }
      chunkCounts[type as keyof typeof chunkCounts] = (chunkCounts[type as keyof typeof chunkCounts] || 0) + 1;
      if (chunkCounts[type as keyof typeof chunkCounts] === 1) {
        console.log(`[Socket] First ${type} chunk received (${chunk.length} chars)`);
      }
      
      switch (type) {
        case 'analysis': appendAnalysisChunk(chunk); break;
        case 'questions': appendQuestionsChunk(chunk); break;
        case 'rating': appendRatingChunk(chunk); break;
      }
    });

    socket.on('analysis:complete', ({ type, txId }) => {
      if (txId !== currentTxRef.current) return;
      console.log(`[Socket] analysis:complete | type=${type} txId=${txId} chunks=${chunkCounts[type as keyof typeof chunkCounts] || 0}`);
      
      switch (type) {
        case 'analysis': setIsAnalyzing(false); break;
        case 'questions': setIsGeneratingQuestions(false); break;
        case 'rating': setIsGeneratingRating(false); break;
      }
    });

    socket.on('analysis:error', ({ type, error, txId }) => {
      if (txId !== currentTxRef.current) return;
      console.error(`[Socket] analysis:error | type=${type} error=${error} txId=${txId}`);
      
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

    // Next-question Co-Pilot events
    let nqChunkCount = 0;
    socket.on('next-question:chunk', ({ chunk, txId }) => {
      if (txId === currentTxRef.current) {
        nqChunkCount++;
        if (nqChunkCount === 1) {
          console.log(`[Socket] First next-question chunk received (${chunk.length} chars)`);
        }
        appendNextQuestionChunk(chunk);
      } else {
        console.log(`[Socket] Ignoring stale next-question chunk | txId=${txId} current=${currentTxRef.current}`);
      }
    });

    socket.on('next-question:complete', ({ txId }) => {
      console.log(`[Socket] next-question:complete | txId=${txId} totalChunks=${nqChunkCount}`);
      nqChunkCount = 0;
      if (txId === currentTxRef.current) {
        setIsGeneratingNextQuestion(false);
      }
    });

    socket.on('next-question:error', ({ error, txId }) => {
      console.error(`[Socket] next-question:error | txId=${txId} error=${error}`);
      nqChunkCount = 0;
      if (txId === currentTxRef.current) {
        setIsGeneratingNextQuestion(false);
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

    console.log(`[Socket] === EMITTING analyze:batch === txId=${txId}`);
    console.log(`[Socket]   Q: "${question.substring(0, 80)}"`);
    console.log(`[Socket]   A: "${answer.substring(0, 80)}"`);
    console.log(`[Socket]   turns: ${turns.length}, role: ${interviewContext.role}, skills: [${interviewContext.requiredSkills?.join(', ')}], lang: ${language}`);

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
      console.log(`[Socket] analyze:batch emitted successfully`);
    } catch (error) {
      console.error('[Socket] Emit failed:', error);
      setIsAnalyzing(false);
      setIsGeneratingQuestions(false);
      setIsGeneratingRating(false);
      return null;
    }

    return txId;
  }, [clearAnalysis, clearQuestions, clearRating, setIsAnalyzing, setIsGeneratingQuestions, setIsGeneratingRating]);

  const requestNextQuestion = useCallback((
    interviewContext: InterviewContext,
    turns: Turn[],
    topicProgress: TopicProgress[],
    pendingTopics: string[],
    questionsAsked: string[],
    lastAnswerSummary: string | undefined,
    lastAnswerScore: number | undefined,
    currentStage: InterviewStage,
    totalQuestionsAsked: number,
    language: string
  ) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      console.error('[Socket] Not connected for next-question');
      return;
    }

    const txId = currentTxRef.current || `tx-${Date.now()}`;
    console.log(`[Socket] === EMITTING suggest:next-question === txId=${txId}`);
    console.log(`[Socket]   stage=${currentStage} totalQ=${totalQuestionsAsked} pending=[${pendingTopics.join(',')}] lastScore=${lastAnswerScore}`);
    clearNextQuestion();
    setIsGeneratingNextQuestion(true);

    try {
      socket.emit('suggest:next-question', {
        txId,
        interviewContext,
        turns,
        topicProgress,
        pendingTopics,
        questionsAsked,
        lastAnswerSummary,
        lastAnswerScore,
        currentStage,
        totalQuestionsAsked,
        language,
      });
      console.log(`[Socket] suggest:next-question emitted successfully`);
    } catch (error) {
      console.error('[Socket] Next-question emit failed:', error);
      setIsGeneratingNextQuestion(false);
    }
  }, [clearNextQuestion, setIsGeneratingNextQuestion]);

  const cancel = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || !currentTxRef.current) return;

    socket.emit('analyze:cancel', { txId: currentTxRef.current });
    
    currentTxRef.current = '';
    setIsAnalyzing(false);
    setIsGeneratingQuestions(false);
    setIsGeneratingRating(false);
    setIsGeneratingNextQuestion(false);
  }, [setIsAnalyzing, setIsGeneratingQuestions, setIsGeneratingRating, setIsGeneratingNextQuestion]);

  return {
    analyze,
    requestNextQuestion,
    cancel,
    isConnected,
  };
}
