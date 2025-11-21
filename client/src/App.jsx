import { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io.connect("http://localhost:3001");

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [rooms, setRooms] = useState([]); 
  const [currentRoom, setCurrentRoom] = useState("general");
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [typingStatus, setTypingStatus] = useState("");
  
  // NEW STATE: List of online users
  const [usersInRoom, setUsersInRoom] = useState([]);

  // LOGIN
  const joinChat = () => {
    if (userName !== "") {
      setIsLoggedIn(true);
      localStorage.setItem("chat_username", userName);
      // UPDATED: Send object { room, username }
      socket.emit("join_room", { room: "general", username: userName });
    }
  };

  // SWITCH ROOMS
  const joinRoom = (roomName) => {
    if (roomName !== currentRoom) {
      // UPDATED: Send object { room, username }
      socket.emit("join_room", { room: roomName, username: userName });
      setCurrentRoom(roomName);
      setTypingStatus(""); 
    }
  };

  const createChannel = () => {
    const newChannelName = prompt("Enter new channel name:");
    if (newChannelName && newChannelName.trim() !== "") {
      const cleanName = newChannelName.trim().toLowerCase().replace(/\s+/g, '-');
      socket.emit("create_channel", cleanName);
    }
  };

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room: currentRoom,
        author: userName,
        message: currentMessage,
        time: new Date(Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
  };

  const handleInput = (e) => {
    setCurrentMessage(e.target.value);
    socket.emit("typing", { room: currentRoom, user: userName });
  };

  useEffect(() => {
    const savedName = localStorage.getItem("chat_username");
    if (savedName) {
      setUserName(savedName);
      setIsLoggedIn(true);
      // UPDATED: Send object
      socket.emit("join_room", { room: "general", username: savedName });
    }
  }, []); 

  useEffect(() => {
    const handleReceiveMessage = (data) => {
      setMessageList((list) => [...list, data]);
    };
    const handleLoadMessages = (history) => {
      setMessageList(history);
    };
    const handleUpdateChannels = (channelList) => {
      setRooms(channelList);
    };
    const handleDisplayTyping = (data) => {
      setTypingStatus(`${data.user} is typing...`);
      setTimeout(() => setTypingStatus(""), 3000);
    };
    
    // NEW: Handle user list update
    const handleUserList = (userList) => {
        setUsersInRoom(userList);
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("load_messages", handleLoadMessages);
    socket.on("update_channels", handleUpdateChannels);
    socket.on("display_typing", handleDisplayTyping);
    socket.on("update_user_list", handleUserList); // Bind

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("load_messages", handleLoadMessages);
      socket.off("update_channels", handleUpdateChannels);
      socket.off("display_typing", handleDisplayTyping);
      socket.off("update_user_list", handleUserList); // Unbind
    };
  }, [socket]);


  if (!isLoggedIn) {
    return (
      <div className="h-screen flex items-center justify-center bg-discord_gray">
        <div className="bg-discord_channels p-8 rounded-lg shadow-lg w-96 text-center">
          <h2 className="text-2xl text-white font-bold mb-4">Welcome Back!</h2>
          <input 
            type="text" placeholder="Username" 
            className="w-full p-3 mb-4 rounded bg-discord_gray text-white focus:outline-none focus:ring-2 focus:ring-discord_purple"
            onChange={(event) => setUserName(event.target.value)}
          />
          <button onClick={joinChat} className="w-full bg-discord_purple text-white p-3 rounded font-bold hover:bg-indigo-500 transition">Join Server</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen text-gray-100 font-sans overflow-hidden">
      
      {/* LEFT SIDEBAR */}
      <div className="w-60 bg-discord_channels flex flex-col shrink-0">
        <div className="h-12 shadow-sm border-b border-gray-900 flex items-center px-4 font-bold text-white shadow-md">Eric's Server</div>
        <div className="flex-1 p-2 space-y-1 overflow-y-auto">
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="text-xs font-bold text-gray-400 uppercase">Text Channels</div>
            <button onClick={createChannel} className="text-gray-400 hover:text-white text-xl font-bold transition">+</button>
          </div>
          {rooms.map((roomObj) => (
             <div key={roomObj._id} onClick={() => joinRoom(roomObj.name)} className={`flex items-center px-2 py-1 rounded cursor-pointer transition ${currentRoom === roomObj.name ? "bg-discord_hover text-gray-100" : "text-gray-400 hover:bg-discord_hover hover:text-gray-200"}`}>
            <span className="text-gray-500 text-xl mr-2">#</span> {roomObj.name}
          </div>
          ))}
        </div>
        <div className="bg-[#232428] p-2 flex items-center justify-between border-t border-gray-900">
            <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full mr-2 flex items-center justify-center font-bold text-white text-xs">{userName.substring(0, 2).toUpperCase()}</div>
                <div className="text-sm"><div className="font-bold text-white text-xs">{userName}</div><div className="text-xs text-gray-400">#1234</div></div>
            </div>
            <button onClick={() => { localStorage.removeItem("chat_username"); setIsLoggedIn(false); setUserName(""); }} className="hover:bg-gray-700 p-2 rounded text-gray-400 hover:text-white transition">Log Out</button>
        </div>
      </div> 

      {/* MIDDLE: CHAT AREA */}
      <div className="flex-1 bg-discord_gray flex flex-col min-w-0">
        <div className="h-12 shadow-sm border-b border-black/20 flex items-center px-4 bg-discord_gray">
          <span className="text-gray-400 text-2xl mr-2">#</span><span className="font-bold text-white">{currentRoom}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messageList.map((msg, key) => (
             <div key={key} className="flex items-start hover:bg-gray-800/30 p-1 rounded">
             <div className="w-10 h-10 rounded-full bg-indigo-500 mr-3 shrink-0 flex items-center justify-center font-bold uppercase text-white">{msg.author[0]}</div>
             <div className="min-w-0">
               <div className="flex items-baseline space-x-2">
                 <span className="font-bold text-white cursor-pointer hover:underline">{msg.author}</span>
                 <span className="text-xs text-gray-400">{msg.time}</span>
               </div>
               <p className="text-gray-100 break-words">{msg.message}</p>
             </div>
           </div>
          ))}
        </div>
        <div className="px-4 pb-6 pt-2">
          <div className="h-6 px-2 text-xs font-bold text-gray-400 animate-pulse">{typingStatus}</div>
          <div className="bg-discord_channels rounded-lg px-4 py-2 flex items-center">
             <input className="bg-transparent w-full focus:outline-none text-gray-200 placeholder-gray-400" placeholder={`Message #${currentRoom}`} value={currentMessage} onChange={handleInput} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} />
          </div>
        </div>
      </div>

      {/* NEW RIGHT SIDEBAR: WHO'S ONLINE */}
      <div className="w-60 bg-discord_channels flex flex-col shrink-0 border-l border-gray-900">
        <div className="h-12 shadow-sm border-b border-gray-900 flex items-center px-4 font-bold text-gray-400 text-xs uppercase">
           Online — {usersInRoom.length}
        </div>
        <div className="flex-1 p-2 space-y-1 overflow-y-auto">
            {usersInRoom.map((user, index) => (
                <div key={index} className="flex items-center px-2 py-2 hover:bg-discord_hover rounded cursor-pointer opacity-90 hover:opacity-100">
                    <div className="w-8 h-8 bg-green-500 rounded-full mr-3 flex items-center justify-center font-bold text-white text-xs">
                        {user.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="font-bold text-gray-300 text-sm">
                        {user.username}
                    </div>
                </div>
            ))}
        </div>
      </div>

    </div>
  );
}

export default App;