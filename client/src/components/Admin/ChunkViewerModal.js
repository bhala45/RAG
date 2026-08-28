import { useState, useEffect } from 'react';
import { X, Layers, Database, Hash, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function ChunkViewerModal({ documentId, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && documentId) {
      setLoading(true);
      setError(null);
      api
        .get(`/documents/${documentId}/chunks`)
        .then((res) => {
          setData(res.data.data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.response?.data?.error || err.message);
          setLoading(false);
        });
    }
  }, [isOpen, documentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-semibold text-white text-sm sm:text-base">
                Chunk & Vector Inspector
              </h3>
              <p className="text-xs text-slate-400">
                {data?.document?.title || 'Inspecting document chunks'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              <span className="text-xs">Loading chunk vectors...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span>Total Chunks Indexed: {data?.totalChunks || 0}</span>
                <span>Embedding Model: Gemini text-embedding-004 (768-dim)</span>
              </div>

              <div className="space-y-3">
                {data?.chunks?.map((chunk) => (
                  <div
                    key={chunk._id}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono font-semibold">
                          Chunk #{chunk.chunkIndex}
                        </span>
                        <span className="text-slate-400">Page {chunk.pageNumber}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">{chunk.metadata?.department || 'General'}</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
                        <Database className="w-3 h-3" />
                        <span>{chunk.embeddingDimensions} Dimensions</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-mono bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                      {chunk.content}
                    </p>

                    {chunk.embeddingPreview && chunk.embeddingPreview.length > 0 && (
                      <div className="text-[10px] text-slate-500 font-mono flex items-center space-x-1 truncate">
                        <Hash className="w-3 h-3 text-slate-600 flex-shrink-0" />
                        <span>Vector Preview: [{chunk.embeddingPreview.map((v) => v.toFixed(4)).join(', ')}, ...]</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
