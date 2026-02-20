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

export interface CompetencyRating {
  competency: string;
  score: number;
  evidence: string[];
  concerns: string[];
  weight: number;
  source?: 'interviewer' | 'ai';
}

export interface InterviewSession {
  id: string;
  candidateName: string;
  role: string;
  company: string;
  experienceLevel: string;
  interviewerName?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  turns: Turn[];
  
  // Interviewer Evaluation
  interviewerRatings?: CompetencyRating[];
  interviewerOverallScore?: number;
  interviewerStrengths?: string[];
  interviewerConcerns?: string[];
  interviewerRecommendation?: 'strong_hire' | 'hire' | 'maybe' | 'no_hire';
  
  // AI Evaluation
  aiRatings?: CompetencyRating[];
  aiOverallScore?: number;
  aiStrengths?: string[];
  aiConcerns?: string[];
  aiRecommendation?: 'strong_hire' | 'hire' | 'maybe' | 'no_hire';
  aiAnalysisText?: string;
  
  // Legacy fields (for backward compatibility)
  competencyRatings?: CompetencyRating[];
  overallScore?: number;
  strengths?: string[];
  concerns?: string[];
  recommendation?: 'strong_hire' | 'hire' | 'maybe' | 'no_hire';
  
  notes?: string;
}
