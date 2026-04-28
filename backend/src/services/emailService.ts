import sgMail from '@sendgrid/mail';
import { config } from '../config';
import type { InterviewSession, EvaluationMatrix } from '../types';
import { pdfService } from './pdfService';

interface EmailResult {
  success: boolean;
  message: string;
}

export class EmailService {
  private initialized = false;

  constructor() {
    if (config.sendgridApiKey) {
      sgMail.setApiKey(config.sendgridApiKey);
      this.initialized = true;
    }
  }

  async sendFeedbackEmail(
    session: InterviewSession,
    matrix: EvaluationMatrix,
    recipientEmail: string,
    recipientName?: string
  ): Promise<EmailResult> {
    if (!this.initialized) {
      return {
        success: false,
        message:
          'Email service is not configured. Please set SENDGRID_API_KEY in your environment variables.',
      };
    }

    if (!recipientEmail || !this.isValidEmail(recipientEmail)) {
      return {
        success: false,
        message: 'Please provide a valid recipient email address.',
      };
    }

    try {
      const feedbackHtml = pdfService.generateFeedbackHTML(session, matrix);
      const candidateName = recipientName || session.candidateName;

      const msg = {
        to: recipientEmail,
        from: config.senderEmail || 'noreply@interviewcopilot.com',
        subject: `Interview Feedback Report | ${session.role}`,
        text: this.generatePlainTextFeedback(session),
        html: this.wrapEmailHTML(feedbackHtml, candidateName, session),
      };

      await sgMail.send(msg);

      return {
        success: true,
        message: `Feedback report sent successfully to ${recipientEmail}`,
      };
    } catch (error: any) {
      console.error('Error sending feedback email:', error);

      const statusCode = error?.code || error?.response?.statusCode;
      let message = `Failed to send email: ${error?.message || 'Unknown error'}`;

      if (statusCode === 403) {
        message =
          'Email sending failed: Sender identity is not verified in SendGrid. Verify your sender under SendGrid → Settings → Sender Authentication.';
      } else if (statusCode === 401) {
        message =
          'Email sending failed: Invalid SendGrid API key. Please verify SENDGRID_API_KEY in your backend environment.';
      }

      return {
        success: false,
        message,
      };
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private generatePlainTextFeedback(session: InterviewSession): string {
    const date = new Date(session.startTime).toLocaleDateString();
    const score = (session.interviewerOverallScore ?? session.overallScore ?? 0).toFixed(1);
    const recommendation = (
      session.interviewerRecommendation ?? session.recommendation ?? 'maybe'
    )
      .replace(/_/g, ' ')
      .toUpperCase();

    return `
Interview Feedback Report

Candidate: ${session.candidateName}
Role: ${session.role}
Company: ${session.company}
Interview Date: ${date}

Overall Score: ${score} / 5.0
Recommendation: ${recommendation}

Thank you for participating in the interview process. Your detailed feedback is available in the HTML version of this email.

Best regards,
${session.company} Hiring Team
    `.trim();
  }

  private wrapEmailHTML(
    feedbackHTML: string,
    candidateName: string,
    session: InterviewSession
  ): string {
    const score = (session.interviewerOverallScore ?? session.overallScore ?? 0).toFixed(1);
    const recommendation = (
      session.interviewerRecommendation ?? session.recommendation ?? 'maybe'
    )
      .replace(/_/g, ' ')
      .toUpperCase();

    const recommendationColor = this.getRecommendationColor(recommendation);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Interview Feedback Report</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,0.12);">
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 55%,#3b82f6 100%);padding:40px 32px;text-align:center;">
              <div style="display:inline-block;padding:10px 18px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);border-radius:999px;color:#dbeafe;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                Interview Copilot
              </div>
              <h1 style="margin:18px 0 10px;font-size:32px;line-height:1.2;color:#ffffff;font-weight:800;">
                Interview Feedback Report
              </h1>
              <p style="margin:0;color:#dbeafe;font-size:16px;line-height:1.6;">
                Comprehensive candidate evaluation and hiring recommendation
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <div style="background:linear-gradient(135deg,#eff6ff 0%,#f8fbff 100%);border:1px solid #dbeafe;border-radius:16px;padding:24px;">
                <p style="margin:0;font-size:16px;color:#1e3a8a;line-height:1.7;">
                  Hello,
                </p>
                <p style="margin:12px 0 0;font-size:15px;color:#334155;line-height:1.8;">
                  Please find the detailed interview assessment for
                  <strong style="color:#0f172a;">${candidateName}</strong>.
                  This report summarizes interview performance, evaluation insights,
                  and the final recommendation.
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="48%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:24px;vertical-align:top;">
                    <div style="font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">
                      Overall Score
                    </div>
                    <div style="margin-top:10px;font-size:40px;font-weight:800;color:#0f172a;line-height:1;">
                      ${score}
                    </div>
                    <div style="margin-top:8px;font-size:14px;color:#64748b;">Out of 5.0</div>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background:${recommendationColor.bg};border:1px solid ${recommendationColor.border};border-radius:16px;padding:24px;vertical-align:top;">
                    <div style="font-size:13px;color:${recommendationColor.text};text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">
                      Recommendation
                    </div>
                    <div style="margin-top:14px;font-size:26px;font-weight:800;color:${recommendationColor.text};line-height:1.2;">
                      ${recommendation}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 12px;">
              ${feedbackHTML}
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px 32px;">
              <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:20px;">
                <div style="font-size:14px;font-weight:700;color:#9a3412;margin-bottom:8px;">
                  Confidential Information
                </div>
                <div style="font-size:14px;line-height:1.7;color:#7c2d12;">
                  This report contains confidential interview feedback intended solely for authorized internal stakeholders. Please handle and share it in accordance with your organization's hiring policies.
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td style="border-top:1px solid #e5e7eb;padding:28px 32px;text-align:center;background:#fafbfd;">
              <p style="margin:0;font-size:15px;color:#475569;">Best regards,</p>
              <p style="margin:8px 0 0;font-size:18px;font-weight:700;color:#0f172a;">${session.company} Hiring Team</p>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;">
          <tr>
            <td style="padding:20px 16px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                This is an automated message generated by Interview Copilot.<br />
                © ${new Date().getFullYear()} Interview Copilot. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getRecommendationColor(recommendation: string) {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      HIRE: {
        bg: '#ecfdf5',
        border: '#86efac',
        text: '#166534',
      },
      'STRONG HIRE': {
        bg: '#dcfce7',
        border: '#4ade80',
        text: '#14532d',
      },
      MAYBE: {
        bg: '#fffbeb',
        border: '#fcd34d',
        text: '#92400e',
      },
      'NO HIRE': {
        bg: '#fef2f2',
        border: '#fca5a5',
        text: '#991b1b',
      },
    };

    return colors[recommendation] || {
      bg: '#eff6ff',
      border: '#93c5fd',
      text: '#1d4ed8',
    };
  }
}

export const emailService = new EmailService();
