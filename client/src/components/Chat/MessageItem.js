import { BookOpen, Sparkles, User, ShieldCheck } from 'lucide-react';
import FeedbackButtons from './FeedbackButtons';

export default function MessageItem({ message, onOpenSources, onFeedback }) {
  const isAssistant = message.sender === 'assistant';
  const hasSources = isAssistant && message.sources && message.sources.length > 0;

  return (
    <div className={`flex w-full ${isAssistant ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`flex space-x-3 max-w-3xl ${isAssistant ? 'flex-row' : 'flex-row-reverse space-x-reverse'}`}>
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
            isAssistant
              ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/20'
              : 'bg-slate-800 text-slate-300 border border-slate-700'
          }`}
        >
          {isAssistant ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>

        {/* Message Card */}
        <div className="space-y-2">
          <div
            className={`p-4 rounded-2xl text-sm leading-relaxed ${
              isAssistant
                ? 'bg-slate-900/90 text-slate-100 border border-slate-800/80 shadow-lg shadow-black/20'
                : 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
            }`}
          >
            {/* Message Text with preserved paragraphs */}
            <div className="whitespace-pre-wrap font-sans">
              {message.text || (isAssistant ? 'Thinking...' : '')}
            </div>

            {/* Source Citations Badges */}
            {hasSources && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium flex items-center mr-1">
                  <BookOpen className="w-3 h-3 text-blue-400 mr-1" />
                  Sources:
                </span>
                {message.sources.map((source, idx) => (
                  <button
                    key={idx}
                    onClick={() => onOpenSources(message.sources)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/50 transition-colors"
                  >
                    <span className="truncate max-w-[140px]">{source.title || 'Document'}</span>
                    <span className="text-[10px] text-blue-400 font-mono">p.{source.pageNumber || 1}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer Metadata: Confidence & Feedback */}
          {isAssistant && message.text && (
            <div className="flex items-center justify-between px-1 text-xs text-slate-500">
              <div className="flex items-center space-x-2">
                {message.confidenceScore !== undefined && (
                  <span className="flex items-center space-x-1 text-[11px] text-slate-400">
                    <ShieldCheck className="w-3 h-3 text-blue-400" />
                    <span>Match Confidence: {(message.confidenceScore * 100).toFixed(0)}%</span>
                  </span>
                )}
              </div>
              <FeedbackButtons
                feedback={message.feedback}
                onFeedback={(type) => onFeedback(message._id, type)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
