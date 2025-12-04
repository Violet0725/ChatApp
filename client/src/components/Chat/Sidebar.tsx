import { useChatStore, useAuthStore } from '../../store';
import { getSocket } from '../../services/socket';

export function Sidebar() {
  const { channels, currentChannel, setCurrentChannel } = useChatStore();
  const { user, logout } = useAuthStore();
  const socket = getSocket();

  const handleJoinRoom = (roomName: string) => {
    if (roomName !== currentChannel) {
      setCurrentChannel(roomName);
      socket?.emit('join_room', { room: roomName });
    }
  };

  const handleCreateChannel = () => {
    const newChannelName = prompt('Enter new channel name:');
    if (newChannelName?.trim()) {
      const cleanName = newChannelName.trim().toLowerCase().replace(/\s+/g, '-');
      socket?.emit('create_channel', cleanName);
    }
  };

  return (
    <div className="w-60 bg-discord_channels flex flex-col shrink-0">
      {/* Server Header */}
      <div className="h-12 shadow-sm border-b border-gray-900 flex items-center px-4 font-bold text-white">
        Chat Server
      </div>

      {/* Channels List */}
      <div className="flex-1 p-2 space-y-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="text-xs font-bold text-gray-400 uppercase">
            Text Channels
          </div>
          <button
            onClick={handleCreateChannel}
            className="text-gray-400 hover:text-white text-xl font-bold transition"
            title="Create Channel"
          >
            +
          </button>
        </div>

        {channels.map((channel) => (
          <div
            key={channel._id}
            onClick={() => handleJoinRoom(channel.name)}
            className={`flex items-center px-2 py-1 rounded cursor-pointer transition ${
              currentChannel === channel.name
                ? 'bg-discord_hover text-gray-100'
                : 'text-gray-400 hover:bg-discord_hover hover:text-gray-200'
            }`}
          >
            <span className="text-gray-500 text-xl mr-2">#</span>
            {channel.name}
          </div>
        ))}
      </div>

      {/* User Panel */}
      <div className="bg-[#232428] p-2 flex items-center justify-between border-t border-gray-900">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-green-500 rounded-full mr-2 flex items-center justify-center font-bold text-white text-xs">
            {user?.username?.substring(0, 2).toUpperCase()}
          </div>
          <div className="text-sm">
            <div className="font-bold text-white text-xs">{user?.username}</div>
            <div className="text-xs text-green-400">Online</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="hover:bg-gray-700 p-2 rounded text-gray-400 hover:text-white transition text-xs"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
