import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Turn, Utterance, InterviewContext, InterviewState, RatingData } from './types';

interface InterviewStore {
  // Interview state
  interviewState: InterviewState;
  isInterviewActive: boolean;
  interviewContext: InterviewContext | null;
  interviewStartTime: number | null; // FIX: Track actual interview start time
  interviewEndTime: number | null; // FIX: Track actual interview end time
  
  // Transcription
  turns: Turn[];
  utterances: Utterance[];
  currentQuestion: string;
  currentAnswer: string;
  interimText: string; // FIX: Add interim text for real-time display
  
  // AI Analysis
  analysisText: string;
  questionsText: string;
  ratingText: string;
  isAnalyzing: boolean;
  isGeneratingQuestions: boolean;
  isGeneratingRating: boolean;
  
  // Ratings
  ratings: RatingData[];
  coveredTopics: string[];
  
  // Language
  language: string;
  
  // Actions
  setInterviewState: (state: InterviewState) => void;
  setInterviewActive: (active: boolean) => void;
  setInterviewContext: (context: InterviewContext) => void;
  setInterviewStartTime: (time: number) => void; // FIX: Add setter
  setInterviewEndTime: (time: number) => void; // FIX: Add setter
  addTurn: (turn: Turn) => void;
  addUtterance: (utterance: Utterance) => void;
  setCurrentQuestion: (question: string) => void;
  setCurrentAnswer: (answer: string) => void;
  setInterimText: (text: string) => void; // FIX: Add interim text setter
  appendAnalysisChunk: (chunk: string) => void;
  appendQuestionsChunk: (chunk: string) => void;
  appendRatingChunk: (chunk: string) => void;
  clearAnalysis: () => void;
  clearQuestions: () => void;
  clearRating: () => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setIsGeneratingQuestions: (generating: boolean) => void;
  setIsGeneratingRating: (generating: boolean) => void;
  addRating: (rating: RatingData) => void;
  addCoveredTopic: (topic: string) => void;
  setLanguage: (language: string) => void;
  resetInterview: () => void;
}

export const useInterviewStore = create<InterviewStore>()(
  persist(
    (set) => ({
      // Initial state
      interviewState: 'SETUP',
      isInterviewActive: false,
      interviewContext: null,
      interviewStartTime: null, // FIX: Initialize start time
      interviewEndTime: null, // FIX: Initialize end time
      turns: [],
      utterances: [],
      currentQuestion: '',
      currentAnswer: '',
      interimText: '', // FIX: Initialize interim text
      analysisText: '',
      questionsText: '',
      ratingText: '',
      isAnalyzing: false,
      isGeneratingQuestions: false,
      isGeneratingRating: false,
      ratings: [],
      coveredTopics: [],
      language: 'en',

      // Actions
      setInterviewState: (state) => set({ interviewState: state }),
      setInterviewActive: (active) => set({ isInterviewActive: active }),
      setInterviewContext: (context) => set({ interviewContext: context }),
      setInterviewStartTime: (time) => set({ interviewStartTime: time }), // FIX: Add action
      setInterviewEndTime: (time) => set({ interviewEndTime: time }), // FIX: Add action
      addTurn: (turn) => set((state) => ({ turns: [...state.turns, turn] })),
      addUtterance: (utterance) => set((state) => ({ utterances: [...state.utterances, utterance] })),
      setCurrentQuestion: (question) => set({ currentQuestion: question }),
      setCurrentAnswer: (answer) => set({ currentAnswer: answer }),
      setInterimText: (text) => set({ interimText: text }), // FIX: Add interim text action
      appendAnalysisChunk: (chunk) => set((state) => ({ analysisText: state.analysisText + chunk })),
      appendQuestionsChunk: (chunk) => set((state) => ({ questionsText: state.questionsText + chunk })),
      appendRatingChunk: (chunk) => set((state) => ({ ratingText: state.ratingText + chunk })),
      clearAnalysis: () => set({ analysisText: '' }),
      clearQuestions: () => set({ questionsText: '' }),
      clearRating: () => set({ ratingText: '' }),
      setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
      setIsGeneratingQuestions: (generating) => set({ isGeneratingQuestions: generating }),
      setIsGeneratingRating: (generating) => set({ isGeneratingRating: generating }),
      addRating: (rating) => set((state) => ({ ratings: [...state.ratings, rating] })),
      addCoveredTopic: (topic) => set((state) => ({ 
        coveredTopics: state.coveredTopics.includes(topic) ? state.coveredTopics : [...state.coveredTopics, topic] 
      })),
      setLanguage: (language) => set({ language }),
      resetInterview: () => set({
        interviewState: 'SETUP',
        isInterviewActive: false,
        interviewStartTime: null, // FIX: Reset start time
        interviewEndTime: null, // FIX: Reset end time
        turns: [],
        utterances: [],
        currentQuestion: '',
        currentAnswer: '',
        interimText: '', // FIX: Reset interim text
        analysisText: '',
        questionsText: '',
        ratingText: '',
        isAnalyzing: false,
        isGeneratingQuestions: false,
        isGeneratingRating: false,
        ratings: [],
        coveredTopics: [],
      }),
    }),
    {
      name: 'interview-storage', // unique name for localStorage key
      partialize: (state) => ({
        // Only persist these fields
        interviewContext: state.interviewContext,
        interviewStartTime: state.interviewStartTime, // FIX: Persist start time
        interviewEndTime: state.interviewEndTime, // FIX: Persist end time
        turns: state.turns,
        ratings: state.ratings,
        coveredTopics: state.coveredTopics,
        // FIX: Persist AI analysis data
        analysisText: state.analysisText,
        questionsText: state.questionsText,
        ratingText: state.ratingText,
      }),
    }
  )
);
