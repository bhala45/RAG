import { X, BookOpen, FileText, CheckCircle } from 'lucide-react';

export default function SourceDrawer({ isOpen, onClose, sources = [] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white text-sm sm:text-base">Retrieved College Sources</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sources.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-500">
            No source documents were retrieved for this response.
          </div>
        ) : (
          sources.map((src, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="font-medium text-xs sm:text-sm text-slate-200 truncate">
                    {src.title || 'Official College Document'}
                  </span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  Page {src.pageNumber || 1}
                </span>
              </div>

              {/* Text Snippet */}
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/90 p-3 rounded-lg border border-slate-800/80 font-mono">
                "{src.snippet}"
              </p>

              <div className="flex items-center text-[10px] text-emerald-400 space-x-1 pt-1">
                <CheckCircle className="w-3 h-3" />
                <span>Verified by CampusWise Vector Index</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
