import { create } from 'zustand';
import { api } from '@/services/api';
import { getSocket, disconnectSocket as closeSocket } from '@/services/socket';
import { 
  Conversation, 
  Message, 
  MessagesResponse, 
  ConversationsResponse
} from '@/types/chat';
import { Socket } from 'socket.io-client';

interface ChatState {
  conversations: (Conversation & { hasUnread?: boolean })[];
  activeConversation: Conversation | null;
  messages: Message[];
  hasMoreMessages: boolean;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  isSocketConnected: boolean;
  error: string | null;
  socket: Socket | null;

  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string, before?: string) => Promise<void>;
  setActiveConversation: (conversation: Conversation | null) => void;
  sendMessage: (text: string) => Promise<void>;
  createDirectConversation: (userId: string) => Promise<Conversation>;
  createGroupConversation: (name: string, participantIds: string[]) => Promise<Conversation>;
  addParticipants: (conversationId: string, userIds: string[]) => Promise<void>;
  removeParticipant: (conversationId: string, userId: string) => Promise<void>;
  promoteToAdmin: (conversationId: string, userId: string) => Promise<void>;
  renameGroup: (conversationId: string, name: string) => Promise<void>;
  
  initSocket: (token: string) => void;
  disconnectSocket: () => void;
  clearError: () => void;
}

// Custom helper to cast Axios errors safely
interface ApiErrorStructure {
  response?: {
    data?: {
      error?: {
        message?: string;
        code?: string;
        details?: Array<{ path: string; message: string }>;
      };
    };
  };
}

const parseApiError = (err: unknown) => {
  return (err as ApiErrorStructure).response?.data?.error;
};

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  hasMoreMessages: false,
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSendingMessage: false,
  isSocketConnected: false,
  error: null,
  socket: null,

  fetchConversations: async () => {
    set({ isLoadingConversations: true, error: null });
    try {
      const response = await api.get<ConversationsResponse>('/conversations');
      const sortedConversations = response.data.data.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      set({ conversations: sortedConversations, isLoadingConversations: false });
    } catch (err: unknown) {
      console.error('Fetch conversations error:', err);
      set({ isLoadingConversations: false, error: 'Failed to load conversations.' });
    }
  },

  fetchMessages: async (conversationId: string, before?: string) => {
    set({ isLoadingMessages: true, error: null });
    try {
      const url = `/conversations/${conversationId}/messages`;
      const params = before ? { before, limit: 20 } : { limit: 20 };
      
      const response = await api.get<MessagesResponse>(url, { params });
      const { messages: newMessages, hasMore } = response.data;

      set((state) => {
        if (state.activeConversation?._id !== conversationId) {
          return {};
        }

        const updatedMessages = before 
          ? [...newMessages, ...state.messages] 
          : newMessages;
        
        const sortedMessages = [...updatedMessages].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        return {
          messages: sortedMessages,
          hasMoreMessages: hasMore,
          isLoadingMessages: false,
        };
      });
    } catch (err: unknown) {
      console.error('Fetch messages error:', err);
      set({ isLoadingMessages: false, error: 'Failed to load message history.' });
    }
  },

  setActiveConversation: (conversation) => {
    if (conversation) {
      set((state) => ({
        activeConversation: conversation,
        messages: [],
        hasMoreMessages: false,
        conversations: state.conversations.map((c) => 
          c._id === conversation._id ? { ...c, hasUnread: false } : c
        ),
      }));
      get().fetchMessages(conversation._id);
    } else {
      set({ activeConversation: null, messages: [], hasMoreMessages: false });
    }
  },

  sendMessage: async (text: string) => {
    const { activeConversation, isSendingMessage } = get();
    if (!activeConversation || isSendingMessage || !text.trim()) return;

    set({ isSendingMessage: true, error: null });
    try {
      const response = await api.post<Message>('/messages', {
        conversationId: activeConversation._id,
        text,
      });

      const sentMessage = response.data;

      set((state) => {
        const messageExists = state.messages.some((m) => m._id === sentMessage._id);
        const updatedMessages = messageExists 
          ? state.messages 
          : [...state.messages, sentMessage];

        const updatedConversations = state.conversations.map((c) => {
          if (c._id === activeConversation._id) {
            return {
              ...c,
              lastMessage: {
                text: sentMessage.text,
                sender: sentMessage.sender,
                createdAt: sentMessage.createdAt,
              },
              updatedAt: sentMessage.createdAt,
            };
          }
          return c;
        }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        return {
          messages: updatedMessages,
          conversations: updatedConversations,
          isSendingMessage: false,
        };
      });
    } catch (err: unknown) {
      console.error('Send message error:', err);
      set({ isSendingMessage: false, error: 'Failed to send message.' });
      throw err;
    }
  },

  createDirectConversation: async (userId: string) => {
    set({ isLoadingConversations: true, error: null });
    try {
      const response = await api.post<Conversation>('/conversations', { userId });
      const newRoom = response.data;
      
      await get().fetchConversations();
      
      const fullRoom = get().conversations.find((c) => c._id === newRoom._id) || newRoom;
      set({ activeConversation: fullRoom, isLoadingConversations: false });
      
      return fullRoom;
    } catch (err: unknown) {
      console.error('Create direct room error:', err);
      set({ isLoadingConversations: false, error: 'Failed to start conversation.' });
      throw err;
    }
  },

  createGroupConversation: async (name: string, participantIds: string[]) => {
    set({ isLoadingConversations: true, error: null });
    try {
      const response = await api.post<Conversation>('/conversations/group', {
        name,
        participantIds,
      });
      const newRoom = response.data;

      await get().fetchConversations();
      const fullRoom = get().conversations.find((c) => c._id === newRoom._id) || newRoom;
      set({ activeConversation: fullRoom, isLoadingConversations: false });

      return fullRoom;
    } catch (err: unknown) {
      console.error('Create group error:', err);
      let errMsg = 'Failed to create group.';
      const apiError = parseApiError(err);
      if (apiError?.details) {
        errMsg = apiError.details.map((d: { message: string }) => d.message).join(', ');
      }
      set({ isLoadingConversations: false, error: errMsg });
      throw err;
    }
  },

  addParticipants: async (conversationId: string, userIds: string[]) => {
    try {
      await api.post(`/conversations/${conversationId}/participants`, { userIds });
      await get().fetchConversations();
      
      const active = get().activeConversation;
      if (active && active._id === conversationId) {
        const updated = get().conversations.find((c) => c._id === conversationId);
        if (updated) set({ activeConversation: updated });
      }
    } catch (err: unknown) {
      console.error('Add participants error:', err);
      throw err;
    }
  },

  removeParticipant: async (conversationId: string, userId: string) => {
    try {
      await api.delete(`/conversations/${conversationId}/participants/${userId}`);
      await get().fetchConversations();
      
      const active = get().activeConversation;
      if (active && active._id === conversationId) {
        const storedUser = localStorage.getItem('chat_app_user');
        const currentUserId = storedUser ? JSON.parse(storedUser)._id : null;
        
        if (userId === currentUserId) {
          set({ activeConversation: null, messages: [] });
        } else {
          const updated = get().conversations.find((c) => c._id === conversationId);
          if (updated) set({ activeConversation: updated });
        }
      }
    } catch (err: unknown) {
      console.error('Remove participant error:', err);
      throw err;
    }
  },

  promoteToAdmin: async (conversationId: string, userId: string) => {
    try {
      await api.post(`/conversations/${conversationId}/admins`, { userId });
      await get().fetchConversations();
      
      const active = get().activeConversation;
      if (active && active._id === conversationId) {
        const updated = get().conversations.find((c) => c._id === conversationId);
        if (updated) set({ activeConversation: updated });
      }
    } catch (err: unknown) {
      console.error('Promote to admin error:', err);
      throw err;
    }
  },

  renameGroup: async (conversationId: string, name: string) => {
    try {
      await api.patch(`/conversations/${conversationId}`, { name });
      await get().fetchConversations();
      
      const active = get().activeConversation;
      if (active && active._id === conversationId) {
        const updated = get().conversations.find((c) => c._id === conversationId);
        if (updated) set({ activeConversation: updated });
      }
    } catch (err: unknown) {
      console.error('Rename group error:', err);
      throw err;
    }
  },

  initSocket: (token: string) => {
    const existingSocket = get().socket;
    if (existingSocket) return;

    const s = getSocket(token);
    set({ socket: s });

    s.on('connect', () => {
      console.log('Socket.io connected');
      set({ isSocketConnected: true });
    });

    s.on('connect_error', (err) => {
      console.error('Socket.io connect_error:', err.message, err);
      set({ isSocketConnected: false });
    });

    s.on('disconnect', () => {
      console.log('Socket.io disconnected');
      set({ isSocketConnected: false });
    });

    s.on('message:new', (rawMessage: unknown) => {
      console.log('Socket message:new received:', rawMessage);
      
      const msgData = rawMessage as {
        _id?: string;
        id?: string;
        conversation: string;
        sender: string;
        text: string;
        createdAt: string | number;
      };

      const message: Message = {
        _id: msgData._id || msgData.id || '',
        conversation: msgData.conversation,
        sender: msgData.sender,
        text: msgData.text,
        createdAt: typeof msgData.createdAt === 'number'
          ? new Date(msgData.createdAt).toISOString()
          : msgData.createdAt,
      };
      
      const active = get().activeConversation;
      
      if (active && active._id === message.conversation) {
        set((state) => {
          const messageExists = state.messages.some((m) => m._id === message._id);
          return {
            messages: messageExists ? state.messages : [...state.messages, message],
          };
        });
      }

      set((state) => {
        const updatedConversations = state.conversations.map((c) => {
          if (c._id === message.conversation) {
            const hasUnread = active ? active._id !== message.conversation : true;
            return {
              ...c,
              lastMessage: {
                text: message.text,
                sender: message.sender,
                createdAt: message.createdAt,
              },
              updatedAt: message.createdAt,
              hasUnread: c.hasUnread || hasUnread,
            };
          }
          return c;
        }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        return { conversations: updatedConversations };
      });

      // If the conversation is not found in the local conversations list, fetch list to sync it
      const conversationExists = get().conversations.some((c) => c._id === message.conversation);
      if (!conversationExists) {
        setTimeout(() => get().fetchConversations(), 100);
      }
    });

    s.on('conversation:updated', (data: unknown) => {
      console.log('Socket conversation:updated received:', data);
      get().fetchConversations();
      
      const active = get().activeConversation;
      if (active && active.type === 'group') {
        const updatedActive = get().conversations.find((c) => c._id === active._id);
        if (updatedActive) {
          set({ activeConversation: updatedActive });
        }
      }
    });

    s.connect();
  },

  disconnectSocket: () => {
    const s = get().socket;
    if (s) {
      s.off('connect');
      s.off('disconnect');
      s.off('message:new');
      s.off('conversation:updated');
      closeSocket();
      set({ socket: null, isSocketConnected: false });
      console.log('Socket.io cleaned up and disconnected');
    }
  },

  clearError: () => set({ error: null }),
}));
