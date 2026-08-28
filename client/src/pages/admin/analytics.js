import { useState, useEffect } from 'react';
import Layout from '../../components/AppShell/Layout';
import ProtectedRoute from '../../components/Common/ProtectedRoute';
import MetricsGrid from '../../components/Admin/MetricsGrid';
import UnhandledQueriesTable from '../../components/Admin/UnhandledQueriesTable';
import { BarChart2, PieChart, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react';
import api from '../../services/api';

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data.data);
    } catch (err) {
      console.warn('Failed to fetch analytics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">System Telemetry & Analytics</h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Monitor student query traffic, department coverage, satisfaction rates, and unhandled knowledge gaps.
              </p>
            </div>
            <button
              onClick={fetchAnalytics}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center space-x-2 text-xs self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Telemetry</span>
            </button>
          </div>

          {/* High Level Metrics Cards */}
          <MetricsGrid overview={analytics?.overview || {}} />

          {/* Department Breakdown & Feedback Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Department Breakdown */}
            <div className="lg:col-span-2 p-6 glass-panel rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center space-x-2">
                <PieChart className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-white text-base">Knowledge Base by Department</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {analytics?.departmentBreakdown?.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-xs text-slate-500">
                    No department document breakdown available yet.
                  </div>
                ) : (
                  analytics?.departmentBreakdown?.map((dept) => (
                    <div
                      key={dept._id}
                      className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1"
                    >
                      <span className="text-xs font-semibold text-blue-400">{dept._id || 'General'}</span>
                      <p className="text-lg font-bold text-white">{dept.count} docs</p>
                      <p className="text-[11px] text-slate-400 font-mono">{dept.totalChunks} chunks</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Student Feedback Breakdown */}
            <div className="p-6 glass-panel rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center space-x-2">
                <BarChart2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-white text-base">Feedback Sentiment</h3>
              </div>

              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-xs font-medium">Helpful / Positive</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-300">
                    {analytics?.feedback?.likes || 0}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-rose-400">
                    <ThumbsDown className="w-4 h-4" />
                    <span className="text-xs font-medium">Needs Improvement</span>
                  </div>
                  <span className="text-lg font-bold text-rose-300">
                    {analytics?.feedback?.dislikes || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Low Confidence / Unhandled Queries Table */}
          <UnhandledQueriesTable />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
