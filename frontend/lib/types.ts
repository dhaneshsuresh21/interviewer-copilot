export interface Turn {
  id: string;
  speaker: 'interviewer' | 'candidate';
  text: string;
  timestamp: number;
}

export interface Utterance {
  id: string;
  speaker: 'interviewer' | 'candidate';
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface InterviewContext {
  candidateName: string;
  role: string;
  company: string;
  requiredSkills: string[];
  jobDescription?: string;
  candidateResume?: string;
  experienceLevel: 'junior' | 'mid' | 'senior' | 'lead';
}

export interface DeepgramResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  speechFinal: boolean;
  speaker?: number;
}

export type InterviewState = 
  | 'SETUP'
  | 'ASKING_QUESTION'
  | 'CANDIDATE_RESPONDING'
  | 'ANALYZING_RESPONSE'
  | 'RATING'
  | 'BETWEEN_QUESTIONS'
  | 'COMPLETED';

export interface AnalysisResult {
  fullResponse: string;
  generationId: string;
}

export interface QuestionSuggestion {
  question: string;
  rationale: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  targetCompetency: string;
}

export interface RatingData {
  questionId: string;
  score: number;
  aiSuggestion?: string;
  notes?: string;
  timestamp: number;
}
