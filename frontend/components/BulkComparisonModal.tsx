'use client';

import { useState } from 'react';
import { X, TrendingUp, Award, AlertCircle, CheckCircle } from 'lucide-react';

interface Candidate {
  id: string;
  candidateName: string;
  role: string;
  company: string;
  startTime: number;
  overallScore: number;
  competencyRatings: Array<{
    competency: string;
    score: number;
    weight: number;
  }>;
  strengths: string[];
  concerns: string[];
  recommendation: string;
  experienceLevel: string;
}

interface BulkComparisonModalProps {
  candidates: Candidate[];
  onClose: () => void;
}

export default function BulkComparisonModal({ candidates, onClose }: BulkComparisonModalProps) {
  const [exportFormat, setExportFormat] = useState<'html' | 'json'>('html');

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-400';
    if (score >= 3.5) return 'text-blue-400';
    if (score >= 2.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRecommendationColor = (rec: string) => {
    const colors: any = {
      strong_hire: 'text-green-400',
      hire: 'text-blue-400',
      maybe: 'text-yellow-400',
      no_hire: 'text-red-400'
    };
    return colors[rec] || 'text-gray-400';
  };

  // Get all unique competencies
  const allCompetencies = Array.from(
    new Set(candidates.flatMap(c => c.competencyRatings.map(r => r.competency)))
  );

  const handleExport = () => {
    if (exportFormat === 'html') {
      exportAsHTML();
    } else {
      exportAsJSON();
    }
  };

  const exportAsHTML = () => {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Candidate Comparison Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .comparison-grid { display: grid; grid-template-columns: repeat(${Math.min(candidates.length, 3)}, 1fr); gap: 20px; margin-bottom: 20px; }
    .candidate-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .candidate-name { font-size: 1.5em; font-weight: bold; margin-bottom: 10px; color: #1e40af; }
    .score { font-size: 2em; font-weight: bold; margin: 10px 0; }
    .score-high { color: #10b981; }
    .score-mid { color: #3b82f6; }
    .score-low { color: #f59e0b; }
    .recommendation { padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
    .rec-strong_hire { background: #d1fae5; color: #065f46; }
    .rec-hire { background: #dbeafe; color: #1e40af; }
    .rec-maybe { background: #fef3c7; color: #92400e; }
    .rec-no_hire { background: #fee2e2; color: #991b1b; }
    .competency { margin: 15px 0; padding: 10px; background: #f9fafb; border-radius: 5px; }
    .competency-name { font-weight: bold; color: #374151; }
    .competency-score { float: right; font-weight: bold; }
    .strengths, .concerns { margin: 15px 0; }
    .strengths h4, .concerns h4 { color: #374151; margin-bottom: 8px; }
    .strengths li { color: #059669; }
    .concerns li { color: #dc2626; }
    table { width: 100%; border-collapse: collapse; background: white; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f3f4f6; font-weight: bold; color: #374151; }
    .footer { text-align: center; color: #6b7280; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Candidate Comparison Report</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
    <p>Comparing ${candidates.length} candidates</p>
  </div>

  <div class="comparison-grid">
    ${candidates.map((candidate, index) => `
      <div class="candidate-card">
        <div class="candidate-name">${index + 1}. ${candidate.candidateName}</div>
        <div><strong>Role:</strong> ${candidate.role}</div>
        <div><strong>Company:</strong> ${candidate.company}</div>
        <div><strong>Experience:</strong> ${candidate.experienceLevel}</div>
        <div><strong>Interview Date:</strong> ${new Date(candidate.startTime).toLocaleDateString()}</div>
        
        <div class="score ${candidate.overallScore >= 4 ? 'score-high' : candidate.overallScore >= 3 ? 'score-mid' : 'score-low'}">
          ${candidate.overallScore.toFixed(1)}/5.0
        </div>
        
        <div class="recommendation rec-${candidate.recommendation}">
          ${candidate.recommendation.replace(/_/g, ' ').toUpperCase()}
        </div>

        <div class="strengths">
          <h4>✓ Strengths:</h4>
          <ul>
            ${candidate.strengths.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>

        <div class="concerns">
          <h4>⚠ Concerns:</h4>
          <ul>
            ${candidate.concerns.map(c => `<li>${c}</li>`).join('')}
          </ul>
        </div>

        <h4>Competency Scores:</h4>
        ${candidate.competencyRatings.map(rating => `
          <div class="competency">
            <span class="competency-name">${rating.competency}</span>
            <span class="competency-score">${rating.score}/5</span>
          </div>
        `).join('')}
      </div>
    `).join('')}
  </div>

  <h2>Competency Comparison Table</h2>
  <table>
    <thead>
      <tr>
        <th>Candidate</th>
        ${allCompetencies.map(comp => `<th>${comp}</th>`).join('')}
        <th>Overall</th>
      </tr>
    </thead>
    <tbody>
      ${candidates.map(candidate => `
        <tr>
          <td><strong>${candidate.candidateName}</strong></td>
          ${allCompetencies.map(comp => {
            const rating = candidate.competencyRatings.find(r => r.competency === comp);
            return `<td>${rating ? rating.score + '/5' : '-'}</td>`;
          }).join('')}
          <td><strong>${candidate.overallScore.toFixed(1)}/5</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>This comparison report was generated by Interview Copilot</p>
    <p>Confidential - For internal use only</p>
  </div>
</body>
</html>
    `.trim();

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidate-comparison-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      candidateCount: candidates.length,
      candidates: candidates.map(c => ({
        name: c.candidateName,
        role: c.role,
        company: c.company,
        experienceLevel: c.experienceLevel,
        interviewDate: new Date(c.startTime).toISOString(),
        overallScore: c.overallScore,
        recommendation: c.recommendation,
        competencyRatings: c.competencyRatings,
        strengths: c.strengths,
        concerns: c.concerns
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidate-comparison-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp size={28} className="text-blue-400" />
              Compare {candidates.length} Candidates
            </h2>
            <p className="text-gray-400 text-sm mt-1">Side-by-side detailed comparison</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Candidate Cards Grid */}
          <div className={`grid gap-6 mb-6 ${candidates.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {candidates.map((candidate, index) => (
              <div key={candidate.id} className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Rank #{index + 1}</div>
                    <h3 className="text-xl font-bold text-white">{candidate.candidateName}</h3>
                    <div className="text-sm text-gray-400 mt-1">{candidate.role}</div>
                    <div className="text-sm text-gray-500">{candidate.company}</div>
                  </div>
                  {index === 0 && <Award className="text-yellow-400" size={32} />}
                </div>

                <div className={`text-4xl font-bold mb-2 ${getScoreColor(candidate.overallScore)}`}>
                  {candidate.overallScore.toFixed(1)}
                </div>

                <div className={`text-sm font-bold mb-4 ${getRecommendationColor(candidate.recommendation)}`}>
                  {candidate.recommendation.replace(/_/g, ' ').toUpperCase()}
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <div className="flex items-center gap-1 text-green-400 font-semibold mb-2">
                      <CheckCircle size={16} />
                      Top Strengths
                    </div>
                    <ul className="space-y-1">
                      {candidate.strengths.slice(0, 2).map((s, i) => (
                        <li key={i} className="text-gray-300 text-xs pl-4 border-l-2 border-green-500/50">{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 text-orange-400 font-semibold mb-2">
                      <AlertCircle size={16} />
                      Key Concerns
                    </div>
                    <ul className="space-y-1">
                      {candidate.concerns.slice(0, 2).map((c, i) => (
                        <li key={i} className="text-gray-300 text-xs pl-4 border-l-2 border-orange-500/50">{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Competency Comparison Table */}
          <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white">Competency Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-300">Competency</th>
                    {candidates.map((candidate, index) => (
                      <th key={candidate.id} className="px-4 py-3 text-center text-sm font-bold text-gray-300">
                        {candidate.candidateName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {allCompetencies.map((competency) => (
                    <tr key={competency} className="hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-sm font-medium text-white">{competency}</td>
                      {candidates.map((candidate) => {
                        const rating = candidate.competencyRatings.find(r => r.competency === competency);
                        return (
                          <td key={candidate.id} className="px-4 py-3 text-center">
                            {rating ? (
                              <span className={`text-lg font-bold ${getScoreColor(rating.score)}`}>
                                {rating.score}/5
                              </span>
                            ) : (
                              <span className="text-gray-600">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="bg-gray-800 font-bold">
                    <td className="px-4 py-3 text-sm text-white">Overall Score</td>
                    {candidates.map((candidate) => (
                      <td key={candidate.id} className="px-4 py-3 text-center">
                        <span className={`text-xl font-bold ${getScoreColor(candidate.overallScore)}`}>
                          {candidate.overallScore.toFixed(1)}/5
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer with Export */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700 bg-gray-900/50">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Export as:</span>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="html">HTML Report</option>
              <option value="json">JSON Data</option>
            </select>
          </div>
          <button
            onClick={handleExport}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Export Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
