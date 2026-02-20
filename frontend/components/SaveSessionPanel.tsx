'use client';

import { useState } from 'react';
import { Save, Download, CheckCircle } from 'lucide-react';
import EvaluationMatrixPanel from './EvaluationMatrixPanel';
import FeedbackWidget from './FeedbackWidget';
import type { Turn } from '@/lib/types';
import { useInterviewStore } from '@/lib/store';

interface CompetencyRating {
  competency: string;
  score: number;
  evidence: string[];
  concerns: string[];
  weight: number;
}

interface Props {
  candidateName: string;
  role: string;
  company: string;
  experienceLevel: string;
  turns: Turn[];
  onSaved?: (sessionId: string) => void;
}

export default function SaveSessionPanel({ candidateName, role, company, experienceLevel, turns, onSaved }: Props) {
  const { analysisText, questionsText, ratingText } = useInterviewStore();
  const [ratings, setRatings] = useState<CompetencyRating[]>([]);
  const [notes, setNotes] = useState('');
  const [interviewerName, setInterviewerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sessionId, setSessionId] = useState('');

  const calculateOverallScore = () => {
    if (ratings.length === 0) return 0;
    const totalWeight = ratings.reduce((sum, r) => sum + r.weight, 0);
    if (totalWeight === 0) return 0;
    const weightedSum = ratings.reduce((sum, r) => sum + (r.score * r.weight), 0);
    return weightedSum / totalWeight;
  };

  const determineRecommendation = (score: number) => {
    if (score >= 4.5) return 'strong_hire';
    if (score >= 3.5) return 'hire';
    if (score >= 2.5) return 'maybe';
    return 'no_hire';
  };

  const extractStrengthsAndConcerns = () => {
    const strengths: string[] = [];
    const concerns: string[] = [];
    
    ratings.forEach(r => {
      strengths.push(...r.evidence);
      concerns.push(...r.concerns);
    });
    
    return { strengths, concerns };
  };

  const handleSave = async () => {
    if (ratings.some(r => r.score === 0)) {
      alert('Please rate all competencies before saving');
      return;
    }

    setSaving(true);
    try {
      const overallScore = calculateOverallScore();
      const recommendation = determineRecommendation(overallScore);
      const { strengths, concerns } = extractStrengthsAndConcerns();
      
      const session = {
        id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        candidateName,
        role,
        company,
        experienceLevel,
        interviewerName: interviewerName || 'Unknown',
        startTime: turns[0]?.timestamp || Date.now(),
        endTime: turns[turns.length - 1]?.timestamp || Date.now(),
        duration: turns.length > 0 ? (turns[turns.length - 1].timestamp - turns[0].timestamp) : 0,
        turns,
        competencyRatings: ratings,
        overallScore,
        strengths,
        concerns,
        recommendation,
        notes
      };

      console.log('Saving session:', session);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session)
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Save failed:', errorText);
        throw new Error('Failed to save session');
      }
      
      const data = await res.json();
      console.log('Session saved successfully:', data);
      setSessionId(data.sessionId);
      setSaved(true);
      
      // Clear persisted interview data from localStorage
      localStorage.removeItem('interview-storage');
      
      if (onSaved) {
        onSaved(data.sessionId);
      }
    } catch (error) {
      console.error('Failed to save session:', error);
      alert('Failed to save session. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const downloadPDF = async () => {
    if (!sessionId) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${sessionId}/feedback-pdf`);
      const html = await res.text();
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
  };

  if (saved) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Session Saved Successfully!</h2>
          <p className="text-gray-300 mb-6">
            Interview evaluation for {candidateName} has been saved.
          </p>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-500/20"
            >
              <Download size={20} />
              Download PDF Report
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-medium"
            >
              View Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 text-white">Complete Interview Evaluation</h2>
        <p className="text-gray-400">
          Rate the candidate on each competency based on evidence from the interview.
        </p>
      </div>

      <div className="mb-6 bg-gray-800/80 backdrop-blur border border-gray-700/50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Your Name (Interviewer)
            </label>
            <input
              type="text"
              value={interviewerName}
              onChange={(e) => setInterviewerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white placeholder-gray-500 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Additional Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional comments..."
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white placeholder-gray-500 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <EvaluationMatrixPanel
        role={role}
        experienceLevel={experienceLevel}
        onRatingsChange={setRatings}
      />

      <div className="mt-6 flex justify-end gap-4">
        <button
          onClick={() => window.history.back()}
          className="px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || ratings.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium shadow-lg shadow-blue-500/20"
        >
          <Save size={20} />
          {saving ? 'Saving...' : 'Save Evaluation'}
        </button>
      </div>
    </div>
  );
}
