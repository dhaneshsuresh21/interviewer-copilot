// Shared types between frontend and backend
export interface Turn {
  id: string;
  speaker: 'interviewer' | 'candidate';
  text: string;
  timestamp: number;
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

// Socket request types
export interface AnalysisRequest {
  turns: Turn[];
  currentQuestion: string;
  candidateAnswer: string;
  interviewContext: InterviewContext;
  language: string;
  generationId: string;
}

export interface QuestionRequest {
  turns: Turn[];
  interviewContext: InterviewContext;
  coveredTopics: string[];
  language: string;
  generationId: string;
}

export interface RatingRequest {
  question: string;
  answer: string;
  competency: string;
  interviewContext: InterviewContext;
  generationId: string;
}

// NEW: Evaluation and Analytics Types
export interface CompetencyRating {
  competency: string;
  score: number; // 1-5
  evidence: string[];
  concerns: string[];
  weight: number; // 0-1, importance for role
  source?: 'interviewer' | 'ai'; // Source of the rating
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

export interface EvaluationMatrix {
  role: string;
  experienceLevel: string;
  competencies: {
    name: string;
    weight: number;
    description: string;
    criteria: {
      score: number;
      description: string;
    }[];
  }[];
}

export interface CandidateComparison {
  candidates: {
    id: string;
    name: string;
    overallScore: number;
    competencyScores: { [competency: string]: number };
    strengths: string[];
    concerns: string[];
    recommendation: string;
  }[];
  role: string;
  evaluationDate: number;
}

export interface InterviewerAnalytics {
  interviewerId: string;
  interviewerName: string;
  totalInterviews: number;
  averageDuration: number;
  averageQuestionsAsked: number;
  competencyCoverage: { [competency: string]: number };
  recommendationDistribution: {
    strong_hire: number;
    hire: number;
    maybe: number;
    no_hire: number;
  };
  recentSessions: string[]; // session IDs
}
