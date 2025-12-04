import { useEffect } from 'react';
import { useAuthStore } from './store';
import { useSocket } from './hooks';
import { AuthPage } from './components/Auth';
import { Sidebar, ChatArea, OnlineUsers } from './components/Chat';

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Initialize socket connection when authenticated
  useSocket();

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Main chat layout
  return (
    <div className="flex h-screen text-gray-100 font-sans overflow-hidden">
      <Sidebar />
      <ChatArea />
      <OnlineUsers />
    </div>
  );
}

export default App;
