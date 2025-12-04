const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  sender: {
    odName: { type: String, required: true },
    odId: { type: String },
  },
  recipient: {
    odName: { type: String, required: true },
    odId: { type: String },
  },
  message: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text',
  },
  fileUrl: String,
  fileName: String,
  isRead: {
    type: Boolean,
    default: false,
  },
  reactions: [{
    emoji: String,
    users: [String],
  }],
}, { timestamps: true });

// Index for efficient DM queries
directMessageSchema.index({ conversation: 1, createdAt: -1 });

// Virtual for formatted time
directMessageSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

directMessageSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('DirectMessage', directMessageSchema);
