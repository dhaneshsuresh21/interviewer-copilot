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
  candidateEmail: string;
  candidatePhone: string;
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

// ---------------------------------------------------------------------------
// Structured Interview Co-Pilot Types
// ---------------------------------------------------------------------------

export type InterviewStage = 'Intro' | 'Basic' | 'Core' | 'Advanced' | 'Behavioral';

export interface TopicProgress {
  topic: string;
  questionsAsked: number;
  lastScore?: number;       // 1-5 from AI evaluation
  depth: 'surface' | 'moderate' | 'deep';
}

export interface NextQuestionResponse {
  question: string;
  topic: string;
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  rationale: string;
  stage: InterviewStage;
  followUpHint?: string;
}

// Stage question quotas (cumulative thresholds for auto-advance)
export const STAGE_QUOTAS: Record<InterviewStage, number> = {
  Intro: 2,
  Basic: 7,
  Core: 15,
  Advanced: 20,
  Behavioral: 25,
};

export const STAGE_ORDER: InterviewStage[] = ['Intro', 'Basic', 'Core', 'Advanced', 'Behavioral'];

export interface InterviewSession {
  id: string;
  candidateName: string;
  candidateEmail?: string;
  candidatePhone?: string;
  resumeText?: string;
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
