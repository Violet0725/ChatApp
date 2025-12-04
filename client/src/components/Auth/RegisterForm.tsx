import { useState, FormEvent } from 'react';
import { useAuthStore } from '../../store';
import type { RegisterFormData } from '../../types';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [validationError, setValidationError] = useState('');
  
  const { register, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setValidationError('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[0-9]/.test(formData.password)) {
      setValidationError('Password must contain at least one number');
      return;
    }

    try {
      await register(formData);
    } catch {
      // Error is handled by store
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const displayError = validationError || error;

  return (
    <div className="h-screen flex items-center justify-center bg-discord_gray">
      <div className="bg-discord_channels p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl text-white font-bold mb-2 text-center">Create Account</h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          Join our chat community
        </p>

        {displayError && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded mb-4 text-sm">
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={20}
              className="w-full p-3 rounded bg-discord_gray text-white focus:outline-none focus:ring-2 focus:ring-discord_purple"
              placeholder="Choose a username"
            />
          </div>

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
              minLength={6}
              className="w-full p-3 rounded bg-discord_gray text-white focus:outline-none focus:ring-2 focus:ring-discord_purple"
              placeholder="Create a password"
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be 6+ chars with uppercase and number
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full p-3 rounded bg-discord_gray text-white focus:outline-none focus:ring-2 focus:ring-discord_purple"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-discord_purple text-white p-3 rounded font-bold hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-gray-400 text-sm text-center mt-4">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-discord_purple hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
