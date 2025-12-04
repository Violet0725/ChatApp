import { useEffect } from 'react';
import { getSocket, initializeSocket } from '../services/socket';
import { useChatStore, useAuthStore } from '../store';
import { DEFAULT_CHANNEL } from '../config/constants';
import type { Message, Channel, OnlineUser, TypingData } from '../types';

/**
 * Custom hook to manage socket connections and event listeners
 */
export function useSocket() {
  const { isAuthenticated } = useAuthStore();
  const {
    setChannels,
    setMessages,
    addMessage,
    setUsersInRoom,
    addTypingUser,
    setCurrentChannel,
    updateMessage,
    deleteMessage,
  } = useChatStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = initializeSocket();

    // Channel events
    socket.on('update_channels', (channels: Channel[]) => {
      setChannels(channels);
    });

    // Message events
    socket.on('load_messages', (messages: Message[]) => {
      setMessages(messages);
    });

    socket.on('receive_message', (message: Message) => {
      addMessage(message);
    });

    socket.on('message_edited', ({ messageId, newContent }: { messageId: string; newContent: string }) => {
      updateMessage(messageId, newContent);
    });

    socket.on('message_deleted', ({ messageId }: { messageId: string }) => {
      deleteMessage(messageId);
    });

    // User events
    socket.on('update_user_list', (users: OnlineUser[]) => {
      setUsersInRoom(users);
    });

    // Typing events
    socket.on('display_typing', (data: TypingData) => {
      addTypingUser(data.user);
    });

    // Error handling
    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message);
    });

    // Join default channel on connection
    socket.on('connect', () => {
      setCurrentChannel(DEFAULT_CHANNEL);
      socket.emit('join_room', { room: DEFAULT_CHANNEL });
    });

    // Cleanup on unmount
    return () => {
      socket.off('update_channels');
      socket.off('load_messages');
      socket.off('receive_message');
      socket.off('message_edited');
      socket.off('message_deleted');
      socket.off('update_user_list');
      socket.off('display_typing');
      socket.off('error');
      socket.off('connect');
    };
  }, [isAuthenticated, setChannels, setMessages, addMessage, setUsersInRoom, addTypingUser, setCurrentChannel, updateMessage, deleteMessage]);

  return getSocket();
}
