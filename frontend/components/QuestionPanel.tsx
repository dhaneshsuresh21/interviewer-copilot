'use client';

import { useInterviewStore } from '@/lib/store';
import { MessageSquare, Copy, Check, ArrowRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { StreamingPanel } from './StreamingPanel';

export function QuestionPanel() {
  const { questionsText, isGeneratingQuestions, setCurrentQuestion } = useInterviewStore();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyQuestion = (question: string, index: number) => {
    navigator.clipboard.writeText(question);
    setCurrentQuestion(question);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const questions = useMemo(() => {
    if (!questionsText) return [];
    
    const lines = questionsText.split('\n').filter(line => line.trim());
    const parsed: string[] = [];
    
    for (const line of lines) {
      const cleaned = line.replace(/^(\d+[\.)]\s*|[-*•]\s*|Question\s*\d*:\s*)/i, '').trim();
      if (cleaned.length > 10 && (cleaned.includes('?') || /^(what|how|why|when|where|who|can|could|would|tell|describe|explain)/i.test(cleaned))) {
        parsed.push(cleaned);
      }
    }
    
    return parsed.length > 0 ? parsed : (questionsText.trim() ? [questionsText] : []);
  }, [questionsText]);

  const difficultyColors = ['bg-green-500/20 text-green-400', 'bg-yellow-500/20 text-yellow-400', 'bg-red-500/20 text-red-400'];
  const difficultyLabels = ['Basic', 'Intermediate', 'Advanced'];

  return (
    <StreamingPanel
      icon={MessageSquare}
      title="Follow-up Questions"
      iconColor="text-blue-400"
      accentColor="blue"
      isLoading={isGeneratingQuestions}
      content={questionsText}
      emptyMessage="Suggested questions will appear here"
    >
      <div className="space-y-3">
        {questions.map((question, index) => (
          <div
            key={index}
            onClick={() => handleCopyQuestion(question, index)}
            className="group relative p-4 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-lg border border-gray-600/50 hover:border-blue-500/50 hover:from-blue-900/20 hover:to-gray-800/50 transition-all duration-200 cursor-pointer"
          >
            {/* Question number badge */}
            <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-400">{index + 1}</span>
            </div>
            
            <div className="flex items-start gap-3">
              <p className="text-sm text-gray-200 flex-1 leading-relaxed pr-8">{question}</p>
              
              {/* Copy indicator */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                {copiedIndex === index ? (
                  <div className="flex items-center gap-1 text-green-400">
                    <Check className="w-4 h-4" />
                    <span className="text-xs">Copied!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-blue-400">
                    <Copy className="w-4 h-4" />
                    <span className="text-xs">Click to use</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Difficulty indicator */}
            <div className="mt-3 flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColors[index % 3]}`}>
                {difficultyLabels[index % 3]}
              </span>
              <ArrowRight className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}
        
        {questions.length === 0 && !isGeneratingQuestions && questionsText && (
          <div className="p-4 bg-gray-700/30 rounded-lg">
            <p className="text-sm text-gray-300">{questionsText}</p>
          </div>
        )}
      </div>
    </StreamingPanel>
  );
}
