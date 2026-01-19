# Interviewer Assistant 🎯

AI-powered interview assistant that helps interviewers conduct better interviews through real-time transcription, intelligent response analysis, contextual question suggestions, and AI-assisted rating.

## 🚀 Quick Start

**Get running in 5 minutes:**

```bash
# 1. Install dependencies
npm run install:all

# 2. Configure API keys
cd backend && cp .env.example .env
# Edit .env with your Deepgram and OpenAI keys

cd ../frontend && cp .env.local.example .env.local

# 3. Start the application
cd .. && npm run dev

# 4. Open http://localhost:3000
```

**Need detailed instructions?** See [QUICKSTART.md](QUICKSTART.md)

## ✨ Key Features

### 🎤 Real-time Transcription
- Speaker diarization (automatic separation of interviewer and candidate)
- Live transcript with timestamps
- High accuracy with Deepgram nova-3

### 🧠 AI Response Analysis
- **Clarity Score**: How well the candidate communicated
- **Depth Score**: Level of detail and insight
- **Technical Accuracy**: Correctness of technical content
- **Red Flags**: Evasiveness, errors, knowledge gaps
- **Strengths**: Good examples, clear thinking, relevant experience

### 💡 Question Suggestions
- Contextual follow-up questions based on conversation flow
- Questions targeting uncovered competencies
- Difficulty levels (basic/intermediate/advanced)
- Rationale and expected answer elements

### ⭐ AI-Assisted Rating
- Suggested ratings (1-5 scale) with justification
- Manual override capability
- Optional notes per rating
- Comparison to expected level

## 📋 Requirements

### API Keys (Required)
1. **Deepgram**: https://console.deepgram.com/signup (Free tier: 45,000 minutes)
2. **OpenAI**: https://platform.openai.com/api-keys (Pay-as-you-go)

### System Requirements
- Node.js 18+
- Modern browser (Chrome/Edge recommended)
- Microphone access

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get running in 5 minutes
- **[SETUP.md](SETUP.md)** - Detailed setup and troubleshooting
- **[FEATURES.md](FEATURES.md)** - Complete feature list and use cases
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Code organization
- **[SUMMARY.md](SUMMARY.md)** - Project overview and design decisions
- **[ARCHITECTURE_INTERVIEWER.md](../ARCHITECTURE_INTERVIEWER.md)** - Technical architecture

## 🎯 How It Works

1. **Setup Interview**: Configure candidate info, role, and required skills
2. **Start Recording**: Real-time transcription with speaker separation
3. **Ask Questions**: Speak naturally, AI transcribes everything
4. **Analyze Responses**: Click "Analyze" after candidate answers
5. **Review Insights**: See quality scores, red flags, and strengths
6. **Get Suggestions**: AI recommends contextual follow-up questions
7. **Rate Answers**: Review AI rating suggestion and adjust if needed
8. **End Interview**: Get comprehensive summary report

## 🏗️ Technology Stack

- **Frontend**: Next.js 14, React 18, Zustand, Tailwind CSS
- **Backend**: Express, Socket.IO, LangChain
- **STT**: Deepgram (speaker diarization)
- **LLM**: OpenAI GPT-4 or Google Gemini
- **Real-time**: WebSocket + Socket.IO streaming

## 📁 Project Structure

```
interviewer-app/
├── backend/              # Express + Socket.IO server
│   ├── src/
│   │   ├── services/    # LangChain AI integration
│   │   ├── socket/      # Real-time handlers
│   │   └── routes/      # REST endpoints
│   └── .env             # API keys (create this)
│
└── frontend/            # Next.js React app
    ├── components/      # UI components
    ├── lib/
    │   ├── hooks/       # Deepgram & Socket.IO hooks
    │   └── store.ts     # Zustand state management
    └── .env.local       # API URL (create this)
```

## 🎬 Usage Example

```typescript
// 1. Setup interview
{
  candidateName: "John Doe",
  role: "Senior Software Engineer",
  company: "Acme Corp",
  experienceLevel: "senior",
  requiredSkills: ["React", "TypeScript", "System Design"]
}

// 2. Start recording and ask questions
// 3. After candidate responds, click "Analyze Response"

// 4. Get AI analysis:
{
  clarityScore: 4,
  depthScore: 5,
  technicalAccuracyScore: 4,
  redFlags: [],
  strengths: [
    "Provided concrete example from previous project",
    "Demonstrated deep understanding of React hooks",
    "Clear explanation of trade-offs"
  ]
}

// 5. Get question suggestions:
[
  {
    question: "Can you walk me through how you optimized that component's performance?",
    rationale: "Candidate mentioned performance optimization, probe deeper",
    difficulty: "advanced",
    targetCompetency: "React Performance"
  }
]

// 6. Get rating suggestion:
{
  score: 4,
  justification: "Strong technical knowledge with practical experience",
  keyPoints: ["Good examples", "Clear communication", "Deep understanding"]
}
```

## 🔧 Configuration

### Backend (.env)
```env
PORT=3001
DEEPGRAM_API_KEY=your_deepgram_key
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_key_optional
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🐛 Troubleshooting

### Microphone not working
- Check browser permissions (allow microphone access)
- Use HTTPS or localhost
- Try Chrome or Edge

### Deepgram connection failed
- Verify `DEEPGRAM_API_KEY` in `backend/.env`
- Check Deepgram account credits
- Restart backend server

### AI analysis not working
- Verify `OPENAI_API_KEY` in `backend/.env`
- Check OpenAI account credits
- Review backend console for errors

**More help:** See [SETUP.md](SETUP.md) troubleshooting section

## 💰 Costs (Approximate)

- **Deepgram**: $0.0043/minute (~$0.26 for 1-hour interview)
- **OpenAI GPT-4**: ~$0.10-0.30 per analysis
- **Total**: ~$2-5 per 1-hour interview

## 🚀 Production Deployment

### Backend
```bash
npm run build
npm start
```

### Frontend
```bash
npm run build
# Deploy to Vercel, Netlify, or your hosting service
```

Set production environment variables and update CORS settings.

## 🤝 Contributing

Contributions welcome! Please:
- Report issues with reproduction steps
- Suggest features with use cases
- Submit PRs with tests and documentation

## 📄 License

Demonstration project - modify and use as needed.

## 🙏 Credits

Built with Next.js, Deepgram, LangChain, OpenAI, Socket.IO, Zustand, and Tailwind CSS.

---

**Ready to start?** → [QUICKSTART.md](QUICKSTART.md)
