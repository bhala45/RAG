export default function LoadingSkeleton() {
  return (
    <div className="w-full max-w-md p-6 glass-panel rounded-2xl animate-pulse space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-500/20 rounded-xl"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-800 rounded w-3/4"></div>
          <div className="h-3 bg-slate-800/60 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-3 bg-slate-800 rounded"></div>
        <div className="h-3 bg-slate-800 rounded w-5/6"></div>
        <div className="h-3 bg-slate-800 rounded w-4/6"></div>
      </div>
    </div>
  );
}
