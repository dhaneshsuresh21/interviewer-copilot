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
  },
  'frontend_engineer_mid': {
    role: 'Frontend Engineer',
    experienceLevel: 'mid',
    competencies: [
      {
        name: 'Frontend Technical Skills',
        weight: 0.35,
        description: 'React, TypeScript, CSS, and modern frontend tools',
        criteria: [
          { score: 1, description: 'Basic HTML/CSS only' },
          { score: 2, description: 'Can build simple components' },
          { score: 3, description: 'Proficient with React and state management' },
          { score: 4, description: 'Expert in performance optimization and advanced patterns' },
          { score: 5, description: 'Thought leader, contributes to frameworks' }
        ]
      },
      {
        name: 'UI/UX & Design Sense',
        weight: 0.25,
        description: 'Visual design, accessibility, and user experience',
        criteria: [
          { score: 1, description: 'No design awareness' },
          { score: 2, description: 'Can implement designs with guidance' },
          { score: 3, description: 'Good eye for UI/UX, accessibility aware' },
          { score: 4, description: 'Collaborates with designers, suggests improvements' },
          { score: 5, description: 'Design thinking, drives UX strategy' }
        ]
      },
      {
        name: 'Code Quality & Testing',
        weight: 0.2,
        description: 'Clean code, testing, and maintainability',
        criteria: [
          { score: 1, description: 'Poor code structure' },
          { score: 2, description: 'Basic structure, minimal testing' },
          { score: 3, description: 'Clean components, good test coverage' },
          { score: 4, description: 'Excellent practices, comprehensive testing' },
          { score: 5, description: 'Sets standards, testing advocate' }
        ]
      },
      {
        name: 'Performance & Optimization',
        weight: 0.15,
        description: 'Load time, rendering, bundle size optimization',
        criteria: [
          { score: 1, description: 'No optimization awareness' },
          { score: 2, description: 'Basic understanding' },
          { score: 3, description: 'Implements common optimizations' },
          { score: 4, description: 'Proactive optimization, uses profiling tools' },
          { score: 5, description: 'Performance expert, innovative solutions' }
        ]
      },
      {
        name: 'Collaboration',
        weight: 0.05,
        description: 'Working with designers, backend, and product',
        criteria: [
          { score: 1, description: 'Works in isolation' },
          { score: 2, description: 'Basic collaboration' },
          { score: 3, description: 'Good team player' },
          { score: 4, description: 'Bridges frontend/backend effectively' },
          { score: 5, description: 'Cross-functional leader' }
        ]
      }
    ]
  },
  'backend_engineer_senior': {
    role: 'Backend Engineer',
    experienceLevel: 'senior',
    competencies: [
      {
        name: 'Backend Architecture',
        weight: 0.3,
        description: 'Microservices, APIs, distributed systems',
        criteria: [
          { score: 1, description: 'Monolithic thinking only' },
          { score: 2, description: 'Basic API design' },
          { score: 3, description: 'Solid microservices understanding' },
          { score: 4, description: 'Designs complex distributed systems' },
          { score: 5, description: 'Industry-leading architecture patterns' }
        ]
      },
      {
        name: 'Database & Data Management',
        weight: 0.25,
        description: 'SQL/NoSQL, optimization, data modeling',
        criteria: [
          { score: 1, description: 'Basic CRUD operations' },
          { score: 2, description: 'Can write queries, basic optimization' },
          { score: 3, description: 'Strong data modeling, indexing strategies' },
          { score: 4, description: 'Expert optimization, sharding, replication' },
          { score: 5, description: 'Database architecture thought leader' }
        ]
      },
      {
        name: 'DevOps & Infrastructure',
        weight: 0.2,
        description: 'Docker, Kubernetes, CI/CD, monitoring',
        criteria: [
          { score: 1, description: 'No DevOps experience' },
          { score: 2, description: 'Basic Docker knowledge' },
          { score: 3, description: 'Proficient with containerization and deployment' },
          { score: 4, description: 'Kubernetes expert, full CI/CD ownership' },
          { score: 5, description: 'Infrastructure architect, SRE practices' }
        ]
      },
      {
        name: 'Code Quality & Testing',
        weight: 0.15,
        description: 'Clean code, unit/integration tests, TDD',
        criteria: [
          { score: 1, description: 'Poor code quality' },
          { score: 2, description: 'Basic structure, minimal tests' },
          { score: 3, description: 'Clean code, good test coverage' },
          { score: 4, description: 'TDD practitioner, comprehensive testing' },
          { score: 5, description: 'Quality champion, sets org standards' }
        ]
      },
      {
        name: 'Technical Leadership',
        weight: 0.1,
        description: 'Mentoring, technical decisions, documentation',
        criteria: [
          { score: 1, description: 'No leadership experience' },
          { score: 2, description: 'Occasional mentoring' },
          { score: 3, description: 'Mentors juniors, documents well' },
          { score: 4, description: 'Leads technical initiatives' },
          { score: 5, description: 'Drives technical strategy' }
        ]
      }
    ]
  },
  'product_manager_senior': {
    role: 'Product Manager',
    experienceLevel: 'senior',
    competencies: [
      {
        name: 'Product Strategy & Vision',
        weight: 0.3,
        description: 'Long-term thinking, market understanding, roadmap',
        criteria: [
          { score: 1, description: 'No strategic thinking' },
          { score: 2, description: 'Tactical focus only' },
          { score: 3, description: 'Clear product vision and strategy' },
          { score: 4, description: 'Drives multi-quarter roadmap' },
          { score: 5, description: 'Visionary, shapes company direction' }
        ]
      },
      {
        name: 'Stakeholder Management',
        weight: 0.25,
        description: 'Executive communication, alignment, influence',
        criteria: [
          { score: 1, description: 'Poor stakeholder management' },
          { score: 2, description: 'Basic communication' },
          { score: 3, description: 'Manages stakeholders effectively' },
          { score: 4, description: 'Influences senior leadership' },
          { score: 5, description: 'Executive presence, strategic partner' }
        ]
      },
      {
        name: 'Data-Driven Decision Making',
        weight: 0.2,
        description: 'Analytics, metrics, experimentation, insights',
        criteria: [
          { score: 1, description: 'Gut-feel decisions only' },
          { score: 2, description: 'Basic metrics tracking' },
          { score: 3, description: 'Uses data to inform decisions' },
          { score: 4, description: 'Advanced analytics, A/B testing' },
          { score: 5, description: 'Data science expertise, predictive modeling' }
        ]
      },
      {
        name: 'Execution & Delivery',
        weight: 0.15,
        description: 'Shipping products, agile practices, prioritization',
        criteria: [
          { score: 1, description: 'Struggles to ship' },
          { score: 2, description: 'Ships with delays' },
          { score: 3, description: 'Consistent delivery, good prioritization' },
          { score: 4, description: 'High-velocity shipping, excellent prioritization' },
          { score: 5, description: 'Delivery excellence, process innovation' }
        ]
      },
      {
        name: 'Technical Acumen',
        weight: 0.1,
        description: 'Understanding engineering, trade-offs, technical debt',
        criteria: [
          { score: 1, description: 'No technical understanding' },
          { score: 2, description: 'Basic technical awareness' },
          { score: 3, description: 'Understands technical trade-offs' },
          { score: 4, description: 'Strong technical partner to engineering' },
          { score: 5, description: 'Technical background, can code' }
        ]
      }
    ]
  },
  'software_engineer_mid': {
    role: 'Software Engineer',
    experienceLevel: 'mid',
    competencies: [
      {
        name: 'Technical Skills',
        weight: 0.35,
        description: 'Coding proficiency and technical knowledge',
        criteria: [
          { score: 1, description: 'Below mid-level expectations' },
          { score: 2, description: 'Basic mid-level skills' },
          { score: 3, description: 'Solid technical skills' },
          { score: 4, description: 'Strong technical depth' },
          { score: 5, description: 'Approaching senior level' }
        ]
      },
      {
        name: 'Problem Solving',
        weight: 0.25,
        description: 'Debugging and analytical thinking',
        criteria: [
          { score: 1, description: 'Struggles with complex problems' },
          { score: 2, description: 'Solves problems with guidance' },
          { score: 3, description: 'Independent problem solver' },
          { score: 4, description: 'Creative solutions' },
          { score: 5, description: 'Innovative problem solver' }
        ]
      },
      {
        name: 'Code Quality',
        weight: 0.2,
        description: 'Clean code and best practices',
        criteria: [
          { score: 1, description: 'Poor code quality' },
          { score: 2, description: 'Basic structure' },
          { score: 3, description: 'Good code quality' },
          { score: 4, description: 'Excellent practices' },
          { score: 5, description: 'Exemplary code' }
        ]
      },
      {
        name: 'Collaboration',
        weight: 0.15,
        description: 'Teamwork and communication',
        criteria: [
          { score: 1, description: 'Poor team player' },
          { score: 2, description: 'Basic collaboration' },
          { score: 3, description: 'Good team player' },
          { score: 4, description: 'Strong collaborator' },
          { score: 5, description: 'Team leader' }
        ]
      },
      {
        name: 'Growth Potential',
        weight: 0.05,
        description: 'Learning ability and initiative',
        criteria: [
          { score: 1, description: 'Limited growth' },
          { score: 2, description: 'Slow learner' },
          { score: 3, description: 'Good learner' },
          { score: 4, description: 'Fast learner' },
          { score: 5, description: 'Exceptional growth' }
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
