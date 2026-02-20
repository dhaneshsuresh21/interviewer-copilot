'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface Competency {
  name: string;
  weight: number;
  description: string;
  criteria: Array<{
    score: number;
    description: string;
  }>;
}

interface EvaluationMatrix {
  role: string;
  experienceLevel: string;
  competencies: Competency[];
}

interface CompetencyRating {
  competency: string;
  score: number;
  evidence: string[];
  concerns: string[];
  weight: number;
}

interface Props {
  role: string;
  experienceLevel: string;
  onRatingsChange: (ratings: CompetencyRating[]) => void;
  initialRatings?: CompetencyRating[];
}

export default function EvaluationMatrixPanel({ role, experienceLevel, onRatingsChange, initialRatings = [] }: Props) {
  const [matrix, setMatrix] = useState<EvaluationMatrix | null>(null);
  const [ratings, setRatings] = useState<CompetencyRating[]>(initialRatings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatrix();
  }, [role, experienceLevel]);

  const loadMatrix = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/evaluation-matrix?role=${encodeURIComponent(role)}&experienceLevel=${experienceLevel}`
      );
      const data = await res.json();
      setMatrix(data);
      
      // Initialize ratings if not provided
      if (initialRatings.length === 0) {
        const newRatings = data.competencies.map((comp: Competency) => ({
          competency: comp.name,
          score: 0,
          evidence: [],
          concerns: [],
          weight: comp.weight
        }));
        setRatings(newRatings);
      }
    } catch (error) {
      console.error('Failed to load evaluation matrix:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRating = (competency: string, field: keyof CompetencyRating, value: any) => {
    const newRatings = ratings.map(r => 
      r.competency === competency ? { ...r, [field]: value } : r
    );
    setRatings(newRatings);
    onRatingsChange(newRatings);
  };

  const addEvidence = (competency: string, text: string) => {
    if (!text.trim()) return;
    const rating = ratings.find(r => r.competency === competency);
    if (rating) {
      updateRating(competency, 'evidence', [...rating.evidence, text]);
    }
  };

  const addConcern = (competency: string, text: string) => {
    if (!text.trim()) return;
    const rating = ratings.find(r => r.competency === competency);
    if (rating) {
      updateRating(competency, 'concerns', [...rating.concerns, text]);
    }
  };

  const removeItem = (competency: string, field: 'evidence' | 'concerns', index: number) => {
    const rating = ratings.find(r => r.competency === competency);
    if (rating) {
      const newArray = rating[field].filter((_, i) => i !== index);
      updateRating(competency, field, newArray);
    }
  };

  const calculateOverallScore = () => {
    const totalWeight = ratings.reduce((sum, r) => sum + r.weight, 0);
    if (totalWeight === 0) return 0;
    const weightedSum = ratings.reduce((sum, r) => sum + (r.score * r.weight), 0);
    return (weightedSum / totalWeight).toFixed(1);
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-400">Loading evaluation matrix...</div>;
  }

  if (!matrix) {
    return <div className="p-4 text-center text-red-400">Failed to load evaluation matrix</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-2 text-white">Bias-Free Evaluation Matrix</h3>
        <p className="text-sm text-gray-300 mb-2">
          Rate each competency based on evidence from the interview. Focus on specific examples and behaviors.
        </p>
        <div className="text-2xl font-bold text-blue-400">
          Overall Score: {calculateOverallScore()} / 5.0
        </div>
      </div>

      {matrix.competencies.map((comp) => {
        const rating = ratings.find(r => r.competency === comp.name);
        if (!rating) return null;

        return (
          <div key={comp.name} className="bg-gray-800/80 backdrop-blur border border-gray-700/50 rounded-lg p-4 shadow-lg">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-lg text-white">{comp.name}</h4>
                <p className="text-sm text-gray-400">{comp.description}</p>
                <p className="text-xs text-gray-500 mt-1">Weight: {(comp.weight * 100).toFixed(0)}%</p>
              </div>
              
              <select
                value={rating.score}
                onChange={(e) => updateRating(comp.name, 'score', parseInt(e.target.value))}
                className="px-4 py-2 bg-gray-900 border border-gray-700 text-white rounded font-semibold text-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Not Rated</option>
                {comp.criteria.map((c) => (
                  <option key={c.score} value={c.score}>
                    {c.score} - {c.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Scoring Criteria */}
            <div className="mb-4 p-3 bg-gray-900/50 rounded text-sm">
              <div className="font-semibold mb-2 text-gray-300">Scoring Guide:</div>
              <div className="space-y-1">
                {comp.criteria.map((c) => (
                  <div key={c.score} className="flex gap-2">
                    <span className="font-semibold text-blue-400">{c.score}:</span>
                    <span className="text-gray-300">{c.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={18} className="text-green-400" />
                <span className="font-semibold text-white">Evidence / Strengths</span>
              </div>
              <div className="space-y-2">
                {rating.evidence.map((ev, i) => (
                  <div key={i} className="flex gap-2 items-start bg-green-500/10 border border-green-500/30 p-2 rounded">
                    <span className="flex-1 text-sm text-gray-300">{ev}</span>
                    <button
                      onClick={() => removeItem(comp.name, 'evidence', i)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  placeholder="Add evidence (press Enter)"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white placeholder-gray-500 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addEvidence(comp.name, e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>

            {/* Concerns */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={18} className="text-orange-400" />
                <span className="font-semibold text-white">Concerns / Areas for Development</span>
              </div>
              <div className="space-y-2">
                {rating.concerns.map((concern, i) => (
                  <div key={i} className="flex gap-2 items-start bg-orange-500/10 border border-orange-500/30 p-2 rounded">
                    <span className="flex-1 text-sm text-gray-300">{concern}</span>
                    <button
                      onClick={() => removeItem(comp.name, 'concerns', i)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  placeholder="Add concern (press Enter)"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white placeholder-gray-500 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addConcern(comp.name, e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
