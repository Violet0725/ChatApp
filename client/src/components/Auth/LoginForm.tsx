import { useState, FormEvent } from 'react';
import { useAuthStore } from '../../store';
import type { LoginFormData } from '../../types';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      await login(formData);
    } catch {
      // Error is handled by store
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="h-screen flex items-center justify-center bg-discord_gray">
      <div className="bg-discord_channels p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl text-white font-bold mb-2 text-center">Welcome Back!</h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          Sign in to continue chatting
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-3 rounded bg-discord_gray text-white focus:outline-none focus:ring-2 focus:ring-discord_purple"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full p-3 rounded bg-discord_gray text-white focus:outline-none focus:ring-2 focus:ring-discord_purple"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-discord_purple text-white p-3 rounded font-bold hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-gray-400 text-sm text-center mt-4">
          Need an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-discord_purple hover:underline"
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
}
