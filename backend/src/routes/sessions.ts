import { Router } from 'express';
import { prismaStorageService as storageService } from '../services/prismaStorageService';
import { evaluationService } from '../services/evaluationService';
import { pdfService } from '../services/pdfService';
import type { InterviewSession } from '../types';

const router = Router();

// Save interview session
router.post('/sessions', async (req, res) => {
  try {
    const session: InterviewSession = req.body;
    
    // Remove turns (transcript) from storage
    const { turns, ...sessionWithoutTurns } = session;
    
    // Calculate overall score if not provided (use interviewer score as primary)
    if (!sessionWithoutTurns.interviewerOverallScore && sessionWithoutTurns.interviewerRatings && sessionWithoutTurns.interviewerRatings.length > 0) {
      sessionWithoutTurns.interviewerOverallScore = evaluationService.calculateOverallScore(sessionWithoutTurns.interviewerRatings);
    }
    
    // Fallback to legacy fields
    if (!sessionWithoutTurns.overallScore && sessionWithoutTurns.competencyRatings && sessionWithoutTurns.competencyRatings.length > 0) {
      sessionWithoutTurns.overallScore = evaluationService.calculateOverallScore(sessionWithoutTurns.competencyRatings);
    }
    
    // Determine recommendation if not provided
    if (!sessionWithoutTurns.interviewerRecommendation && sessionWithoutTurns.interviewerOverallScore) {
      sessionWithoutTurns.interviewerRecommendation = evaluationService.determineRecommendation(sessionWithoutTurns.interviewerOverallScore);
    }
    
    if (!sessionWithoutTurns.recommendation && sessionWithoutTurns.overallScore) {
      sessionWithoutTurns.recommendation = evaluationService.determineRecommendation(sessionWithoutTurns.overallScore);
    }
    
    await storageService.saveSession(sessionWithoutTurns as InterviewSession);
    res.json({ success: true, sessionId: session.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get session by ID
router.get('/sessions/:id', async (req, res) => {
  try {
    const session = await storageService.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List sessions with filters
router.get('/sessions', async (req, res) => {
  try {
    const filters: any = {};
    
    if (req.query.role) filters.role = req.query.role as string;
    if (req.query.startDate) filters.startDate = parseInt(req.query.startDate as string);
    if (req.query.endDate) filters.endDate = parseInt(req.query.endDate as string);
    if (req.query.interviewerName) filters.interviewerName = req.query.interviewerName as string;
    
    const sessions = await storageService.listSessions(filters);
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete session
router.delete('/sessions/:id', async (req, res) => {
  try {
    const success = await storageService.deleteSession(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get evaluation matrix
router.get('/evaluation-matrix', (req, res) => {
  try {
    const role = req.query.role as string || 'Software Engineer';
    const experienceLevel = req.query.experienceLevel as string || 'mid';
    
    const matrix = evaluationService.getEvaluationMatrix(role, experienceLevel);
    res.json(matrix);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Generate PDF feedback report (returns HTML)
router.get('/sessions/:id/feedback-pdf', async (req, res) => {
  try {
    const session = await storageService.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const matrix = evaluationService.getEvaluationMatrix(session.role, session.experienceLevel);
    const html = pdfService.generateFeedbackHTML(session, matrix);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Compare candidates for a role
router.get('/compare', async (req, res) => {
  try {
    const role = req.query.role as string;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!role) {
      return res.status(400).json({ error: 'Role parameter is required' });
    }
    
    const sessions = await storageService.getSessionsForComparison(role, limit);
    
    if (sessions.length === 0) {
      return res.status(404).json({ 
        error: 'No sessions found for this role',
        role,
        candidates: []
      });
    }
    
    // Anonymize for bias-free comparison
    const comparison = {
      role,
      evaluationDate: Date.now(),
      candidates: sessions.map(s => evaluationService.anonymizeForComparison(s))
    };
    
    res.json(comparison);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get interviewer analytics
router.get('/analytics/interviewer/:name', async (req, res) => {
  try {
    const analytics = await storageService.getInterviewerAnalytics(req.params.name);
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Session Notes
router.post('/sessions/:id/notes', async (req, res) => {
  try {
    // Validate session exists before adding note
    const session = await storageService.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const note = await storageService.addSessionNote(req.params.id, req.body);
    res.status(201).json(note);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/sessions/:id/notes', async (req, res) => {
  try {
    const notes = await storageService.getSessionNotes(req.params.id);
    res.json(notes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/notes/:id', async (req, res) => {
  try {
    await storageService.deleteSessionNote(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Session Feedback
router.post('/sessions/:id/feedback', async (req, res) => {
  try {
    // Validate session exists before adding feedback
    const session = await storageService.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const feedback = await storageService.addSessionFeedback(req.params.id, req.body);
    res.status(201).json(feedback);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/sessions/:id/feedback', async (req, res) => {
  try {
    const feedback = await storageService.getSessionFeedback(req.params.id);
    res.json(feedback);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/feedback/stats', async (req, res) => {
  try {
    const feedbackType = req.query.type as string | undefined;
    const stats = await storageService.getFeedbackStats(feedbackType);
    
    // Add metadata indicating data availability
    const response = {
      ...stats,
      hasData: stats.count > 0,
      feedbackType: feedbackType || 'all'
    };
    
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
