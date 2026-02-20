import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with realistic interview data...');
  
  // Clear existing data
  await prisma.sessionFeedback.deleteMany({});
  await prisma.sessionNote.deleteMany({});
  await prisma.competencyRating.deleteMany({});
  await prisma.turn.deleteMany({});
  await prisma.interviewSession.deleteMany({});
  await prisma.interviewTemplate.deleteMany({});
  console.log('✓ Cleared existing data');

  // Seed Templates
  console.log('📝 Creating interview templates...');
  
  await prisma.interviewTemplate.create({
    data: {
      name: 'Senior Software Engineer - Full Stack',
      role: 'Senior Software Engineer',
      company: 'TechCorp',
      experienceLevel: 'senior',
      requiredSkills: JSON.stringify([
        'React',
        'TypeScript',
        'Node.js',
        'System Design',
        'AWS',
        'PostgreSQL'
      ]),
      jobDescription: 'Looking for a senior engineer to lead our full-stack development team. Must have strong system design skills and experience with modern web technologies.',
      isDefault: true
    }
  });

  await prisma.interviewTemplate.create({
    data: {
      name: 'Frontend Engineer - React Specialist',
      role: 'Frontend Engineer',
      company: 'TechCorp',
      experienceLevel: 'mid',
      requiredSkills: JSON.stringify([
        'React',
        'TypeScript',
        'CSS/SCSS',
        'Redux',
        'Testing (Jest, RTL)',
        'Webpack'
      ]),
      jobDescription: 'Mid-level frontend engineer with strong React skills. Will work on our customer-facing applications.',
      isDefault: false
    }
  });

  await prisma.interviewTemplate.create({
    data: {
      name: 'Backend Engineer - Microservices',
      role: 'Backend Engineer',
      company: 'TechCorp',
      experienceLevel: 'senior',
      requiredSkills: JSON.stringify([
        'Node.js',
        'Python',
        'Microservices',
        'Docker',
        'Kubernetes',
        'MongoDB',
        'Redis'
      ]),
      jobDescription: 'Senior backend engineer to work on our microservices architecture. Experience with containerization and orchestration required.',
      isDefault: false
    }
  });

  await prisma.interviewTemplate.create({
    data: {
      name: 'Junior Developer - Entry Level',
      role: 'Software Engineer',
      company: 'TechCorp',
      experienceLevel: 'junior',
      requiredSkills: JSON.stringify([
        'JavaScript',
        'HTML/CSS',
        'Git',
        'Basic algorithms',
        'Problem solving'
      ]),
      jobDescription: 'Entry-level position for recent graduates or career changers. Strong fundamentals and eagerness to learn required.',
      isDefault: false
    }
  });

  await prisma.interviewTemplate.create({
    data: {
      name: 'Product Manager - B2B SaaS',
      role: 'Product Manager',
      company: 'TechCorp',
      experienceLevel: 'senior',
      requiredSkills: JSON.stringify([
        'Product Strategy',
        'Stakeholder Management',
        'Data Analysis',
        'Agile/Scrum',
        'B2B SaaS Experience'
      ]),
      jobDescription: 'Senior PM to lead our B2B product line. Must have experience with enterprise software and strong analytical skills.',
      isDefault: false
    }
  });

  console.log('✅ Created 5 interview templates');

  const now = Date.now();
  const oneDay = 86400000;
  const oneHour = 3600000;

  // Session 1: Excellent Senior Engineer
  const session1 = await prisma.interviewSession.create({
    data: {
      id: 'session-001',
      candidateName: 'Sarah Chen',
      role: 'Software Engineer',
      company: 'TechCorp',
      experienceLevel: 'senior',
      interviewerName: 'Alice Johnson',
      startTime: new Date(now - 1 * oneDay),
      endTime: new Date(now - 1 * oneDay + oneHour),
      duration: oneHour,
      
      // Interviewer evaluation
      interviewerOverallScore: 4.7,
      interviewerRecommendation: 'strong_hire',
      interviewerStrengths: JSON.stringify([
        'Exceptional system design skills with real-world examples',
        'Strong technical leadership and mentoring experience',
        'Excellent communication and problem-solving abilities',
        'Deep understanding of distributed systems and scalability'
      ]),
      interviewerConcerns: JSON.stringify([]),
      
      // AI evaluation
      aiOverallScore: 4.5,
      aiRecommendation: 'strong_hire',
      aiStrengths: JSON.stringify([
        'Demonstrated strong technical depth in system design',
        'Clear communication of complex concepts',
        'Good understanding of trade-offs and scalability'
      ]),
      aiConcerns: JSON.stringify([
        'Could provide more specific metrics from past projects'
      ]),
      aiAnalysisText: 'The candidate demonstrated exceptional system design skills, particularly in discussing distributed systems architecture. Their approach to the URL shortener problem showed deep understanding of scalability, caching strategies, and database sharding. Communication was clear and structured. Leadership experience is well-documented with concrete examples of mentoring and technical decision-making.',
      
      // Legacy fields
      overallScore: 4.7,
      recommendation: 'strong_hire',
      strengths: JSON.stringify([
        'Exceptional system design skills with real-world examples',
        'Strong technical leadership and mentoring experience',
        'Excellent communication and problem-solving abilities',
        'Deep understanding of distributed systems and scalability'
      ]),
      concerns: JSON.stringify([]),
      notes: 'Outstanding candidate. Would be a great addition to the team.',
      
      turns: {
        create: [
          {
            id: 'turn-001-1',
            speaker: 'interviewer',
            text: 'Can you walk me through how you would design a scalable URL shortener service?',
            timestamp: new Date(now - 1 * oneDay)
          },
          {
            id: 'turn-001-2',
            speaker: 'candidate',
            text: 'I would start by identifying the key requirements: high availability, low latency, and scalability. For the architecture, I would use a distributed hash table approach with consistent hashing...',
            timestamp: new Date(now - 1 * oneDay + 60000)
          }
        ]
      },
      competencyRatings: {
        create: [
          {
            competency: 'System Design',
            score: 5,
            evidence: JSON.stringify([
              'Designed comprehensive URL shortener with load balancing',
              'Considered CAP theorem trade-offs',
              'Explained caching strategy with Redis',
              'Discussed database sharding approach'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.3,
            source: 'interviewer'
          },
          {
            competency: 'System Design',
            score: 4,
            evidence: JSON.stringify([
              'Strong architectural thinking',
              'Good understanding of distributed systems',
              'Considered scalability from the start'
            ]),
            concerns: JSON.stringify(['Could elaborate more on monitoring and observability']),
            weight: 0.3,
            source: 'ai'
          },
          {
            competency: 'Technical Leadership',
            score: 5,
            evidence: JSON.stringify([
              'Led team of 5 engineers on microservices migration',
              'Mentored 3 junior developers',
              'Established code review standards',
              'Drove technical decision-making'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.25,
            source: 'interviewer'
          },
          {
            competency: 'Technical Leadership',
            score: 5,
            evidence: JSON.stringify([
              'Clear examples of team leadership',
              'Mentoring experience well-articulated',
              'Shows initiative in process improvement'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.25,
            source: 'ai'
          },
          {
            competency: 'Code Excellence',
            score: 4,
            evidence: JSON.stringify([
              'Strong coding practices demonstrated',
              'Comprehensive testing approach',
              'Clean architecture principles'
            ]),
            concerns: JSON.stringify(['Could improve documentation practices']),
            weight: 0.2,
            source: 'interviewer'
          },
          {
            competency: 'Code Excellence',
            score: 4,
            evidence: JSON.stringify([
              'Good code quality awareness',
              'Testing mindset evident'
            ]),
            concerns: JSON.stringify(['Documentation practices not deeply discussed']),
            weight: 0.2,
            source: 'ai'
          },
          {
            competency: 'Cross-functional Collaboration',
            score: 5,
            evidence: JSON.stringify([
              'Worked closely with product and design teams',
              'Excellent stakeholder communication',
              'Drove alignment across teams'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.15,
            source: 'interviewer'
          },
          {
            competency: 'Cross-functional Collaboration',
            score: 5,
            evidence: JSON.stringify([
              'Strong communication skills',
              'Good at explaining technical concepts to non-technical stakeholders'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.15,
            source: 'ai'
          },
          {
            competency: 'Impact & Delivery',
            score: 5,
            evidence: JSON.stringify([
              'Delivered major platform migration on time',
              'Reduced system latency by 40%',
              'Improved deployment frequency'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.1,
            source: 'interviewer'
          },
          {
            competency: 'Impact & Delivery',
            score: 5,
            evidence: JSON.stringify([
              'Concrete metrics provided',
              'Clear business impact'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.1,
            source: 'ai'
          }
        ]
      }
    }
  });

  // Session 2: Good Senior Engineer
  const session2 = await prisma.interviewSession.create({
    data: {
      id: 'session-002',
      candidateName: 'Michael Rodriguez',
      role: 'Software Engineer',
      company: 'TechCorp',
      experienceLevel: 'senior',
      interviewerName: 'Alice Johnson',
      startTime: new Date(now - 2 * oneDay),
      endTime: new Date(now - 2 * oneDay + 3300000),
      duration: 3300000,
      
      // Interviewer evaluation
      interviewerOverallScore: 4.1,
      interviewerRecommendation: 'hire',
      interviewerStrengths: JSON.stringify([
        'Strong backend development skills',
        'Good system design fundamentals',
        'Solid problem-solving approach',
        'Team player with good communication'
      ]),
      interviewerConcerns: JSON.stringify([
        'Limited experience with distributed systems at scale',
        'Could strengthen frontend skills'
      ]),
      
      // AI evaluation
      aiOverallScore: 3.9,
      aiRecommendation: 'hire',
      aiStrengths: JSON.stringify([
        'Good technical problem-solving demonstrated',
        'Solid understanding of performance optimization',
        'Clear communication style'
      ]),
      aiConcerns: JSON.stringify([
        'Limited depth in distributed systems',
        'Could benefit from more architectural experience'
      ]),
      aiAnalysisText: 'Candidate shows solid backend engineering skills with good problem-solving abilities. The performance optimization example was well-explained. However, there are gaps in distributed systems experience that would be expected at a senior level. Overall a good hire with room to grow into the senior role.',
      
      // Legacy fields
      overallScore: 4.1,
      recommendation: 'hire',
      strengths: JSON.stringify([
        'Strong backend development skills',
        'Good system design fundamentals',
        'Solid problem-solving approach',
        'Team player with good communication'
      ]),
      concerns: JSON.stringify([
        'Limited experience with distributed systems at scale',
        'Could strengthen frontend skills'
      ]),
      notes: 'Solid candidate with room to grow into senior role.',
      
      turns: {
        create: [
          {
            id: 'turn-002-1',
            speaker: 'interviewer',
            text: 'Tell me about a challenging technical problem you solved recently.',
            timestamp: new Date(now - 2 * oneDay)
          },
          {
            id: 'turn-002-2',
            speaker: 'candidate',
            text: 'We had a performance issue with our API that was causing timeouts. I profiled the code and found N+1 query problems...',
            timestamp: new Date(now - 2 * oneDay + 45000)
          }
        ]
      },
      competencyRatings: {
        create: [
          {
            competency: 'System Design',
            score: 4,
            evidence: JSON.stringify([
              'Good understanding of API design',
              'Solid database optimization skills',
              'Understands caching strategies'
            ]),
            concerns: JSON.stringify(['Limited experience with large-scale distributed systems']),
            weight: 0.3,
            source: 'interviewer'
          },
          {
            competency: 'System Design',
            score: 3,
            evidence: JSON.stringify([
              'Basic system design understanding',
              'Good at optimization'
            ]),
            concerns: JSON.stringify(['Lacks depth in distributed architecture', 'Limited scalability discussion']),
            weight: 0.3,
            source: 'ai'
          },
          {
            competency: 'Technical Leadership',
            score: 3,
            evidence: JSON.stringify([
              'Mentored 1 junior developer',
              'Participates in code reviews'
            ]),
            concerns: JSON.stringify(['Limited leadership experience', 'Needs more initiative']),
            weight: 0.25,
            source: 'interviewer'
          },
          {
            competency: 'Technical Leadership',
            score: 3,
            evidence: JSON.stringify([
              'Some mentoring experience'
            ]),
            concerns: JSON.stringify(['Limited leadership examples', 'Needs to demonstrate more initiative']),
            weight: 0.25,
            source: 'ai'
          },
          {
            competency: 'Code Excellence',
            score: 5,
            evidence: JSON.stringify([
              'Clean, well-tested code',
              'Strong attention to detail',
              'Good documentation practices'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'interviewer'
          },
          {
            competency: 'Code Excellence',
            score: 5,
            evidence: JSON.stringify([
              'Strong code quality focus',
              'Testing mindset evident'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'ai'
          },
          {
            competency: 'Cross-functional Collaboration',
            score: 4,
            evidence: JSON.stringify([
              'Works well with product team',
              'Good communication skills'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.15,
            source: 'interviewer'
          },
          {
            competency: 'Cross-functional Collaboration',
            score: 4,
            evidence: JSON.stringify([
              'Good team collaboration mentioned'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.15,
            source: 'ai'
          },
          {
            competency: 'Impact & Delivery',
            score: 4,
            evidence: JSON.stringify([
              'Consistently delivers on commitments',
              'Improved API performance by 30%'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.1,
            source: 'interviewer'
          },
          {
            competency: 'Impact & Delivery',
            score: 4,
            evidence: JSON.stringify([
              'Good track record of delivery',
              'Measurable performance improvements'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.1,
            source: 'ai'
          }
        ]
      }
    }
  });

  // Session 3: Mid-level Engineer
  const session3 = await prisma.interviewSession.create({
    data: {
      id: 'session-003',
      candidateName: 'Emily Watson',
      role: 'Software Engineer',
      company: 'TechCorp',
      experienceLevel: 'mid',
      interviewerName: 'Bob Smith',
      startTime: new Date(now - 3 * oneDay),
      endTime: new Date(now - 3 * oneDay + 3000000),
      duration: 3000000,
      overallScore: 3.8,
      recommendation: 'hire',
      strengths: JSON.stringify([
        'Strong React and frontend skills',
        'Quick learner with good fundamentals',
        'Enthusiastic and motivated',
        'Good team collaboration'
      ]),
      concerns: JSON.stringify([
        'Limited backend experience',
        'Needs more exposure to system design',
        'Could improve testing practices'
      ]),
      notes: 'Good mid-level candidate with potential to grow.',
      turns: {
        create: [
          {
            id: 'turn-003-1',
            speaker: 'interviewer',
            text: 'What is your experience with React hooks?',
            timestamp: new Date(now - 3 * oneDay)
          },
          {
            id: 'turn-003-2',
            speaker: 'candidate',
            text: 'I use hooks extensively in my current role. useState and useEffect are my go-to hooks, and I have created several custom hooks for shared logic...',
            timestamp: new Date(now - 3 * oneDay + 30000)
          }
        ]
      },
      competencyRatings: {
        create: [
          {
            competency: 'Technical Skills',
            score: 4,
            evidence: JSON.stringify([
              'Strong React and TypeScript skills',
              'Good understanding of modern frontend',
              'Built several production features'
            ]),
            concerns: JSON.stringify(['Limited backend knowledge']),
            weight: 0.35,
            source: 'interviewer'
          },
          {
            competency: 'Communication',
            score: 4,
            evidence: JSON.stringify([
              'Clear explanations',
              'Good at asking questions',
              'Articulate about technical concepts'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.25,
            source: 'interviewer'
          },
          {
            competency: 'Problem Solving',
            score: 3,
            evidence: JSON.stringify([
              'Methodical approach to debugging',
              'Good analytical skills'
            ]),
            concerns: JSON.stringify(['Needs more experience with complex problems']),
            weight: 0.2,
            source: 'interviewer'
          },
          {
            competency: 'Cultural Fit',
            score: 4,
            evidence: JSON.stringify([
              'Team player',
              'Positive attitude',
              'Aligns with company values'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'interviewer'
          }
        ]
      }
    }
  });

  // Session 4: Junior Engineer - Strong Hire
  const session4 = await prisma.interviewSession.create({
    data: {
      id: 'session-004',
      candidateName: 'David Kim',
      role: 'Software Engineer',
      company: 'TechCorp',
      experienceLevel: 'junior',
      interviewerName: 'Bob Smith',
      startTime: new Date(now - 4 * oneDay),
      endTime: new Date(now - 4 * oneDay + 2700000),
      duration: 2700000,
      overallScore: 4.2,
      recommendation: 'strong_hire',
      strengths: JSON.stringify([
        'Exceptional learning ability and growth mindset',
        'Strong computer science fundamentals',
        'Excellent problem-solving skills',
        'Great attitude and cultural fit'
      ]),
      concerns: JSON.stringify([
        'Limited production experience',
        'Needs mentoring on best practices'
      ]),
      notes: 'Outstanding junior candidate with high potential.',
      turns: {
        create: [
          {
            id: 'turn-004-1',
            speaker: 'interviewer',
            text: 'Can you explain the difference between var, let, and const in JavaScript?',
            timestamp: new Date(now - 4 * oneDay)
          },
          {
            id: 'turn-004-2',
            speaker: 'candidate',
            text: 'Var is function-scoped and can be redeclared, while let and const are block-scoped. Const cannot be reassigned, but objects declared with const can still be mutated...',
            timestamp: new Date(now - 4 * oneDay + 20000)
          }
        ]
      },
      competencyRatings: {
        create: [
          {
            competency: 'Technical Fundamentals',
            score: 4,
            evidence: JSON.stringify([
              'Strong CS fundamentals',
              'Good understanding of data structures',
              'Solid grasp of algorithms'
            ]),
            concerns: JSON.stringify(['Limited real-world experience']),
            weight: 0.3,
            source: 'interviewer'
          },
          {
            competency: 'Code Quality',
            score: 4,
            evidence: JSON.stringify([
              'Clean, readable code',
              'Good naming conventions',
              'Follows best practices'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.25,
            source: 'interviewer'
          },
          {
            competency: 'Learning & Growth',
            score: 5,
            evidence: JSON.stringify([
              'Extremely eager to learn',
              'Asks insightful questions',
              'Quick to grasp new concepts',
              'Self-directed learning'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'interviewer'
          },
          {
            competency: 'Communication',
            score: 4,
            evidence: JSON.stringify([
              'Clear explanations',
              'Good listener',
              'Articulate'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.15,
            source: 'interviewer'
          },
          {
            competency: 'Problem Solving',
            score: 4,
            evidence: JSON.stringify([
              'Systematic approach',
              'Good debugging skills',
              'Creative solutions'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.1,
            source: 'interviewer'
          }
        ]
      }
    }
  });

  // Session 5: Maybe Candidate
  const session5 = await prisma.interviewSession.create({
    data: {
      id: 'session-005',
      candidateName: 'Jennifer Lee',
      role: 'Software Engineer',
      company: 'TechCorp',
      experienceLevel: 'mid',
      interviewerName: 'Alice Johnson',
      startTime: new Date(now - 5 * oneDay),
      endTime: new Date(now - 5 * oneDay + 3600000),
      duration: 3600000,
      overallScore: 3.2,
      recommendation: 'maybe',
      strengths: JSON.stringify([
        'Good technical knowledge',
        'Relevant experience'
      ]),
      concerns: JSON.stringify([
        'Communication could be clearer',
        'Struggled with system design questions',
        'Limited problem-solving depth',
        'Cultural fit concerns'
      ]),
      notes: 'Borderline candidate. Would need strong team support.',
      turns: {
        create: [
          {
            id: 'turn-005-1',
            speaker: 'interviewer',
            text: 'How would you approach designing a notification system?',
            timestamp: new Date(now - 5 * oneDay)
          },
          {
            id: 'turn-005-2',
            speaker: 'candidate',
            text: 'Um, I would probably use a database to store notifications and then poll for updates...',
            timestamp: new Date(now - 5 * oneDay + 90000)
          }
        ]
      },
      competencyRatings: {
        create: [
          {
            competency: 'Technical Skills',
            score: 3,
            evidence: JSON.stringify([
              'Basic understanding of concepts',
              'Some relevant experience'
            ]),
            concerns: JSON.stringify([
              'Struggled with advanced topics',
              'Limited depth of knowledge'
            ]),
            weight: 0.35,
            source: 'interviewer'
          },
          {
            competency: 'Communication',
            score: 2,
            evidence: JSON.stringify([]),
            concerns: JSON.stringify([
              'Unclear explanations',
              'Difficulty articulating thoughts',
              'Needed many clarifying questions'
            ]),
            weight: 0.25,
            source: 'interviewer'
          },
          {
            competency: 'Problem Solving',
            score: 3,
            evidence: JSON.stringify([
              'Eventually arrived at solutions'
            ]),
            concerns: JSON.stringify([
              'Slow problem-solving',
              'Needed significant hints'
            ]),
            weight: 0.2,
            source: 'interviewer'
          },
          {
            competency: 'Cultural Fit',
            score: 4,
            evidence: JSON.stringify([
              'Friendly demeanor',
              'Team-oriented'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'interviewer'
          }
        ]
      }
    }
  });

  // Session 6: No Hire
  const session6 = await prisma.interviewSession.create({
    data: {
      id: 'session-006',
      candidateName: 'Robert Taylor',
      role: 'Software Engineer',
      company: 'TechCorp',
      experienceLevel: 'senior',
      interviewerName: 'Bob Smith',
      startTime: new Date(now - 6 * oneDay),
      endTime: new Date(now - 6 * oneDay + 2400000),
      duration: 2400000,
      overallScore: 2.1,
      recommendation: 'no_hire',
      strengths: JSON.stringify([
        'Years of experience'
      ]),
      concerns: JSON.stringify([
        'Outdated technical knowledge',
        'Poor problem-solving skills',
        'Weak communication',
        'Not a culture fit',
        'Defensive when receiving feedback'
      ]),
      notes: 'Not recommended for hire. Skills do not match senior level expectations.',
      turns: {
        create: [
          {
            id: 'turn-006-1',
            speaker: 'interviewer',
            text: 'What is your experience with modern JavaScript frameworks?',
            timestamp: new Date(now - 6 * oneDay)
          },
          {
            id: 'turn-006-2',
            speaker: 'candidate',
            text: 'I mostly use jQuery. I have not really needed to learn React or Vue...',
            timestamp: new Date(now - 6 * oneDay + 15000)
          }
        ]
      },
      competencyRatings: {
        create: [
          {
            competency: 'System Design',
            score: 2,
            evidence: JSON.stringify([]),
            concerns: JSON.stringify([
              'Outdated approaches',
              'No understanding of modern architecture',
              'Could not explain scalability concepts'
            ]),
            weight: 0.3,
            source: 'interviewer'
          },
          {
            competency: 'Technical Leadership',
            score: 1,
            evidence: JSON.stringify([]),
            concerns: JSON.stringify([
              'No leadership experience',
              'Defensive attitude',
              'Not open to feedback'
            ]),
            weight: 0.25,
            source: 'interviewer'
          },
          {
            competency: 'Code Excellence',
            score: 2,
            evidence: JSON.stringify([]),
            concerns: JSON.stringify([
              'Outdated practices',
              'No testing experience',
              'Poor code quality'
            ]),
            weight: 0.2,
            source: 'interviewer'
          },
          {
            competency: 'Cross-functional Collaboration',
            score: 2,
            evidence: JSON.stringify([]),
            concerns: JSON.stringify([
              'Poor communication',
              'Not collaborative'
            ]),
            weight: 0.15,
            source: 'interviewer'
          },
          {
            competency: 'Impact & Delivery',
            score: 3,
            evidence: JSON.stringify([
              'Has delivered projects'
            ]),
            concerns: JSON.stringify([
              'No significant impact mentioned'
            ]),
            weight: 0.1,
            source: 'interviewer'
          }
        ]
      }
    }
  });

  // Additional sessions for different roles
  // Session 7: Product Manager
  const session7 = await prisma.interviewSession.create({
    data: {
      id: 'session-007',
      candidateName: 'Amanda Foster',
      role: 'Product Manager',
      company: 'TechCorp',
      experienceLevel: 'senior',
      interviewerName: 'Alice Johnson',
      startTime: new Date(now - 7 * oneDay),
      endTime: new Date(now - 7 * oneDay + 3600000),
      duration: 3600000,
      overallScore: 4.5,
      recommendation: 'strong_hire',
      strengths: JSON.stringify([
        'Excellent product strategy skills',
        'Strong stakeholder management',
        'Data-driven decision making',
        'Great leadership presence'
      ]),
      concerns: JSON.stringify([]),
      notes: 'Exceptional PM candidate with proven track record.',
      turns: {
        create: [
          {
            id: 'turn-007-1',
            speaker: 'interviewer',
            text: 'Tell me about a product you launched and its impact.',
            timestamp: new Date(now - 7 * oneDay)
          },
          {
            id: 'turn-007-2',
            speaker: 'candidate',
            text: 'I led the launch of our mobile app redesign which increased user engagement by 45% and reduced churn by 20%...',
            timestamp: new Date(now - 7 * oneDay + 40000)
          }
        ]
      },
      competencyRatings: {
        create: [
          {
            competency: 'Product Strategy',
            score: 5,
            evidence: JSON.stringify([
              'Clear product vision',
              'Strong market understanding',
              'Data-driven approach'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.35,
            source: 'interviewer'
          },
          {
            competency: 'Leadership',
            score: 5,
            evidence: JSON.stringify([
              'Led cross-functional teams',
              'Strong influence skills',
              'Excellent stakeholder management'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.25,
            source: 'interviewer'
          },
          {
            competency: 'Execution',
            score: 4,
            evidence: JSON.stringify([
              'Delivered major product launches',
              'Strong project management'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'interviewer'
          },
          {
            competency: 'Communication',
            score: 4,
            evidence: JSON.stringify([
              'Clear communicator',
              'Good presentation skills'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'interviewer'
          }
        ]
      }
    }
  });

  // Session 8: Frontend Engineer
  const session8 = await prisma.interviewSession.create({
    data: {
      id: 'session-008',
      candidateName: 'Chris Martinez',
      role: 'Frontend Engineer',
      company: 'TechCorp',
      experienceLevel: 'mid',
      interviewerName: 'Bob Smith',
      startTime: new Date(now - 8 * oneDay),
      endTime: new Date(now - 8 * oneDay + 3300000),
      duration: 3300000,
      overallScore: 3.9,
      recommendation: 'hire',
      strengths: JSON.stringify([
        'Strong React and CSS skills',
        'Good eye for design',
        'Performance optimization experience',
        'Accessibility awareness'
      ]),
      concerns: JSON.stringify([
        'Limited TypeScript experience',
        'Could improve testing practices'
      ]),
      notes: 'Solid frontend engineer with good potential.',
      turns: {
        create: [
          {
            id: 'turn-008-1',
            speaker: 'interviewer',
            text: 'How do you approach performance optimization in React?',
            timestamp: new Date(now - 8 * oneDay)
          },
          {
            id: 'turn-008-2',
            speaker: 'candidate',
            text: 'I start by profiling with React DevTools to identify bottlenecks. Then I use techniques like memoization, code splitting, and lazy loading...',
            timestamp: new Date(now - 8 * oneDay + 35000)
          }
        ]
      },
      competencyRatings: {
        create: [
          {
            competency: 'Frontend Skills',
            score: 4,
            evidence: JSON.stringify([
              'Strong React knowledge',
              'Good CSS and styling skills',
              'Performance optimization experience'
            ]),
            concerns: JSON.stringify(['Limited TypeScript']),
            weight: 0.4,
            source: 'interviewer'
          },
          {
            competency: 'Code Quality',
            score: 3,
            evidence: JSON.stringify([
              'Clean component structure',
              'Good naming conventions'
            ]),
            concerns: JSON.stringify(['Testing could be improved']),
            weight: 0.25,
            source: 'interviewer'
          },
          {
            competency: 'Design Sense',
            score: 4,
            evidence: JSON.stringify([
              'Good eye for UI/UX',
              'Accessibility aware'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'interviewer'
          },
          {
            competency: 'Collaboration',
            score: 4,
            evidence: JSON.stringify([
              'Works well with designers',
              'Good team player'
            ]),
            concerns: JSON.stringify([]),
            weight: 0.15,
            source: 'interviewer'
          }
        ]
      }
    }
  });

  console.log('✅ Created 8 sample sessions:');
  console.log('   - session-001: Sarah Chen (Senior, Strong Hire, 4.7)');
  console.log('   - session-002: Michael Rodriguez (Senior, Hire, 4.1)');
  console.log('   - session-003: Emily Watson (Mid, Hire, 3.8)');
  console.log('   - session-004: David Kim (Junior, Strong Hire, 4.2)');
  console.log('   - session-005: Jennifer Lee (Mid, Maybe, 3.2)');
  console.log('   - session-006: Robert Taylor (Senior, No Hire, 2.1)');
  console.log('   - session-007: Amanda Foster (PM, Strong Hire, 4.5)');
  console.log('   - session-008: Chris Martinez (Frontend, Hire, 3.9)');

  // Seed Session Notes
  console.log('📝 Creating session notes...');
  
  await prisma.sessionNote.create({
    data: {
      sessionId: 'session-001',
      content: 'Candidate showed exceptional system design skills',
      type: 'highlight',
      timestamp: new Date(now - 1 * oneDay + 1800000)
    }
  });

  await prisma.sessionNote.create({
    data: {
      sessionId: 'session-001',
      content: 'Great cultural fit - very collaborative',
      type: 'note',
      timestamp: new Date(now - 1 * oneDay + 2400000)
    }
  });

  await prisma.sessionNote.create({
    data: {
      sessionId: 'session-002',
      content: 'Need to verify distributed systems experience',
      type: 'flag',
      timestamp: new Date(now - 2 * oneDay + 1500000)
    }
  });

  await prisma.sessionNote.create({
    data: {
      sessionId: 'session-003',
      content: 'Strong React skills demonstrated',
      type: 'highlight',
      timestamp: new Date(now - 3 * oneDay + 1200000)
    }
  });

  await prisma.sessionNote.create({
    data: {
      sessionId: 'session-005',
      content: 'Communication issues - struggled to explain concepts',
      type: 'flag',
      timestamp: new Date(now - 5 * oneDay + 2000000)
    }
  });

  await prisma.sessionNote.create({
    data: {
      sessionId: 'session-006',
      content: 'Outdated tech stack - not a good fit',
      type: 'flag',
      timestamp: new Date(now - 6 * oneDay + 1000000)
    }
  });

  console.log('✅ Created 6 session notes');

  // Seed Session Feedback
  console.log('💬 Creating session feedback...');
  
  await prisma.sessionFeedback.create({
    data: {
      sessionId: 'session-001',
      feedbackType: 'question_helpful',
      rating: 5,
      comment: 'System design question was perfect for senior level'
    }
  });

  await prisma.sessionFeedback.create({
    data: {
      sessionId: 'session-001',
      feedbackType: 'rating_accurate',
      rating: 5,
      comment: 'AI ratings matched my assessment perfectly'
    }
  });

  await prisma.sessionFeedback.create({
    data: {
      sessionId: 'session-002',
      feedbackType: 'question_helpful',
      rating: 4,
      comment: 'Good questions but could dig deeper on architecture'
    }
  });

  await prisma.sessionFeedback.create({
    data: {
      sessionId: 'session-003',
      feedbackType: 'suggestion_useful',
      rating: 5,
      comment: 'Follow-up questions were spot on'
    }
  });

  await prisma.sessionFeedback.create({
    data: {
      sessionId: 'session-004',
      feedbackType: 'question_helpful',
      rating: 5,
      comment: 'Great fundamentals questions for junior level'
    }
  });

  await prisma.sessionFeedback.create({
    data: {
      sessionId: 'session-005',
      feedbackType: 'rating_accurate',
      rating: 3,
      comment: 'Rating was a bit harsh, candidate had potential'
    }
  });

  await prisma.sessionFeedback.create({
    data: {
      sessionId: 'session-006',
      feedbackType: 'question_helpful',
      rating: 4
    }
  });

  await prisma.sessionFeedback.create({
    data: {
      sessionId: 'session-007',
      feedbackType: 'question_helpful',
      rating: 5,
      comment: 'Excellent PM-specific questions'
    }
  });

  await prisma.sessionFeedback.create({
    data: {
      sessionId: 'session-008',
      feedbackType: 'suggestion_useful',
      rating: 4,
      comment: 'Good technical depth for frontend role'
    }
  });

  console.log('✅ Created 9 feedback entries');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log('   - 5 Interview Templates');
  console.log('   - 8 Interview Sessions');
  console.log('   - 6 Session Notes');
  console.log('   - 9 Feedback Entries');
  console.log('\n✨ You can now test all features with realistic data!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

