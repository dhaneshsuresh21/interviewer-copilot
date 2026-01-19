'use client';

import { useInterviewStore } from '@/lib/store';
import { Brain } from 'lucide-react';
import { StreamingPanel } from './StreamingPanel';

export function AnalysisPanel() {
  const { analysisText, isAnalyzing } = useInterviewStore();

  return (
    <StreamingPanel
      icon={Brain}
      title="Analysis"
      iconColor="text-purple-400"
      accentColor="purple"
      isLoading={isAnalyzing}
      content={analysisText}
      emptyMessage="AI analysis will appear here"
    />
  );
}
