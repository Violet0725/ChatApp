import { useEffect, useRef } from 'react';
import { useChatStore } from '../../store';
import { MessageItem } from './MessageItem';

export function MessageList() {
  const { messages, isLoadingMessages } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400">Loading messages...</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">👋</div>
          <div className="text-gray-400">No messages yet. Start the conversation!</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageItem key={message._id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
