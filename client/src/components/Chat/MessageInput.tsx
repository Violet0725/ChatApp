import { useState, KeyboardEvent } from 'react';
import { useChatStore } from '../../store';
import { getSocket } from '../../services/socket';
import { MESSAGE_MAX_LENGTH } from '../../config/constants';

export function MessageInput() {
  const [message, setMessage] = useState('');
  const { currentChannel, typingUsers } = useChatStore();
  const socket = getSocket();

  const handleSend = () => {
    if (message.trim() && socket) {
      socket.emit('send_message', {
        room: currentChannel,
        message: message.trim(),
      });
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = () => {
    socket?.emit('typing', { room: currentChannel });
  };

  const typingDisplay = typingUsers.length > 0
    ? typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : `${typingUsers.slice(0, 2).join(', ')}${typingUsers.length > 2 ? ` and ${typingUsers.length - 2} others` : ''} are typing...`
    : '';

  return (
    <div className="px-4 pb-6 pt-2">
      <div className="h-6 px-2 text-xs font-bold text-gray-400 animate-pulse">
        {typingDisplay}
      </div>
      <div className="bg-discord_channels rounded-lg px-4 py-2 flex items-center">
        <input
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          maxLength={MESSAGE_MAX_LENGTH}
          className="bg-transparent w-full focus:outline-none text-gray-200 placeholder-gray-400"
          placeholder={`Message #${currentChannel}`}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="ml-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:hover:text-gray-400 transition"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>
      {message.length > MESSAGE_MAX_LENGTH - 100 && (
        <div className="text-xs text-gray-500 mt-1 text-right">
          {MESSAGE_MAX_LENGTH - message.length} characters remaining
        </div>
      )}
    </div>
  );
}
