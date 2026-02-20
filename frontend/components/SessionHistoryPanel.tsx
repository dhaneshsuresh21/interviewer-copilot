'use client';

import { useState, useEffect } from 'react';
import { Clock, User, Calendar, Download, Trash2, Eye } from 'lucide-react';

interface Session {
  id: string;
  candidateName: string;
  role: string;
  experienceLevel: string;
  startTime: number;
  duration?: number;
  
  // Interviewer evaluation
  interviewerOverallScore?: number;
  interviewerRecommendation?: string;
  
  // AI evaluation
  aiOverallScore?: number;
  aiRecommendation?: string;
  
  // Legacy fields
  overallScore: number;
  recommendation: string;
}

export default function SessionHistoryPanel() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: '', interviewerName: '' });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.interviewerName) params.append('interviewerName', filters.interviewerName);
      
      console.log('Fetching sessions...');
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/sessions?${params}`;
      console.log('URL:', url);
      
      const res = await fetch(url);
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to load sessions: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Received sessions:', data.length);
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      alert('Failed to load sessions. Make sure backend is running on port 3001.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (sessionId: string, candidateName: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${sessionId}/feedback-pdf`);
      const html = await res.text();
      
      // Create a blob and trigger download
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview-feedback-${candidateName.replace(/\s+/g, '-')}-${sessionId.slice(0, 8)}.html`;
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

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Delete this session? This cannot be undone.')) return;
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      loadSessions();
    } catch (error) {
      console.error('Failed to delete session:', error);
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

  if (loading) {
    return <div className="p-4 text-center">Loading sessions...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Clock size={28} className="text-blue-400" />
            Interview History
          </h2>
          <p className="text-gray-400 mt-1">View and manage all completed interview sessions</p>
        </div>
        <button
          onClick={loadSessions}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-500/20 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="mb-6 bg-gray-800/50 p-4 rounded-lg border border-gray-700/50 flex gap-4">
        <input
          type="text"
          placeholder="Filter by role..."
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          className="px-4 py-2 bg-gray-900 border border-gray-700 text-white placeholder-gray-500 rounded-lg flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={loadSessions}
          className="px-8 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-medium transition-colors"
        >
          Apply Filters
        </button>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => (
          <div key={session.id} className="bg-gray-800/80 backdrop-blur border border-gray-700/50 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <h3 className="text-xl font-bold text-white">{session.candidateName}</h3>
                  <span className={`px-4 py-1 rounded-full text-sm font-bold border ${getRecommendationColor(session.interviewerRecommendation ?? session.recommendation)}`}>
                    {(session.interviewerRecommendation ?? session.recommendation).replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="text-center">
                      <div className="text-xs text-blue-400 mb-1">Interviewer</div>
                      <span className="text-xl font-bold text-blue-400">
                        {(session.interviewerOverallScore ?? session.overallScore).toFixed(1)}/5
                      </span>
                    </div>
                    {session.aiOverallScore !== undefined && session.aiOverallScore > 0 && (
                      <>
                        <span className="text-gray-600">|</span>
                        <div className="text-center">
                          <div className="text-xs text-purple-400 mb-1">AI</div>
                          <span className="text-xl font-bold text-purple-400">
                            {session.aiOverallScore.toFixed(1)}/5
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-8 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-gray-500" />
                    <span className="font-medium text-gray-300">{session.role}</span>
                    <span className="text-gray-600">•</span>
                    <span className="capitalize">{session.experienceLevel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-gray-500" />
                    <span>{new Date(session.startTime).toLocaleDateString()}</span>
                  </div>
                  {session.duration && (
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-gray-500" />
                      <span>{Math.round(session.duration / 60000)} min</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.open(`/session/${session.id}`, '_blank')}
                  className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors border border-blue-500/30"
                  title="View Details"
                >
                  <Eye size={20} />
                </button>
                <button
                  onClick={() => downloadPDF(session.id, session.candidateName)}
                  className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors border border-green-500/30"
                  title="Download PDF"
                >
                  <Download size={20} />
                </button>
                <button
                  onClick={() => deleteSession(session.id)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/30"
                  title="Delete"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="text-center py-16 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <Clock size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-lg text-gray-300 mb-2">No interview sessions found</p>
            <p className="text-gray-500">Complete an interview to see it here</p>
          </div>
        )}
      </div>
    </div>
  );
}
