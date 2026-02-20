import { PrismaClient } from '@prisma/client';
import type { InterviewSession, InterviewerAnalytics, CompetencyRating } from '../types';

const prisma = new PrismaClient();

export class PrismaStorageService {
  // Session Management
  async saveSession(session: InterviewSession): Promise<void> {
    const { 
      turns, // Don't store turns
      interviewerRatings,
      aiRatings,
      interviewerStrengths,
      interviewerConcerns,
      aiStrengths,
      aiConcerns,
      // Legacy fields for backward compatibility
      competencyRatings,
      strengths,
      concerns,
      ...sessionData 
    } = session;

    // Validate and prepare data
    const validatedInterviewerStrengths = Array.isArray(interviewerStrengths) ? interviewerStrengths : (Array.isArray(strengths) ? strengths : []);
    const validatedInterviewerConcerns = Array.isArray(interviewerConcerns) ? interviewerConcerns : (Array.isArray(concerns) ? concerns : []);
    const validatedAiStrengths = Array.isArray(aiStrengths) ? aiStrengths : [];
    const validatedAiConcerns = Array.isArray(aiConcerns) ? aiConcerns : [];

    // Prepare interviewer ratings
    const interviewerRatingsData = (interviewerRatings || competencyRatings || []).map(rating => ({
      competency: rating.competency,
      score: rating.score,
      evidence: JSON.stringify(Array.isArray(rating.evidence) ? rating.evidence : []),
      concerns: JSON.stringify(Array.isArray(rating.concerns) ? rating.concerns : []),
      weight: rating.weight,
      source: 'interviewer' as const
    }));

    // Prepare AI ratings
    const aiRatingsData = (aiRatings || []).map(rating => ({
      competency: rating.competency,
      score: rating.score,
      evidence: JSON.stringify(Array.isArray(rating.evidence) ? rating.evidence : []),
      concerns: JSON.stringify(Array.isArray(rating.concerns) ? rating.concerns : []),
      weight: rating.weight,
      source: 'ai' as const
    }));

    await prisma.interviewSession.upsert({
      where: { id: session.id },
      update: {
        ...sessionData,
        startTime: new Date(sessionData.startTime),
        endTime: sessionData.endTime ? new Date(sessionData.endTime) : null,
        
        // Interviewer evaluation
        interviewerOverallScore: session.interviewerOverallScore ?? session.overallScore ?? 0,
        interviewerRecommendation: session.interviewerRecommendation ?? session.recommendation ?? 'maybe',
        interviewerStrengths: JSON.stringify(validatedInterviewerStrengths),
        interviewerConcerns: JSON.stringify(validatedInterviewerConcerns),
        
        // AI evaluation
        aiOverallScore: session.aiOverallScore ?? 0,
        aiRecommendation: session.aiRecommendation ?? 'maybe',
        aiStrengths: JSON.stringify(validatedAiStrengths),
        aiConcerns: JSON.stringify(validatedAiConcerns),
        aiAnalysisText: session.aiAnalysisText,
        
        // Legacy fields for backward compatibility
        overallScore: session.interviewerOverallScore ?? session.overallScore ?? 0,
        recommendation: session.interviewerRecommendation ?? session.recommendation ?? 'maybe',
        strengths: JSON.stringify(validatedInterviewerStrengths),
        concerns: JSON.stringify(validatedInterviewerConcerns),
        
        competencyRatings: {
          deleteMany: {},
          create: [...interviewerRatingsData, ...aiRatingsData]
        }
      },
      create: {
        ...sessionData,
        startTime: new Date(sessionData.startTime),
        endTime: sessionData.endTime ? new Date(sessionData.endTime) : null,
        
        // Interviewer evaluation
        interviewerOverallScore: session.interviewerOverallScore ?? session.overallScore ?? 0,
        interviewerRecommendation: session.interviewerRecommendation ?? session.recommendation ?? 'maybe',
        interviewerStrengths: JSON.stringify(validatedInterviewerStrengths),
        interviewerConcerns: JSON.stringify(validatedInterviewerConcerns),
        
        // AI evaluation
        aiOverallScore: session.aiOverallScore ?? 0,
        aiRecommendation: session.aiRecommendation ?? 'maybe',
        aiStrengths: JSON.stringify(validatedAiStrengths),
        aiConcerns: JSON.stringify(validatedAiConcerns),
        aiAnalysisText: session.aiAnalysisText,
        
        // Legacy fields
        overallScore: session.interviewerOverallScore ?? session.overallScore ?? 0,
        recommendation: session.interviewerRecommendation ?? session.recommendation ?? 'maybe',
        strengths: JSON.stringify(validatedInterviewerStrengths),
        concerns: JSON.stringify(validatedInterviewerConcerns),
        
        competencyRatings: {
          create: [...interviewerRatingsData, ...aiRatingsData]
        }
      }
    });
  }

  async getSession(sessionId: string): Promise<InterviewSession | null> {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        competencyRatings: true
      }
    });

    if (!session) return null;

    return this.mapToInterviewSession(session);
  }

  async listSessions(filters?: {
    role?: string;
    startDate?: number;
    endDate?: number;
    interviewerName?: string;
  }): Promise<InterviewSession[]> {
    const where: any = {};

    if (filters?.role) {
      where.role = {
        contains: filters.role
        // Note: SQLite doesn't support 'mode: insensitive'
        // We'll do case-insensitive filtering in memory below
      };
    }

    if (filters?.startDate) {
      where.startTime = {
        ...where.startTime,
        gte: new Date(filters.startDate)
      };
    }

    if (filters?.endDate) {
      where.startTime = {
        ...where.startTime,
        lte: new Date(filters.endDate)
      };
    }

    if (filters?.interviewerName) {
      where.interviewerName = filters.interviewerName;
    }

    let sessions = await prisma.interviewSession.findMany({
      where,
      include: {
        competencyRatings: true
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    // SQLite doesn't support case-insensitive search, so filter in memory
    if (filters?.role) {
      const roleLower = filters.role.toLowerCase();
      sessions = sessions.filter((s: any) => 
        s.role.toLowerCase().includes(roleLower)
      );
    }

    return sessions.map((session: any) => this.mapToInterviewSession(session));
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await prisma.interviewSession.delete({
        where: { id: sessionId }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Analytics
  async getInterviewerAnalytics(interviewerName: string): Promise<InterviewerAnalytics> {
    const sessions = await this.listSessions({ interviewerName });
    
    const totalInterviews = sessions.length;
    const avgDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / totalInterviews || 0;
    const avgQuestions = sessions.reduce((sum, s) => {
      const qCount = s.turns.filter(t => t.speaker === 'interviewer').length;
      return sum + qCount;
    }, 0) / totalInterviews || 0;

    const competencyCoverage: { [key: string]: number } = {};
    sessions.forEach(s => {
      (s.interviewerRatings || s.competencyRatings || []).forEach((r: any) => {
        competencyCoverage[r.competency] = (competencyCoverage[r.competency] || 0) + 1;
      });
    });

    const recommendationDistribution = {
      strong_hire: sessions.filter(s => (s.interviewerRecommendation || s.recommendation) === 'strong_hire').length,
      hire: sessions.filter(s => (s.interviewerRecommendation || s.recommendation) === 'hire').length,
      maybe: sessions.filter(s => (s.interviewerRecommendation || s.recommendation) === 'maybe').length,
      no_hire: sessions.filter(s => (s.interviewerRecommendation || s.recommendation) === 'no_hire').length
    };

    return {
      interviewerId: interviewerName.toLowerCase().replace(/\s+/g, '_'),
      interviewerName,
      totalInterviews,
      averageDuration: Math.round(avgDuration / 60000), // minutes
      averageQuestionsAsked: 0,
      competencyCoverage,
      recommendationDistribution,
      recentSessions: sessions.slice(0, 10).map(s => s.id)
    };
  }

  // Comparison
  async getSessionsForComparison(role: string, limit: number = 10): Promise<InterviewSession[]> {
    const sessions = await this.listSessions({ role });
    return sessions.slice(0, limit);
  }

  // Helper method to map Prisma model to InterviewSession type
  private mapToInterviewSession(session: {
    id: string;
    candidateName: string;
    role: string;
    company: string;
    experienceLevel: string;
    interviewerName: string | null;
    startTime: Date;
    endTime: Date | null;
    duration: number | null;
    
    interviewerOverallScore: number;
    interviewerRecommendation: string;
    interviewerStrengths: string;
    interviewerConcerns: string;
    
    aiOverallScore: number;
    aiRecommendation: string;
    aiStrengths: string;
    aiConcerns: string;
    aiAnalysisText: string | null;
    
    overallScore: number;
    recommendation: string;
    strengths: string;
    concerns: string;
    notes: string | null;
    
    competencyRatings: Array<{
      competency: string;
      score: number;
      evidence: string;
      concerns: string;
      weight: number;
      source: string;
    }>;
  }): InterviewSession {
    // Safe JSON parsing with error handling
    const parseJsonSafe = (jsonStr: string, fallback: any = []) => {
      try {
        return JSON.parse(jsonStr);
      } catch (error) {
        console.error('JSON parse error:', error);
        return fallback;
      }
    };

    return {
      id: session.id,
      candidateName: session.candidateName,
      role: session.role,
      company: session.company,
      experienceLevel: session.experienceLevel,
      interviewerName: session.interviewerName || undefined,
      startTime: session.startTime.getTime(),
      endTime: session.endTime ? session.endTime.getTime() : undefined,
      duration: session.duration || undefined,
      
      // Interviewer evaluation
      interviewerOverallScore: session.interviewerOverallScore,
      interviewerRecommendation: session.interviewerRecommendation as any,
      interviewerStrengths: parseJsonSafe(session.interviewerStrengths, []),
      interviewerConcerns: parseJsonSafe(session.interviewerConcerns, []),
      interviewerRatings: session.competencyRatings
        .filter(r => r.source === 'interviewer')
        .map((rating) => ({
          competency: rating.competency,
          score: rating.score,
          evidence: parseJsonSafe(rating.evidence, []),
          concerns: parseJsonSafe(rating.concerns, []),
          weight: rating.weight,
          source: 'interviewer' as const
        })),
      
      // AI evaluation
      aiOverallScore: session.aiOverallScore,
      aiRecommendation: session.aiRecommendation as any,
      aiStrengths: parseJsonSafe(session.aiStrengths, []),
      aiConcerns: parseJsonSafe(session.aiConcerns, []),
      aiAnalysisText: session.aiAnalysisText || undefined,
      aiRatings: session.competencyRatings
        .filter(r => r.source === 'ai')
        .map((rating) => ({
          competency: rating.competency,
          score: rating.score,
          evidence: parseJsonSafe(rating.evidence, []),
          concerns: parseJsonSafe(rating.concerns, []),
          weight: rating.weight,
          source: 'ai' as const
        })),
      
      // Legacy fields for backward compatibility
      overallScore: session.interviewerOverallScore || session.overallScore,
      recommendation: (session.interviewerRecommendation || session.recommendation) as any,
      strengths: parseJsonSafe(session.interviewerStrengths || session.strengths, []),
      concerns: parseJsonSafe(session.interviewerConcerns || session.concerns, []),
      competencyRatings: session.competencyRatings
        .filter(r => r.source === 'interviewer')
        .map((rating) => ({
          competency: rating.competency,
          score: rating.score,
          evidence: parseJsonSafe(rating.evidence, []),
          concerns: parseJsonSafe(rating.concerns, []),
          weight: rating.weight
        })),
      
      notes: session.notes || undefined,
      turns: [] // Don't return turns
    };
  }

  // Cleanup on shutdown
  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }

  // Template Management
  async getTemplates(): Promise<any[]> {
    const templates = await prisma.interviewTemplate.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return templates.map((t: any) => ({
      ...t,
      requiredSkills: JSON.parse(t.requiredSkills)
    }));
  }

  async getTemplate(id: string): Promise<any | null> {
    const template = await prisma.interviewTemplate.findUnique({
      where: { id }
    });

    if (!template) return null;

    return {
      ...template,
      requiredSkills: JSON.parse(template.requiredSkills)
    };
  }

  async createTemplate(data: {
    name: string;
    role: string;
    company?: string;
    experienceLevel: string;
    requiredSkills: string[];
    jobDescription?: string;
    isDefault?: boolean;
  }): Promise<any> {
    const template = await prisma.interviewTemplate.create({
      data: {
        ...data,
        requiredSkills: JSON.stringify(data.requiredSkills)
      }
    });

    return {
      ...template,
      requiredSkills: JSON.parse(template.requiredSkills)
    };
  }

  async updateTemplate(id: string, data: Partial<{
    name: string;
    role: string;
    company?: string;
    experienceLevel: string;
    requiredSkills: string[];
    jobDescription?: string;
    isDefault?: boolean;
  }>): Promise<any> {
    const updateData: any = { ...data };
    if (data.requiredSkills) {
      updateData.requiredSkills = JSON.stringify(data.requiredSkills);
    }

    const template = await prisma.interviewTemplate.update({
      where: { id },
      data: updateData
    });

    return {
      ...template,
      requiredSkills: JSON.parse(template.requiredSkills)
    };
  }

  async deleteTemplate(id: string): Promise<boolean> {
    try {
      await prisma.interviewTemplate.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Session Notes Management
  async addSessionNote(sessionId: string, note: {
    content: string;
    type: 'note' | 'flag' | 'highlight';
    timestamp: number;
  }): Promise<any> {
    return await prisma.sessionNote.create({
      data: {
        sessionId,
        content: note.content,
        type: note.type,
        timestamp: new Date(note.timestamp)
      }
    });
  }

  async getSessionNotes(sessionId: string): Promise<any[]> {
    return await prisma.sessionNote.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' }
    });
  }

  async deleteSessionNote(noteId: string): Promise<boolean> {
    try {
      await prisma.sessionNote.delete({
        where: { id: noteId }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Session Feedback Management
  async addSessionFeedback(sessionId: string, feedback: {
    questionId?: string;
    feedbackType: string;
    rating: number;
    comment?: string;
  }): Promise<any> {
    return await prisma.sessionFeedback.create({
      data: {
        sessionId,
        questionId: feedback.questionId,
        feedbackType: feedback.feedbackType,
        rating: feedback.rating,
        comment: feedback.comment
      }
    });
  }

  async getSessionFeedback(sessionId: string): Promise<any[]> {
    return await prisma.sessionFeedback.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getFeedbackStats(feedbackType?: string): Promise<any> {
    const where = feedbackType ? { feedbackType } : {};
    
    const feedbacks = await prisma.sessionFeedback.findMany({ where });
    
    if (feedbacks.length === 0) {
      return {
        count: 0,
        averageRating: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const avgRating = feedbacks.reduce((sum: number, f: any) => sum + f.rating, 0) / feedbacks.length;
    const distribution = feedbacks.reduce((acc: any, f: any) => {
      acc[f.rating] = (acc[f.rating] || 0) + 1;
      return acc;
    }, {} as any);

    return {
      count: feedbacks.length,
      averageRating: avgRating,
      distribution
    };
  }
}

export const prismaStorageService = new PrismaStorageService();
