import { useChatStore } from '../../store';

export function OnlineUsers() {
  const { usersInRoom } = useChatStore();

  return (
    <div className="w-60 bg-discord_channels flex flex-col shrink-0 border-l border-gray-900">
      <div className="h-12 shadow-sm border-b border-gray-900 flex items-center px-4 font-bold text-gray-400 text-xs uppercase">
        Online — {usersInRoom.length}
      </div>
      <div className="flex-1 p-2 space-y-1 overflow-y-auto">
        {usersInRoom.map((user, index) => (
          <div
            key={index}
            className="flex items-center px-2 py-2 hover:bg-discord_hover rounded cursor-pointer opacity-90 hover:opacity-100"
          >
            <div className="relative">
              <div className="w-8 h-8 bg-green-500 rounded-full mr-3 flex items-center justify-center font-bold text-white text-xs">
                {user.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-discord_channels" />
            </div>
            <div className="font-bold text-gray-300 text-sm">
              {user.username}
            </div>
          </div>
        ))}
        {usersInRoom.length === 0 && (
          <div className="text-gray-500 text-sm text-center py-4">
            No users online
          </div>
        )}
      </div>
    </div>
  );
}
