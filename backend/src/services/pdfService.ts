import type { InterviewSession, EvaluationMatrix } from '../types';

export class PDFService {
  // Generate HTML that can be converted to PDF on frontend
  generateFeedbackHTML(session: InterviewSession, matrix: EvaluationMatrix): string {
    const date = new Date(session.startTime).toLocaleDateString();
    const duration = session.duration ? Math.round(session.duration / 60000) : 0;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
    h3 { color: #1e3a8a; margin-top: 20px; }
    .header { background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .info-item { margin: 5px 0; }
    .label { font-weight: bold; color: #64748b; }
    .score-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin: 5px 0; }
    .score-5 { background: #dcfce7; color: #166534; }
    .score-4 { background: #dbeafe; color: #1e40af; }
    .score-3 { background: #fef3c7; color: #92400e; }
    .score-2 { background: #fed7aa; color: #9a3412; }
    .score-1 { background: #fee2e2; color: #991b1b; }
    .competency { background: #f8fafc; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #2563eb; }
    .evidence { background: #f0fdf4; padding: 10px; margin: 10px 0; border-radius: 5px; }
    .concern { background: #fef2f2; padding: 10px; margin: 10px 0; border-radius: 5px; }
    ul { margin: 10px 0; padding-left: 20px; }
    li { margin: 5px 0; }
    .recommendation { padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; font-size: 1.2em; font-weight: bold; }
    .rec-strong_hire { background: #dcfce7; color: #166534; }
    .rec-hire { background: #dbeafe; color: #1e40af; }
    .rec-maybe { background: #fef3c7; color: #92400e; }
    .rec-no_hire { background: #fee2e2; color: #991b1b; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 0.9em; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <h1>Interview Feedback Report</h1>
  
  <div class="header">
    <div class="info-grid">
      <div class="info-item"><span class="label">Candidate:</span> ${session.candidateName}</div>
      <div class="info-item"><span class="label">Role:</span> ${session.role}</div>
      <div class="info-item"><span class="label">Company:</span> ${session.company}</div>
      <div class="info-item"><span class="label">Experience Level:</span> ${session.experienceLevel}</div>
      <div class="info-item"><span class="label">Date:</span> ${date}</div>
      <div class="info-item"><span class="label">Duration:</span> ${duration} minutes</div>
    </div>
  </div>

  <h2>Overall Assessment</h2>
  <p><span class="label">Overall Score:</span> <span class="score-badge score-${Math.round(session.interviewerOverallScore ?? session.overallScore ?? 0)}">${(session.interviewerOverallScore ?? session.overallScore ?? 0).toFixed(1)} / 5.0</span></p>
  
  <div class="recommendation rec-${session.interviewerRecommendation ?? session.recommendation ?? 'maybe'}">
    Recommendation: ${(session.interviewerRecommendation ?? session.recommendation ?? 'maybe').replace(/_/g, ' ').toUpperCase()}
  </div>

  <h2>Competency Evaluation</h2>
  ${(session.interviewerRatings ?? session.competencyRatings ?? []).map(rating => `
    <div class="competency">
      <h3>${rating.competency} <span class="score-badge score-${rating.score}">${rating.score}/5</span></h3>
      
      ${rating.evidence.length > 0 ? `
        <div class="evidence">
          <strong>✓ Strengths:</strong>
          <ul>
            ${rating.evidence.map(e => `<li>${e}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${rating.concerns.length > 0 ? `
        <div class="concern">
          <strong>⚠ Areas for Development:</strong>
          <ul>
            ${rating.concerns.map(c => `<li>${c}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `).join('')}

  <h2>Summary</h2>
  
  ${(session.interviewerStrengths ?? session.strengths ?? []).length > 0 ? `
    <h3>Key Strengths</h3>
    <ul>
      ${(session.interviewerStrengths ?? session.strengths ?? []).map(s => `<li>${s}</li>`).join('')}
    </ul>
  ` : ''}
  
  ${(session.interviewerConcerns ?? session.concerns ?? []).length > 0 ? `
    <h3>Development Areas</h3>
    <ul>
      ${(session.interviewerConcerns ?? session.concerns ?? []).map(c => `<li>${c}</li>`).join('')}
    </ul>
  ` : ''}

  ${session.notes ? `
    <h3>Additional Notes</h3>
    <p>${session.notes}</p>
  ` : ''}

  <div class="footer">
    <p>This report was generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    <p>Confidential - For internal use only</p>
  </div>
</body>
</html>
    `.trim();
  }
}

export const pdfService = new PDFService();
