'use client';

import ComparisonDashboard from '@/components/ComparisonDashboard';
import { Award, ArrowLeft } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
        <div className="bg-gray-800/80 backdrop-blur border-b border-gray-700/50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="text-blue-400" size={32} />
                <h1 className="text-3xl font-bold text-white">Interview Management Dashboard</h1>
              </div>
              {/* FIX: Add back button to setup screen */}
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                <ArrowLeft size={18} />
                Back to Setup
              </Link>
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
