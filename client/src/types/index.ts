// User types
export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'dnd' | 'offline';
  lastSeen?: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    refreshToken: string;
  };
}

// Channel types
export interface Channel {
  _id: string;
  name: string;
  description?: string;
  createdBy?: User;
  isPrivate: boolean;
  createdAt?: string;
}

// Message types
export interface Message {
  _id: string;
  room: string;
  author: User | string;
  authorName: string;
  message: string;
  type: 'text' | 'image' | 'file' | 'system';
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  formattedTime?: string;
}

// Online user in room
export interface OnlineUser {
  username: string;
  odName?: string;
}

// Socket event types
export interface TypingData {
  room: string;
  user: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  errors?: string[];
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}
