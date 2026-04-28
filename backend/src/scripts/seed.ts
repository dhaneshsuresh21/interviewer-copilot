import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with realistic interview data...');

  // ─────────────────────────────────────────────────────────────────────────────
  // Clear existing data (order matters: children before parents)
  // ─────────────────────────────────────────────────────────────────────────────
  await prisma.sessionFeedback.deleteMany({});
  await prisma.sessionNote.deleteMany({});
  await prisma.competencyRating.deleteMany({});
  await prisma.turn.deleteMany({});
  await prisma.interviewSession.deleteMany({});
  await prisma.interviewTemplate.deleteMany({});
  console.log('✓ Cleared existing data');

  // ─────────────────────────────────────────────────────────────────────────────
  // Templates
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('📝 Creating interview templates...');

  await prisma.interviewTemplate.create({
    data: {
      name: 'Senior Software Engineer – Full Stack',
      role: 'Senior Software Engineer',
      company: 'TechCorp',
      experienceLevel: 'senior',
      requiredSkills: JSON.stringify([
        'React', 'TypeScript', 'Node.js', 'System Design', 'AWS', 'PostgreSQL',
      ]),
      jobDescription:
        'Looking for a senior engineer to lead our full-stack development team. Must have strong system design skills and experience with modern web technologies.',
      presetQuestions: JSON.stringify([
        'Can you walk me through how you would design a scalable URL shortener service?',
        'Describe a time when you had to make a critical architectural decision. What was your thought process?',
        'How do you approach performance optimization in a full-stack application?',
        'Tell me about your experience with microservices architecture and when you would choose it over a monolith.',
        'How do you ensure code quality and maintainability in a large codebase?',
        'Describe your experience mentoring junior developers and how you approach technical leadership.',
      ]),
      isDefault: true,
    },
  });

  await prisma.interviewTemplate.create({
    data: {
      name: 'Frontend Engineer – React Specialist',
      role: 'Frontend Engineer',
      company: 'TechCorp',
      experienceLevel: 'mid',
      requiredSkills: JSON.stringify([
        'React', 'TypeScript', 'CSS/SCSS', 'Redux', 'Testing (Jest, RTL)', 'Webpack',
      ]),
      jobDescription:
        'Mid-level frontend engineer with strong React skills. Will work on our customer-facing applications.',
      presetQuestions: JSON.stringify([
        'What is your experience with React hooks and how do you decide when to create custom hooks?',
        'How do you approach state management in a large React application?',
        'Describe your process for optimizing React component performance.',
        'How do you ensure accessibility in your frontend applications?',
        'Walk me through how you would implement a complex form with validation in React.',
        'What testing strategies do you use for React components?',
      ]),
      isDefault: false,
    },
  });

  await prisma.interviewTemplate.create({
    data: {
      name: 'Backend Engineer – Microservices',
      role: 'Backend Engineer',
      company: 'TechCorp',
      experienceLevel: 'senior',
      requiredSkills: JSON.stringify([
        'Node.js', 'Python', 'Microservices', 'Docker', 'Kubernetes', 'MongoDB', 'Redis',
      ]),
      jobDescription:
        'Senior backend engineer to work on our microservices architecture. Experience with containerization and orchestration required.',
      presetQuestions: JSON.stringify([
        'How do you design communication patterns between microservices?',
        'Describe your experience with containerization and orchestration using Docker and Kubernetes.',
        'How do you handle distributed transactions and maintain data consistency across services?',
        'What strategies do you use for monitoring and debugging microservices in production?',
        'Tell me about a time you had to optimize database performance. What was your approach?',
        'How do you implement caching strategies in a distributed system?',
      ]),
      isDefault: false,
    },
  });

  await prisma.interviewTemplate.create({
    data: {
      name: 'Junior Developer – Entry Level',
      role: 'Software Engineer',
      company: 'TechCorp',
      experienceLevel: 'junior',
      requiredSkills: JSON.stringify([
        'JavaScript', 'HTML/CSS', 'Git', 'Basic algorithms', 'Problem solving',
      ]),
      jobDescription:
        'Entry-level position for recent graduates or career changers. Strong fundamentals and eagerness to learn required.',
      presetQuestions: JSON.stringify([
        'Can you explain the difference between var, let, and const in JavaScript?',
        'What is the difference between == and === in JavaScript?',
        'How does the event loop work in JavaScript?',
        'Explain the concept of closures with an example.',
        'What is your experience with version control using Git?',
        'Describe a challenging bug you encountered and how you debugged it.',
        'How do you stay updated with new technologies and best practices?',
      ]),
      isDefault: false,
    },
  });

  await prisma.interviewTemplate.create({
    data: {
      name: 'Product Manager – B2B SaaS',
      role: 'Product Manager',
      company: 'TechCorp',
      experienceLevel: 'senior',
      requiredSkills: JSON.stringify([
        'Product Strategy', 'Stakeholder Management', 'Data Analysis', 'Agile/Scrum',
        'B2B SaaS Experience',
      ]),
      jobDescription:
        'Senior PM to lead our B2B product line. Must have experience with enterprise software and strong analytical skills.',
      presetQuestions: JSON.stringify([
        'Tell me about a product you launched and its impact on the business.',
        'How do you prioritize features when you have competing stakeholder demands?',
        'Describe your approach to gathering and analyzing user feedback.',
        'How do you measure product success and what metrics do you track?',
        'Tell me about a time when you had to pivot a product strategy. What led to that decision?',
        'How do you work with engineering teams to balance technical debt with new features?',
        'Describe your experience with B2B SaaS products and enterprise sales cycles.',
      ]),
      isDefault: false,
    },
  });

  await prisma.interviewTemplate.create({
    data: {
      name: 'Data Engineer – Analytics Platform',
      role: 'Data Engineer',
      company: 'TechCorp',
      experienceLevel: 'mid',
      requiredSkills: JSON.stringify([
        'Python', 'SQL', 'Apache Spark', 'dbt', 'Airflow', 'Snowflake', 'Data modeling',
      ]),
      jobDescription:
        'Mid-level data engineer to build and maintain our analytics platform. Experience with modern data stacks required.',
      presetQuestions: JSON.stringify([
        'Walk me through how you would design a data pipeline for real-time analytics.',
        'How do you approach data quality and testing in pipelines?',
        'Describe your experience with data modeling and dimensional design.',
        'How do you handle schema evolution in a data warehouse?',
        'Tell me about a time you optimized a slow query or pipeline.',
        'What is your experience with orchestration tools like Airflow or Prefect?',
      ]),
      isDefault: false,
    },
  });

  console.log('✅ Created 6 interview templates');

  // ─────────────────────────────────────────────────────────────────────────────
  // Evaluation Matrices
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('📊 Creating evaluation matrices...');
  
  await prisma.evaluationMatrix.create({
    data: {
      role: 'Software Engineer',
      experienceLevel: 'junior',
      competencies: JSON.stringify([
        { name: 'Technical Fundamentals', weight: 0.3, description: 'Core programming concepts and problem-solving' },
        { name: 'Code Quality', weight: 0.25, description: 'Writing clean, maintainable code' },
        { name: 'Learning & Growth', weight: 0.2, description: 'Ability to learn and adapt' },
        { name: 'Communication', weight: 0.15, description: 'Explaining technical concepts clearly' },
        { name: 'Problem Solving', weight: 0.1, description: 'Approach to debugging and challenges' }
      ])
    }
  });

  await prisma.evaluationMatrix.create({
    data: {
      role: 'Software Engineer',
      experienceLevel: 'mid',
      competencies: JSON.stringify([
        { name: 'Technical Skills', weight: 0.35, description: 'Coding proficiency and technical knowledge' },
        { name: 'Problem Solving', weight: 0.25, description: 'Debugging and analytical thinking' },
        { name: 'Code Quality', weight: 0.2, description: 'Clean code and best practices' },
        { name: 'Collaboration', weight: 0.15, description: 'Teamwork and communication' },
        { name: 'Growth Potential', weight: 0.05, description: 'Learning ability and initiative' }
      ])
    }
  });

  await prisma.evaluationMatrix.create({
    data: {
      role: 'Software Engineer',
      experienceLevel: 'senior',
      competencies: JSON.stringify([
        { name: 'System Design', weight: 0.3, description: 'Architecting scalable systems' },
        { name: 'Technical Leadership', weight: 0.25, description: 'Mentoring and technical direction' },
        { name: 'Code Excellence', weight: 0.2, description: 'Advanced coding and best practices' },
        { name: 'Cross-functional Collaboration', weight: 0.15, description: 'Working with product, design, stakeholders' },
        { name: 'Impact & Delivery', weight: 0.1, description: 'Shipping high-impact projects' }
      ])
    }
  });

  await prisma.evaluationMatrix.create({
    data: {
      role: 'Frontend Engineer',
      experienceLevel: 'mid',
      competencies: JSON.stringify([
        { name: 'Frontend Technical Skills', weight: 0.35, description: 'React, TypeScript, CSS, and modern frontend tools' },
        { name: 'UI/UX & Design Sense', weight: 0.25, description: 'Visual design, accessibility, and user experience' },
        { name: 'Code Quality & Testing', weight: 0.2, description: 'Clean code, testing, and maintainability' },
        { name: 'Performance & Optimization', weight: 0.15, description: 'Load time, rendering, bundle size optimization' },
        { name: 'Collaboration', weight: 0.05, description: 'Working with designers, backend, and product' }
      ])
    }
  });

  await prisma.evaluationMatrix.create({
    data: {
      role: 'Backend Engineer',
      experienceLevel: 'senior',
      competencies: JSON.stringify([
        { name: 'Backend Architecture', weight: 0.3, description: 'Microservices, APIs, distributed systems' },
        { name: 'Database & Data Management', weight: 0.25, description: 'SQL/NoSQL, optimization, data modeling' },
        { name: 'DevOps & Infrastructure', weight: 0.2, description: 'Docker, Kubernetes, CI/CD, monitoring' },
        { name: 'Code Quality & Testing', weight: 0.15, description: 'Clean code, unit/integration tests, TDD' },
        { name: 'Technical Leadership', weight: 0.1, description: 'Mentoring, technical decisions, documentation' }
      ])
    }
  });

  await prisma.evaluationMatrix.create({
    data: {
      role: 'Product Manager',
      experienceLevel: 'senior',
      competencies: JSON.stringify([
        { name: 'Product Strategy & Vision', weight: 0.3, description: 'Long-term thinking, market understanding, roadmap' },
        { name: 'Stakeholder Management', weight: 0.25, description: 'Executive communication, alignment, influence' },
        { name: 'Data-Driven Decision Making', weight: 0.2, description: 'Analytics, metrics, experimentation, insights' },
        { name: 'Execution & Delivery', weight: 0.15, description: 'Shipping products, agile practices, prioritization' },
        { name: 'Technical Acumen', weight: 0.1, description: 'Understanding engineering, trade-offs, technical debt' }
      ])
    }
  });

  console.log('✅ Created 6 evaluation matrices');

  // ─────────────────────────────────────────────────────────────────────────────
  // Time helpers
  // ─────────────────────────────────────────────────────────────────────────────
  const now = Date.now();
  const d = (days: number) => days * 86_400_000;
  const h = (hours: number) => hours * 3_600_000;
  const m = (mins: number) => mins * 60_000;

  // ─────────────────────────────────────────────────────────────────────────────
  // Session 1 – Sarah Chen | Senior | Strong Hire | 4.7
  // ─────────────────────────────────────────────────────────────────────────────
  await prisma.interviewSession.create({
    data: {
      id: 'session-001',
      candidateName: 'Sarah Chen',
      candidateEmail: 'sarah.chen@email.com',
      candidatePhone: '+1-555-0101',
      role: 'Senior Software Engineer',
      company: 'TechCorp',
      experienceLevel: 'senior',
      interviewerName: 'Alice Johnson',
      startTime: new Date(now - d(1)),
      endTime: new Date(now - d(1) + h(1)),
      duration: h(1),

      interviewerOverallScore: 4.7,
      interviewerRecommendation: 'strong_hire',
      interviewerStrengths: JSON.stringify([
        'Exceptional system design skills with real-world examples',
        'Strong technical leadership and mentoring experience',
        'Excellent communication and problem-solving abilities',
        'Deep understanding of distributed systems and scalability',
      ]),
      interviewerConcerns: JSON.stringify([]),

      aiOverallScore: 4.5,
      aiRecommendation: 'strong_hire',
      aiStrengths: JSON.stringify([
        'Demonstrated strong technical depth in system design',
        'Clear, structured communication of complex concepts',
        'Strong grasp of trade-offs: CAP theorem, consistency vs. availability',
        'Impressive mentoring examples with measurable team impact',
      ]),
      aiConcerns: JSON.stringify([
        'Could provide more specific latency/throughput metrics from past projects',
      ]),
      aiAnalysisText:
        'Sarah demonstrated exceptional system design skills, particularly in distributed systems architecture. Her URL-shortener walkthrough showed deep understanding of consistent hashing, Redis caching, and database sharding strategies. Communication was clear and structured throughout. Leadership experience is well-documented with concrete examples of mentoring junior engineers and driving technical decision-making. Minor gap: quantitative metrics from previous projects were occasionally vague.',

      overallScore: 4.7,
      recommendation: 'strong_hire',
      strengths: JSON.stringify([
        'Exceptional system design skills with real-world examples',
        'Strong technical leadership and mentoring experience',
        'Excellent communication and problem-solving abilities',
        'Deep understanding of distributed systems and scalability',
      ]),
      concerns: JSON.stringify([]),
      notes: 'Outstanding candidate. Would be a great addition to the team. Recommend fast-tracking the offer.',

      turns: {
        create: [
          {
            id: 'turn-001-1',
            speaker: 'interviewer',
            text: 'Thanks for joining us today, Sarah. Let\'s dive right in — can you walk me through how you would design a scalable URL shortener service?',
            timestamp: new Date(now - d(1)),
          },
          {
            id: 'turn-001-2',
            speaker: 'candidate',
            text: 'Sure! I\'d start by clarifying requirements: expected read/write ratio, URL expiry, analytics needs. For a service like bit.ly, I\'d assume ~100M URLs, read-heavy (100:1). The architecture would be: an API layer behind a load balancer, a short-code generation service using base62 encoding of a counter or MD5 hash truncation, Redis for hot-URL caching, and a PostgreSQL cluster with sharding by short-code prefix for persistence.',
            timestamp: new Date(now - d(1) + m(2)),
          },
          {
            id: 'turn-001-3',
            speaker: 'interviewer',
            text: 'Great. How would you handle hash collisions in the short-code generation?',
            timestamp: new Date(now - d(1) + m(8)),
          },
          {
            id: 'turn-001-4',
            speaker: 'candidate',
            text: 'Two approaches: optimistic locking with a retry loop on collision, or pre-generating a pool of codes using a distributed counter (like Snowflake IDs) that guarantees uniqueness. I\'d lean toward the counter approach in production — it eliminates the retry cost and scales better across multiple generator nodes.',
            timestamp: new Date(now - d(1) + m(10)),
          },
          {
            id: 'turn-001-5',
            speaker: 'interviewer',
            text: 'Tell me about a time you had to make a critical architectural decision under pressure.',
            timestamp: new Date(now - d(1) + m(20)),
          },
          {
            id: 'turn-001-6',
            speaker: 'candidate',
            text: 'We were three weeks from launch when we discovered our monolith couldn\'t handle the expected 10x traffic spike. I proposed an emergency decomposition of just the two highest-traffic endpoints into separate services, leaving the rest as-is. We shipped on time, those services scaled independently, and we migrated the rest over the following quarter in a planned way rather than a crisis.',
            timestamp: new Date(now - d(1) + m(22)),
          },
          {
            id: 'turn-001-7',
            speaker: 'interviewer',
            text: 'Describe your approach to mentoring junior developers.',
            timestamp: new Date(now - d(1) + m(35)),
          },
          {
            id: 'turn-001-8',
            speaker: 'candidate',
            text: 'I pair each junior with a specific area of ownership so they have something they can be proud of. Weekly 1:1s where I ask what blocked them — not what they completed. I also do code review as teaching rather than gatekeeping: I try to explain the "why" behind every request. Two of my reports have since been promoted to mid-level.',
            timestamp: new Date(now - d(1) + m(37)),
          },
        ],
      },

      competencyRatings: {
        create: [
          {
            competency: 'System Design',
            score: 5,
            evidence: JSON.stringify([
              'Designed URL shortener with consistent hashing and Redis caching',
              'Articulated CAP theorem trade-offs unprompted',
              'Discussed database sharding strategy with concrete shard-key rationale',
              'Addressed collision resolution with two valid approaches',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.3,
            source: 'interviewer',
          },
          {
            competency: 'System Design',
            score: 4,
            evidence: JSON.stringify([
              'Strong architectural thinking with appropriate trade-off analysis',
              'Scalability considered from requirements-gathering stage',
              'Good understanding of distributed systems primitives',
            ]),
            concerns: JSON.stringify(['Monitoring and observability not proactively raised']),
            weight: 0.3,
            source: 'ai',
          },
          {
            competency: 'Technical Leadership',
            score: 5,
            evidence: JSON.stringify([
              'Led team of 5 engineers through microservices migration',
              'Mentored 3 junior developers, 2 promoted to mid-level',
              'Established code review standards adopted org-wide',
              'Made calm, high-quality architectural call under launch pressure',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.25,
            source: 'interviewer',
          },
          {
            competency: 'Technical Leadership',
            score: 5,
            evidence: JSON.stringify([
              'Concrete leadership examples with measurable team impact',
              'Shows initiative in process improvement',
              'Mentoring philosophy is thoughtful and structured',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.25,
            source: 'ai',
          },
          {
            competency: 'Code Excellence',
            score: 4,
            evidence: JSON.stringify([
              'Advocates for comprehensive testing including integration tests',
              'Clean architecture principles applied in migration story',
              'Code review used as a teaching tool',
            ]),
            concerns: JSON.stringify(['Documentation practices not explicitly discussed']),
            weight: 0.2,
            source: 'interviewer',
          },
          {
            competency: 'Code Excellence',
            score: 4,
            evidence: JSON.stringify([
              'Testing mindset evident throughout conversation',
              'Awareness of technical debt and planned remediation',
            ]),
            concerns: JSON.stringify(['Documentation practices not deeply discussed']),
            weight: 0.2,
            source: 'ai',
          },
          {
            competency: 'Cross-functional Collaboration',
            score: 5,
            evidence: JSON.stringify([
              'Worked closely with product and design to scope emergency refactor',
              'Excellent stakeholder communication during crisis',
              'Drove alignment across engineering, product, and operations',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.15,
            source: 'interviewer',
          },
          {
            competency: 'Cross-functional Collaboration',
            score: 5,
            evidence: JSON.stringify([
              'Explains technical concepts accessibly throughout interview',
              'Demonstrates empathy for non-technical stakeholders',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.15,
            source: 'ai',
          },
          {
            competency: 'Impact & Delivery',
            score: 5,
            evidence: JSON.stringify([
              'Delivered major platform migration on time despite mid-sprint blocker',
              'Reduced system latency by 40% post-migration',
              'Two mentees promoted within 12 months',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.1,
            source: 'interviewer',
          },
          {
            competency: 'Impact & Delivery',
            score: 5,
            evidence: JSON.stringify([
              'Concrete, quantified business impact across multiple stories',
              'Delivery under pressure handled with clear decision framework',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.1,
            source: 'ai',
          },
        ],
      },
    },
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Session 2 – Michael Rodriguez | Senior | Hire | 4.1
  // ─────────────────────────────────────────────────────────────────────────────
  await prisma.interviewSession.create({
    data: {
      id: 'session-002',
      candidateName: 'Michael Rodriguez',
      candidateEmail: 'michael.rodriguez@email.com',
      candidatePhone: '+1-555-0102',
      role: 'Senior Software Engineer',
      company: 'TechCorp',
      experienceLevel: 'senior',
      interviewerName: 'Alice Johnson',
      startTime: new Date(now - d(2)),
      endTime: new Date(now - d(2) + m(55)),
      duration: m(55),

      interviewerOverallScore: 4.1,
      interviewerRecommendation: 'hire',
      interviewerStrengths: JSON.stringify([
        'Strong backend development skills with deep Node.js experience',
        'Good system design fundamentals and N+1 awareness',
        'Solid problem-solving with clear, methodical approach',
        'Team player with good cross-team communication',
      ]),
      interviewerConcerns: JSON.stringify([
        'Limited experience with distributed systems at scale (>1M req/day)',
        'Frontend knowledge is shallow — TypeScript types usage was basic',
      ]),

      aiOverallScore: 3.9,
      aiRecommendation: 'hire',
      aiStrengths: JSON.stringify([
        'Strong performance optimization instincts (N+1 identification, indexing)',
        'Clear communication — structured answers with context, action, result',
        'Genuine curiosity about system-level trade-offs',
      ]),
      aiConcerns: JSON.stringify([
        'Distributed systems depth below senior bar — no discussion of consensus, partitioning',
        'Architectural breadth could be broader for a senior role',
      ]),
      aiAnalysisText:
        'Michael is a solid backend engineer with strong practical skills. His API performance optimization story was well-structured and showed real diagnostic skill. However, when probed on distributed systems topics (consistent hashing, eventual consistency), answers became less confident and more theoretical. This is a gap at the senior level but not disqualifying — he has strong fundamentals to build on. Recommend hire with a note to onboard him with a senior technical mentor for the first 6 months.',

      overallScore: 4.1,
      recommendation: 'hire',
      strengths: JSON.stringify([
        'Strong backend development skills',
        'Good system design fundamentals',
        'Solid problem-solving approach',
        'Team player with good communication',
      ]),
      concerns: JSON.stringify([
        'Limited experience with distributed systems at scale',
        'Could strengthen frontend skills',
      ]),
      notes: 'Solid candidate with room to grow into senior role. Suggest pairing with a distributed-systems mentor.',

      turns: {
        create: [
          {
            id: 'turn-002-1',
            speaker: 'interviewer',
            text: 'Tell me about a challenging technical problem you solved recently.',
            timestamp: new Date(now - d(2)),
          },
          {
            id: 'turn-002-2',
            speaker: 'candidate',
            text: 'Our main product API started timing out under load. I profiled requests and found N+1 query patterns — each call to /orders was spawning one DB query per line item. I introduced DataLoader-style batching and added a composite index on (user_id, created_at). Response times dropped from ~2s to ~80ms under the same load.',
            timestamp: new Date(now - d(2) + m(2)),
          },
          {
            id: 'turn-002-3',
            speaker: 'interviewer',
            text: 'How would you design a rate limiter for a public API?',
            timestamp: new Date(now - d(2) + m(15)),
          },
          {
            id: 'turn-002-4',
            speaker: 'candidate',
            text: 'I\'d use a token bucket algorithm backed by Redis. Each client key maps to a counter with a TTL. On each request, INCR the counter and check against the limit in a single Lua script for atomicity. For distributed deployments I\'d use Redis Cluster so the counter is consistent across nodes.',
            timestamp: new Date(now - d(2) + m(17)),
          },
          {
            id: 'turn-002-5',
            speaker: 'interviewer',
            text: 'How do you ensure code quality across a team?',
            timestamp: new Date(now - d(2) + m(30)),
          },
          {
            id: 'turn-002-6',
            speaker: 'candidate',
            text: 'Code reviews with a checklist — not as a gate but as a shared standard. We use ESLint and Prettier in CI so style is never a review topic. I also advocate for test coverage thresholds. We aim for 80% on business-critical paths. I\'ve written runbooks for common patterns so junior devs have references.',
            timestamp: new Date(now - d(2) + m(32)),
          },
          {
            id: 'turn-002-7',
            speaker: 'interviewer',
            text: 'How do you handle disagreements with product over scope?',
            timestamp: new Date(now - d(2) + m(44)),
          },
          {
            id: 'turn-002-8',
            speaker: 'candidate',
            text: 'I try to reframe it as a trade-off conversation rather than a conflict. I\'ll say "we can ship X by Friday or X+Y by next sprint — what\'s the business cost of waiting?" Usually that gets us to a reasoned decision together rather than a push-pull.',
            timestamp: new Date(now - d(2) + m(46)),
          },
        ],
      },

      competencyRatings: {
        create: [
          {
            competency: 'System Design',
            score: 4,
            evidence: JSON.stringify([
              'Rate limiter design with Redis token bucket was correct',
              'Good N+1 diagnostic and resolution instincts',
              'Understands caching strategies at a practical level',
            ]),
            concerns: JSON.stringify(['Limited discussion of large-scale distributed patterns']),
            weight: 0.3,
            source: 'interviewer',
          },
          {
            competency: 'System Design',
            score: 3,
            evidence: JSON.stringify([
              'Solid practical design skills',
              'Redis knowledge is applied and accurate',
            ]),
            concerns: JSON.stringify([
              'Lacks depth in distributed systems (partitioning, consensus)',
              'Scalability discussion stayed surface-level',
            ]),
            weight: 0.3,
            source: 'ai',
          },
          {
            competency: 'Technical Leadership',
            score: 3,
            evidence: JSON.stringify([
              'Mentored 1 junior developer',
              'Wrote runbooks and participates in code reviews',
            ]),
            concerns: JSON.stringify([
              'No examples of driving architectural decisions at team/org level',
            ]),
            weight: 0.25,
            source: 'interviewer',
          },
          {
            competency: 'Technical Leadership',
            score: 3,
            evidence: JSON.stringify([
              'Some process improvement initiative (checklists, runbooks)',
            ]),
            concerns: JSON.stringify([
              'Limited scope of influence — team-level only',
              'No examples of leading cross-team initiatives',
            ]),
            weight: 0.25,
            source: 'ai',
          },
          {
            competency: 'Code Excellence',
            score: 5,
            evidence: JSON.stringify([
              'CI enforcement of linting and formatting',
              '80% coverage target on critical paths',
              'Strong attention to code review quality',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'interviewer',
          },
          {
            competency: 'Code Excellence',
            score: 5,
            evidence: JSON.stringify([
              'Testing mindset with concrete coverage targets',
              'Tooling-first approach to style enforcement',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'ai',
          },
          {
            competency: 'Cross-functional Collaboration',
            score: 4,
            evidence: JSON.stringify([
              'Productive trade-off framing with product team',
              'Avoids blame, focuses on outcomes',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.15,
            source: 'interviewer',
          },
          {
            competency: 'Cross-functional Collaboration',
            score: 4,
            evidence: JSON.stringify([
              'Constructive conflict-resolution framing',
              'Good empathy for product priorities',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.15,
            source: 'ai',
          },
          {
            competency: 'Impact & Delivery',
            score: 4,
            evidence: JSON.stringify([
              'API latency improvement: 2s → 80ms (measurable)',
              'Consistently delivers on sprint commitments',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.1,
            source: 'interviewer',
          },
          {
            competency: 'Impact & Delivery',
            score: 4,
            evidence: JSON.stringify([
              'Quantified performance improvement provided',
              'Good track record of follow-through',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.1,
            source: 'ai',
          },
        ],
      },
    },
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Session 3 – Emily Watson | Mid | Hire | 3.8
  // ─────────────────────────────────────────────────────────────────────────────
  await prisma.interviewSession.create({
    data: {
      id: 'session-003',
      candidateName: 'Emily Watson',
      candidateEmail: 'emily.watson@email.com',
      candidatePhone: '+1-555-0103',
      role: 'Frontend Engineer',
      company: 'TechCorp',
      experienceLevel: 'mid',
      interviewerName: 'Bob Smith',
      startTime: new Date(now - d(3)),
      endTime: new Date(now - d(3) + m(50)),
      duration: m(50),

      interviewerOverallScore: 3.8,
      interviewerRecommendation: 'hire',
      interviewerStrengths: JSON.stringify([
        'Strong React hooks and custom-hook authoring',
        'Quick learner with good foundational knowledge',
        'Enthusiastic, positive energy — good culture fit',
        'Accessibility awareness is above average for mid-level',
      ]),
      interviewerConcerns: JSON.stringify([
        'Backend knowledge is minimal — API design unfamiliar',
        'Testing coverage is low: primarily unit tests, no integration',
        'System design experience thin, expected for level',
      ]),

      aiOverallScore: 3.7,
      aiRecommendation: 'hire',
      aiStrengths: JSON.stringify([
        'Deep React hooks knowledge with practical custom-hook examples',
        'Performance optimization awareness: memoization, lazy loading',
        'Accessibility knowledge beyond basic aria-label usage',
      ]),
      aiConcerns: JSON.stringify([
        'Testing strategy is shallow — no mention of integration or E2E tests',
        'State management answer defaulted to Redux without considering lighter alternatives',
        'No backend exposure makes full-stack tasks a risk',
      ]),
      aiAnalysisText:
        'Emily is a solid mid-level frontend engineer with genuine depth in React. Her custom-hook examples were practical and well-motivated. Accessibility knowledge was a pleasant surprise. The main gaps are in testing strategy (unit-only) and state management breadth — she defaulted to Redux for all scenarios without considering Context + useReducer or Zustand for simpler cases. These are learnable gaps. Recommend hire for a role with a strong backend buddy and testing culture.',

      overallScore: 3.8,
      recommendation: 'hire',
      strengths: JSON.stringify([
        'Strong React and frontend skills',
        'Quick learner with good fundamentals',
        'Enthusiastic and motivated',
        'Good accessibility awareness',
      ]),
      concerns: JSON.stringify([
        'Limited backend experience',
        'Testing strategy is unit-only — no integration or E2E',
        'State management thinking is Redux-first without evaluating alternatives',
      ]),
      notes: 'Good mid-level frontend candidate. Pair with backend mentor. Push her on testing practices early.',

      turns: {
        create: [
          {
            id: 'turn-003-1',
            speaker: 'interviewer',
            text: 'What is your experience with React hooks, and when do you create custom hooks?',
            timestamp: new Date(now - d(3)),
          },
          {
            id: 'turn-003-2',
            speaker: 'candidate',
            text: 'I use hooks constantly — useState, useEffect, useMemo, useCallback. I create custom hooks when I see the same stateful logic repeated across two or more components. For example, I extracted a useIntersectionObserver hook for lazy-loading images that ended up being reused in four places across the app.',
            timestamp: new Date(now - d(3) + m(2)),
          },
          {
            id: 'turn-003-3',
            speaker: 'interviewer',
            text: 'How do you approach accessibility in your components?',
            timestamp: new Date(now - d(3) + m(18)),
          },
          {
            id: 'turn-003-4',
            speaker: 'candidate',
            text: 'I start with semantic HTML — using button instead of div with an onClick, nav for navigation. Then I add ARIA roles where HTML semantics fall short. I run axe-core in our CI pipeline and do manual keyboard-navigation testing. Screen-reader testing with VoiceOver occasionally.',
            timestamp: new Date(now - d(3) + m(20)),
          },
          {
            id: 'turn-003-5',
            speaker: 'interviewer',
            text: 'Walk me through how you\'d implement a complex multi-step form.',
            timestamp: new Date(now - d(3) + m(32)),
          },
          {
            id: 'turn-003-6',
            speaker: 'candidate',
            text: 'I\'d model the form as a state machine — each step is a state, with transitions on "next" and "back". I\'d use react-hook-form for field-level validation with Zod schemas. Progress is stored in a top-level reducer so navigating backwards doesn\'t lose data. On submit, I\'d optimistically update the UI and handle errors inline per field if the API returns validation errors.',
            timestamp: new Date(now - d(3) + m(34)),
          },
          {
            id: 'turn-003-7',
            speaker: 'interviewer',
            text: 'What\'s your testing strategy for React components?',
            timestamp: new Date(now - d(3) + m(44)),
          },
          {
            id: 'turn-003-8',
            speaker: 'candidate',
            text: 'I write unit tests with React Testing Library — testing behaviour, not implementation details. I mock API calls with msw. I\'m still getting into Cypress for E2E but haven\'t set it up from scratch yet.',
            timestamp: new Date(now - d(3) + m(46)),
          },
        ],
      },

      competencyRatings: {
        create: [
          {
            competency: 'Technical Skills',
            score: 4,
            evidence: JSON.stringify([
              'Deep React hooks knowledge with real useIntersectionObserver example',
              'react-hook-form + Zod integration is a mature pattern',
              'State machine mental model for form — shows architectural thinking',
            ]),
            concerns: JSON.stringify(['Backend/API knowledge limited']),
            weight: 0.35,
            source: 'interviewer',
          },
          {
            competency: 'Technical Skills',
            score: 4,
            evidence: JSON.stringify([
              'Good practical React depth',
              'Accessibility tooling knowledge is above average',
            ]),
            concerns: JSON.stringify([
              'No integration/E2E test experience yet',
              'State management defaulted to Redux without weighing lighter options',
            ]),
            weight: 0.35,
            source: 'ai',
          },
          {
            competency: 'Communication',
            score: 4,
            evidence: JSON.stringify([
              'Clear, structured explanations',
              'Good at grounding abstract concepts with examples',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.25,
            source: 'interviewer',
          },
          {
            competency: 'Communication',
            score: 4,
            evidence: JSON.stringify([
              'Articulate throughout the interview',
              'Proactively provides motivations for technical choices',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.25,
            source: 'ai',
          },
          {
            competency: 'Problem Solving',
            score: 3,
            evidence: JSON.stringify([
              'Multi-step form answer showed genuine systems thinking',
              'Debugging approach is methodical',
            ]),
            concerns: JSON.stringify(['Limited exposure to complex backend-integrated problems']),
            weight: 0.2,
            source: 'interviewer',
          },
          {
            competency: 'Problem Solving',
            score: 3,
            evidence: JSON.stringify([
              'Good analytical approach within frontend domain',
            ]),
            concerns: JSON.stringify(['Problem-solving scope is frontend-bounded']),
            weight: 0.2,
            source: 'ai',
          },
          {
            competency: 'Cultural Fit',
            score: 4,
            evidence: JSON.stringify([
              'Positive, collaborative attitude throughout',
              'Asked thoughtful questions about team engineering culture',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'interviewer',
          },
          {
            competency: 'Cultural Fit',
            score: 4,
            evidence: JSON.stringify([
              'Genuine enthusiasm for the role and company mission',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'ai',
          },
        ],
      },
    },
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Session 4 – David Kim | Junior | Strong Hire | 4.2
  // ─────────────────────────────────────────────────────────────────────────────
  await prisma.interviewSession.create({
    data: {
      id: 'session-004',
      candidateName: 'David Kim',
      candidateEmail: 'david.kim@email.com',
      candidatePhone: '+1-555-0104',
      role: 'Software Engineer',
      company: 'TechCorp',
      experienceLevel: 'junior',
      interviewerName: 'Bob Smith',
      startTime: new Date(now - d(4)),
      endTime: new Date(now - d(4) + m(45)),
      duration: m(45),

      interviewerOverallScore: 4.2,
      interviewerRecommendation: 'strong_hire',
      interviewerStrengths: JSON.stringify([
        'Exceptional learning ability and growth mindset',
        'Strong CS fundamentals — closures, event loop, data structures all solid',
        'Creative, systematic problem-solving with minimal prompting',
        'Great culture fit — humble, curious, collaborative',
      ]),
      interviewerConcerns: JSON.stringify([
        'Limited production experience — has not shipped a feature to real users yet',
        'Will need mentoring on team workflow and best practices',
      ]),

      aiOverallScore: 4.0,
      aiRecommendation: 'strong_hire',
      aiStrengths: JSON.stringify([
        'Fundamentals are strong and deeply understood, not just memorised',
        'Ability to explain concepts clearly indicates solid mental models',
        'Self-directed learning habits suggest high growth ceiling',
      ]),
      aiConcerns: JSON.stringify([
        'No production system exposure — ramp-up investment required',
        'Testing experience is academic/tutorial level only',
      ]),
      aiAnalysisText:
        'David is an exceptional junior candidate. His CS fundamentals are not just memorised but genuinely understood — the closure explanation included a practical memory-leak example that most mid-level candidates miss. The event-loop walkthrough was accurate and confident. His debugging approach on the algorithm problem was systematic: edge cases first, then invariants. Primary gap is zero production experience, which is expected for the level. High ceiling — this candidate should be prioritised.',

      overallScore: 4.2,
      recommendation: 'strong_hire',
      strengths: JSON.stringify([
        'Exceptional learning ability and growth mindset',
        'Strong computer science fundamentals',
        'Excellent problem-solving skills',
        'Great attitude and cultural fit',
      ]),
      concerns: JSON.stringify([
        'Zero production system experience — will need structured onboarding',
        'Testing knowledge is theoretical, needs hands-on ramp-up',
      ]),
      notes: 'Outstanding junior candidate with very high ceiling. Fast-track offer recommended.',

      turns: {
        create: [
          {
            id: 'turn-004-1',
            speaker: 'interviewer',
            text: 'Can you explain the difference between var, let, and const in JavaScript?',
            timestamp: new Date(now - d(4)),
          },
          {
            id: 'turn-004-2',
            speaker: 'candidate',
            text: 'Var is function-scoped and is hoisted to the top of its function — so you can reference it before declaration without an error, you just get undefined. Let and const are block-scoped, which means they\'re confined to the nearest curly-brace block. Const can\'t be reassigned, but if it holds an object, the object\'s properties can still be mutated. I generally default to const and only use let when I know I need to reassign.',
            timestamp: new Date(now - d(4) + m(2)),
          },
          {
            id: 'turn-004-3',
            speaker: 'interviewer',
            text: 'Explain closures with a concrete example.',
            timestamp: new Date(now - d(4) + m(12)),
          },
          {
            id: 'turn-004-4',
            speaker: 'candidate',
            text: 'A closure is when a function "closes over" variables from its outer scope and keeps a reference to them even after the outer function has returned. Classic example: a counter factory. You call makeCounter(), it returns an inner function, and that inner function still has access to the count variable. One gotcha I\'ve seen in tutorials is accidental closures in loops with var — you end up with all callbacks referencing the same variable. That\'s why you use let in loops.',
            timestamp: new Date(now - d(4) + m(14)),
          },
          {
            id: 'turn-004-5',
            speaker: 'interviewer',
            text: 'Tell me about a challenging bug you encountered and how you debugged it.',
            timestamp: new Date(now - d(4) + m(26)),
          },
          {
            id: 'turn-004-6',
            speaker: 'candidate',
            text: 'In my capstone project, users reported that their saved data would sometimes disappear. I added console.log statements first — that didn\'t isolate it. Then I looked at the async flow and realised I was writing to localStorage before a Promise resolved, so on slow connections the write was happening with stale data. I refactored to await the async operation before persisting. I also added a test that simulates a slow network using setTimeout.',
            timestamp: new Date(now - d(4) + m(28)),
          },
          {
            id: 'turn-004-7',
            speaker: 'interviewer',
            text: 'How do you stay updated with new technologies?',
            timestamp: new Date(now - d(4) + m(38)),
          },
          {
            id: 'turn-004-8',
            speaker: 'candidate',
            text: 'I follow the TC39 proposals repo on GitHub for what\'s coming to JavaScript. I read the React blog and subscribe to Kent C. Dodds\'s newsletter. I also try to build a small weekend project with any new tool I want to learn — reading docs is one thing but building something locks it in. Recently built a mini-RSS reader to learn about Service Workers.',
            timestamp: new Date(now - d(4) + m(40)),
          },
        ],
      },

      competencyRatings: {
        create: [
          {
            competency: 'Technical Fundamentals',
            score: 4,
            evidence: JSON.stringify([
              'Scope and hoisting explanation was accurate and nuanced',
              'Closure explanation included real-world loop gotcha',
              'Async/await debugging showed genuine understanding of execution model',
            ]),
            concerns: JSON.stringify(['Production system exposure is zero']),
            weight: 0.3,
            source: 'interviewer',
          },
          {
            competency: 'Technical Fundamentals',
            score: 4,
            evidence: JSON.stringify([
              'Fundamentals are deeply understood, not surface-level',
              'Event-loop and async model conceptually solid',
            ]),
            concerns: JSON.stringify(['Testing knowledge is academic only']),
            weight: 0.3,
            source: 'ai',
          },
          {
            competency: 'Code Quality',
            score: 4,
            evidence: JSON.stringify([
              'Defaults to const — good habits',
              'Added regression test after fixing the localStorage bug',
              'Follows clear naming conventions in code samples',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.25,
            source: 'interviewer',
          },
          {
            competency: 'Code Quality',
            score: 4,
            evidence: JSON.stringify([
              'Demonstrates test-after mindset even without prompting',
              'Consistent naming and style in examples',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.25,
            source: 'ai',
          },
          {
            competency: 'Learning & Growth',
            score: 5,
            evidence: JSON.stringify([
              'Follows TC39 proposals — unusually proactive for junior level',
              'Builds weekend projects to solidify learning',
              'Self-aware about gaps and actively closing them',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'interviewer',
          },
          {
            competency: 'Learning & Growth',
            score: 5,
            evidence: JSON.stringify([
              'Structured self-directed learning with hands-on projects',
              'Curiosity evident throughout interview',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'ai',
          },
          {
            competency: 'Communication',
            score: 4,
            evidence: JSON.stringify([
              'Explanations are clear with concrete examples unprompted',
              'Good listener — asked clarifying questions before answering',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.15,
            source: 'interviewer',
          },
          {
            competency: 'Communication',
            score: 4,
            evidence: JSON.stringify([
              'Articulate and well-structured answers throughout',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.15,
            source: 'ai',
          },
          {
            competency: 'Problem Solving',
            score: 4,
            evidence: JSON.stringify([
              'Debugging story showed systematic isolation: log → async flow → fix → test',
              'Identified edge case (slow network) without prompting',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.1,
            source: 'interviewer',
          },
          {
            competency: 'Problem Solving',
            score: 4,
            evidence: JSON.stringify([
              'Systematic debugging approach demonstrates strong analytical instincts',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.1,
            source: 'ai',
          },
        ],
      },
    },
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Session 5 – Jennifer Lee | Mid | Maybe | 3.2
  // ─────────────────────────────────────────────────────────────────────────────
  await prisma.interviewSession.create({
    data: {
      id: 'session-005',
      candidateName: 'Jennifer Lee',
      candidateEmail: 'jennifer.lee@email.com',
      candidatePhone: '+1-555-0105',
      role: 'Software Engineer',
      company: 'TechCorp',
      experienceLevel: 'mid',
      interviewerName: 'Alice Johnson',
      startTime: new Date(now - d(5)),
      endTime: new Date(now - d(5) + h(1)),
      duration: h(1),

      interviewerOverallScore: 3.2,
      interviewerRecommendation: 'maybe',
      interviewerStrengths: JSON.stringify([
        'Relevant work experience in a similar domain',
        'Technical knowledge breadth is adequate',
        'Friendly demeanor, shows genuine interest',
      ]),
      interviewerConcerns: JSON.stringify([
        'Communication is unclear under pressure — struggled to articulate design decisions',
        'System design answer started with polling (naive approach), needed coaching to arrive at WebSockets',
        'Problem-solving pace was slow; relied on hints for medium-difficulty questions',
        'Possible culture fit risk — became visibly frustrated when follow-up questions were asked',
      ]),

      aiOverallScore: 3.0,
      aiRecommendation: 'maybe',
      aiStrengths: JSON.stringify([
        'General technical knowledge is adequate for mid-level',
        'Positive attitude outside of pressure moments',
      ]),
      aiConcerns: JSON.stringify([
        'Communication degraded significantly under follow-up questioning — not resilient',
        'System design answer showed lack of first-principles thinking',
        'Hint dependency on problem-solving is a yellow flag at mid-level',
        'Frustration response to probing questions is a culture concern',
      ]),
      aiAnalysisText:
        'Jennifer presents a mixed picture. Her general knowledge is sufficient but not deep, and her communication breaks down when probed beyond the surface. The notification system design defaulted to the most naive solution (polling) and only improved after direct hints. More concerning was a visible frustration response when follow-up questions were asked — at mid-level, candidates should expect and embrace challenging follow-ups. If the team has bandwidth for significant coaching and the role has low design complexity, this could work. Otherwise, recommend a no-hire.',

      overallScore: 3.2,
      recommendation: 'maybe',
      strengths: JSON.stringify([
        'Adequate technical knowledge breadth',
        'Relevant domain experience',
        'Friendly and shows genuine interest in role',
      ]),
      concerns: JSON.stringify([
        'Communication clarity degrades under pressure',
        'System design relies on naive approaches without self-correction',
        'Hint-dependent problem-solving at mid-level is concerning',
        'Frustration under questioning is a culture risk',
      ]),
      notes: 'Borderline. Only recommend if team has capacity for heavy coaching and role complexity is low. Discuss with hiring panel before proceeding.',

      turns: {
        create: [
          {
            id: 'turn-005-1',
            speaker: 'interviewer',
            text: 'How would you design a notification system that delivers updates to users in real time?',
            timestamp: new Date(now - d(5)),
          },
          {
            id: 'turn-005-2',
            speaker: 'candidate',
            text: 'Um, I would probably use a database to store notifications and then... poll for updates every few seconds from the frontend?',
            timestamp: new Date(now - d(5) + m(3)),
          },
          {
            id: 'turn-005-3',
            speaker: 'interviewer',
            text: 'What are the downsides of polling at scale?',
            timestamp: new Date(now - d(5) + m(4)),
          },
          {
            id: 'turn-005-4',
            speaker: 'candidate',
            text: 'It... creates a lot of requests. I guess if you have a million users polling every 5 seconds that is a lot of load on the server.',
            timestamp: new Date(now - d(5) + m(6)),
          },
          {
            id: 'turn-005-5',
            speaker: 'interviewer',
            text: 'What alternatives would reduce that server load?',
            timestamp: new Date(now - d(5) + m(7)),
          },
          {
            id: 'turn-005-6',
            speaker: 'candidate',
            text: 'WebSockets? I have heard of them. You keep a connection open so the server can push messages.',
            timestamp: new Date(now - d(5) + m(9)),
          },
          {
            id: 'turn-005-7',
            speaker: 'interviewer',
            text: 'Good. What happens to notification delivery if the WebSocket connection drops?',
            timestamp: new Date(now - d(5) + m(12)),
          },
          {
            id: 'turn-005-8',
            speaker: 'candidate',
            text: 'I... am not sure. Maybe you just reconnect and it picks up again?',
            timestamp: new Date(now - d(5) + m(14)),
          },
          {
            id: 'turn-005-9',
            speaker: 'interviewer',
            text: 'Tell me about a time you received critical feedback on your work. How did you respond?',
            timestamp: new Date(now - d(5) + m(40)),
          },
          {
            id: 'turn-005-10',
            speaker: 'candidate',
            text: 'I mean, I try to take it well. My last manager was pretty nitpicky about code style, which was kind of frustrating because it felt like he was targeting me. But I followed the style guide.',
            timestamp: new Date(now - d(5) + m(42)),
          },
        ],
      },

      competencyRatings: {
        create: [
          {
            competency: 'Technical Skills',
            score: 3,
            evidence: JSON.stringify([
              'General knowledge is adequate at surface level',
              'WebSockets knowledge present but shallow',
            ]),
            concerns: JSON.stringify([
              'Defaulted to naive polling without self-correction',
              'Could not address message-delivery guarantees when probed',
            ]),
            weight: 0.35,
            source: 'interviewer',
          },
          {
            competency: 'Technical Skills',
            score: 3,
            evidence: JSON.stringify([
              'Adequate breadth for mid-level',
            ]),
            concerns: JSON.stringify([
              'Depth is lacking — advanced follow-ups exposed gaps',
              'First-principles thinking is weak',
            ]),
            weight: 0.35,
            source: 'ai',
          },
          {
            competency: 'Communication',
            score: 2,
            evidence: JSON.stringify([]),
            concerns: JSON.stringify([
              'Answers became fragmented and hesitant under follow-up questioning',
              'Struggled to articulate reasoning for design choices',
              'Reliance on filler words under pressure',
            ]),
            weight: 0.25,
            source: 'interviewer',
          },
          {
            competency: 'Communication',
            score: 2,
            evidence: JSON.stringify([]),
            concerns: JSON.stringify([
              'Communication quality inversely correlated with question difficulty',
              'Could not explain WebSockets trade-offs after being prompted to use them',
            ]),
            weight: 0.25,
            source: 'ai',
          },
          {
            competency: 'Problem Solving',
            score: 3,
            evidence: JSON.stringify([
              'Did eventually arrive at WebSockets with guidance',
            ]),
            concerns: JSON.stringify([
              'Needed multiple hints for a medium-level question',
              'Did not proactively consider edge cases',
            ]),
            weight: 0.2,
            source: 'interviewer',
          },
          {
            competency: 'Problem Solving',
            score: 2,
            evidence: JSON.stringify([]),
            concerns: JSON.stringify([
              'Problem-solving pace and independence below mid-level bar',
              'Hint-dependent pattern throughout the technical portion',
            ]),
            weight: 0.2,
            source: 'ai',
          },
          {
            competency: 'Cultural Fit',
            score: 3,
            evidence: JSON.stringify([
              'Friendly demeanor in low-pressure moments',
              'Expressed genuine interest in the product',
            ]),
            concerns: JSON.stringify([
              'Framed code review feedback as "nitpicky" and "targeting" — potential defensiveness',
            ]),
            weight: 0.2,
            source: 'interviewer',
          },
          {
            competency: 'Cultural Fit',
            score: 3,
            evidence: JSON.stringify([
              'Surface-level positivity present',
            ]),
            concerns: JSON.stringify([
              'Response to critical feedback shows potential culture risk',
            ]),
            weight: 0.2,
            source: 'ai',
          },
        ],
      },
    },
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Session 6 – Robert Taylor | Senior | No Hire | 2.1
  // ─────────────────────────────────────────────────────────────────────────────
  await prisma.interviewSession.create({
    data: {
      id: 'session-006',
      candidateName: 'Robert Taylor',
      candidateEmail: 'robert.taylor@email.com',
      candidatePhone: '+1-555-0106',
      role: 'Senior Software Engineer',
      company: 'TechCorp',
      experienceLevel: 'senior',
      interviewerName: 'Bob Smith',
      startTime: new Date(now - d(6)),
      endTime: new Date(now - d(6) + m(40)),
      duration: m(40),

      interviewerOverallScore: 2.1,
      interviewerRecommendation: 'no_hire',
      interviewerStrengths: JSON.stringify([
        '12 years of industry experience (on paper)',
        'Has shipped products to production',
      ]),
      interviewerConcerns: JSON.stringify([
        'Technical knowledge is a decade out of date — still references jQuery as primary tool',
        'No awareness of modern tooling: React, TypeScript, containerisation, CI/CD pipelines',
        'Dismissive of learning: "I don\'t see why I need to learn React"',
        'Became defensive and argumentative when technical gaps were pointed out',
        'Weak problem-solving — could not reverse a linked list with extensive hinting',
        'Culture fit is very poor — would negatively impact team morale',
      ]),

      aiOverallScore: 1.9,
      aiRecommendation: 'strong_no_hire',
      aiStrengths: JSON.stringify([
        'Tenure represents some breadth of project exposure',
      ]),
      aiConcerns: JSON.stringify([
        'Technical stack is critically outdated for a senior role',
        'Explicit resistance to learning modern tools is disqualifying',
        'Defensive and argumentative response to gap identification — culture risk',
        'Algorithm performance was below junior bar with extensive prompting',
        'Zero familiarity with current engineering best practices',
      ]),
      aiAnalysisText:
        'This candidate presents significant risks across multiple dimensions. Technically, the stack is a decade behind current practice with no apparent awareness of or interest in closing that gap. The explicit dismissal of React as unnecessary signals a learning mindset that would be difficult to work around. More concerning is the behavioral pattern: when technical gaps were surfaced, the candidate became argumentative rather than curious or reflective. The combination of outdated skills, resistance to growth, and a defensive attitude make this a clear no-hire at any level, not just senior.',

      overallScore: 2.1,
      recommendation: 'no_hire',
      strengths: JSON.stringify([
        'Significant years of industry tenure',
        'Has delivered projects to production environments',
      ]),
      concerns: JSON.stringify([
        'Technical knowledge critically outdated — jQuery as primary frontend tool',
        'No awareness of React, TypeScript, Docker, Kubernetes, CI/CD',
        'Explicitly resistant to learning: dismisses need to update skills',
        'Defensive and argumentative under technical questioning',
        'Algorithm performance below junior level',
        'Strong negative culture fit risk',
      ]),
      notes: 'Do not hire. Clear no-hire across all dimensions. Polite rejection email sufficient — no second round.',

      turns: {
        create: [
          {
            id: 'turn-006-1',
            speaker: 'interviewer',
            text: 'What is your experience with modern JavaScript frameworks?',
            timestamp: new Date(now - d(6)),
          },
          {
            id: 'turn-006-2',
            speaker: 'candidate',
            text: 'I mostly use jQuery. It handles everything I need — DOM manipulation, AJAX, animations. I\'ve heard of React but I don\'t see why I\'d need it.',
            timestamp: new Date(now - d(6) + m(2)),
          },
          {
            id: 'turn-006-3',
            speaker: 'interviewer',
            text: 'React and component-based frameworks are standard across most modern frontend work. Have you had any exposure to them?',
            timestamp: new Date(now - d(6) + m(4)),
          },
          {
            id: 'turn-006-4',
            speaker: 'candidate',
            text: 'Look, I\'ve been doing this for 12 years. jQuery worked then and it works now. If the company wants to use React that\'s fine, but I don\'t think I\'d need to change how I work.',
            timestamp: new Date(now - d(6) + m(6)),
          },
          {
            id: 'turn-006-5',
            speaker: 'interviewer',
            text: 'Let\'s try a problem. Reverse a singly-linked list in-place.',
            timestamp: new Date(now - d(6) + m(15)),
          },
          {
            id: 'turn-006-6',
            speaker: 'candidate',
            text: 'A linked list? I haven\'t used those since university. Can I use an array instead?',
            timestamp: new Date(now - d(6) + m(17)),
          },
          {
            id: 'turn-006-7',
            speaker: 'interviewer',
            text: 'The problem specifies a linked list. I can walk you through the node structure if that helps.',
            timestamp: new Date(now - d(6) + m(18)),
          },
          {
            id: 'turn-006-8',
            speaker: 'candidate',
            text: 'This feels like a trick question. Real senior engineers don\'t reverse linked lists on the job. I\'m not sure what this is testing.',
            timestamp: new Date(now - d(6) + m(20)),
          },
          {
            id: 'turn-006-9',
            speaker: 'interviewer',
            text: 'It\'s testing algorithmic thinking. Take your time — what would the first step look like?',
            timestamp: new Date(now - d(6) + m(21)),
          },
          {
            id: 'turn-006-10',
            speaker: 'candidate',
            text: 'I guess you\'d go through the list and... reverse the order somehow. I don\'t know, I\'d Google it normally.',
            timestamp: new Date(now - d(6) + m(25)),
          },
        ],
      },

      competencyRatings: {
        create: [
          {
            competency: 'System Design',
            score: 1,
            evidence: JSON.stringify([]),
            concerns: JSON.stringify([
              'No modern architecture knowledge',
              'Could not discuss scalability, containerisation, or service design',
              'Entire frame of reference is pre-2015 monolithic web development',
            ]),
            weight: 0.3,
            source: 'interviewer',
          },
          {
            competency: 'System Design',
            score: 1,
            evidence: JSON.stringify([]),
            concerns: JSON.stringify([
              'System design vocabulary is absent',
              'No awareness of distributed systems, APIs, or cloud infrastructure',
            ]),
            weight: 0.3,
            source: 'ai',
          },
          {
            competency: 'Technical Leadership',
            score: 1,
            evidence: JSON.stringify([]),
            concerns: JSON.stringify([
              'No leadership examples provided',
              'Defensive and resistant attitude would be toxic to team culture',
              'Shows no interest in mentoring or knowledge sharing',
            ]),
            weight: 0.25,
            source: 'interviewer',
          },
          {
            competency: 'Technical Leadership',
            score: 1,
            evidence: JSON.stringify([]),
            concerns: JSON.stringify([
              'No evidence of leadership or mentorship',
              'Argumentative response to feedback is disqualifying',
            ]),
            weight: 0.25,
            source: 'ai',
          },
          {
            competency: 'Code Excellence',
            score: 2,
            evidence: JSON.stringify([
              'Claims to deliver working software historically',
            ]),
            concerns: JSON.stringify([
              'No testing, no CI/CD, no modern code quality tooling',
              'jQuery-era practices do not meet current bar',
            ]),
            weight: 0.2,
            source: 'interviewer',
          },
          {
            competency: 'Code Excellence',
            score: 2,
            evidence: JSON.stringify([]),
            concerns: JSON.stringify([
              'No discussion of testing, linting, or review processes',
              'Outdated practices across the board',
            ]),
            weight: 0.2,
            source: 'ai',
          },
          {
            competency: 'Cross-functional Collaboration',
            score: 1,
            evidence: JSON.stringify([]),
            concerns: JSON.stringify([
              'Dismissive of tooling requirements — would create friction with modern team',
              'No examples of constructive cross-team collaboration',
            ]),
            weight: 0.15,
            source: 'interviewer',
          },
          {
            competency: 'Cross-functional Collaboration',
            score: 1,
            evidence: JSON.stringify([]),
            concerns: JSON.stringify([
              'Combative communication style observed throughout',
            ]),
            weight: 0.15,
            source: 'ai',
          },
          {
            competency: 'Impact & Delivery',
            score: 2,
            evidence: JSON.stringify([
              'Claims to have shipped products to production',
            ]),
            concerns: JSON.stringify([
              'No specific impact metrics or outcomes mentioned',
              'No examples of measurable business value delivered',
            ]),
            weight: 0.1,
            source: 'interviewer',
          },
          {
            competency: 'Impact & Delivery',
            score: 2,
            evidence: JSON.stringify([]),
            concerns: JSON.stringify([
              'No quantified or specific delivery evidence',
            ]),
            weight: 0.1,
            source: 'ai',
          },
        ],
      },
    },
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Session 7 – Amanda Foster | PM Senior | Strong Hire | 4.5
  // ─────────────────────────────────────────────────────────────────────────────
  await prisma.interviewSession.create({
    data: {
      id: 'session-007',
      candidateName: 'Amanda Foster',
      candidateEmail: 'amanda.foster@email.com',
      candidatePhone: '+1-555-0107',
      role: 'Product Manager',
      company: 'TechCorp',
      experienceLevel: 'senior',
      interviewerName: 'Alice Johnson',
      startTime: new Date(now - d(7)),
      endTime: new Date(now - d(7) + h(1)),
      duration: h(1),

      interviewerOverallScore: 4.5,
      interviewerRecommendation: 'strong_hire',
      interviewerStrengths: JSON.stringify([
        'Excellent product strategy with data-driven prioritisation framework',
        'Strong stakeholder management — navigated C-suite and engineering alignment stories well',
        'Clear impact ownership: 45% engagement lift, 20% churn reduction cited',
        'Very strong leadership presence and executive communication',
      ]),
      interviewerConcerns: JSON.stringify([
        'Salary expectations may be above band — confirm with recruiter',
      ]),

      aiOverallScore: 4.4,
      aiRecommendation: 'strong_hire',
      aiStrengths: JSON.stringify([
        'Product vision is clear, measurable, and business-aligned',
        'Prioritisation framework is explicit and defensible (RICE scoring mentioned)',
        'Excellent cross-functional coordination examples with engineering',
        'Strong at framing technical debt as a business risk, not just engineering concern',
      ]),
      aiConcerns: JSON.stringify([
        'Mobile app launch story dominated — would benefit from more varied examples',
        'Less depth on enterprise/B2B-specific challenges despite senior level',
      ]),
      aiAnalysisText:
        'Amanda is an outstanding PM candidate. Her product launch story was compelling and quantified, and she proactively tied every decision back to business outcomes. The RICE scoring approach to prioritisation shows a mature, defensible framework. She handled a hypothetical adversarial stakeholder scenario with impressive composure and structure. Minor note: most examples were from a B2C mobile context — worth confirming comfort with B2B enterprise sales cycles given the role.',

      overallScore: 4.5,
      recommendation: 'strong_hire',
      strengths: JSON.stringify([
        'Excellent product strategy with measurable outcomes',
        'Strong stakeholder management and executive presence',
        'Data-driven decision making with explicit prioritisation framework',
        'Compelling leadership presence',
      ]),
      concerns: JSON.stringify([
        'Examples primarily B2C — validate B2B comfort in second round',
        'Salary expectations may exceed band',
      ]),
      notes: 'Exceptional PM. Proceed to final round immediately. Flag comp expectations with recruiter.',

      turns: {
        create: [
          {
            id: 'turn-007-1',
            speaker: 'interviewer',
            text: 'Tell me about a product you launched and its impact on the business.',
            timestamp: new Date(now - d(7)),
          },
          {
            id: 'turn-007-2',
            speaker: 'candidate',
            text: 'I led the redesign of our mobile app — the previous version had a 35% drop-off in the first session. I ran a discovery sprint: 40 user interviews, heatmap analysis, and cohort data. We identified three friction points in onboarding. After redesigning those three flows and shipping in Q3, we saw a 45% increase in DAU retention and a 20% reduction in monthly churn within 90 days.',
            timestamp: new Date(now - d(7) + m(2)),
          },
          {
            id: 'turn-007-3',
            speaker: 'interviewer',
            text: 'How do you prioritize when engineering and stakeholders both have urgent competing requests?',
            timestamp: new Date(now - d(7) + m(18)),
          },
          {
            id: 'turn-007-4',
            speaker: 'candidate',
            text: 'I use RICE scoring as a shared language — Reach, Impact, Confidence, Effort — so the conversation is about the framework, not personal preferences. I bring engineering into the scoring early so they own the Effort estimates. For stakeholder alignment, I hold a bi-weekly roadmap review where every priority has a one-line business rationale. That way when priorities shift, people understand the "why" rather than feeling overruled.',
            timestamp: new Date(now - d(7) + m(20)),
          },
          {
            id: 'turn-007-5',
            speaker: 'interviewer',
            text: 'Tell me about a time you had to push back on executive leadership.',
            timestamp: new Date(now - d(7) + m(38)),
          },
          {
            id: 'turn-007-6',
            speaker: 'candidate',
            text: 'Our CRO wanted to add a paywall after the second screen of onboarding — I had data showing that users who completed onboarding had 3x LTV. I built a one-page brief comparing the short-term revenue pop versus the long-term LTV erosion and presented it as a risk analysis, not a disagreement. We agreed on a trial with a holdout group. The holdout confirmed my hypothesis and we reversed the change. The key was framing it as "here\'s what the data shows" not "here\'s what I think".',
            timestamp: new Date(now - d(7) + m(40)),
          },
        ],
      },

      competencyRatings: {
        create: [
          {
            competency: 'Product Strategy',
            score: 5,
            evidence: JSON.stringify([
              'Discovery sprint methodology: user interviews + heatmaps + cohort data',
              'Clear problem-to-metric linkage in mobile redesign story',
              'RICE scoring framework applied consistently across prioritisation',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.35,
            source: 'interviewer',
          },
          {
            competency: 'Product Strategy',
            score: 5,
            evidence: JSON.stringify([
              'Every strategy decision linked to business outcome',
              'Quantified discovery: 40 interviews, three friction points identified',
            ]),
            concerns: JSON.stringify(['Examples primarily B2C — B2B depth unverified']),
            weight: 0.35,
            source: 'ai',
          },
          {
            competency: 'Leadership',
            score: 5,
            evidence: JSON.stringify([
              'Pushed back on CRO with data-driven brief rather than opinion',
              'Bi-weekly roadmap reviews with business rationale — proactive alignment',
              'Brought engineering into RICE effort-estimation — shared ownership',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.25,
            source: 'interviewer',
          },
          {
            competency: 'Leadership',
            score: 4,
            evidence: JSON.stringify([
              'Executive influence demonstrated with paywall pushback story',
              'Proactive alignment processes reduce political friction',
            ]),
            concerns: JSON.stringify(['No examples of hiring or growing a PM team']),
            weight: 0.25,
            source: 'ai',
          },
          {
            competency: 'Execution',
            score: 4,
            evidence: JSON.stringify([
              'Delivered redesign with measurable 90-day outcomes',
              'Structured holdout experiment to validate hypothesis',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'interviewer',
          },
          {
            competency: 'Execution',
            score: 4,
            evidence: JSON.stringify([
              'Experimental mindset: holdout group, data-driven reversal',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'ai',
          },
          {
            competency: 'Communication',
            score: 5,
            evidence: JSON.stringify([
              'Executive presence throughout — clear, confident, concise',
              'Reframes disagreements as data conversations',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'interviewer',
          },
          {
            competency: 'Communication',
            score: 5,
            evidence: JSON.stringify([
              'Consistently translates product thinking into stakeholder language',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'ai',
          },
        ],
      },
    },
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Session 8 – Chris Martinez | Frontend Mid | Hire | 3.9
  // ─────────────────────────────────────────────────────────────────────────────
  await prisma.interviewSession.create({
    data: {
      id: 'session-008',
      candidateName: 'Chris Martinez',
      candidateEmail: 'chris.martinez@email.com',
      candidatePhone: '+1-555-0108',
      role: 'Frontend Engineer',
      company: 'TechCorp',
      experienceLevel: 'mid',
      interviewerName: 'Bob Smith',
      startTime: new Date(now - d(8)),
      endTime: new Date(now - d(8) + m(55)),
      duration: m(55),

      interviewerOverallScore: 3.9,
      interviewerRecommendation: 'hire',
      interviewerStrengths: JSON.stringify([
        'Strong React performance optimization instincts (profiling → memoization → code splitting)',
        'Good eye for design and UX — accessibility-first approach',
        'Performance optimization experience with measurable bundle-size reductions',
        'Collaborative, humble communication style',
      ]),
      interviewerConcerns: JSON.stringify([
        'TypeScript usage is basic — primarily type annotations, no advanced generics or utility types',
        'Testing strategy is thin — jest unit tests but no RTL or integration tests',
      ]),

      aiOverallScore: 3.8,
      aiRecommendation: 'hire',
      aiStrengths: JSON.stringify([
        'Performance optimization approach is structured and tooling-led',
        'Accessibility-first mindset is rare and valuable at mid-level',
        'Good at explaining trade-offs in memoization and re-render costs',
      ]),
      aiConcerns: JSON.stringify([
        'TypeScript depth is surface-level — would struggle with complex generic constraints',
        'No integration or E2E testing experience mentioned',
        'CSS architecture experience limited to component-level, no design-system thinking',
      ]),
      aiAnalysisText:
        'Chris is a solid mid-level frontend engineer with standout performance optimization skills. The React DevTools profiling approach was methodical and the bundle-size reduction story was well-quantified (shipped a 38% JS bundle reduction via dynamic imports). Accessibility knowledge is genuine and proactive. TypeScript gaps are real but not blockers — generics can be learned. Recommend hire with a note to assign TypeScript-heavy tasks with senior review in the first 90 days.',

      overallScore: 3.9,
      recommendation: 'hire',
      strengths: JSON.stringify([
        'Strong React performance optimization with measurable impact',
        'Accessibility-first mindset — proactive and genuine',
        'Good collaboration style with design and product teams',
        'Bundle size reduction experience with dynamic imports',
      ]),
      concerns: JSON.stringify([
        'TypeScript is basic — advanced generics and utility types unknown',
        'Testing is unit-only — no RTL, Cypress, or Playwright experience',
      ]),
      notes: 'Good mid-level frontend hire. Assign TypeScript mentor for first 90 days. Strong on performance and a11y.',

      turns: {
        create: [
          {
            id: 'turn-008-1',
            speaker: 'interviewer',
            text: 'Walk me through how you approach performance optimization in a React application.',
            timestamp: new Date(now - d(8)),
          },
          {
            id: 'turn-008-2',
            speaker: 'candidate',
            text: 'I start by measuring, not guessing. React DevTools Profiler shows me which components are re-rendering and how long they take. Once I have a flamegraph, I look at three things: unnecessary re-renders (fix with React.memo or useMemo), large bundle size (fix with dynamic imports and code splitting), and expensive computations (fix with useMemo or moving work off the main thread with a Web Worker).',
            timestamp: new Date(now - d(8) + m(2)),
          },
          {
            id: 'turn-008-3',
            speaker: 'interviewer',
            text: 'Give me a concrete example where you applied this.',
            timestamp: new Date(now - d(8) + m(8)),
          },
          {
            id: 'turn-008-4',
            speaker: 'candidate',
            text: 'Our product page was loading a 2.1 MB JavaScript bundle. Profiling showed 60% of that was from two charting libraries that were only used on the analytics tab. I converted those imports to dynamic import() calls with React.lazy. The initial bundle dropped from 2.1 MB to 1.3 MB — a 38% reduction — and the analytics tab load time was acceptable because it\'s not on the critical path.',
            timestamp: new Date(now - d(8) + m(10)),
          },
          {
            id: 'turn-008-5',
            speaker: 'interviewer',
            text: 'How do you handle accessibility in your components?',
            timestamp: new Date(now - d(8) + m(25)),
          },
          {
            id: 'turn-008-6',
            speaker: 'candidate',
            text: 'I treat it as part of the component contract, not an afterthought. Semantic HTML first. For interactive elements, I validate keyboard navigation and focus management manually. I use eslint-plugin-jsx-a11y to catch issues at write-time. For complex widgets like date pickers or modals, I reference the ARIA Authoring Practices Guide. I also do occasional VoiceOver passes, especially for anything with dynamic content.',
            timestamp: new Date(now - d(8) + m(27)),
          },
          {
            id: 'turn-008-7',
            speaker: 'interviewer',
            text: 'What is your TypeScript experience?',
            timestamp: new Date(now - d(8) + m(40)),
          },
          {
            id: 'turn-008-8',
            speaker: 'candidate',
            text: 'I use TypeScript on all my projects — interfaces, type aliases, basic generics. I\'m comfortable with union types and type guards. Where I\'m less experienced is advanced generics — conditional types, infer keyword, mapped types. I\'ve read about them but haven\'t had a production use case that required them yet.',
            timestamp: new Date(now - d(8) + m(42)),
          },
        ],
      },

      competencyRatings: {
        create: [
          {
            competency: 'Frontend Skills',
            score: 4,
            evidence: JSON.stringify([
              '38% bundle reduction via dynamic imports — well-quantified',
              'React DevTools profiling approach is methodical and professional',
              'Lazy loading applied correctly to non-critical-path features',
            ]),
            concerns: JSON.stringify(['TypeScript advanced features absent']),
            weight: 0.4,
            source: 'interviewer',
          },
          {
            competency: 'Frontend Skills',
            score: 4,
            evidence: JSON.stringify([
              'Performance optimization story is structured and evidence-based',
              'Memoization trade-offs understood at a nuanced level',
            ]),
            concerns: JSON.stringify(['TypeScript depth is surface-level']),
            weight: 0.4,
            source: 'ai',
          },
          {
            competency: 'Code Quality',
            score: 3,
            evidence: JSON.stringify([
              'eslint-plugin-jsx-a11y integrated into write-time workflow',
              'Clean component abstraction discussed',
            ]),
            concerns: JSON.stringify([
              'Testing limited to Jest unit tests',
              'No integration or E2E testing experience',
            ]),
            weight: 0.25,
            source: 'interviewer',
          },
          {
            competency: 'Code Quality',
            score: 3,
            evidence: JSON.stringify([
              'Some test awareness',
            ]),
            concerns: JSON.stringify([
              'Testing strategy is shallow for a mid-level engineer',
              'No RTL, Cypress, or Playwright mentioned',
            ]),
            weight: 0.25,
            source: 'ai',
          },
          {
            competency: 'Design Sense',
            score: 4,
            evidence: JSON.stringify([
              'Accessibility-first approach — ARIA Authoring Practices Guide reference',
              'Treats a11y as part of component contract, not an add-on',
              'VoiceOver manual testing shows genuine commitment',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'interviewer',
          },
          {
            competency: 'Design Sense',
            score: 4,
            evidence: JSON.stringify([
              'Accessibility knowledge is proactive and deeply held',
              'Semantic HTML as default shows disciplined thinking',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'ai',
          },
          {
            competency: 'Collaboration',
            score: 4,
            evidence: JSON.stringify([
              'Works constructively with design — a11y process includes design hand-offs',
              'Humble about TypeScript gaps and open about learning plan',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.15,
            source: 'interviewer',
          },
          {
            competency: 'Collaboration',
            score: 4,
            evidence: JSON.stringify([
              'Self-aware and receptive throughout the interview',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.15,
            source: 'ai',
          },
        ],
      },
    },
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Session 9 – Priya Nair | Backend Senior | Strong Hire | 4.6  (NEW)
  // ─────────────────────────────────────────────────────────────────────────────
  await prisma.interviewSession.create({
    data: {
      id: 'session-009',
      candidateName: 'Priya Nair',
      candidateEmail: 'priya.nair@email.com',
      candidatePhone: '+1-555-0109',
      role: 'Backend Engineer',
      company: 'TechCorp',
      experienceLevel: 'senior',
      interviewerName: 'Carol White',
      startTime: new Date(now - d(9)),
      endTime: new Date(now - d(9) + h(1)),
      duration: h(1),

      interviewerOverallScore: 4.6,
      interviewerRecommendation: 'strong_hire',
      interviewerStrengths: JSON.stringify([
        'Deep distributed systems knowledge — Kafka, Kubernetes, circuit breakers',
        'Exceptional debugging story with Kubernetes pod failure — very impressive',
        'Strong data consistency thinking: saga pattern, two-phase commit trade-offs',
        'Clear, concise communicator under technical pressure',
      ]),
      interviewerConcerns: JSON.stringify([
        'Frontend exposure is minimal — not a concern for this role but noted',
      ]),

      aiOverallScore: 4.6,
      aiRecommendation: 'strong_hire',
      aiStrengths: JSON.stringify([
        'Saga pattern vs. two-phase commit trade-off analysis was precise and nuanced',
        'Kafka consumer group design showed production-grade thinking',
        'Kubernetes debugging story (pod OOM kill root cause) was technically impressive',
        'Communication is structured: context → problem → solution → outcome',
      ]),
      aiConcerns: JSON.stringify([
        'No leadership examples yet — confirm if people-management track is desired',
      ]),
      aiAnalysisText:
        'Priya is an exceptional backend engineer. The distributed transactions discussion was the most sophisticated of any candidate this cycle — she correctly identified where saga is preferable to 2PC and articulated the compensating transaction pattern clearly. Her Kubernetes OOM debugging story was detailed and credible. Communication throughout was exemplary: structured and precise without being verbose. Strong hire — potentially fast-track to staff engineer consideration.',

      overallScore: 4.6,
      recommendation: 'strong_hire',
      strengths: JSON.stringify([
        'Exceptional distributed systems depth',
        'Production-grade Kubernetes and Kafka experience',
        'Nuanced data consistency reasoning',
        'Clear, structured communication',
      ]),
      concerns: JSON.stringify([
        'No people management experience — discuss career track preference',
      ]),
      notes: 'Strong hire. One of the best backend candidates this quarter. Flag for staff engineer path conversation.',

      turns: {
        create: [
          {
            id: 'turn-009-1',
            speaker: 'interviewer',
            text: 'How do you handle distributed transactions across microservices?',
            timestamp: new Date(now - d(9)),
          },
          {
            id: 'turn-009-2',
            speaker: 'candidate',
            text: 'I generally prefer the saga pattern over two-phase commit for microservices. 2PC introduces a coordinator that becomes a single point of failure and blocks resources across services during the commit phase — that kills throughput at scale. Sagas decompose the transaction into a sequence of local transactions with compensating actions for rollback. The trade-off is eventual consistency and more complex error handling, but that\'s almost always the right trade for a distributed system.',
            timestamp: new Date(now - d(9) + m(2)),
          },
          {
            id: 'turn-009-3',
            speaker: 'interviewer',
            text: 'Tell me about a production incident you diagnosed and resolved.',
            timestamp: new Date(now - d(9) + m(18)),
          },
          {
            id: 'turn-009-4',
            speaker: 'candidate',
            text: 'Our order processing service started failing randomly at ~3am daily. Kubernetes kept restarting pods but the alerts were not capturing the root cause. I looked at the resource metrics and found that memory usage was climbing linearly from service start until the pod hit the OOM limit and was killed. I profiled a running pod with pprof and found a goroutine leak — we had a Kafka consumer that was spawning a goroutine per message without ever cleaning up on context cancellation. Fix was a bounded worker pool with a WaitGroup on shutdown.',
            timestamp: new Date(now - d(9) + m(20)),
          },
          {
            id: 'turn-009-5',
            speaker: 'interviewer',
            text: 'How do you design a Kafka consumer for high-throughput, exactly-once processing?',
            timestamp: new Date(now - d(9) + m(38)),
          },
          {
            id: 'turn-009-6',
            speaker: 'candidate',
            text: 'Exactly-once in Kafka requires transactional producers on the write side and idempotent consumers on the read side. I use consumer groups with manual offset commit: process the message, write the result to the database in a transaction that also records the offset, then commit. That way the offset is only advanced if the database write succeeded. For the consumer group design, I partition by entity ID so related messages stay ordered and I can scale consumers horizontally without cross-consumer ordering issues.',
            timestamp: new Date(now - d(9) + m(40)),
          },
        ],
      },

      competencyRatings: {
        create: [
          {
            competency: 'System Design',
            score: 5,
            evidence: JSON.stringify([
              'Saga vs. 2PC trade-off articulated precisely and correctly',
              'Compensating transaction pattern explained accurately',
              'Kafka consumer group design with partition-by-entity-ID is production-grade',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.3,
            source: 'interviewer',
          },
          {
            competency: 'System Design',
            score: 5,
            evidence: JSON.stringify([
              'Distributed systems thinking is nuanced and experience-backed',
              'Exactly-once Kafka semantics explained with correct offset management detail',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.3,
            source: 'ai',
          },
          {
            competency: 'Technical Leadership',
            score: 4,
            evidence: JSON.stringify([
              'Led incident resolution independently',
              'Proactive in improving monitoring (added pprof profiling as standard practice after the incident)',
            ]),
            concerns: JSON.stringify([
              'No direct people-management examples provided',
            ]),
            weight: 0.25,
            source: 'interviewer',
          },
          {
            competency: 'Technical Leadership',
            score: 4,
            evidence: JSON.stringify([
              'Incident ownership and post-incident improvement mindset',
            ]),
            concerns: JSON.stringify(['Leadership scope appears individual rather than team level']),
            weight: 0.25,
            source: 'ai',
          },
          {
            competency: 'Code Excellence',
            score: 5,
            evidence: JSON.stringify([
              'Root-caused goroutine leak via profiling — not guessing',
              'Fix used proper concurrency primitives (bounded pool, WaitGroup)',
              'Context cancellation handling done correctly',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'interviewer',
          },
          {
            competency: 'Code Excellence',
            score: 5,
            evidence: JSON.stringify([
              'Profiling-first debugging approach',
              'Concurrency fix uses correct Go primitives — not a workaround',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'ai',
          },
          {
            competency: 'Cross-functional Collaboration',
            score: 4,
            evidence: JSON.stringify([
              'Incident story included proactive communication to on-call team',
              'Post-mortem documentation written and shared',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.15,
            source: 'interviewer',
          },
          {
            competency: 'Cross-functional Collaboration',
            score: 4,
            evidence: JSON.stringify([
              'Post-mortem culture indicates team transparency',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.15,
            source: 'ai',
          },
          {
            competency: 'Impact & Delivery',
            score: 5,
            evidence: JSON.stringify([
              'Resolved critical production incident within 6 hours of root cause identification',
              'Zero further OOM kills after fix deployed',
              'Goroutine pool pattern now adopted across team services',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.1,
            source: 'interviewer',
          },
          {
            competency: 'Impact & Delivery',
            score: 5,
            evidence: JSON.stringify([
              'Measurable production impact: zero recurrence, pattern adopted broadly',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.1,
            source: 'ai',
          },
        ],
      },
    },
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Session 10 – Marcus Webb | Data Engineer Mid | Maybe | 3.1  (NEW)
  // ─────────────────────────────────────────────────────────────────────────────
  await prisma.interviewSession.create({
    data: {
      id: 'session-010',
      candidateName: 'Marcus Webb',
      candidateEmail: 'marcus.webb@email.com',
      candidatePhone: '+1-555-0110',
      role: 'Data Engineer',
      company: 'TechCorp',
      experienceLevel: 'mid',
      interviewerName: 'Carol White',
      startTime: new Date(now - d(10)),
      endTime: new Date(now - d(10) + m(50)),
      duration: m(50),

      interviewerOverallScore: 3.1,
      interviewerRecommendation: 'maybe',
      interviewerStrengths: JSON.stringify([
        'Solid SQL and basic Python ETL experience',
        'Airflow DAG authoring knowledge is functional',
        'Enthusiastic about data quality — introduced Great Expectations at last role',
      ]),
      interviewerConcerns: JSON.stringify([
        'Data modeling is weak — confused star schema with snowflake schema definitions',
        'Spark experience is tutorial-level, not production',
        'Schema evolution question exposed a significant gap — no awareness of Avro or Protobuf',
        'Pipeline reliability story lacked depth — no retry logic or alerting discussion',
      ]),

      aiOverallScore: 3.0,
      aiRecommendation: 'maybe',
      aiStrengths: JSON.stringify([
        'SQL proficiency is genuine and strong',
        'Data quality tooling initiative (Great Expectations) shows good instincts',
        'Airflow task dependency graph understanding is correct',
      ]),
      aiConcerns: JSON.stringify([
        'Data modeling fundamentals have notable gaps',
        'Spark and large-scale processing is not production-ready',
        'Schema evolution is a significant blind spot for a data engineering role',
        'Pipeline reliability thinking is too shallow for mid-level',
      ]),
      aiAnalysisText:
        'Marcus shows solid fundamentals in SQL and Airflow but has meaningful gaps in the areas most critical for a data engineering role at mid-level: data modeling and schema evolution. The star vs. snowflake confusion was a red flag. Spark experience appears to be self-taught from documentation rather than production use. The Great Expectations initiative is a green flag for initiative, but it does not compensate for architectural gaps. Recommend maybe — could pass if competing candidates are weak, but do not prioritise.',

      overallScore: 3.1,
      recommendation: 'maybe',
      strengths: JSON.stringify([
        'Strong SQL proficiency',
        'Functional Airflow DAG authoring',
        'Proactive data quality initiative',
      ]),
      concerns: JSON.stringify([
        'Data modeling fundamentals are shaky — star vs. snowflake confused',
        'Spark is tutorial-level, not production',
        'Schema evolution is a significant blind spot',
        'Pipeline reliability and alerting thinking is shallow',
      ]),
      notes: 'Borderline. Do not prioritise over stronger candidates. Only proceed if pipeline is thin.',

      turns: {
        create: [
          {
            id: 'turn-010-1',
            speaker: 'interviewer',
            text: 'Walk me through how you would design a data pipeline for a real-time dashboard.',
            timestamp: new Date(now - d(10)),
          },
          {
            id: 'turn-010-2',
            speaker: 'candidate',
            text: 'I\'d use Airflow to orchestrate the pipeline. Data would come from our application database via a JDBC connector, get transformed in Python, and land in a data warehouse like Snowflake. For real-time we could use... maybe a cron every minute?',
            timestamp: new Date(now - d(10) + m(2)),
          },
          {
            id: 'turn-010-3',
            speaker: 'interviewer',
            text: 'For true real-time requirements, what alternatives to Airflow would you consider?',
            timestamp: new Date(now - d(10) + m(5)),
          },
          {
            id: 'turn-010-4',
            speaker: 'candidate',
            text: 'Kafka maybe? I\'ve heard it\'s used for streaming. And Spark Streaming. I haven\'t used those in production but I\'ve read about them.',
            timestamp: new Date(now - d(10) + m(7)),
          },
          {
            id: 'turn-010-5',
            speaker: 'interviewer',
            text: 'Describe the difference between a star schema and a snowflake schema.',
            timestamp: new Date(now - d(10) + m(20)),
          },
          {
            id: 'turn-010-6',
            speaker: 'candidate',
            text: 'A star schema is when... you have a central fact table and dimension tables around it. A snowflake schema is similar but more normalized — the dimensions are... also split into smaller tables. I think snowflake is better because it\'s more normalized?',
            timestamp: new Date(now - d(10) + m(22)),
          },
          {
            id: 'turn-010-7',
            speaker: 'interviewer',
            text: 'How do you handle schema changes in a data warehouse without breaking downstream consumers?',
            timestamp: new Date(now - d(10) + m(35)),
          },
          {
            id: 'turn-010-8',
            speaker: 'candidate',
            text: 'That\'s a good question. I would probably... version the tables? Like keep the old table and create a new one with a v2 suffix. I\'m not sure of a better approach.',
            timestamp: new Date(now - d(10) + m(37)),
          },
        ],
      },

      competencyRatings: {
        create: [
          {
            competency: 'Data Engineering',
            score: 3,
            evidence: JSON.stringify([
              'Airflow DAG and task dependency understanding is correct',
              'Python ETL scripting experience is real',
              'SQL skills are strong — validated in separate screen',
            ]),
            concerns: JSON.stringify([
              'Real-time pipeline design defaulted to batch with a short cron',
              'Spark is self-taught/tutorial level only',
            ]),
            weight: 0.35,
            source: 'interviewer',
          },
          {
            competency: 'Data Engineering',
            score: 3,
            evidence: JSON.stringify([
              'Foundational batch pipeline knowledge is present',
              'Good SQL instincts',
            ]),
            concerns: JSON.stringify([
              'Streaming architecture knowledge is conceptual only',
              'Production Spark experience absent',
            ]),
            weight: 0.35,
            source: 'ai',
          },
          {
            competency: 'Data Modeling',
            score: 2,
            evidence: JSON.stringify([
              'Knows star schema definition at a basic level',
            ]),
            concerns: JSON.stringify([
              'Star vs. snowflake distinction was confused and oversimplified',
              'No discussion of slowly changing dimensions, grain, or surrogate keys',
              'Schema evolution answer revealed no knowledge of serialization formats',
            ]),
            weight: 0.3,
            source: 'interviewer',
          },
          {
            competency: 'Data Modeling',
            score: 2,
            evidence: JSON.stringify([]),
            concerns: JSON.stringify([
              'Data modeling fundamentals are below mid-level bar',
              'Schema evolution is a significant gap for this role',
            ]),
            weight: 0.3,
            source: 'ai',
          },
          {
            competency: 'Data Quality',
            score: 4,
            evidence: JSON.stringify([
              'Introduced Great Expectations framework at previous role',
              'Understands importance of data contracts',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'interviewer',
          },
          {
            competency: 'Data Quality',
            score: 4,
            evidence: JSON.stringify([
              'Great Expectations initiative shows proactive quality mindset',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.2,
            source: 'ai',
          },
          {
            competency: 'Communication',
            score: 3,
            evidence: JSON.stringify([
              'Generally clear when discussing familiar topics',
            ]),
            concerns: JSON.stringify([
              'Answers became vague and hedged when outside comfort zone',
            ]),
            weight: 0.15,
            source: 'interviewer',
          },
          {
            competency: 'Communication',
            score: 3,
            evidence: JSON.stringify([
              'Communication quality varies with topic familiarity',
            ]),
            concerns: JSON.stringify([]),
            weight: 0.15,
            source: 'ai',
          },
        ],
      },
    },
  });

  console.log('✅ Created 10 interview sessions');

  // ─────────────────────────────────────────────────────────────────────────────
  // Session Notes
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('📝 Creating session notes...');

  const notesData = [
    // session-001
    { sessionId: 'session-001', content: 'Exceptional system design depth — best of the cohort so far', type: 'highlight', ts: now - d(1) + m(30) },
    { sessionId: 'session-001', content: 'Great cultural fit — collaborative mindset, mentoring philosophy is thoughtful', type: 'note', ts: now - d(1) + m(40) },
    { sessionId: 'session-001', content: 'Fast-track offer — do not let this candidate wait more than 48h', type: 'flag', ts: now - d(1) + m(58) },
    // session-002
    { sessionId: 'session-002', content: 'Verify distributed systems experience with a follow-up technical screen', type: 'flag', ts: now - d(2) + m(25) },
    { sessionId: 'session-002', content: 'Token bucket rate limiter answer was solid — good Redis knowledge', type: 'highlight', ts: now - d(2) + m(17) },
    // session-003
    { sessionId: 'session-003', content: 'Custom useIntersectionObserver hook example was well-thought-out', type: 'highlight', ts: now - d(3) + m(20) },
    { sessionId: 'session-003', content: 'Push on integration/E2E testing in onboarding — she is aware of the gap', type: 'note', ts: now - d(3) + m(47) },
    // session-004
    { sessionId: 'session-004', content: 'Closure explanation included memory-leak gotcha — unusual depth for a junior', type: 'highlight', ts: now - d(4) + m(14) },
    { sessionId: 'session-004', content: 'Follows TC39 proposals — unusually proactive learner', type: 'highlight', ts: now - d(4) + m(41) },
    // session-005
    { sessionId: 'session-005', content: 'Communication broke down under follow-up — frustration response is a concern', type: 'flag', ts: now - d(5) + m(43) },
    { sessionId: 'session-005', content: 'Framed code review feedback as "targeting" — cultural risk, discuss with panel', type: 'flag', ts: now - d(5) + m(50) },
    // session-006
    { sessionId: 'session-006', content: 'jQuery as primary tool — technically disqualifying for this role level', type: 'flag', ts: now - d(6) + m(8) },
    { sessionId: 'session-006', content: 'Became argumentative during linked-list question — strong no-hire', type: 'flag', ts: now - d(6) + m(28) },
    // session-007
    { sessionId: 'session-007', content: 'RICE scoring used as a shared language across stakeholders — mature PM practice', type: 'highlight', ts: now - d(7) + m(22) },
    { sessionId: 'session-007', content: 'Paywall pushback story is excellent — data-led, not opinion-led', type: 'highlight', ts: now - d(7) + m(42) },
    { sessionId: 'session-007', content: 'Comp expectations may be above band — flag for recruiter before next step', type: 'flag', ts: now - d(7) + m(58) },
    // session-008
    { sessionId: 'session-008', content: '38% bundle reduction with dynamic imports — well-quantified impact', type: 'highlight', ts: now - d(8) + m(11) },
    { sessionId: 'session-008', content: 'Assign TypeScript mentor in first 90 days — self-aware about the gap', type: 'note', ts: now - d(8) + m(53) },
    // session-009
    { sessionId: 'session-009', content: 'Saga vs 2PC trade-off analysis was the most sophisticated this cycle', type: 'highlight', ts: now - d(9) + m(5) },
    { sessionId: 'session-009', content: 'Goroutine leak diagnosis via pprof profiling is impressive — this is senior-plus level', type: 'highlight', ts: now - d(9) + m(22) },
    { sessionId: 'session-009', content: 'Discuss staff engineer track — this candidate may be over-levelled for IC4', type: 'note', ts: now - d(9) + m(58) },
    // session-010
    { sessionId: 'session-010', content: 'Star vs snowflake schema confusion is a red flag for a data engineering role', type: 'flag', ts: now - d(10) + m(24) },
    { sessionId: 'session-010', content: 'Great Expectations initiative shows good data quality instincts — bright spot', type: 'highlight', ts: now - d(10) + m(10) },
];

  for (const n of notesData) {
    await prisma.sessionNote.create({
      data: { sessionId: n.sessionId, content: n.content, type: n.type, timestamp: new Date(n.ts) },
    });
  }

  console.log(`✅ Created ${notesData.length} session notes`);

  // ─────────────────────────────────────────────────────────────────────────────
  // Session Feedback
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('💬 Creating session feedback...');

  const feedbackData = [
    { sessionId: 'session-001', feedbackType: 'question_helpful', rating: 5, comment: 'URL shortener question was perfect depth for a senior system design assessment' },
    { sessionId: 'session-001', feedbackType: 'rating_accurate', rating: 5, comment: 'AI and interviewer scores aligned closely — good calibration' },
    { sessionId: 'session-001', feedbackType: 'suggestion_useful', rating: 5, comment: 'Follow-up prompt about collision handling surfaced important depth' },
    { sessionId: 'session-002', feedbackType: 'question_helpful', rating: 4, comment: 'Good questions but could probe distributed systems more in the rate limiter follow-up' },
    { sessionId: 'session-002', feedbackType: 'rating_accurate', rating: 4, comment: 'AI score was slightly lower than interviewer — reasonable given distributed systems gap' },
    { sessionId: 'session-003', feedbackType: 'question_helpful', rating: 5, comment: 'Multi-step form question surfaced real architectural thinking' },
    { sessionId: 'session-003', feedbackType: 'suggestion_useful', rating: 4, comment: 'Testing follow-up was the right call — exposed a real gap' },
    { sessionId: 'session-004', feedbackType: 'question_helpful', rating: 5, comment: 'Closure question with the loop gotcha was exactly the right bar for junior' },
    { sessionId: 'session-004', feedbackType: 'rating_accurate', rating: 5, comment: 'Strong hire is the right call — AI and human agreed' },
    { sessionId: 'session-005', feedbackType: 'rating_accurate', rating: 3, comment: 'Maybe is probably right but I wanted to push on culture fit more — could be a no-hire' },
    { sessionId: 'session-005', feedbackType: 'question_helpful', rating: 3, comment: 'Notification system design was good but behavioral question caught more signal' },
    { sessionId: 'session-006', feedbackType: 'question_helpful', rating: 5, comment: 'Modern frameworks question identified the core problem immediately — efficient screen' },
    { sessionId: 'session-006', feedbackType: 'rating_accurate', rating: 5, comment: 'No hire is clear and unanimous. AI flagged strong_no_hire which is probably more accurate.' },
    { sessionId: 'session-007', feedbackType: 'question_helpful', rating: 5, comment: 'Executive pushback scenario was the most revealing question of the session' },
    { sessionId: 'session-007', feedbackType: 'suggestion_useful', rating: 4, comment: 'B2B gap noted in AI analysis — good catch, need to probe this in final round' },
    { sessionId: 'session-008', feedbackType: 'question_helpful', rating: 5, comment: 'Bundle size question surfaced the best technical example of the session' },
    { sessionId: 'session-008', feedbackType: 'rating_accurate', rating: 4, comment: 'AI testing concern is valid — agreed this needs attention in onboarding' },
    { sessionId: 'session-009', feedbackType: 'question_helpful', rating: 5, comment: 'Distributed transactions question was calibrated perfectly — got real signal immediately' },
    { sessionId: 'session-009', feedbackType: 'rating_accurate', rating: 5, comment: 'Both scores at 4.6 — rare alignment. This is a clear strong hire.' },
    { sessionId: 'session-009', feedbackType: 'suggestion_useful', rating: 5, comment: 'Staff engineer suggestion from AI was a useful nudge — will raise with hiring manager' },
    { sessionId: 'session-010', feedbackType: 'question_helpful', rating: 4, comment: 'Data modeling question was the right choice — exposed the core gap quickly' },
    { sessionId: 'session-010', feedbackType: 'rating_accurate', rating: 4, comment: 'Maybe is right — would not prioritise but could revisit if pipeline is empty' },
  ];

  for (const f of feedbackData) {
    await prisma.sessionFeedback.create({
      data: { sessionId: f.sessionId, feedbackType: f.feedbackType, rating: f.rating, comment: f.comment ?? null },
    });
  }

  console.log(`✅ Created ${feedbackData.length} feedback entries`);

  // ─────────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log('   Templates : 6');
  console.log('   Matrices  : 6');
  console.log('   Sessions  : 11');
  console.log(`   Notes     : ${notesData.length}`);
  console.log(`   Feedback  : ${feedbackData.length}`);
  console.log('\n🗂  Session roster:');
  console.log('   session-001  Sarah Chen       Senior SWE     strong_hire   4.7 ⭐');
  console.log('   session-002  Michael Rodriguez Senior SWE     hire          4.1');
  console.log('   session-003  Emily Watson      Frontend Mid   hire          3.8');
  console.log('   session-004  David Kim         Junior SWE     strong_hire   4.2 ⭐');
  console.log('   session-005  Jennifer Lee      Mid SWE        maybe         3.2');
  console.log('   session-006  Robert Taylor     Senior SWE     no_hire       2.1 ❌');
  console.log('   session-007  Amanda Foster     Senior PM      strong_hire   4.5 ⭐');
  console.log('   session-008  Chris Martinez    Frontend Mid   hire          3.9');
  console.log('   session-009  Priya Nair        Backend Senior strong_hire   4.6 ⭐  [NEW]');
  console.log('   session-010  Marcus Webb       Data Eng Mid   maybe         3.1      [NEW]');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });