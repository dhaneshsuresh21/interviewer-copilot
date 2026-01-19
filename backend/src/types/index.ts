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
