'use client';

import { useEffect, useState, Suspense } from 'react';
import { useInterviewStore } from '@/lib/store';
import { Save, Download, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import EvaluationMatrixPanel from '@/components/EvaluationMatrixPanel';
import FeedbackWidget from '@/components/FeedbackWidget';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface CompetencyRating {
  competency: string;
  score: number;
  evidence: string[];
  concerns: string[];
  weight: number;
}

function EvaluateContent() {
  const { 
    interviewContext, 
    turns, 
    analysisText, 
    questionsText, 
    ratingText,
    interviewStartTime, // FIX: Get tracked start time
    interviewEndTime, // FIX: Get tracked end time
  } = useInterviewStore();
  const [mounted, setMounted] = useState(false);
  const [ratings, setRatings] = useState<CompetencyRating[]>([]);
  const [notes, setNotes] = useState('');
  const [interviewerName, setInterviewerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    analysis: true,
    rating: true,
    questions: false
  });

  useEffect(() => {
    setMounted(true);
    // Auto-fill interviewer name from session
    const session = localStorage.getItem('interviewer-session');
    if (session) {
      try {
        const { name } = JSON.parse(session);
        setInterviewerName(name || '');
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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

  const parseAIRatings = () => {
    if (!ratingText) return [];
    
    const aiRatings: any[] = [];
    
    // Try to extract ratings from the rating text
    // Look for patterns like "System Design: 4/5" or "Technical Leadership - Score: 3.5"
    const lines = ratingText.split('\n');
    
    for (const line of lines) {
      // Pattern 1: "Competency: X/5" or "Competency: X"
      const match1 = line.match(/([A-Za-z\s&]+?):\s*(\d(?:\.\d)?)\s*(?:\/\s*5)?/i);
      // Pattern 2: "Competency - Score: X" or "Competency (X/5)"
      const match2 = line.match(/([A-Za-z\s&]+?)(?:\s*-\s*Score|\s*\()\s*:\s*(\d(?:\.\d)?)/i);
      
      const match = match1 || match2;
      if (match) {
        const competency = match[1].trim();
        const score = parseFloat(match[2]);
        
        if (score >= 1 && score <= 5 && competency.length > 2) {
          // Check if this competency already exists
          if (!aiRatings.find(r => r.competency.toLowerCase() === competency.toLowerCase())) {
            aiRatings.push({
              competency,
              score,
              evidence: [],
              concerns: [],
              weight: 0.2
            });
          }
        }
      }
    }
    
    // If no ratings found, try to match against known competencies
    if (aiRatings.length === 0) {
      const competencies = ['System Design', 'Technical Leadership', 'Code Excellence', 'Communication', 'Problem Solving'];
      
      competencies.forEach(comp => {
        const compLower = comp.toLowerCase();
        const ratingLower = ratingText.toLowerCase();
        
        const patterns = [
          new RegExp(`${compLower}[:\\s-]+(?:score[:\\s]+)?(\\d(?:\\.\\d)?)(?:/5)?`, 'i'),
          new RegExp(`${compLower}.*?(\\d(?:\\.\\d)?)/5`, 'i'),
          new RegExp(`${compLower}.*?rating[:\\s]+(\\d(?:\\.\\d)?)`, 'i')
        ];
        
        for (const pattern of patterns) {
          const match = ratingLower.match(pattern);
          if (match) {
            const score = parseFloat(match[1]);
            if (score >= 1 && score <= 5) {
              aiRatings.push({
                competency: comp,
                score,
                evidence: [],
                concerns: [],
                weight: 0.2
              });
              break;
            }
          }
        }
      });
    }
    
    return aiRatings;
  };

  const extractAIStrengthsAndConcerns = () => {
    if (!analysisText) return { strengths: [], concerns: [] };
    
    const strengths: string[] = [];
    const concerns: string[] = [];
    
    const lines = analysisText.split('\n');
    let inStrengthsSection = false;
    let inConcernsSection = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detect section headers
      if (/strengths?|positives?|good|excellent/i.test(trimmed) && trimmed.length < 50) {
        inStrengthsSection = true;
        inConcernsSection = false;
        continue;
      }
      if (/concerns?|weaknesses?|areas?\s+for\s+improvement|issues?/i.test(trimmed) && trimmed.length < 50) {
        inConcernsSection = true;
        inStrengthsSection = false;
        continue;
      }
      
      // Extract bullet points or numbered items
      if (trimmed.match(/^[-*•]\s+/) || trimmed.match(/^\d+\.\s+/)) {
        const text = trimmed.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim();
        if (text.length > 10) {
          if (inStrengthsSection) {
            strengths.push(text);
          } else if (inConcernsSection) {
            concerns.push(text);
          }
        }
      }
    }
    
    return { strengths, concerns };
  };

  const calculateAIScore = (aiRatings: any[]) => {
    if (aiRatings.length === 0) return 0;
    const totalWeight = aiRatings.reduce((sum, r) => sum + r.weight, 0);
    if (totalWeight === 0) return 0;
    const weightedSum = aiRatings.reduce((sum, r) => sum + (r.score * r.weight), 0);
    return weightedSum / totalWeight;
  };

  const handleSave = async () => {
    if (ratings.some(r => r.score === 0)) {
      alert('Please rate all competencies before saving');
      return;
    }

    if (!interviewerName.trim()) {
      alert('Session expired. Please login again.');
      window.location.href = '/login';
      return;
    }

    setSaving(true);
    try {
      const overallScore = calculateOverallScore();
      const recommendation = determineRecommendation(overallScore);
      const { strengths, concerns } = extractStrengthsAndConcerns();
      
      const aiRatings = parseAIRatings();
      const aiScore = calculateAIScore(aiRatings);
      const aiRecommendation = determineRecommendation(aiScore);
      const { strengths: aiStrengths, concerns: aiConcerns } = extractAIStrengthsAndConcerns();
      
      // FIX: Use tracked start/end times, fallback to turns if not available
      const startTime = interviewStartTime || (turns[0]?.timestamp || Date.now());
      const endTime = interviewEndTime || (turns[turns.length - 1]?.timestamp || Date.now());
      const duration = endTime - startTime;
      
      const session = {
        id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        candidateName: interviewContext!.candidateName,
        role: interviewContext!.role,
        company: interviewContext!.company,
        experienceLevel: interviewContext!.experienceLevel,
        interviewerName,
        startTime,
        endTime,
        duration,
        turns,
        
        // Interviewer evaluation
        interviewerRatings: ratings.map(r => ({ ...r, source: 'interviewer' })),
        interviewerOverallScore: overallScore,
        interviewerStrengths: strengths,
        interviewerConcerns: concerns,
        interviewerRecommendation: recommendation,
        
        // AI evaluation
        aiRatings: aiRatings.map(r => ({ ...r, source: 'ai' })),
        aiOverallScore: aiScore,
        aiRecommendation,
        aiAnalysisText: analysisText,
        aiStrengths,
        aiConcerns,
        
        // Legacy fields for backward compatibility
        competencyRatings: ratings,
        overallScore,
        strengths,
        concerns,
        recommendation,
        notes
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session)
      });

      if (!res.ok) throw new Error('Failed to save session');
      
      const data = await res.json();
      setSessionId(data.sessionId);
      setSaved(true);
      localStorage.removeItem('interview-storage');
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

  if (!mounted) {
    return <div className="p-6 text-center text-gray-400">Loading...</div>;
  }

  if (!interviewContext) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">No Active Interview</h2>
          <p className="text-gray-400 mb-4">Please complete an interview first.</p>
          <a
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block shadow-lg shadow-blue-500/20"
          >
            Start New Interview
          </a>
        </div>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-8 text-center">
            <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Evaluation Saved Successfully!</h2>
            <p className="text-gray-300 mb-8">
              Interview evaluation for {interviewContext.candidateName} has been saved.
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
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 font-medium"
              >
                New Interview
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Interview Evaluation</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>{interviewContext.candidateName}</span>
            <span>•</span>
            <span>{interviewContext.role}</span>
            <span>•</span>
            <span>{interviewContext.company}</span>
            <span>•</span>
            <span>{interviewContext.experienceLevel}</span>
          </div>
        </div>

        {/* AI Analysis Section */}
        {(analysisText || ratingText || questionsText) && (
          <div className="bg-gray-800/80 backdrop-blur border border-gray-700/50 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🤖</span>
              <h2 className="text-xl font-bold text-white">AI Analysis</h2>
            </div>

            {analysisText && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('analysis')}
                  className="flex items-center justify-between w-full mb-2 text-left"
                >
                  <h3 className="font-semibold text-white">Performance Analysis</h3>
                  {expandedSections.analysis ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </button>
                {expandedSections.analysis && (
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{analysisText}</p>
                    <div className="mt-3">
                      <FeedbackWidget
                        sessionId={sessionId || 'temp'}
                        feedbackType="suggestion_useful"
                        label="Was this helpful?"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {ratingText && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('rating')}
                  className="flex items-center justify-between w-full mb-2 text-left"
                >
                  <h3 className="font-semibold text-white">AI Rating Suggestion</h3>
                  {expandedSections.rating ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </button>
                {expandedSections.rating && (
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{ratingText}</p>
                    <div className="mt-3">
                      <FeedbackWidget
                        sessionId={sessionId || 'temp'}
                        feedbackType="rating_accurate"
                        label="Was this accurate?"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {questionsText && (
              <div>
                <button
                  onClick={() => toggleSection('questions')}
                  className="flex items-center justify-between w-full mb-2 text-left"
                >
                  <h3 className="font-semibold text-white">Suggested Follow-up Questions</h3>
                  {expandedSections.questions ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </button>
                {expandedSections.questions && (
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{questionsText}</p>
                    <div className="mt-3">
                      <FeedbackWidget
                        sessionId={sessionId || 'temp'}
                        feedbackType="question_helpful"
                        label="Were these helpful?"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Interviewer Info */}
        <div className="bg-gray-800/80 backdrop-blur border border-gray-700/50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Interviewer Name
              </label>
              <input
                type="text"
                value={interviewerName}
                readOnly
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 text-gray-400 rounded cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">Auto-filled from login session</p>
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

        {/* Evaluation Matrix */}
        <EvaluationMatrixPanel
          role={interviewContext.role}
          experienceLevel={interviewContext.experienceLevel}
          onRatingsChange={setRatings}
        />

        {/* Action Buttons */}
        <div className="flex justify-end items-center mt-6">
          <button
            onClick={handleSave}
            disabled={saving || ratings.length === 0 || !interviewerName.trim()}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-blue-500/20"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Evaluation'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EvaluatePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="p-6 text-center text-gray-400">Loading...</div>}>
        <EvaluateContent />
      </Suspense>
    </ProtectedRoute>
  );
}
