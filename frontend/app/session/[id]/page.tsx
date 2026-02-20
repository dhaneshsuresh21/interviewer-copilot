'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, User, Calendar, Clock, Award, AlertCircle, CheckCircle, Download, 
  FileText, Share2, Trash2, BarChart3, ChevronDown, ChevronUp, Check
} from 'lucide-react';
import NotesPanel from '@/components/NotesPanel';

interface CompetencyRating {
  competency: string;
  score: number;
  evidence: string[];
  concerns: string[];
  weight: number;
  source?: 'interviewer' | 'ai';
}

interface Session {
  id: string;
  candidateName: string;
  role: string;
  company: string;
  experienceLevel: string;
  interviewerName?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  
  // Interviewer evaluation
  interviewerOverallScore?: number;
  interviewerRecommendation?: string;
  interviewerStrengths?: string[];
  interviewerConcerns?: string[];
  interviewerRatings?: CompetencyRating[];
  
  // AI evaluation
  aiOverallScore?: number;
  aiRecommendation?: string;
  aiStrengths?: string[];
  aiConcerns?: string[];
  aiRatings?: CompetencyRating[];
  aiAnalysisText?: string;
  
  // Legacy fields
  overallScore: number;
  recommendation: string;
  strengths: string[];
  concerns: string[];
  competencyRatings: CompetencyRating[];
  
  notes?: string;
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'competencies' | 'comparison'>('overview');
  const [expandedCompetencies, setExpandedCompetencies] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching session:', sessionId);
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${sessionId}`;
      console.log('URL:', url);
      
      const res = await fetch(url);
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to load session: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Received session:', data);
      setSession(data);
    } catch (error) {
      console.error('Failed to load session:', error);
      setError('Failed to load session details. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!session) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${sessionId}/feedback-pdf`);
      const html = await res.text();
      
      // Create a blob and trigger download
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview-feedback-${session.candidateName.replace(/\s+/g, '-')}-${sessionId.slice(0, 8)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Also open in new window for immediate viewing/printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const getRecommendationColor = (rec: string) => {
    const colors: any = {
      strong_hire: 'bg-green-500/20 text-green-400 border-green-500/30',
      hire: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      maybe: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      no_hire: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[rec] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-400';
    if (score >= 3) return 'text-blue-400';
    if (score >= 2) return 'text-yellow-400';
    return 'text-red-400';
  };

  const toggleCompetency = (competency: string) => {
    const newExpanded = new Set(expandedCompetencies);
    if (newExpanded.has(competency)) {
      newExpanded.delete(competency);
    } else {
      newExpanded.add(competency);
    }
    setExpandedCompetencies(newExpanded);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        router.push('/dashboard');
      } else {
        alert('Failed to delete session');
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareSession = () => {
    const url = window.location.href;
    copyToClipboard(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-xl text-gray-300">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle size={64} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Session</h2>
          <p className="text-gray-400 mb-6">{error || 'Session not found'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-lg shadow-blue-500/20"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Header Bar */}
      <div className="bg-gray-800/80 backdrop-blur border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-white font-medium transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
            <div className="flex gap-2">
              <button
                onClick={shareSession}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-medium transition-colors"
                title="Copy link to clipboard"
              >
                {copied ? <Check size={18} /> : <Share2 size={18} />}
                {copied ? 'Copied!' : 'Share'}
              </button>
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-lg shadow-green-500/20 transition-colors"
              >
                <Download size={18} />
                Download PDF
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-lg shadow-red-500/20 transition-colors"
              >
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: FileText },
            { id: 'comparison', label: 'AI vs Interviewer', icon: BarChart3 },
            { id: 'competencies', label: 'Competencies', icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Candidate Info Card */}
        <div className="bg-gray-800/80 backdrop-blur rounded-lg shadow-lg p-8 mb-6 border border-gray-700/50">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{session.candidateName}</h1>
              <div className="flex items-center gap-4 text-lg text-gray-400">
                <div className="flex items-center gap-2">
                  <User size={20} />
                  <span className="font-medium text-gray-300">{session.role}</span>
                </div>
                <span className="text-gray-600">•</span>
                <span className="capitalize">{session.experienceLevel}</span>
                <span className="text-gray-600">•</span>
                <span>{session.company}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-blue-400 mb-2">
                {session.overallScore.toFixed(1)}/5
              </div>
              <span className={`inline-block px-6 py-2 rounded-full text-sm font-bold border ${getRecommendationColor(session.recommendation)}`}>
                {session.recommendation.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-700">
            <div className="flex items-center gap-3">
              <Calendar size={24} className="text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Date</div>
                <div className="font-semibold text-gray-200">
                  {new Date(session.startTime).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={24} className="text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Duration</div>
                <div className="font-semibold text-gray-200">
                  {session.duration ? `${Math.round(session.duration / 60000)} minutes` : 'N/A'}
                </div>
              </div>
            </div>
            {session.interviewerName && (
              <div className="flex items-center gap-3">
                <User size={24} className="text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Interviewer</div>
                  <div className="font-semibold text-gray-200">{session.interviewerName}</div>
                </div>
              </div>
            )}
          </div>
        </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          <div className="bg-gray-800/80 backdrop-blur rounded-lg shadow-lg p-6 border border-green-500/30">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle size={28} className="text-green-400" />
              Strengths
            </h3>
            <ul className="space-y-2">
              {session.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-300">
                  <span className="text-green-400 font-bold mt-1">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Concerns */}
          <div className="bg-gray-800/80 backdrop-blur rounded-lg shadow-lg p-6 border border-yellow-500/30">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle size={28} className="text-yellow-400" />
              Areas for Improvement
            </h3>
            <ul className="space-y-2">
              {session.concerns.map((concern, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-300">
                  <span className="text-yellow-400 font-bold mt-1">!</span>
                  <span>{concern}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

            {/* Competency Summary */}
            <div className="bg-gray-800/80 backdrop-blur rounded-lg shadow-lg p-6 mb-6 border border-gray-700/50">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 size={28} className="text-blue-400" />
                Competency Summary
              </h3>
              <div className="space-y-3">
                {session.competencyRatings.map((rating, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-white">{rating.competency}</span>
                        <span className={`font-bold ${getScoreColor(rating.score)}`}>
                          {rating.score.toFixed(1)}/5
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            rating.score >= 4 ? 'bg-green-500' :
                            rating.score >= 3 ? 'bg-blue-500' :
                            rating.score >= 2 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(rating.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {session.notes && (
              <div className="bg-gray-800/80 backdrop-blur rounded-lg shadow-lg p-6 border border-gray-700/50">
                <h3 className="text-2xl font-bold text-white mb-4">Additional Notes</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{session.notes}</p>
              </div>
            )}
          </>
        )}

        {/* AI vs Interviewer Comparison Tab */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            {/* Score Comparison */}
            <div className="grid grid-cols-2 gap-6">
              {/* Interviewer Evaluation */}
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg p-6 border border-blue-500/30">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <User size={24} className="text-blue-400" />
                  Interviewer Evaluation
                </h3>
                <div className="text-center mb-4">
                  <div className="text-5xl font-bold text-blue-400 mb-2">
                    {(session.interviewerOverallScore ?? session.overallScore).toFixed(1)}/5
                  </div>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold border ${getRecommendationColor(session.interviewerRecommendation ?? session.recommendation)}`}>
                    {(session.interviewerRecommendation ?? session.recommendation).replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                {(session.interviewerStrengths ?? session.strengths).length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-green-400 mb-2">Strengths:</h4>
                    <ul className="space-y-1 text-sm text-gray-300">
                      {(session.interviewerStrengths ?? session.strengths).slice(0, 3).map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-400">✓</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* AI Evaluation */}
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg p-6 border border-purple-500/30">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">🤖</span>
                  AI Evaluation
                </h3>
                <div className="text-center mb-4">
                  <div className="text-5xl font-bold text-purple-400 mb-2">
                    {(session.aiOverallScore ?? 0).toFixed(1)}/5
                  </div>
                  {session.aiRecommendation && (
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold border ${getRecommendationColor(session.aiRecommendation)}`}>
                      {session.aiRecommendation.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  )}
                </div>
                {session.aiStrengths && session.aiStrengths.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-green-400 mb-2">Strengths:</h4>
                    <ul className="space-y-1 text-sm text-gray-300">
                      {session.aiStrengths.slice(0, 3).map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-400">✓</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Competency Comparison */}
            <div className="bg-gray-800/80 backdrop-blur rounded-lg shadow-lg p-6 border border-gray-700/50">
              <h3 className="text-2xl font-bold text-white mb-6">Competency Score Comparison</h3>
              <div className="space-y-4">
                {(session.interviewerRatings ?? session.competencyRatings).map((interviewerRating, idx) => {
                  const aiRating = session.aiRatings?.find(r => r.competency === interviewerRating.competency);
                  return (
                    <div key={idx} className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
                      <h4 className="text-lg font-bold text-white mb-3">{interviewerRating.competency}</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-blue-400">Interviewer</span>
                            <span className={`font-bold ${getScoreColor(interviewerRating.score)}`}>
                              {interviewerRating.score.toFixed(1)}/5
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${(interviewerRating.score / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-purple-400">AI</span>
                            <span className={`font-bold ${getScoreColor(aiRating?.score ?? 0)}`}>
                              {aiRating ? `${aiRating.score.toFixed(1)}/5` : 'N/A'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            {aiRating && (
                              <div
                                className="h-2 rounded-full bg-purple-500"
                                style={{ width: `${(aiRating.score / 5) * 100}%` }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                      {aiRating && Math.abs(interviewerRating.score - aiRating.score) > 1 && (
                        <div className="mt-2 text-xs text-yellow-400 flex items-center gap-1">
                          <AlertCircle size={14} />
                          Significant difference in ratings ({Math.abs(interviewerRating.score - aiRating.score).toFixed(1)} points)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Analysis Text */}
            {session.aiAnalysisText && (
              <div className="bg-gray-800/80 backdrop-blur rounded-lg shadow-lg p-6 border border-gray-700/50">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">🤖</span>
                  AI Detailed Analysis
                </h3>
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <p className="text-gray-300 whitespace-pre-wrap">{session.aiAnalysisText}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Competencies Tab */}
        {activeTab === 'competencies' && (
          <div className="bg-gray-800/80 backdrop-blur rounded-lg shadow-lg p-6 border border-gray-700/50">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Award size={28} className="text-blue-400" />
              Detailed Competency Assessment
            </h3>
            <div className="space-y-4">
              {session.competencyRatings.map((rating, idx) => {
                const isExpanded = expandedCompetencies.has(rating.competency);
                return (
                  <div key={idx} className="border border-gray-700 rounded-lg bg-gray-900/50 overflow-hidden">
                    <button
                      onClick={() => toggleCompetency(rating.competency)}
                      className="w-full p-4 flex justify-between items-center hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <h4 className="text-xl font-bold text-white">{rating.competency}</h4>
                        <span className={`text-2xl font-bold ${getScoreColor(rating.score)}`}>
                          {rating.score.toFixed(1)}/5
                        </span>
                        <span className="text-sm text-gray-500">Weight: {(rating.weight * 100).toFixed(0)}%</span>
                      </div>
                      {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                    </button>
                    
                    {isExpanded && (
                      <div className="p-4 border-t border-gray-700 space-y-4">
                        {rating.evidence.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle size={18} className="text-green-400" />
                              <span className="font-semibold text-green-400">Evidence & Strengths</span>
                            </div>
                            <ul className="space-y-2">
                              {rating.evidence.map((ev, i) => (
                                <li key={i} className="flex items-start gap-2 text-gray-300 bg-green-500/10 p-3 rounded border border-green-500/30">
                                  <span className="text-green-400 font-bold mt-0.5">✓</span>
                                  <span>{ev}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {rating.concerns.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle size={18} className="text-yellow-400" />
                              <span className="font-semibold text-yellow-400">Concerns & Development Areas</span>
                            </div>
                            <ul className="space-y-2">
                              {rating.concerns.map((concern, i) => (
                                <li key={i} className="flex items-start gap-2 text-gray-300 bg-yellow-500/10 p-3 rounded border border-yellow-500/30">
                                  <span className="text-yellow-400 font-bold mt-0.5">!</span>
                                  <span>{concern}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {rating.evidence.length === 0 && rating.concerns.length === 0 && (
                          <p className="text-gray-500 text-center py-4">No detailed feedback provided for this competency</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-2">Delete Session?</h3>
            <p className="text-sm text-gray-400 mb-5">
              This will permanently delete the interview session for {session?.candidateName}. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleDelete();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-500 transition-colors"
              >
                Delete Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Panel */}
      <NotesPanel sessionId={sessionId} />
    </div>
  );
}
