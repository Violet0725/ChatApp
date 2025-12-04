import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

type AuthMode = 'login' | 'register';

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');

  if (mode === 'register') {
    return <RegisterForm onSwitchToLogin={() => setMode('login')} />;
  }

  return <LoginForm onSwitchToRegister={() => setMode('register')} />;
}
