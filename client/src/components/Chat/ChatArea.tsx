import { useChatStore } from '../../store';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export function ChatArea() {
  const { currentChannel } = useChatStore();

  return (
    <div className="flex-1 bg-discord_gray flex flex-col min-w-0">
      {/* Channel Header */}
      <div className="h-12 shadow-sm border-b border-black/20 flex items-center px-4 bg-discord_gray">
        <span className="text-gray-400 text-2xl mr-2">#</span>
        <span className="font-bold text-white">{currentChannel}</span>
      </div>

      {/* Messages */}
      <MessageList />

      {/* Input */}
      <MessageInput />
    </div>
  );
}
