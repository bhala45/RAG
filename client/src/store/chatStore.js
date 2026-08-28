import { create } from 'zustand';
import api from '../services/api';
import { streamChatMessage } from '../services/sse';

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isStreaming: false,
  activeDepartment: 'All',
  selectedSources: [],
  isSourceDrawerOpen: false,
  error: null,

  setDepartment: (dept) => set({ activeDepartment: dept }),

  openSourceDrawer: (sources) => set({ selectedSources: sources, isSourceDrawerOpen: true }),
  closeSourceDrawer: () => set({ isSourceDrawerOpen: false }),

  // Fetch conversation history
  fetchConversations: async () => {
    try {
      const res = await api.get('/chat/conversations');
      set({ conversations: res.data.data });
    } catch (err) {
      console.warn('[ChatStore] Failed to fetch conversations:', err.message);
    }
  },

  // Load specific conversation messages
  loadConversation: async (conversationId) => {
    try {
      const res = await api.get(`/chat/conversations/${conversationId}`);
      set({
        activeConversationId: conversationId,
        messages: res.data.data.messages || [],
        activeDepartment: res.data.data.departmentFilter || 'All',
      });
    } catch (err) {
      console.warn('[ChatStore] Failed to load conversation:', err.message);
    }
  },

  startNewConversation: () => {
    set({
      activeConversationId: null,
      messages: [],
      error: null,
    });
  },

  // Send message and stream response
  sendMessage: async (queryText) => {
    const { activeConversationId, activeDepartment, messages } = get();
    if (!queryText || queryText.trim().length === 0) return;

    const userMessage = {
      _id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toISOString(),
    };

    const assistantMessageId = `assistant-${Date.now()}`;
    const initialAssistantMessage = {
      _id: assistantMessageId,
      sender: 'assistant',
      text: '',
      sources: [],
      confidenceScore: 1.0,
      feedback: 'none',
      timestamp: new Date().toISOString(),
    };

    set({
      messages: [...messages, userMessage, initialAssistantMessage],
      isStreaming: true,
      error: null,
    });

    await streamChatMessage({
      query: queryText,
      departmentFilter: activeDepartment,
      conversationId: activeConversationId,
      onToken: (token) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg._id === assistantMessageId ? { ...msg, text: msg.text + token } : msg
          ),
        }));
      },
      onDone: (data) => {
        set((state) => ({
          isStreaming: false,
          messages: state.messages.map((msg) =>
            msg._id === assistantMessageId
              ? {
                  ...msg,
                  sources: data.sources || [],
                  confidenceScore: data.confidenceScore || 1.0,
                }
              : msg
          ),
        }));
        // Refresh conversation history list
        get().fetchConversations();
      },
      onError: (err) => {
        set((state) => ({
          isStreaming: false,
          error: err.message,
          messages: state.messages.map((msg) =>
            msg._id === assistantMessageId
              ? {
                  ...msg,
                  text:
                    msg.text ||
                    'I am sorry, but an error occurred while retrieving answer from college documents.',
                }
              : msg
          ),
        }));
      },
    });
  },

  // Submit feedback (like/dislike)
  submitFeedback: async (messageId, feedback) => {
    const { activeConversationId } = get();
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === messageId ? { ...msg, feedback } : msg
      ),
    }));

    if (activeConversationId) {
      try {
        await api.post('/chat/feedback', {
          conversationId: activeConversationId,
          messageId,
          feedback,
        });
      } catch (err) {
        console.warn('[ChatStore] Feedback update failed:', err.message);
      }
    }
  },
}));
