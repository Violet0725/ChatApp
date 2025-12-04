const { Channel, Message, User, Conversation, DirectMessage } = require('../models');

// Track online users: Map<socketId, { odName, odId, room }>
const onlineUsers = new Map();

/**
 * Initialize socket handlers
 * @param {Server} io - Socket.io server instance
 */
const initializeSocket = (io) => {
  io.on('connection', async (socket) => {
    const user = socket.user; // Set by socketAuth middleware (may be null for guests)
    const displayName = user?.username || 'Guest';
    console.log(`User Connected: ${displayName} (${socket.id})`);

    // Update user status to online if authenticated
    if (user?._id) {
      await User.findByIdAndUpdate(user._id, { status: 'online' });
    }

    // Send initial channel list
    const channels = await Channel.find().sort({ createdAt: 1 });
    socket.emit('update_channels', channels);

    /**
     * Join Room Event
     */
    socket.on('join_room', async ({ room, username }) => {
      try {
        // Support both authenticated users and guest usernames
        const userName = user?.username || username || `Guest_${socket.id.slice(0, 6)}`;
        const odId = user?._id?.toString() || socket.id;

        // Handle room switching - leave previous room
        const previousData = onlineUsers.get(socket.id);
        if (previousData && previousData.room !== room) {
          socket.leave(previousData.room);
          // User list will be broadcast after joining new room
        }

        // Join new room
        socket.join(room);
        onlineUsers.set(socket.id, {
          odId,
          odName: userName,
          room,
        });

        // Broadcast ALL online users to everyone (not just current room)
        const allUsers = getAllOnlineUsers();
        io.emit('update_user_list', allUsers);

        // Load message history
        const messages = await Message.find({ room, isDeleted: false })
          .sort({ createdAt: -1 })
          .limit(100)
          .populate('author', 'username avatar');

        socket.emit('load_messages', messages.reverse());

        console.log(`${userName} joined room: ${room}`);
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    /**
     * Send Message Event
     */
    socket.on('send_message', async (data) => {
      try {
        // Get username from authenticated user, data, or online users
        const userData = onlineUsers.get(socket.id);
        const authorName = user?.username || data.author || userData?.odName || 'Guest';

        const messageDoc = await Message.create({
          room: data.room,
          author: user?._id || null,
          authorName,
          message: data.message,
          type: data.type || 'text',
        });

        const messageData = {
          _id: messageDoc._id,
          room: messageDoc.room,
          author: user ? {
            _id: user._id,
            username: user.username,
            avatar: user.avatar,
          } : null,
          authorName,
          message: messageDoc.message,
          type: messageDoc.type,
          createdAt: messageDoc.createdAt,
          formattedTime: messageDoc.formattedTime,
        };

        // Broadcast to room (including sender)
        io.to(data.room).emit('receive_message', messageData);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * Create Channel Event
     */
    socket.on('create_channel', async (channelName) => {
      try {
        const cleanName = channelName.trim().toLowerCase().replace(/\s+/g, '-');
        const userData = onlineUsers.get(socket.id);
        const creatorName = user?.username || userData?.odName || 'Guest';
        
        const existing = await Channel.findOne({ name: cleanName });
        if (existing) {
          socket.emit('error', { message: 'Channel already exists' });
          return;
        }

        await Channel.create({
          name: cleanName,
          createdBy: user?._id || null,
        });

        const allChannels = await Channel.find().sort({ createdAt: 1 });
        io.emit('update_channels', allChannels);

        console.log(`Channel created: ${cleanName} by ${creatorName}`);
      } catch (error) {
        console.error('Create channel error:', error);
        socket.emit('error', { message: 'Failed to create channel' });
      }
    });

    /**
     * Typing Indicator Event
     */
    socket.on('typing', (data) => {
      const userData = onlineUsers.get(socket.id);
      const userName = user?.username || userData?.odName || 'Someone';
      socket.to(data.room).emit('display_typing', {
        user: userName,
        room: data.room,
      });
    });

    /**
     * Edit Message Event (only for authenticated users)
     */
    socket.on('edit_message', async ({ messageId, newContent }) => {
      try {
        if (!user?._id) {
          socket.emit('error', { message: 'Must be logged in to edit messages' });
          return;
        }

        const message = await Message.findById(messageId);
        
        if (!message || message.author?.toString() !== user._id.toString()) {
          socket.emit('error', { message: 'Cannot edit this message' });
          return;
        }

        message.message = newContent;
        message.isEdited = true;
        await message.save();

        io.to(message.room).emit('message_edited', {
          messageId,
          newContent,
          isEdited: true,
        });
      } catch (error) {
        console.error('Edit message error:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    /**
     * Delete Message Event (only for authenticated users)
     */
    socket.on('delete_message', async ({ messageId }) => {
      try {
        if (!user?._id) {
          socket.emit('error', { message: 'Must be logged in to delete messages' });
          return;
        }

        const message = await Message.findById(messageId);
        
        if (!message || message.author?.toString() !== user._id.toString()) {
          socket.emit('error', { message: 'Cannot delete this message' });
          return;
        }

        message.isDeleted = true;
        await message.save();

        io.to(message.room).emit('message_deleted', { messageId });
      } catch (error) {
        console.error('Delete message error:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    /**
     * Search Messages Event
     */
    socket.on('search_messages', async ({ query, room }) => {
      try {
        if (!query || query.length < 2) {
          socket.emit('search_results', []);
          return;
        }

        const searchQuery = {
          message: { $regex: query, $options: 'i' },
          isDeleted: false,
        };
        if (room) searchQuery.room = room;

        const results = await Message.find(searchQuery)
          .sort({ createdAt: -1 })
          .limit(50)
          .populate('author', 'username avatar');

        socket.emit('search_results', results);
      } catch (error) {
        console.error('Search error:', error);
        socket.emit('search_results', []);
      }
    });

    /**
     * Start DM / Get Conversation Event
     */
    socket.on('start_dm', async ({ targetUser }) => {
      try {
        const userData = onlineUsers.get(socket.id);
        const currentUser = {
          odName: user?.username || userData?.odName || 'Guest',
          odId: user?._id?.toString() || socket.id,
        };

        const conversation = await Conversation.findOrCreateConversation(currentUser, targetUser);
        
        // Load DM history
        const messages = await DirectMessage.find({ conversation: conversation._id })
          .sort({ createdAt: -1 })
          .limit(100);

        // Join a private room for this conversation
        socket.join(`dm_${conversation._id}`);
        
        socket.emit('dm_started', {
          conversation,
          messages: messages.reverse(),
        });
      } catch (error) {
        console.error('Start DM error:', error);
        socket.emit('error', { message: 'Failed to start DM' });
      }
    });

    /**
     * Send Direct Message Event
     */
    socket.on('send_dm', async ({ conversationId, message, recipientName }) => {
      try {
        const userData = onlineUsers.get(socket.id);
        const senderName = user?.username || userData?.odName || 'Guest';
        const senderId = user?._id?.toString() || socket.id;

        const dm = await DirectMessage.create({
          conversation: conversationId,
          sender: { odName: senderName, odId: senderId },
          recipient: { odName: recipientName },
          message,
        });

        // Update conversation's last message
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: {
            content: message,
            sender: senderName,
            timestamp: new Date(),
          },
        });

        const dmData = {
          _id: dm._id,
          conversation: conversationId,
          sender: dm.sender,
          recipient: dm.recipient,
          message: dm.message,
          createdAt: dm.createdAt,
          formattedTime: dm.formattedTime,
        };

        // Send to both users in the DM room
        io.to(`dm_${conversationId}`).emit('receive_dm', dmData);
        
        // Also notify recipient if they're online but not in DM view
        const recipientSocket = Array.from(onlineUsers.entries())
          .find(([_, u]) => u.odName === recipientName);
        if (recipientSocket) {
          io.to(recipientSocket[0]).emit('dm_notification', {
            from: senderName,
            preview: message.substring(0, 50),
            conversationId,
          });
        }
      } catch (error) {
        console.error('Send DM error:', error);
        socket.emit('error', { message: 'Failed to send DM' });
      }
    });

    /**
     * Get User's Conversations List
     */
    socket.on('get_conversations', async () => {
      try {
        const userData = onlineUsers.get(socket.id);
        const userName = user?.username || userData?.odName;
        
        if (!userName) {
          socket.emit('conversations_list', []);
          return;
        }

        const conversations = await Conversation.find({
          'participants.odName': userName,
        }).sort({ updatedAt: -1 });

        socket.emit('conversations_list', conversations);
      } catch (error) {
        console.error('Get conversations error:', error);
        socket.emit('conversations_list', []);
      }
    });

    /**
     * Add Reaction Event
     */
    socket.on('add_reaction', async ({ messageId, emoji }) => {
      try {
        const userData = onlineUsers.get(socket.id);
        const userName = user?.username || userData?.odName || 'Guest';
        
        const message = await Message.findById(messageId);
        if (!message) return;

        // Find or create reaction entry for this emoji
        let reaction = message.reactions.find(r => r.emoji === emoji);
        if (reaction) {
          // Toggle: remove if already reacted, add if not
          if (reaction.users.includes(userName)) {
            reaction.users = reaction.users.filter(u => u !== userName);
            if (reaction.users.length === 0) {
              message.reactions = message.reactions.filter(r => r.emoji !== emoji);
            }
          } else {
            reaction.users.push(userName);
          }
        } else {
          message.reactions.push({ emoji, users: [userName] });
        }

        await message.save();
        io.to(message.room).emit('message_reaction_updated', {
          messageId,
          reactions: message.reactions,
        });
      } catch (error) {
        console.error('Add reaction error:', error);
      }
    });

    /**
     * Disconnect Event
     */
    socket.on('disconnect', async () => {
      const userData = onlineUsers.get(socket.id);
      const userName = user?.username || userData?.odName || 'Guest';
      
      if (userData) {
        onlineUsers.delete(socket.id);

        // Check if authenticated user has other active connections
        if (user?._id) {
          const hasOtherConnections = Array.from(onlineUsers.values())
            .some(u => u.odId === user._id.toString());

          if (!hasOtherConnections) {
            // Update user status to offline
            await User.findByIdAndUpdate(user._id, {
              status: 'offline',
              lastSeen: new Date(),
            });
          }
        }

        // Broadcast updated online list to everyone
        const allUsers = getAllOnlineUsers();
        io.emit('update_user_list', allUsers);
      }

      console.log(`User Disconnected: ${userName} (${socket.id})`);
    });
  });
};

/**
 * Get list of users in a specific room
 */
const getUsersInRoom = (room) => {
  return Array.from(onlineUsers.values())
    .filter(u => u.room === room)
    .map(u => ({
      odName: u.odName,
      odId: u.odId,
    }));
};

/**
 * Get ALL online users (across all channels)
 */
const getAllOnlineUsers = () => {
  // Use a Map to dedupe by odId (same user in multiple tabs)
  const uniqueUsers = new Map();
  for (const u of onlineUsers.values()) {
    if (!uniqueUsers.has(u.odId)) {
      uniqueUsers.set(u.odId, {
        odName: u.odName,
        odId: u.odId,
        room: u.room,
      });
    }
  }
  return Array.from(uniqueUsers.values());
};

module.exports = { initializeSocket, onlineUsers };
