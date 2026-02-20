'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useInterviewStore } from '@/lib/store';
import { useCopilotEngine } from '@/lib/hooks/useCopilotEngine';
import { useSocketAnalysis } from '@/lib/hooks/useSocketAnalysis';
import { AnalysisPanel } from './AnalysisPanel';
import { QuestionPanel } from './QuestionPanel';
import { RatingPanel } from './RatingPanel';
import NotesPanel from './NotesPanel';
import { Mic, MicOff, Square, Zap, Radio, Wifi, WifiOff, User, Briefcase, X, MessageSquare, AudioLines } from 'lucide-react';

export function InterviewScreen() {
  const {
    interviewContext,
    currentQuestion,
    currentAnswer,
    interimText,
    isAnalyzing,
    isGeneratingQuestions,
    isGeneratingRating,
    setInterviewEndTime, // FIX: Add end time setter
  } = useInterviewStore();

  const { isConnected: socketConnected } = useSocketAnalysis();

  const {
    isConnected: deepgramConnected,
    startMicrophone,
    stopMicrophone,
    triggerAnalysis,
    clearAnswer,
    canStartAnalysis,
    endInterview,
    getCurrentState,
  } = useCopilotEngine();

  const [isMicActive, setIsMicActive] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [fsmState, setFsmState] = useState('IDLE');
  
  // Refs for auto-scroll - use span inside div for proper width measurement
  const questionContainerRef = useRef<HTMLDivElement>(null);
  const answerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setFsmState(getCurrentState());
    }, 300);
    return () => clearInterval(interval);
  }, [getCurrentState]);

  // FIX: Proper auto-scroll using setTimeout to ensure DOM is updated
  const scrollToEnd = useCallback((containerRef: React.RefObject<HTMLDivElement>) => {
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollLeft = containerRef.current.scrollWidth;
      }
    }, 0);
  }, []);

  // Auto-scroll question
  useEffect(() => {
    scrollToEnd(questionContainerRef);
  }, [currentQuestion, scrollToEnd]);

  // Auto-scroll answer - also scroll when interim text changes for real-time feel
  useEffect(() => {
    scrollToEnd(answerContainerRef);
  }, [currentAnswer, interimText, scrollToEnd]);

  // FIX: Sync mic state with deepgram connection - if disconnected, mic should be off
  useEffect(() => {
    if (!deepgramConnected && isMicActive) {
      setIsMicActive(false);
    }
  }, [deepgramConnected, isMicActive]);

  const handleToggleMic = async () => {
    if (isMicActive) {
      stopMicrophone();
      setIsMicActive(false);
    } else {
      await startMicrophone();
      setIsMicActive(true);
    }
  };

  const handleAnalyze = () => {
    if (canStartAnalysis()) {
      triggerAnalysis();
    }
  };

  const confirmEndInterview = () => {
    setIsMicActive(false);
    setShowEndConfirm(false);
    // FIX: Set interview end time
    setInterviewEndTime(Date.now());
    // Navigate to evaluation page
    window.location.href = '/evaluate';
  };

  const isAnalyzingAny = isAnalyzing || isGeneratingQuestions || isGeneratingRating;

  const stateLabels: Record<string, string> = {
    'IDLE': 'Ready',
    'LISTENING': 'Listening',
    'HAS_QUESTION': 'Question Detected',
    'HAS_ANSWER': 'Answer Ready',
    'ANALYZING': 'Analyzing',
  };

  const stateColors: Record<string, string> = {
    'IDLE': 'bg-gray-500',
    'LISTENING': 'bg-blue-500',
    'HAS_QUESTION': 'bg-yellow-500',
    'HAS_ANSWER': 'bg-green-500',
    'ANALYZING': 'bg-purple-500',
  };

  const wordCount = currentAnswer ? currentAnswer.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Header */}
      <header className="bg-gray-800/80 backdrop-blur border-b border-gray-700/50 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Interview Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-white">{interviewContext?.candidateName}</h1>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Briefcase className="w-3 h-3" />
                  <span>{interviewContext?.role}</span>
                </div>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
              <div className="flex items-center gap-1.5">
                {deepgramConnected ? (
                  <Wifi className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-red-400" />
                )}
                <span className="text-xs text-gray-400">STT</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-xs text-gray-400">AI</span>
              </div>
              
              {/* State Badge */}
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${stateColors[fsmState]}/20`}>
                <span className={`w-2 h-2 rounded-full ${stateColors[fsmState]} ${fsmState === 'ANALYZING' ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-medium text-gray-300">{stateLabels[fsmState]}</span>
              </div>
            </div>
          </div>
          
          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMic}
              disabled={!deepgramConnected && !isMicActive}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isMicActive
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 shadow-lg shadow-blue-500/20'
              }`}
            >
              {isMicActive ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Stop</span>
                  <Radio className="w-3 h-3 animate-pulse" />
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Record</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleAnalyze}
              disabled={!canStartAnalysis() || isAnalyzingAny}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg text-sm font-medium hover:from-purple-500 hover:to-purple-400 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 transition-all shadow-lg shadow-purple-500/20 disabled:shadow-none"
            >
              <Zap className={`w-4 h-4 ${isAnalyzingAny ? 'animate-pulse' : ''}`} />
              {isAnalyzingAny ? 'Analyzing...' : 'Analyze'}
            </button>
            
            <button
              onClick={() => setShowEndConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
            >
              <Square className="w-4 h-4" />
              End
            </button>
          </div>
        </div>
      </header>

      {/* Live Transcript Bar */}
      <div className="bg-gray-800/50 border-b border-gray-700/50">
        {/* Question and Answer Row */}
        <div className="flex items-stretch">
          {/* Question */}
          <div className="flex-1 flex items-center gap-3 px-4 py-2.5 border-r border-gray-700/50 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <MessageSquare className="w-3 h-3 text-yellow-400" />
              </div>
              <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Q</span>
            </div>
            <div 
              ref={questionContainerRef}
              className="flex-1 overflow-x-auto scrollbar-hide min-w-0"
            >
              <div className="inline-block min-w-full">
                {currentQuestion ? (
                  <p className="text-sm text-gray-200 whitespace-nowrap">{currentQuestion}</p>
                ) : (
                  <p className="text-sm text-gray-500 italic whitespace-nowrap">
                    {isMicActive ? 'Listening for question...' : 'Start recording to capture questions'}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Answer */}
          <div className="flex-1 flex items-center gap-3 px-4 py-2.5 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <User className="w-3 h-3 text-green-400" />
              </div>
              <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">A</span>
              {wordCount > 0 && (
                <span className="text-xs text-gray-500 tabular-nums">{wordCount}w</span>
              )}
              {/* Live indicator when mic is active */}
              {isMicActive && interimText && (
                <div className="flex items-center gap-1">
                  <AudioLines className="w-3 h-3 text-cyan-400 animate-pulse" />
                </div>
              )}
            </div>
            <div 
              ref={answerContainerRef}
              className="flex-1 overflow-x-auto scrollbar-hide min-w-0"
            >
              <div className="inline-block min-w-full">
                {currentAnswer || (isMicActive && interimText) ? (
                  <p className="text-sm whitespace-nowrap">
                    {/* Finalized answer text */}
                    <span className="text-gray-200">{currentAnswer}</span>
                    {/* Interim text shown inline with different styling - no flicker */}
                    {isMicActive && interimText && (
                      <span className="text-cyan-400/70">
                        {currentAnswer ? ' ' : ''}{interimText}
                      </span>
                    )}
                    {isMicActive && <span className="inline-block w-0.5 h-4 bg-cyan-400 ml-1 animate-pulse align-middle" />}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 italic whitespace-nowrap">
                    {currentQuestion ? 'Waiting for response...' : 'No question yet'}
                  </p>
                )}
              </div>
            </div>
            {currentAnswer && (
              <button 
                onClick={clearAnswer} 
                className="shrink-0 text-gray-500 hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors"
                title="Clear answer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Analysis Panels */}
      <div className="flex-1 grid grid-cols-3 gap-4 p-4 min-h-0">
        <div className="min-h-0">
          <AnalysisPanel />
        </div>
        <div className="min-h-0">
          <QuestionPanel />
        </div>
        <div className="min-h-0">
          <RatingPanel />
        </div>
      </div>

      {/* End Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 border border-gray-700 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">End Interview?</h3>
            <p className="text-sm text-gray-400 mb-5">
              This will stop recording and take you to the evaluation screen to rate the candidate.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmEndInterview}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors"
              >
                Continue to Evaluation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Panel */}
      <NotesPanel />
    </div>
  );
}
