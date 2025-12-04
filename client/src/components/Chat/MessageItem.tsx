import type { Message } from '../../types';

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const authorName = typeof message.author === 'string' 
    ? message.authorName 
    : message.author?.username || message.authorName;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex items-start hover:bg-gray-800/30 p-1 rounded group">
      <div className="w-10 h-10 rounded-full bg-indigo-500 mr-3 shrink-0 flex items-center justify-center font-bold uppercase text-white">
        {authorName?.[0] || '?'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline space-x-2">
          <span className="font-bold text-white cursor-pointer hover:underline">
            {authorName}
          </span>
          <span className="text-xs text-gray-400">
            {message.formattedTime || formatTime(message.createdAt)}
          </span>
          {message.isEdited && (
            <span className="text-xs text-gray-500">(edited)</span>
          )}
        </div>
        <p className="text-gray-100 break-words">{message.message}</p>
      </div>
    </div>
  );
}
