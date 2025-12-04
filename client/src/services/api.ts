import { API_BASE_URL, STORAGE_KEYS } from '../config/constants';
import type { ApiResponse, AuthResponse, LoginFormData, RegisterFormData, Channel, Message, User } from '../types';

/**
 * Base fetch wrapper with auth token handling
 */
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }

  return data;
}

// Auth API
export const authApi = {
  register: async (formData: RegisterFormData): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.errors?.join(', '));
    return data;
  },

  login: async (formData: LoginFormData): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.errors?.join(', '));
    return data;
  },

  getMe: async () => fetchWithAuth<User>('/auth/me'),

  logout: async () => fetchWithAuth('/auth/logout', { method: 'POST' }),

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  },
};

// Channel API
export const channelApi = {
  getAll: () => fetchWithAuth<Channel[]>('/channels'),

  create: (name: string, description?: string) =>
    fetchWithAuth<Channel>('/channels', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  delete: (id: string) =>
    fetchWithAuth(`/channels/${id}`, { method: 'DELETE' }),

  getMessages: (name: string, limit = 50, before?: string) =>
    fetchWithAuth<Message[]>(
      `/channels/${name}/messages?limit=${limit}${before ? `&before=${before}` : ''}`
    ),
};
