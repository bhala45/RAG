import { ThumbsUp, ThumbsDown } from 'lucide-react';

export default function FeedbackButtons({ feedback = 'none', onFeedback }) {
  return (
    <div className="flex items-center space-x-1.5 pt-1">
      <button
        onClick={() => onFeedback(feedback === 'like' ? 'none' : 'like')}
        title="Helpful response"
        className={`p-1.5 rounded-lg text-xs transition-colors flex items-center space-x-1 ${
          feedback === 'like'
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
        }`}
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onFeedback(feedback === 'dislike' ? 'none' : 'dislike')}
        title="Not helpful / Inaccurate"
        className={`p-1.5 rounded-lg text-xs transition-colors flex items-center space-x-1 ${
          feedback === 'dislike'
            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
        }`}
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
