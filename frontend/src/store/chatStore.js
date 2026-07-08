import { create } from 'zustand';
import api from '../utils/api';

const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  typingUsers: {},
  loading: false,

  fetchConversations: async () => {
    const { data } = await api.get('/chat/conversations');
    set({ conversations: data.conversations });
  },

  setActiveConversation: (conv) => set({ activeConversation: conv, messages: [] }),

  fetchMessages: async (conversationId) => {
    set({ loading: true });
    const { data } = await api.get(`/chat/messages/${conversationId}`);
    set({ messages: data.messages, loading: false });
  },

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
    conversations: state.conversations.map(c =>
      c._id === message.conversation ? { ...c, lastMessage: message } : c
    ),
  })),

  updateMessage: (updated) => set((state) => ({
    messages: state.messages.map(m => m._id === updated._id ? updated : m),
  })),

  deleteMessage: (id) => set((state) => ({
    messages: state.messages.map(m => m._id === id ? { ...m, isDeleted: true, content: 'This message was deleted' } : m),
  })),

  setTyping: (conversationId, userId, isTyping) => set((state) => ({
    typingUsers: { ...state.typingUsers, [`${conversationId}_${userId}`]: isTyping },
  })),
}));

export default useChatStore;
