'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Eye, Calendar, User, Award, Filter, GitCompare, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BulkComparisonModal from './BulkComparisonModal';
import SendEmailButton from './SendEmailButton';

interface Candidate {
  id: string;
  candidateName: string;
  candidateId: string;
  candidateEmail?: string;
  role: string;
  company: string;
  startTime: number;
  
  // Interviewer evaluation
  interviewerOverallScore?: number;
  interviewerRecommendation?: string;
  
  // AI evaluation
  aiOverallScore?: number;
  aiRecommendation?: string;
  
  // Legacy fields
  overallScore: number;
  recommendation: string;
  
  competencyRatings: Array<{
    competency: string;
    score: number;
    weight: number;
  }>;
  strengths: string[];
  concerns: string[];
  experienceLevel: string;
}

export default function ComparisonDashboard() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'name'>('score');
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    experienceLevel: '',
    minScore: 0,
    recommendation: ''
  });
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [showBulkComparison, setShowBulkComparison] = useState(false);

  const loadAllCandidates = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions`);
      
      if (!res.ok) {
        throw new Error(`Failed to load candidates: ${res.status}`);
      }
      
      const data = await res.json();
      setCandidates(data);
      setFilteredCandidates(data);
      
      if (!data || data.length === 0) {
        setError('No interview sessions found. Complete some interviews first.');
      }
    } catch (error: any) {
      console.error('Failed to load candidates:', error);
      setError(`Failed to load candidates: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllCandidates();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, candidates, sortBy]);

  const applyFilters = () => {
    let filtered = [...candidates];

    if (filters.role) {
      filtered = filtered.filter(c => 
        c.role.toLowerCase().includes(filters.role.toLowerCase())
      );
    }

    if (filters.experienceLevel) {
      filtered = filtered.filter(c => c.experienceLevel === filters.experienceLevel);
    }

    if (filters.minScore > 0) {
      filtered = filtered.filter(c => c.overallScore >= filters.minScore);
    }

    if (filters.recommendation) {
      filtered = filtered.filter(c => c.recommendation === filters.recommendation);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'score') return b.overallScore - a.overallScore;
      if (sortBy === 'date') return b.startTime - a.startTime;
      if (sortBy === 'name') return a.candidateName.localeCompare(b.candidateName);
      return 0;
    });

    setFilteredCandidates(filtered);
  };

  const clearFilters = () => {
    setFilters({
      role: '',
      experienceLevel: '',
      minScore: 0,
      recommendation: ''
    });
  };

  const toggleSelectCandidate = (id: string) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      if (newSelected.size >= 3) {
        alert('You can compare up to 3 candidates at a time');
        return;
      }
      newSelected.add(id);
    }
    setSelectedCandidates(newSelected);
  };

  const handleBulkCompare = () => {
    if (selectedCandidates.size < 2) {
      alert('Please select at least 2 candidates to compare');
      return;
    }
    setShowBulkComparison(true);
  };

  const getSelectedCandidates = () => {
    return filteredCandidates.filter(c => selectedCandidates.has(c.id));
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-400 bg-green-500/20';
    if (score >= 3.5) return 'text-blue-400 bg-blue-500/20';
    if (score >= 2.5) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const getRecommendationBadge = (rec: string) => {
    const styles: any = {
      strong_hire: 'bg-green-500/20 text-green-400 border-green-500/30',
      hire: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      maybe: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      no_hire: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return styles[rec] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const uniqueRoles = Array.from(new Set(candidates.map(c => c.role)));
  const uniqueLevels = Array.from(new Set(candidates.map(c => c.experienceLevel)));

  const stats = {
    total: filteredCandidates.length,
    avgScore: filteredCandidates.length > 0 
      ? (filteredCandidates.reduce((sum, c) => sum + c.overallScore, 0) / filteredCandidates.length).toFixed(1)
      : '0',
    strongHire: filteredCandidates.filter(c => c.recommendation === 'strong_hire').length,
    hire: filteredCandidates.filter(c => c.recommendation === 'hire').length
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 text-white flex items-center gap-3">
          <BarChart3 size={32} className="text-blue-400" />
          Candidate Comparison
        </h2>
        <p className="text-gray-400">Compare all interviewed candidates with advanced filtering</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-4 rounded-lg border border-blue-500/30">
          <div className="text-sm text-blue-400 mb-1">Total Candidates</div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-4 rounded-lg border border-purple-500/30">
          <div className="text-sm text-purple-400 mb-1">Average Score</div>
          <div className="text-3xl font-bold text-white">{stats.avgScore}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 p-4 rounded-lg border border-green-500/30">
          <div className="text-sm text-green-400 mb-1">Strong Hire</div>
          <div className="text-3xl font-bold text-white">{stats.strongHire}</div>
        </div>
        <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 p-4 rounded-lg border border-cyan-500/30">
          <div className="text-sm text-cyan-400 mb-1">Selected</div>
          <div className="text-3xl font-bold text-white">{selectedCandidates.size}</div>
        </div>
      </div>

      {/* Bulk Compare Button */}
      {selectedCandidates.size >= 2 && (
        <div className="mb-4">
          <button
            onClick={handleBulkCompare}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-500 hover:to-purple-400 font-semibold shadow-lg shadow-purple-500/30 transition-all"
          >
            <GitCompare size={20} />
            Compare {selectedCandidates.size} Selected Candidates
          </button>
        </div>
      )}
        
      {/* Filters */}
      <div className="mb-6 bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={20} className="text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Filters</h3>
        </div>
        <div className="grid grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Filter by role..."
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="px-3 py-2 bg-gray-900 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          
          <select
            value={filters.experienceLevel}
            onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
            className="px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Experience Levels</option>
            {uniqueLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>

          <select
            value={filters.recommendation}
            onChange={(e) => setFilters({ ...filters, recommendation: e.target.value })}
            className="px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Recommendations</option>
            <option value="strong_hire">Strong Hire</option>
            <option value="hire">Hire</option>
            <option value="maybe">Maybe</option>
            <option value="no_hire">No Hire</option>
          </select>

          <select
            value={filters.minScore}
            onChange={(e) => setFilters({ ...filters, minScore: parseFloat(e.target.value) })}
            className="px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="0">Min Score: Any</option>
            <option value="4.5">Min Score: 4.5+</option>
            <option value="4.0">Min Score: 4.0+</option>
            <option value="3.5">Min Score: 3.5+</option>
            <option value="3.0">Min Score: 3.0+</option>
          </select>

          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>

        <div className="flex gap-3 mt-3">
          <span className="text-sm text-gray-400">Sort by:</span>
          <button
            onClick={() => setSortBy('score')}
            className={`text-sm font-medium ${sortBy === 'score' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Score
          </button>
          <button
            onClick={() => setSortBy('date')}
            className={`text-sm font-medium ${sortBy === 'date' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Date
          </button>
          <button
            onClick={() => setSortBy('name')}
            className={`text-sm font-medium ${sortBy === 'name' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Name
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading candidates...</p>
        </div>
      )}

      {!loading && filteredCandidates.length === 0 && !error && (
        <div className="text-center py-20 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <BarChart3 size={64} className="mx-auto text-gray-600 mb-4" />
          <p className="text-xl text-gray-300 mb-2">No candidates match your filters</p>
          <p className="text-gray-500">Try adjusting your filters or clear them to see all candidates</p>
        </div>
      )}

      {!loading && filteredCandidates.length > 0 && (
        <div className="bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Select</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Experience</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Interview Date</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Score</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Recommendation</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Top Strength</th>
                  <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 bg-gray-900/50">
                {filteredCandidates.map((candidate, index) => (
                  <tr key={candidate.id} className="hover:bg-blue-500/10 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCandidates.has(candidate.id)}
                        onChange={() => toggleSelectCandidate(candidate.id)}
                        className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {index === 0 && sortBy === 'score' && <Award className="text-yellow-400" size={24} />}
                      {index === 1 && sortBy === 'score' && <Award className="text-gray-400" size={24} />}
                      {index === 2 && sortBy === 'score' && <Award className="text-orange-400" size={24} />}
                      {(index > 2 || sortBy !== 'score') && <span className="text-gray-400 font-semibold text-lg">#{index + 1}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{candidate.candidateName}</div>
                      <div className="text-sm text-gray-500">{candidate.company}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-300">{candidate.role}</td>
                    <td className="px-6 py-4 text-sm capitalize font-medium text-gray-300">{candidate.experienceLevel}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(candidate.startTime).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-4 py-2 rounded-full font-bold text-lg ${getScoreColor(candidate.overallScore)}`}>
                        {candidate.overallScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRecommendationBadge(candidate.recommendation)}`}>
                        {candidate.recommendation.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                      {candidate.strengths[0] || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-center">
                        <button
                          onClick={() => router.push(`/session/${candidate.id}`)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm"
                        >
                          <Eye size={16} />
                          View
                        </button>
                        <SendEmailButton
                          sessionId={candidate.id}
                          candidateName={candidate.candidateName}
                          candidateEmail={candidate.candidateEmail}
                          compact={true}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Comparison Modal */}
      {showBulkComparison && (
        <BulkComparisonModal
          candidates={getSelectedCandidates()}
          onClose={() => setShowBulkComparison(false)}
        />
      )}
    </div>
  );
}
