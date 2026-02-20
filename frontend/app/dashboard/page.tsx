'use client';

import ComparisonDashboard from '@/components/ComparisonDashboard';
import { Award } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
        <div className="bg-gray-800/80 backdrop-blur border-b border-gray-700/50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-3">
              <Award className="text-blue-400" size={32} />
              <h1 className="text-3xl font-bold text-white">Interview Management Dashboard</h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6">
          <ComparisonDashboard />
        </div>
      </div>
    </ProtectedRoute>
  );
}
