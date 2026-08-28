import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, AlertCircle } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import MessageItem from './MessageItem';
import DepartmentFilter from './DepartmentFilter';
import SourceDrawer from './SourceDrawer';

const SUGGESTED_QUESTIONS = [
  'What is the minimum attendance requirement for semester exams?',
  'What are the eligibility criteria for campus placement drives?',
  'What are the hostel check-in hours and curfew rules?',
  'How do I apply for a course withdrawal or semester break?',
];

export default function ChatWindow() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const {
    messages,
    isStreaming,
    activeDepartment,
    setDepartment,
    sendMessage,
    selectedSources,
    isSourceDrawerOpen,
    openSourceDrawer,
    closeSourceDrawer,
    submitFeedback,
    error,
  } = useChatStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const q = input;
    setInput('');
    sendMessage(q);
  };

  const handleSuggestedClick = (text) => {
    if (isStreaming) return;
    sendMessage(text);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] relative bg-slate-950/40">
      {/* Top Header: Department Filter */}
      <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Campus Knowledge Assistant
          </span>
        </div>
        <DepartmentFilter value={activeDepartment} onChange={setDepartment} />
      </div>

      {/* Messages Timeline */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6 my-auto">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-[2px] shadow-xl shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-blue-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                How can CampusWise assist you today?
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Ask questions about curriculum, admissions, fees, hostel policies, and placements. Verified answers retrieved directly from official campus records.
              </p>
            </div>

            {/* Suggested Prompt Chips */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestedClick(q)}
                  className="p-3 text-left rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800/80 hover:border-blue-500/40 text-xs text-slate-300 hover:text-white transition-all shadow-sm group"
                >
                  <span className="line-clamp-2 group-hover:translate-x-0.5 transition-transform">{q}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg._id}
              message={msg}
              onOpenSources={openSourceDrawer}
              onFeedback={submitFeedback}
            />
          ))
        )}

        {error && (
          <div className="flex items-center space-x-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 sm:p-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent border-t border-slate-800/60">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            placeholder={
              activeDepartment === 'All'
                ? 'Ask anything about campus policies, exams, syllabus...'
                : `Ask about ${activeDepartment} department...`
            }
            className="w-full pl-5 pr-14 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm text-white placeholder-slate-500 shadow-xl disabled:opacity-60 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="absolute right-2.5 p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isStreaming ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>

      {/* Source Citation Drawer */}
      <SourceDrawer
        isOpen={isSourceDrawerOpen}
        onClose={closeSourceDrawer}
        sources={selectedSources}
      />
    </div>
  );
}
