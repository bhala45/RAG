import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function UnhandledQueriesTable() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending_review');

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/unhandled-queries?status=${filterStatus}`);
      setQueries(res.data.data.queries);
    } catch (err) {
      console.warn('Failed to fetch unhandled queries:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [filterStatus]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/admin/unhandled-queries/${id}`, { status: newStatus });
      fetchQueries();
    } catch (err) {
      console.warn('Failed to update status:', err.message);
    }
  };

  return (
    <div className="p-6 glass-panel rounded-2xl border border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">Low-Confidence & Missing Knowledge Logs</h3>
            <p className="text-xs text-slate-400">
              Student queries with vector match similarity score &lt; 0.6 flagged for administrative review.
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="pending_review">Pending Review</option>
            <option value="resolved">Resolved</option>
            <option value="ignored">Ignored</option>
            <option value="all">All Queries</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span className="text-xs">Loading telemetry log...</span>
          </div>
        ) : queries.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No queries found under status '{filterStatus}'.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="pb-3 px-3">Student Question</th>
                <th className="pb-3 px-3">Similarity</th>
                <th className="pb-3 px-3">Date</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {queries.map((q) => (
                <tr key={q._id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3.5 px-3 font-medium text-slate-200 max-w-xs sm:max-w-md truncate">
                    {q.queryText}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-amber-400">
                    {(q.highestSimilarityScore * 100).toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-3 text-slate-400">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                        q.status === 'pending_review'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : q.status === 'resolved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {q.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right space-x-1.5">
                    {q.status === 'pending_review' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(q._id, 'resolved')}
                          title="Mark Resolved"
                          className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(q._id, 'ignored')}
                          title="Ignore"
                          className="p-1 text-slate-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
