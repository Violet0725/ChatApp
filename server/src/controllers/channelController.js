const { Channel, Message } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

/**
 * @desc    Get all channels
 * @route   GET /api/channels
 * @access  Private
 */
const getChannels = asyncHandler(async (req, res) => {
  const channels = await Channel.find({ isPrivate: false })
    .sort({ createdAt: 1 })
    .populate('createdBy', 'username');

  res.json({
    success: true,
    count: channels.length,
    data: channels,
  });
});

/**
 * @desc    Get single channel by ID
 * @route   GET /api/channels/:id
 * @access  Private
 */
const getChannel = asyncHandler(async (req, res) => {
  const channel = await Channel.findById(req.params.id).populate('createdBy', 'username');

  if (!channel) {
    throw new ApiError('Channel not found', 404);
  }

  res.json({
    success: true,
    data: channel,
  });
});

/**
 * @desc    Create new channel
 * @route   POST /api/channels
 * @access  Private
 */
const createChannel = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  // Check if channel exists
  const existing = await Channel.findOne({ name: name.toLowerCase() });
  if (existing) {
    throw new ApiError('Channel already exists', 400);
  }

  const channel = await Channel.create({
    name: name.toLowerCase(),
    description,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Channel created successfully',
    data: channel,
  });
});

/**
 * @desc    Delete channel
 * @route   DELETE /api/channels/:id
 * @access  Private (creator only)
 */
const deleteChannel = asyncHandler(async (req, res) => {
  const channel = await Channel.findById(req.params.id);

  if (!channel) {
    throw new ApiError('Channel not found', 404);
  }

  // Check ownership
  if (channel.createdBy?.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized to delete this channel', 403);
  }

  // Don't allow deleting general channel
  if (channel.name === 'general') {
    throw new ApiError('Cannot delete the general channel', 400);
  }

  await channel.deleteOne();

  // Also delete all messages in channel
  await Message.deleteMany({ room: channel.name });

  res.json({
    success: true,
    message: 'Channel deleted successfully',
  });
});

/**
 * @desc    Get messages for a channel
 * @route   GET /api/channels/:name/messages
 * @access  Private
 */
const getChannelMessages = asyncHandler(async (req, res) => {
  const { name } = req.params;
  const { limit = 50, before } = req.query;

  const query = { room: name, isDeleted: false };
  
  // Pagination: get messages before a certain timestamp
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('author', 'username avatar');

  // Return in chronological order
  res.json({
    success: true,
    count: messages.length,
    data: messages.reverse(),
  });
});

module.exports = {
  getChannels,
  getChannel,
  createChannel,
  deleteChannel,
  getChannelMessages,
};
