import { create } from 'zustand';
import type { Channel, Message, OnlineUser } from '../types';
import { DEFAULT_CHANNEL, TYPING_TIMEOUT } from '../config/constants';

interface ChatState {
  // Channels
  channels: Channel[];
  currentChannel: string;
  
  // Messages
  messages: Message[];
  
  // Users
  usersInRoom: OnlineUser[];
  
  // UI State
  typingUsers: string[];
  isLoadingMessages: boolean;
  
  // Actions
  setChannels: (channels: Channel[]) => void;
  addChannel: (channel: Channel) => void;
  setCurrentChannel: (channelName: string) => void;
  
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  
  setUsersInRoom: (users: OnlineUser[]) => void;
  
  addTypingUser: (username: string) => void;
  setLoadingMessages: (loading: boolean) => void;
  
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  channels: [],
  currentChannel: DEFAULT_CHANNEL,
  messages: [],
  usersInRoom: [],
  typingUsers: [],
  isLoadingMessages: false,

  setChannels: (channels) => set({ channels }),

  addChannel: (channel) =>
    set((state) => ({
      channels: [...state.channels, channel],
    })),

  setCurrentChannel: (channelName) =>
    set({
      currentChannel: channelName,
      messages: [], // Clear messages when switching channels
      typingUsers: [],
    }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateMessage: (messageId, content) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === messageId
          ? { ...msg, message: content, isEdited: true }
          : msg
      ),
    })),

  deleteMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg._id !== messageId),
    })),

  setUsersInRoom: (users) => set({ usersInRoom: users }),

  addTypingUser: (username) => {
    set((state) => {
      if (state.typingUsers.includes(username)) return state;
      return { typingUsers: [...state.typingUsers, username] };
    });

    // Auto-remove typing indicator after timeout
    setTimeout(() => {
      set((state) => ({
        typingUsers: state.typingUsers.filter((u) => u !== username),
      }));
    }, TYPING_TIMEOUT);
  },

  setLoadingMessages: (loading) => set({ isLoadingMessages: loading }),

  reset: () =>
    set({
      channels: [],
      currentChannel: DEFAULT_CHANNEL,
      messages: [],
      usersInRoom: [],
      typingUsers: [],
      isLoadingMessages: false,
    }),
}));
