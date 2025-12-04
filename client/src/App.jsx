import { useState, useEffect } from "react";
import io from "socket.io-client";

// Use environment variable or fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:3001";
const socket = io.connect(API_URL);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [rooms, setRooms] = useState([]); 
  const [currentRoom, setCurrentRoom] = useState("general");
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [typingStatus, setTypingStatus] = useState("");
  const [usersInRoom, setUsersInRoom] = useState([]);
  
  // Auth mode toggle and full auth state
  const [authMode, setAuthMode] = useState("simple"); // "simple" or "full"
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authError, setAuthError] = useState("");
  
  // New features state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [dmView, setDmView] = useState(null); // { odName, odId, conversationId }
  const [dmMessages, setDmMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null); // messageId
  const [dmNotification, setDmNotification] = useState(null);

  const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉"];

  // SIMPLE LOGIN (username only)
  const joinChat = () => {
    if (userName !== "") {
      setIsLoggedIn(true);
      localStorage.setItem("chat_username", userName);
      localStorage.setItem("chat_auth_mode", "simple");
      socket.emit("join_room", { room: "general", username: userName });
    }
  };

  // FULL AUTH: Register with email/password
  const handleRegister = async () => {
    setAuthError("");
    if (!userName || userName.length < 2) {
      setAuthError("Username must be at least 2 characters");
      return;
    }
    if (!email || !email.includes("@")) {
      setAuthError("Please enter a valid email");
      return;
    }
    if (password !== confirmPassword) {
      setAuthError("Passwords don't match");
      return;
    }
    if (password.length < 4) {
      setAuthError("Password must be at least 4 characters");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userName, email, password }),
      });
      const data = await res.json();
      // Show specific validation errors from server
      if (!res.ok) {
        const errorMsg = data.errors?.join(", ") || data.message || "Registration failed";
        throw new Error(errorMsg);
      }
      
      // Auto-login after registration
      const { user, token } = data.data;
      localStorage.setItem("chat_token", token);
      localStorage.setItem("chat_username", user.username);
      localStorage.setItem("chat_auth_mode", "full");
      setUserName(user.username);
      setIsLoggedIn(true);
      socket.emit("join_room", { room: "general", username: user.username });
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // FULL AUTH: Login with email/password
  const handleLogin = async () => {
    setAuthError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      
      const { user, token } = data.data;
      localStorage.setItem("chat_token", token);
      localStorage.setItem("chat_username", user.username);
      localStorage.setItem("chat_auth_mode", "full");
      setUserName(user.username);
      setIsLoggedIn(true);
      socket.emit("join_room", { room: "general", username: user.username });
    } catch (err) {
      setAuthError(err.message);
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
      };
      await socket.emit("send_message", messageData);
      // Don't add locally - server will broadcast back to everyone including sender
      setCurrentMessage("");
    }
  };

  const handleInput = (e) => {
    setCurrentMessage(e.target.value);
    socket.emit("typing", { room: currentRoom, user: userName });
  };

  // Add reaction to message
  const addReaction = (messageId, emoji) => {
    socket.emit("add_reaction", { messageId, emoji });
    setShowEmojiPicker(null);
  };

  // Search messages
  const handleSearch = () => {
    if (searchQuery.length >= 2) {
      socket.emit("search_messages", { query: searchQuery, room: currentRoom });
    }
  };

  // Start DM with user
  const startDM = (targetUser) => {
    socket.emit("start_dm", { targetUser });
  };

  // Send DM
  const sendDM = () => {
    if (currentMessage && dmView) {
      socket.emit("send_dm", {
        conversationId: dmView.conversationId,
        message: currentMessage,
        recipientName: dmView.odName,
      });
      setCurrentMessage("");
    }
  };

  // Exit DM view
  const exitDM = () => {
    setDmView(null);
    setDmMessages([]);
  };

  // File upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        const fileMessage = file.type.startsWith("image/") 
          ? `[Image: ${API_URL}${data.data.url}]`
          : `[File: ${data.data.originalName}](${API_URL}${data.data.url})`;
        
        if (dmView) {
          socket.emit("send_dm", {
            conversationId: dmView.conversationId,
            message: fileMessage,
            recipientName: dmView.odName,
          });
        } else {
          socket.emit("send_message", {
            room: currentRoom,
            author: userName,
            message: fileMessage,
          });
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  useEffect(() => {
    const savedName = localStorage.getItem("chat_username");
    const savedAuthMode = localStorage.getItem("chat_auth_mode") || "simple";
    
    setAuthMode(savedAuthMode);
    
    if (savedName) {
      setUserName(savedName);
      setIsLoggedIn(true);
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
    const handleUserList = (userList) => {
      setUsersInRoom(userList);
    };

    // New feature handlers
    const handleReactionUpdated = ({ messageId, reactions }) => {
      setMessageList((list) =>
        list.map((msg) =>
          msg._id === messageId ? { ...msg, reactions } : msg
        )
      );
    };
    const handleSearchResults = (results) => {
      setSearchResults(results);
    };
    const handleDmStarted = ({ conversation, messages }) => {
      const otherUser = conversation.participants.find(p => p.odName !== userName);
      setDmView({
        odName: otherUser?.odName,
        odId: otherUser?.odId,
        conversationId: conversation._id,
      });
      setDmMessages(messages);
    };
    const handleReceiveDm = (dm) => {
      setDmMessages((list) => [...list, dm]);
    };
    const handleDmNotification = (notification) => {
      setDmNotification(notification);
      setTimeout(() => setDmNotification(null), 5000);
    };
    const handleConversationsList = () => {
      // Conversations list received (can be used for DM sidebar)
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("load_messages", handleLoadMessages);
    socket.on("update_channels", handleUpdateChannels);
    socket.on("display_typing", handleDisplayTyping);
    socket.on("update_user_list", handleUserList);
    socket.on("message_reaction_updated", handleReactionUpdated);
    socket.on("search_results", handleSearchResults);
    socket.on("dm_started", handleDmStarted);
    socket.on("receive_dm", handleReceiveDm);
    socket.on("dm_notification", handleDmNotification);
    socket.on("conversations_list", handleConversationsList);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("load_messages", handleLoadMessages);
      socket.off("update_channels", handleUpdateChannels);
      socket.off("display_typing", handleDisplayTyping);
      socket.off("update_user_list", handleUserList);
      socket.off("message_reaction_updated", handleReactionUpdated);
      socket.off("search_results", handleSearchResults);
      socket.off("dm_started", handleDmStarted);
      socket.off("receive_dm", handleReceiveDm);
      socket.off("dm_notification", handleDmNotification);
      socket.off("conversations_list", handleConversationsList);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName]);


  if (!isLoggedIn) {
    return (
      <div className="h-screen flex items-center justify-center bg-discord_gray">
        <div className="bg-discord_channels p-8 rounded-lg shadow-lg w-96 text-center">
          <h2 className="text-2xl text-white font-bold mb-4">
            {authMode === "simple" ? "Quick Join" : (isRegistering ? "Create Account" : "Welcome Back!")}
          </h2>
          
          {/* Auth Mode Toggle */}
          <div className="flex mb-6 bg-discord_gray rounded-lg p-1">
            <button 
              onClick={() => { setAuthMode("simple"); setAuthError(""); }}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${authMode === "simple" ? "bg-discord_purple text-white" : "text-gray-400 hover:text-white"}`}
            >
              Quick (Username)
            </button>
            <button 
              onClick={() => { setAuthMode("full"); setAuthError(""); }}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${authMode === "full" ? "bg-discord_purple text-white" : "text-gray-400 hover:text-white"}`}
            >
              Full (Email/Pass)
            </button>
          </div>

          {/* Error Message */}
          {authError && <div className="mb-4 p-2 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm">{authError}</div>}

          {authMode === "simple" ? (
            /* SIMPLE AUTH: Username only */
            <>
              <input 
                type="text" 
                placeholder="Enter a username" 
                className="w-full p-3 mb-4 rounded bg-discord_gray text-white focus:outline-none focus:ring-2 focus:ring-discord_purple"
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && joinChat()}
              />
              <button onClick={joinChat} className="w-full bg-discord_purple text-white p-3 rounded font-bold hover:bg-indigo-500 transition">
                Join Server
              </button>
              <p className="mt-4 text-xs text-gray-500">No account needed - just pick a name!</p>
            </>
          ) : (
            /* FULL AUTH: Email + Password */
            <>
              {isRegistering && (
                <input 
                  type="text" 
                  placeholder="Username" 
                  className="w-full p-3 mb-3 rounded bg-discord_gray text-white focus:outline-none focus:ring-2 focus:ring-discord_purple"
                  onChange={(e) => setUserName(e.target.value)}
                />
              )}
              <input 
                type="email" 
                placeholder="Email" 
                className="w-full p-3 mb-3 rounded bg-discord_gray text-white focus:outline-none focus:ring-2 focus:ring-discord_purple"
                onChange={(e) => setEmail(e.target.value)}
              />
              <input 
                type="password" 
                placeholder="Password" 
                className="w-full p-3 mb-3 rounded bg-discord_gray text-white focus:outline-none focus:ring-2 focus:ring-discord_purple"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isRegistering && handleLogin()}
              />
              {isRegistering && (
                <input 
                  type="password" 
                  placeholder="Confirm Password" 
                  className="w-full p-3 mb-3 rounded bg-discord_gray text-white focus:outline-none focus:ring-2 focus:ring-discord_purple"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                />
              )}
              <button 
                onClick={isRegistering ? handleRegister : handleLogin} 
                className="w-full bg-discord_purple text-white p-3 rounded font-bold hover:bg-indigo-500 transition"
              >
                {isRegistering ? "Create Account" : "Login"}
              </button>
              <p className="mt-4 text-sm text-gray-400">
                {isRegistering ? "Already have an account? " : "Need an account? "}
                <button 
                  onClick={() => { setIsRegistering(!isRegistering); setAuthError(""); }}
                  className="text-discord_purple hover:underline"
                >
                  {isRegistering ? "Login" : "Register"}
                </button>
              </p>
            </>
          )}
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
            <button onClick={() => { 
                localStorage.removeItem("chat_username"); 
                localStorage.removeItem("chat_token"); 
                localStorage.removeItem("chat_auth_mode"); 
                setIsLoggedIn(false); 
                setUserName(""); 
                setEmail("");
                setPassword("");
            }} className="hover:bg-gray-700 p-2 rounded text-gray-400 hover:text-white transition">Log Out</button>
        </div>
      </div> 

      {/* MIDDLE: CHAT AREA */}
      <div className="flex-1 bg-discord_gray flex flex-col min-w-0">
        {/* Header with search */}
        <div className="h-12 border-b border-black/20 flex items-center justify-between px-4 bg-discord_gray">
          <div className="flex items-center">
            {dmView ? (
              <>
                <button onClick={exitDM} className="mr-2 text-gray-400 hover:text-white">←</button>
                <span className="text-gray-400 mr-2">@</span>
                <span className="font-bold text-white">{dmView.odName}</span>
              </>
            ) : (
              <>
                <span className="text-gray-400 text-2xl mr-2">#</span>
                <span className="font-bold text-white">{currentRoom}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-discord_channels text-sm px-3 py-1 rounded text-gray-200 placeholder-gray-500 w-40 focus:outline-none focus:ring-1 focus:ring-discord_purple"
            />
            <button onClick={handleSearch} className="text-gray-400 hover:text-white text-sm">🔍</button>
          </div>
        </div>

        {/* Search Results Modal */}
        {searchResults.length > 0 && (
          <div className="absolute top-16 right-4 bg-discord_channels p-4 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50 w-80">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-bold">Search Results</span>
              <button onClick={() => setSearchResults([])} className="text-gray-400 hover:text-white">✕</button>
            </div>
            {searchResults.map((msg) => (
              <div key={msg._id} className="p-2 hover:bg-discord_hover rounded text-sm">
                <div className="text-gray-400 text-xs">{msg.authorName} in #{msg.room}</div>
                <div className="text-gray-200">{msg.message}</div>
              </div>
            ))}
          </div>
        )}

        {/* DM Notification */}
        {dmNotification && (
          <div className="absolute top-16 right-4 bg-discord_purple p-3 rounded-lg shadow-lg z-50 cursor-pointer"
               onClick={() => startDM({ odName: dmNotification.from })}>
            <div className="text-white font-bold">New DM from {dmNotification.from}</div>
            <div className="text-gray-200 text-sm">{dmNotification.preview}...</div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {(dmView ? dmMessages : messageList).map((msg, key) => (
            <div key={msg._id || key} className="flex items-start hover:bg-gray-800/30 p-1 rounded group relative">
              <div className="w-10 h-10 rounded-full bg-indigo-500 mr-3 shrink-0 flex items-center justify-center font-bold uppercase text-white">
                {(msg.authorName || msg.sender?.odName || msg.author || 'G')[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline space-x-2">
                  <span className="font-bold text-white cursor-pointer hover:underline">
                    {msg.authorName || msg.sender?.odName || msg.author}
                  </span>
                  <span className="text-xs text-gray-400">{msg.time || msg.formattedTime}</span>
                </div>
                {/* Render image if message contains image URL */}
                {msg.message.startsWith('[Image:') ? (
                  <img src={msg.message.match(/\[Image: (.+)\]/)?.[1]} alt="uploaded" className="max-w-xs rounded mt-1" />
                ) : msg.message.startsWith('[File:') ? (
                  <a href={msg.message.match(/\((.+)\)/)?.[1]} target="_blank" rel="noreferrer" className="text-discord_purple hover:underline">
                    📎 {msg.message.match(/\[File: (.+)\]/)?.[1]}
                  </a>
                ) : (
                  <p className="text-gray-100 break-words">{msg.message}</p>
                )}
                {/* Reactions */}
                {msg.reactions?.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {msg.reactions.map((r, i) => (
                      <button key={i} onClick={() => addReaction(msg._id, r.emoji)}
                              className="bg-discord_channels px-2 py-0.5 rounded text-sm hover:bg-discord_hover">
                        {r.emoji} {r.users.length}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Reaction button - only for channel messages */}
              {!dmView && msg._id && (
                <div className="absolute right-2 top-1 hidden group-hover:flex gap-1">
                  <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg._id ? null : msg._id)}
                          className="bg-discord_channels p-1 rounded hover:bg-discord_hover text-sm">
                    😀
                  </button>
                </div>
              )}
              {/* Emoji Picker */}
              {showEmojiPicker === msg._id && (
                <div className="absolute right-2 top-8 bg-discord_channels p-2 rounded-lg shadow-lg flex gap-1 z-50">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button key={emoji} onClick={() => addReaction(msg._id, emoji)}
                            className="hover:bg-discord_hover p-1 rounded text-lg">
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="px-4 pb-6 pt-2">
          <div className="h-6 px-2 text-xs font-bold text-gray-400 animate-pulse">{typingStatus}</div>
          <div className="bg-discord_channels rounded-lg px-4 py-2 flex items-center gap-2">
            <label className="cursor-pointer text-gray-400 hover:text-white">
              <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx,.txt" />
              📎
            </label>
            <input 
              className="bg-transparent w-full focus:outline-none text-gray-200 placeholder-gray-400" 
              placeholder={dmView ? `Message @${dmView.odName}` : `Message #${currentRoom}`} 
              value={currentMessage} 
              onChange={handleInput} 
              onKeyDown={(e) => e.key === 'Enter' && (dmView ? sendDM() : sendMessage())} 
            />
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: WHO'S ONLINE */}
      <div className="w-60 bg-discord_channels flex flex-col shrink-0 border-l border-gray-900">
        <div className="h-12 border-b border-gray-900 flex items-center px-4 font-bold text-gray-400 text-xs uppercase">
           Online — {usersInRoom.length}
        </div>
        <div className="flex-1 p-2 space-y-1 overflow-y-auto">
            {usersInRoom.map((user, index) => (
                <div key={index} className="flex items-center justify-between px-2 py-2 hover:bg-discord_hover rounded group">
                    <div className="flex items-center cursor-pointer opacity-90 hover:opacity-100"
                         onClick={() => user.odName !== userName && startDM({ odName: user.odName, odId: user.odId })}>
                        <div className="w-8 h-8 bg-green-500 rounded-full mr-3 flex items-center justify-center font-bold text-white text-xs">
                            {(user.odName || user.username || 'G').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="font-bold text-gray-300 text-sm">
                            {user.odName || user.username}
                            {user.odName === userName && <span className="text-xs text-gray-500 ml-1">(you)</span>}
                        </div>
                    </div>
                    {user.odName !== userName && (
                        <button 
                            onClick={() => startDM({ odName: user.odName, odId: user.odId })}
                            className="hidden group-hover:block text-gray-400 hover:text-white text-sm"
                            title="Send DM"
                        >
                            💬
                        </button>
                    )}
                </div>
            ))}
        </div>
      </div>

    </div>
  );
}

export default App;