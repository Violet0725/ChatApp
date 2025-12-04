const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    odName: { type: String, required: true },
    odId: { type: String },
  }],
  lastMessage: {
    content: String,
    sender: String,
    timestamp: Date,
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {},
  },
}, { timestamps: true });

// Index for finding conversations by participant
conversationSchema.index({ 'participants.odName': 1 });

// Get or create a conversation between two users
conversationSchema.statics.findOrCreateConversation = async function(user1, user2) {
  // Sort to ensure consistent ordering
  const sorted = [user1, user2].sort((a, b) => a.odName.localeCompare(b.odName));
  
  let conversation = await this.findOne({
    'participants.odName': { $all: [sorted[0].odName, sorted[1].odName] },
    participants: { $size: 2 },
  });

  if (!conversation) {
    conversation = await this.create({
      participants: sorted,
    });
  }

  return conversation;
};

module.exports = mongoose.model('Conversation', conversationSchema);
