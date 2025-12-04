import { io, Socket } from 'socket.io-client';
import { SOCKET_URL, STORAGE_KEYS } from '../config/constants';

let socket: Socket | null = null;

/**
 * Initialize socket connection with auth token
 */
export const initializeSocket = (): Socket => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  return socket;
};

/**
 * Get current socket instance
 */
export const getSocket = (): Socket | null => socket;

/**
 * Disconnect socket
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Emit socket event with type safety
 */
export const emitEvent = <T>(event: string, data: T): void => {
  if (socket?.connected) {
    socket.emit(event, data);
  } else {
    console.warn('Socket not connected, cannot emit:', event);
  }
};

export default socket;
