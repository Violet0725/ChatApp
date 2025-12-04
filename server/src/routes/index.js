const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const channelRoutes = require('./channelRoutes');
const uploadRoutes = require('./uploadRoutes');
const { Message } = require('../models');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Search messages endpoint
router.get('/search', async (req, res) => {
  try {
    const { q, room } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const searchQuery = {
      message: { $regex: q, $options: 'i' },
      isDeleted: false,
    };
    if (room) searchQuery.room = room;

    const results = await Message.find(searchQuery)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/channels', channelRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;
