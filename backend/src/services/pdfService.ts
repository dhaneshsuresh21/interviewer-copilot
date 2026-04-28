import type { InterviewSession, EvaluationMatrix } from '../types';

export class PDFService {
  // Generate HTML that can be converted to PDF on frontend
  generateFeedbackHTML(session: InterviewSession, matrix: EvaluationMatrix): string {
    const date = new Date(session.startTime).toLocaleDateString();
    const duration = session.duration ? Math.round(session.duration / 60000) : 0;

    return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937;">
  
  <!-- Candidate Info Card -->
  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px; border: 1px solid #bae6fd;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
      <div style="margin: 8px 0;">
        <span style="font-weight: 600; color: #0369a1; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Candidate</span>
        <div style="color: #0c4a6e; font-size: 16px; font-weight: 600; margin-top: 4px;">${session.candidateName}</div>
      </div>
      <div style="margin: 8px 0;">
        <span style="font-weight: 600; color: #0369a1; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Role</span>
        <div style="color: #0c4a6e; font-size: 16px; font-weight: 600; margin-top: 4px;">${session.role}</div>
      </div>
      <div style="margin: 8px 0;">
        <span style="font-weight: 600; color: #0369a1; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Company</span>
        <div style="color: #0c4a6e; font-size: 16px; font-weight: 600; margin-top: 4px;">${session.company}</div>
      </div>
      <div style="margin: 8px 0;">
        <span style="font-weight: 600; color: #0369a1; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Experience Level</span>
        <div style="color: #0c4a6e; font-size: 16px; font-weight: 600; margin-top: 4px;">${session.experienceLevel}</div>
      </div>
      <div style="margin: 8px 0;">
        <span style="font-weight: 600; color: #0369a1; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Interview Date</span>
        <div style="color: #0c4a6e; font-size: 16px; font-weight: 600; margin-top: 4px;">${date}</div>
      </div>
      <div style="margin: 8px 0;">
        <span style="font-weight: 600; color: #0369a1; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Duration</span>
        <div style="color: #0c4a6e; font-size: 16px; font-weight: 600; margin-top: 4px;">${duration} minutes</div>
      </div>
    </div>
  </div>

  <!-- Overall Assessment -->
  <div style="margin-bottom: 35px;">
    <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 22px; font-weight: 700; border-bottom: 3px solid #3b82f6; padding-bottom: 10px;">Overall Assessment</h2>
    
    <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
      <div>
        <span style="font-weight: 600; color: #64748b; font-size: 14px;">Overall Score</span>
        <div style="display: inline-block; padding: 8px 20px; border-radius: 25px; font-weight: 700; font-size: 18px; margin-left: 12px; background: ${this.getScoreColor(Math.round(session.interviewerOverallScore ?? session.overallScore ?? 0)).bg}; color: ${this.getScoreColor(Math.round(session.interviewerOverallScore ?? session.overallScore ?? 0)).text};">
          ${(session.interviewerOverallScore ?? session.overallScore ?? 0).toFixed(1)} / 5.0
        </div>
      </div>
    </div>
    
    <div style="padding: 20px; border-radius: 10px; text-align: center; font-size: 18px; font-weight: 700; background: ${this.getRecommendationColor(session.interviewerRecommendation ?? session.recommendation ?? 'maybe').bg}; color: ${this.getRecommendationColor(session.interviewerRecommendation ?? session.recommendation ?? 'maybe').text}; border: 2px solid ${this.getRecommendationColor(session.interviewerRecommendation ?? session.recommendation ?? 'maybe').border};">
      Recommendation: ${(session.interviewerRecommendation ?? session.recommendation ?? 'maybe').replace(/_/g, ' ').toUpperCase()}
    </div>
  </div>

  <!-- Competency Evaluation -->
  <div style="margin-bottom: 35px;">
    <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 22px; font-weight: 700; border-bottom: 3px solid #3b82f6; padding-bottom: 10px;">Competency Evaluation</h2>
    
    ${(session.interviewerRatings ?? session.competencyRatings ?? []).map(rating => `
      <div style="background: #f8fafc; padding: 20px; margin: 18px 0; border-radius: 10px; border-left: 5px solid #3b82f6; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="color: #1e3a8a; margin: 0; font-size: 18px; font-weight: 700;">${rating.competency}</h3>
          <span style="display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: 700; font-size: 15px; background: ${this.getScoreColor(rating.score).bg}; color: ${this.getScoreColor(rating.score).text};">
            ${rating.score}/5
          </span>
        </div>
        
        ${rating.evidence.length > 0 ? `
          <div style="background: #f0fdf4; padding: 15px; margin: 12px 0; border-radius: 8px; border-left: 3px solid #22c55e;">
            <div style="font-weight: 700; color: #166534; margin-bottom: 8px; font-size: 14px;">✓ Strengths</div>
            <ul style="margin: 0; padding-left: 20px; color: #15803d;">
              ${rating.evidence.map(e => `<li style="margin: 6px 0; line-height: 1.5;">${e}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${rating.concerns.length > 0 ? `
          <div style="background: #fef2f2; padding: 15px; margin: 12px 0; border-radius: 8px; border-left: 3px solid #ef4444;">
            <div style="font-weight: 700; color: #991b1b; margin-bottom: 8px; font-size: 14px;">⚠ Areas for Development</div>
            <ul style="margin: 0; padding-left: 20px; color: #b91c1c;">
              ${rating.concerns.map(c => `<li style="margin: 6px 0; line-height: 1.5;">${c}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `).join('')}
  </div>

  <!-- Summary -->
  <div style="margin-bottom: 35px;">
    <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 22px; font-weight: 700; border-bottom: 3px solid #3b82f6; padding-bottom: 10px;">Summary</h2>
    
    ${(session.interviewerStrengths ?? session.strengths ?? []).length > 0 ? `
      <div style="margin-bottom: 25px;">
        <h3 style="color: #166534; margin: 0 0 12px 0; font-size: 18px; font-weight: 700;">Key Strengths</h3>
        <ul style="margin: 0; padding-left: 20px; color: #15803d; background: #f0fdf4; padding: 15px 15px 15px 35px; border-radius: 8px; border-left: 4px solid #22c55e;">
          ${(session.interviewerStrengths ?? session.strengths ?? []).map(s => `<li style="margin: 8px 0; line-height: 1.6;">${s}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    
    ${(session.interviewerConcerns ?? session.concerns ?? []).length > 0 ? `
      <div style="margin-bottom: 25px;">
        <h3 style="color: #991b1b; margin: 0 0 12px 0; font-size: 18px; font-weight: 700;">Development Areas</h3>
        <ul style="margin: 0; padding-left: 20px; color: #b91c1c; background: #fef2f2; padding: 15px 15px 15px 35px; border-radius: 8px; border-left: 4px solid #ef4444;">
          ${(session.interviewerConcerns ?? session.concerns ?? []).map(c => `<li style="margin: 8px 0; line-height: 1.6;">${c}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    ${session.notes ? `
      <div style="margin-bottom: 25px;">
        <h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 18px; font-weight: 700;">Additional Notes</h3>
        <div style="background: #eff6ff; padding: 15px; border-radius: 8px; color: #1e40af; line-height: 1.6; border-left: 4px solid #3b82f6;">
          ${session.notes}
        </div>
      </div>
    ` : ''}
  </div>

  <!-- Footer -->
  <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 13px;">
    <p style="margin: 0;">Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    <p style="margin: 8px 0 0 0; font-weight: 600;">Confidential - For Internal Use Only</p>
  </div>
</div>
    `.trim();
  }

  private getScoreColor(score: number): { bg: string; text: string } {
    if (score >= 5) return { bg: '#dcfce7', text: '#166534' };
    if (score >= 4) return { bg: '#dbeafe', text: '#1e40af' };
    if (score >= 3) return { bg: '#fef3c7', text: '#92400e' };
    if (score >= 2) return { bg: '#fed7aa', text: '#9a3412' };
    return { bg: '#fee2e2', text: '#991b1b' };
  }

  private getRecommendationColor(rec: string): { bg: string; text: string; border: string } {
    if (rec === 'strong_hire') return { bg: '#dcfce7', text: '#166534', border: '#22c55e' };
    if (rec === 'hire') return { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' };
    if (rec === 'maybe') return { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' };
    return { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' };
  }
}

export const pdfService = new PDFService();
