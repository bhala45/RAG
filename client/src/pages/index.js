import Link from 'next/link';
import Layout from '../components/AppShell/Layout';
import {
  Sparkles,
  BookOpen,
  Zap,
  ShieldCheck,
  Search,
  Layers,
  ArrowRight,
  Database,
  CheckCircle,
} from 'lucide-react';

export default function Home() {
  return (
    <Layout>
      <div className="relative overflow-hidden">
        {/* Hero Section */}
        <section className="relative pt-20 pb-24 sm:pt-28 sm:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold backdrop-blur-md shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Campus Intelligence • Gemini RAG Pipeline</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Instant, Verified Answers From Your{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Official Campus Documents
            </span>
          </h1>

          {/* Description */}
          <p className="max-w-2xl mx-auto text-sm sm:text-lg text-slate-300 leading-relaxed font-light">
            CampusWise AI uses enterprise-grade Hybrid Vector Search and Google Gemini LLMs to answer questions about regulations, admissions, fees, hostel policies, and course syllabi with 100% verifiable page citations.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/chat"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/30 hover:shadow-blue-500/40 flex items-center justify-center space-x-2 transition-all group"
            >
              <span>Launch Student Chat</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-850 text-slate-200 border border-slate-700/80 font-semibold text-sm transition-all flex items-center justify-center space-x-2"
            >
              <span>Admin Portal</span>
            </Link>
          </div>

          {/* Highlight Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-12">
            {[
              { label: 'Embedding Dimensions', value: '768-dim Vectors' },
              { label: 'Retrieval Strategy', value: 'Dense + Sparse RRF' },
              { label: 'Streaming Protocol', value: 'Server-Sent Events' },
              { label: 'Hallucination Defense', value: 'Strict Context Guard' },
            ].map((stat, i) => (
              <div key={i} className="p-4 glass-panel rounded-2xl border border-slate-800/80 text-left space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">{stat.label}</span>
                <p className="text-sm sm:text-base font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Core RAG Architecture Features */}
        <section className="py-20 bg-slate-950/60 border-t border-slate-900 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-white">
              Engineered For Academic Precision
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Built on modern information retrieval architecture designed to eliminate hallucinations and pinpoint official campus policies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 glass-panel rounded-2xl border border-slate-800 space-y-4 hover:border-blue-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Hybrid Retrieval & RRF</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Combines MongoDB Atlas Dense Vector Search with Sparse keyword indexes via Reciprocal Rank Fusion (RRF) for accurate lookup of course codes and concepts.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 glass-panel rounded-2xl border border-slate-800 space-y-4 hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Source-Verified Citations</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Every AI response is accompanied by interactive citation badges highlighting the source document title, page number, and original text snippet.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 glass-panel rounded-2xl border border-slate-800 space-y-4 hover:border-cyan-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">SSE Real-Time Streaming</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tokens stream in real-time directly from Gemini 1.5 Flash via Server-Sent Events (SSE), delivering immediate feedback with near-zero latency perception.
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
