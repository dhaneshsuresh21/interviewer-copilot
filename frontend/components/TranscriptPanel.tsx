'use client';

import { useEffect, useRef } from 'react';
import { useInterviewStore } from '@/lib/store';
import { User, UserCircle } from 'lucide-react';

export function TranscriptPanel({ currentSpeaker }: { currentSpeaker: 'interviewer' | 'candidate' | null }) {
  const { turns } = useInterviewStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Live Transcript</h2>
        {currentSpeaker && (
          <div className="flex items-center gap-2 text-sm animate-pulse">
            {currentSpeaker === 'candidate' ? (
              <User className="w-4 h-4 text-blue-600" />
            ) : (
              <UserCircle className="w-4 h-4 text-green-600" />
            )}
            <span className="text-gray-600 font-medium">
              {currentSpeaker === 'candidate' ? 'Candidate' : 'Interviewer'} speaking
            </span>
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3">
        {turns.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Start recording to see the transcript...
          </p>
        ) : (
          turns.map((turn) => (
            <div
              key={turn.id}
              className={`p-4 rounded-lg transition-all ${
                turn.speaker === 'candidate'
                  ? 'bg-blue-50 border-l-4 border-blue-500'
                  : 'bg-green-50 border-l-4 border-green-500'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {turn.speaker === 'candidate' ? (
                  <User className="w-4 h-4 text-blue-600" />
                ) : (
                  <UserCircle className="w-4 h-4 text-green-600" />
                )}
                <span className="font-medium text-sm text-gray-700">
                  {turn.speaker === 'candidate' ? 'Candidate' : 'Interviewer'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(turn.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-gray-900 text-sm leading-relaxed">{turn.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
