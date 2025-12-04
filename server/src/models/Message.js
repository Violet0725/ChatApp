const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: {
    type: String,
    required: true,
    index: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,  // Optional for guest users
    default: null,
  },
  authorName: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text',
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  reactions: [{
    emoji: { type: String, required: true },
    users: [{ type: String }], // usernames who reacted
  }],
}, { timestamps: true });

// Compound index for efficient message queries
messageSchema.index({ room: 1, createdAt: -1 });

// Virtual for formatted time
messageSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

// Ensure virtuals are included in JSON
messageSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Message', messageSchema);
