'use client';

import { useState } from 'react';
import { useInterviewStore } from '@/lib/store';
import { SetupScreen } from './SetupScreen';
import { InterviewScreen } from './InterviewScreen';

export function InterviewerDashboard() {
  const { isInterviewActive } = useInterviewStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {!isInterviewActive ? <SetupScreen /> : <InterviewScreen />}
    </div>
  );
}
