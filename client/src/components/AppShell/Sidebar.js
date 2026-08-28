import { useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { MessageSquare, Plus, Clock, ChevronRight } from 'lucide-react';

export default function Sidebar() {
  const {
    conversations,
    activeConversationId,
    fetchConversations,
    loadConversation,
    startNewConversation,
  } = useChatStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <aside className="w-64 h-[calc(100vh-4rem)] border-r border-slate-800/80 bg-slate-950/60 flex flex-col p-4">
      {/* New Chat Button */}
      <button
        onClick={startNewConversation}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40 font-medium text-sm transition-all shadow-sm group mb-4"
      >
        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
        <span>New Conversation</span>
      </button>

      {/* History Section */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
        <Clock className="w-3.5 h-3.5" />
        <span>Chat History</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No previous chats found. Ask a question to begin!
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = activeConversationId === conv._id;
            return (
              <button
                key={conv._id}
                onClick={() => loadConversation(conv._id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-center justify-between group ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span className="truncate">{conv.title || 'Untitled Conversation'}</span>
                </div>
                <ChevronRight className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 text-blue-400' : 'text-slate-600'}`} />
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
