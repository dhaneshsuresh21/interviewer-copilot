import type { EvaluationMatrix, CompetencyRating, InterviewSession } from '../types';

// Predefined evaluation matrices for common roles
const EVALUATION_MATRICES: { [key: string]: EvaluationMatrix } = {
  'software_engineer_junior': {
    role: 'Software Engineer',
    experienceLevel: 'junior',
    competencies: [
      {
        name: 'Technical Fundamentals',
        weight: 0.3,
        description: 'Core programming concepts and problem-solving',
        criteria: [
          { score: 1, description: 'Struggles with basic concepts' },
          { score: 2, description: 'Understands basics but needs guidance' },
          { score: 3, description: 'Solid fundamentals, can work independently' },
          { score: 4, description: 'Strong fundamentals, teaches others' },
          { score: 5, description: 'Expert level, innovative solutions' }
        ]
      },
      {
        name: 'Code Quality',
        weight: 0.25,
        description: 'Writing clean, maintainable code',
        criteria: [
          { score: 1, description: 'Poor code organization' },
          { score: 2, description: 'Basic structure, needs improvement' },
          { score: 3, description: 'Good practices, readable code' },
          { score: 4, description: 'Excellent practices, well-documented' },
          { score: 5, description: 'Exemplary, sets standards' }
        ]
      },
      {
        name: 'Learning & Growth',
        weight: 0.2,
        description: 'Ability to learn and adapt',
        criteria: [
          { score: 1, description: 'Resistant to feedback' },
          { score: 2, description: 'Accepts feedback slowly' },
          { score: 3, description: 'Eager to learn, applies feedback' },
          { score: 4, description: 'Proactive learner, seeks challenges' },
          { score: 5, description: 'Self-directed, mentors others' }
        ]
      },
      {
        name: 'Communication',
        weight: 0.15,
        description: 'Explaining technical concepts clearly',
        criteria: [
          { score: 1, description: 'Unclear, difficult to follow' },
          { score: 2, description: 'Basic communication, some gaps' },
          { score: 3, description: 'Clear and organized' },
          { score: 4, description: 'Articulate, adapts to audience' },
          { score: 5, description: 'Exceptional communicator' }
        ]
      },
      {
        name: 'Problem Solving',
        weight: 0.1,
        description: 'Approach to debugging and challenges',
        criteria: [
          { score: 1, description: 'Gets stuck easily' },
          { score: 2, description: 'Needs significant help' },
          { score: 3, description: 'Methodical approach' },
          { score: 4, description: 'Creative solutions' },
          { score: 5, description: 'Innovative problem solver' }
        ]
      }
    ]
  },
  'software_engineer_senior': {
    role: 'Software Engineer',
    experienceLevel: 'senior',
    competencies: [
      {
        name: 'System Design',
        weight: 0.3,
        description: 'Architecting scalable systems',
        criteria: [
          { score: 1, description: 'No design experience' },
          { score: 2, description: 'Basic understanding' },
          { score: 3, description: 'Designs solid systems' },
          { score: 4, description: 'Designs complex distributed systems' },
          { score: 5, description: 'Industry-leading architecture' }
        ]
      },
      {
        name: 'Technical Leadership',
        weight: 0.25,
        description: 'Mentoring and technical direction',
        criteria: [
          { score: 1, description: 'No leadership experience' },
          { score: 2, description: 'Occasional mentoring' },
          { score: 3, description: 'Mentors junior engineers' },
          { score: 4, description: 'Leads technical initiatives' },
          { score: 5, description: 'Drives org-wide technical strategy' }
        ]
      },
      {
        name: 'Code Excellence',
        weight: 0.2,
        description: 'Advanced coding and best practices',
        criteria: [
          { score: 1, description: 'Below senior standards' },
          { score: 2, description: 'Meets basic expectations' },
          { score: 3, description: 'Strong code quality' },
          { score: 4, description: 'Sets team standards' },
          { score: 5, description: 'Industry thought leader' }
        ]
      },
      {
        name: 'Cross-functional Collaboration',
        weight: 0.15,
        description: 'Working with product, design, stakeholders',
        criteria: [
          { score: 1, description: 'Siloed work style' },
          { score: 2, description: 'Basic collaboration' },
          { score: 3, description: 'Effective partner' },
          { score: 4, description: 'Drives alignment' },
          { score: 5, description: 'Strategic partner' }
        ]
      },
      {
        name: 'Impact & Delivery',
        weight: 0.1,
        description: 'Shipping high-impact projects',
        criteria: [
          { score: 1, description: 'Struggles to deliver' },
          { score: 2, description: 'Delivers with support' },
          { score: 3, description: 'Consistent delivery' },
          { score: 4, description: 'High-impact projects' },
          { score: 5, description: 'Transformative impact' }
        ]
      }
    ]
  }
};

export class EvaluationService {
  getEvaluationMatrix(role: string, experienceLevel: string): EvaluationMatrix {
    const key = `${role.toLowerCase().replace(/\s+/g, '_')}_${experienceLevel.toLowerCase()}`;
    return EVALUATION_MATRICES[key] || this.getDefaultMatrix(role, experienceLevel);
  }

  private getDefaultMatrix(role: string, experienceLevel: string): EvaluationMatrix {
    // Generic matrix for any role
    return {
      role,
      experienceLevel,
      competencies: [
        {
          name: 'Technical Skills',
          weight: 0.35,
          description: 'Role-specific technical expertise',
          criteria: [
            { score: 1, description: 'Below expectations' },
            { score: 2, description: 'Needs development' },
            { score: 3, description: 'Meets expectations' },
            { score: 4, description: 'Exceeds expectations' },
            { score: 5, description: 'Outstanding' }
          ]
        },
        {
          name: 'Communication',
          weight: 0.25,
          description: 'Clarity and effectiveness',
          criteria: [
            { score: 1, description: 'Poor communication' },
            { score: 2, description: 'Basic communication' },
            { score: 3, description: 'Clear communicator' },
            { score: 4, description: 'Excellent communicator' },
            { score: 5, description: 'Exceptional communicator' }
          ]
        },
        {
          name: 'Problem Solving',
          weight: 0.2,
          description: 'Analytical and creative thinking',
          criteria: [
            { score: 1, description: 'Struggles with problems' },
            { score: 2, description: 'Basic problem solving' },
            { score: 3, description: 'Effective problem solver' },
            { score: 4, description: 'Strong problem solver' },
            { score: 5, description: 'Innovative problem solver' }
          ]
        },
        {
          name: 'Cultural Fit',
          weight: 0.2,
          description: 'Alignment with team values',
          criteria: [
            { score: 1, description: 'Poor fit' },
            { score: 2, description: 'Some concerns' },
            { score: 3, description: 'Good fit' },
            { score: 4, description: 'Strong fit' },
            { score: 5, description: 'Excellent fit' }
          ]
        }
      ]
    };
  }

  calculateOverallScore(ratings: CompetencyRating[]): number {
    if (ratings.length === 0) return 0;
    
    const totalWeight = ratings.reduce((sum, r) => sum + r.weight, 0);
    if (totalWeight === 0) return 0;
    
    const weightedSum = ratings.reduce((sum, r) => sum + (r.score * r.weight), 0);
    return Math.round((weightedSum / totalWeight) * 10) / 10;
  }

  determineRecommendation(overallScore: number): InterviewSession['recommendation'] {
    if (overallScore >= 4.5) return 'strong_hire';
    if (overallScore >= 3.5) return 'hire';
    if (overallScore >= 2.5) return 'maybe';
    return 'no_hire';
  }

  // Bias mitigation: Anonymize and focus on evidence
  anonymizeForComparison(session: InterviewSession): any {
    return {
      id: session.id,
      candidateId: session.id.substring(0, 8), // Short ID instead of name
      overallScore: session.overallScore,
      competencyRatings: session.competencyRatings,
      strengths: session.strengths,
      concerns: session.concerns,
      recommendation: session.recommendation,
      experienceLevel: session.experienceLevel
    };
  }
}

export const evaluationService = new EvaluationService();
