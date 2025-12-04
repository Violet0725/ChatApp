// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://127.0.0.1:3001';

// Storage keys
export const STORAGE_KEYS = {
  TOKEN: 'chat_token',
  REFRESH_TOKEN: 'chat_refresh_token',
  USER: 'chat_user',
} as const;

// Default values
export const DEFAULT_CHANNEL = 'general';

// Message limits
export const MESSAGE_LIMIT = 100;
export const MESSAGE_MAX_LENGTH = 2000;

// Typing indicator timeout
export const TYPING_TIMEOUT = 3000;
