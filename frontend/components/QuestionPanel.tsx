'use client';

import { useInterviewStore } from '@/lib/store';
import { MessageSquare, Copy, Check, ArrowRight, Sparkles, Lightbulb } from 'lucide-react';
import { useState, useMemo } from 'react';
import { StreamingPanel } from './StreamingPanel';
import type { NextQuestionResponse } from '@/lib/types';


export function QuestionPanel() {
  const {
    questionsText,
    isGeneratingQuestions,
    nextQuestionText,
    isGeneratingNextQuestion,
    setCurrentQuestion,
  } = useInterviewStore();

  const [copied, setCopied] = useState(false);
  const [copiedLegacy, setCopiedLegacy] = useState<number | null>(null);

  // Parse structured next question JSON
  const nextQuestion: NextQuestionResponse | null = useMemo(() => {
    if (!nextQuestionText) return null;
    try {
      const cleaned = nextQuestionText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      return JSON.parse(cleaned) as NextQuestionResponse;
    } catch {
      return null;
    }
  }, [nextQuestionText]);

  const handleCopyNext = () => {
    if (!nextQuestion) return;
    navigator.clipboard.writeText(nextQuestion.question);
    setCurrentQuestion(nextQuestion.question);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Legacy follow-up questions parsing
  const legacyQuestions = useMemo(() => {
    if (!questionsText) return [];
    const lines = questionsText.split('\n').filter(line => line.trim());
    const parsed: string[] = [];
    for (const line of lines) {
      const cleaned = line.replace(/^(\d+[\.)]\s*|[-*\u2022]\s*|Question\s*\d*:\s*)/i, '').trim();
      if (cleaned.length > 10 && (cleaned.includes('?') || /^(what|how|why|when|where|who|can|could|would|tell|describe|explain)/i.test(cleaned))) {
        parsed.push(cleaned);
      }
    }
    return parsed.length > 0 ? parsed : (questionsText.trim() ? [questionsText] : []);
  }, [questionsText]);

  const handleCopyLegacy = (question: string, index: number) => {
    navigator.clipboard.writeText(question);
    setCurrentQuestion(question);
    setCopiedLegacy(index);
    setTimeout(() => setCopiedLegacy(null), 2000);
  };

  const isLoading = isGeneratingNextQuestion || isGeneratingQuestions;
  const hasContent = !!nextQuestionText || !!questionsText;

  return (
    <StreamingPanel
      icon={MessageSquare}
      title="Next Question"
      iconColor="text-blue-400"
      accentColor="blue"
      isLoading={isLoading}
      content={hasContent ? ' ' : ''}
      emptyMessage="The AI Co-Pilot will suggest the next best question here"
    >
      <div className="space-y-4">
        {/* Structured Next Question (primary) */}
        {(nextQuestion || isGeneratingNextQuestion) && (
          <div
            onClick={handleCopyNext}
            className="group relative p-4 bg-gradient-to-br from-blue-900/30 to-purple-900/20 rounded-xl border border-blue-500/30 hover:border-blue-400/50 transition-all duration-200 cursor-pointer shadow-lg shadow-blue-500/5"
          >
            {/* Stage + Sparkle badge */}
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                AI Suggested
              </span>
            </div>

            {isGeneratingNextQuestion && !nextQuestion ? (
              <div className="flex items-center gap-2 py-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-sm text-gray-400 ml-2">Generating next question...</span>
              </div>
            ) : nextQuestion ? (
              <>
                <p className="text-base text-white font-medium leading-relaxed pr-8">
                  {nextQuestion.question}
                </p>

                {/* Topic badge */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/20">
                    {nextQuestion.topic}
                  </span>
                </div>

                {/* Rationale */}
                {nextQuestion.rationale && (
                  <p className="mt-2 text-xs text-gray-400 italic">
                    {nextQuestion.rationale}
                  </p>
                )}

                {/* Follow-up hint */}
                {nextQuestion.followUpHint && (
                  <div className="mt-3 flex items-start gap-2 p-2 bg-gray-800/60 rounded-lg">
                    <Lightbulb className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-400">
                      <span className="text-yellow-400/80 font-medium">If they struggle: </span>
                      {nextQuestion.followUpHint}
                    </p>
                  </div>
                )}

                {/* Copy indicator */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  {copied ? (
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
              </>
            ) : null}
          </div>
        )}

        {/* Legacy follow-up questions (secondary, below the main suggestion) */}
        {legacyQuestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
              Follow-up Alternatives
            </p>
            {legacyQuestions.map((question, index) => (
              <div
                key={index}
                onClick={() => handleCopyLegacy(question, index)}
                className="group relative p-3 bg-gray-700/30 rounded-lg border border-gray-600/30 hover:border-gray-500/50 hover:bg-gray-700/50 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-gray-500 mt-0.5 shrink-0">{index + 1}.</span>
                  <p className="text-sm text-gray-300 flex-1 leading-relaxed">{question}</p>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {copiedLegacy === index ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-gray-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state when no structured next question and no streaming text */}
        {!nextQuestion && !isGeneratingNextQuestion && legacyQuestions.length === 0 && !isGeneratingQuestions && (
          <div className="text-center py-6">
            <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              The AI Co-Pilot will suggest the next best question after each analysis
            </p>
          </div>
        )}
      </div>
    </StreamingPanel>
  );
}
