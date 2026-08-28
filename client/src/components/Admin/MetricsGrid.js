import { FileText, Layers, MessageSquare, Heart } from 'lucide-react';

export default function MetricsGrid({ overview = {} }) {
  const cards = [
    {
      title: 'Indexed Documents',
      value: overview.totalDocuments ?? 0,
      icon: FileText,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      title: 'Total Vector Chunks',
      value: overview.totalChunks ?? 0,
      icon: Layers,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
    },
    {
      title: 'Queries Answered',
      value: overview.totalQueriesAnswered ?? 0,
      icon: MessageSquare,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
    },
    {
      title: 'Satisfaction Rate',
      value: overview.satisfactionRate ?? '100%',
      icon: Heart,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-5 glass-panel rounded-2xl border border-slate-800 flex items-center justify-between"
          >
            <div>
              <p className="text-xs text-slate-400 font-medium">{card.title}</p>
              <h4 className="text-2xl font-bold text-white mt-1">{card.value}</h4>
            </div>
            <div className={`p-3 rounded-xl ${card.bg} border ${card.border} ${card.color}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
