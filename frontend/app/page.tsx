'use client';

import { InterviewerDashboard } from '@/components/InterviewerDashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Home() {
  return (
    <ProtectedRoute>
      <InterviewerDashboard />
    </ProtectedRoute>
  );
}
