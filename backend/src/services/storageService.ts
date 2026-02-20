import * as fs from 'fs';
import * as path from 'path';
import type { InterviewSession, InterviewerAnalytics } from '../types';

// Simple file-based storage (can be replaced with database)
export class StorageService {
  private dataDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.ensureDataDir();
  }

  private ensureDataDir() {
    const dirs = [
      this.dataDir,
      path.join(this.dataDir, 'sessions'),
      path.join(this.dataDir, 'analytics')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // Session Management
  async saveSession(session: InterviewSession): Promise<void> {
    const filePath = path.join(this.dataDir, 'sessions', `${session.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
  }

  async getSession(sessionId: string): Promise<InterviewSession | null> {
    const filePath = path.join(this.dataDir, 'sessions', `${sessionId}.json`);
    if (!fs.existsSync(filePath)) return null;
    
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }

  async listSessions(filters?: {
    role?: string;
    startDate?: number;
    endDate?: number;
    interviewerName?: string;
  }): Promise<InterviewSession[]> {
    const sessionsDir = path.join(this.dataDir, 'sessions');
    const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.json'));
    
    let sessions = files.map(file => {
      const data = fs.readFileSync(path.join(sessionsDir, file), 'utf-8');
      return JSON.parse(data) as InterviewSession;
    });

    // Apply filters
    if (filters) {
      if (filters.role) {
        sessions = sessions.filter(s => s.role.toLowerCase().includes(filters.role!.toLowerCase()));
      }
      if (filters.startDate) {
        sessions = sessions.filter(s => s.startTime >= filters.startDate!);
      }
      if (filters.endDate) {
        sessions = sessions.filter(s => s.startTime <= filters.endDate!);
      }
      if (filters.interviewerName) {
        sessions = sessions.filter(s => s.interviewerName === filters.interviewerName);
      }
    }

    return sessions.sort((a, b) => b.startTime - a.startTime);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const filePath = path.join(this.dataDir, 'sessions', `${sessionId}.json`);
    if (!fs.existsSync(filePath)) return false;
    
    fs.unlinkSync(filePath);
    return true;
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
      (s.interviewerRatings ?? s.competencyRatings ?? []).forEach(r => {
        competencyCoverage[r.competency] = (competencyCoverage[r.competency] || 0) + 1;
      });
    });

    const recommendationDistribution = {
      strong_hire: sessions.filter(s => s.recommendation === 'strong_hire').length,
      hire: sessions.filter(s => s.recommendation === 'hire').length,
      maybe: sessions.filter(s => s.recommendation === 'maybe').length,
      no_hire: sessions.filter(s => s.recommendation === 'no_hire').length
    };

    return {
      interviewerId: interviewerName.toLowerCase().replace(/\s+/g, '_'),
      interviewerName,
      totalInterviews,
      averageDuration: Math.round(avgDuration / 60000), // minutes
      averageQuestionsAsked: Math.round(avgQuestions),
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
}

export const storageService = new StorageService();
