const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

app.use(cors({
  origin: ["http://localhost:5173", "https://eric-chat-app.vercel.app"],
  methods: ["GET", "POST"]
}));

// 1. DB CONNECTION
mongoose.connect("mongodb+srv://eric:79258279a@cluster0.6g7pkew.mongodb.net/chatdb?retryWrites=true&w=majority")
  .then(async () => {
    console.log("MONGODB CONNECTED");
    const existing = await Channel.findOne({ name: "general" });
    if (!existing) {
      const generalChannel = new Channel({ name: "general" });
      await generalChannel.save();
    }
  })
  .catch((err) => console.log("DB Error:", err));

// SCHEMAS
const channelSchema = new mongoose.Schema({ name: String });
const Channel = mongoose.model("Channel", channelSchema);

const messageSchema = new mongoose.Schema({ room: String, author: String, message: String, time: String });
const Message = mongoose.model("Message", messageSchema);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // MAKE SURE THERE IS NO SLASH "/" AT THE END OF THE URL!
    origin: ["http://localhost:5173", "https://eric-chat-app.vercel.app"],
    methods: ["GET", "POST"],
  },
});

// ---------------------------------------------------------
// NEW: TRACK ONLINE USERS
// Map Key: socket.id, Value: { username, room }
// ---------------------------------------------------------
const onlineUsers = new Map(); 

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Send channel list
  Channel.find().then((channels) => socket.emit("update_channels", channels));

  // UPDATED: JOIN ROOM (Now expects an Object { room, username })
  socket.on("join_room", ({ room, username }) => {
    
    // 1. Handle Room Switching (Remove user from old room list)
    const previousData = onlineUsers.get(socket.id);
    if (previousData && previousData.room !== room) {
        socket.leave(previousData.room);
        // Update the OLD room's list
        const usersInOldRoom = Array.from(onlineUsers.values()).filter(u => u.room === previousData.room);
        // We have to manually remove the current user from this temp list before sending
        const filteredOld = usersInOldRoom.filter(u => u.username !== username);
        io.to(previousData.room).emit("update_user_list", filteredOld);
    }

    // 2. Join New Room
    socket.join(room);
    onlineUsers.set(socket.id, { username, room });

    // 3. Send updated list to NEW room
    const usersInNewRoom = Array.from(onlineUsers.values()).filter(u => u.room === room);
    io.to(room).emit("update_user_list", usersInNewRoom);

    // 4. Load Messages
    Message.find({ room: room }).then((result) => {
      socket.emit("load_messages", result);
    });
  });

  socket.on("send_message", (data) => {
    const messageToSave = new Message(data);
    messageToSave.save().then(() => {
      socket.to(data.room).emit("receive_message", data);
    });
  });

  socket.on("create_channel", async (newChannelName) => {
    const existing = await Channel.findOne({ name: newChannelName });
    if (!existing) {
      const newChannel = new Channel({ name: newChannelName });
      await newChannel.save();
      const allChannels = await Channel.find();
      io.emit("update_channels", allChannels);
    }
  });

  socket.on("typing", (data) => {
    socket.to(data.room).emit("display_typing", data);
  });

  // UPDATED: DISCONNECT
  socket.on("disconnect", () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      onlineUsers.delete(socket.id);
      // Notify the room they left
      const usersInRoom = Array.from(onlineUsers.values()).filter(u => u.room === user.room);
      io.to(user.room).emit("update_user_list", usersInRoom);
    }
    console.log("User Disconnected", socket.id);
  });
});

server.listen(3001, () => {
  console.log("SERVER RUNNING");
});