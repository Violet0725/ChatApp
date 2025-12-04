const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware to protect routes - verifies JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - no token provided',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not found',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized - invalid token',
    });
  }
};

/**
 * Socket.io authentication middleware (optional auth)
 * Allows guest connections but attaches user if valid token provided
 */
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    // Allow guest connections (for backwards compatibility)
    if (!token) {
      socket.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    // Attach user to socket if found
    socket.user = user || null;
    next();
  } catch (error) {
    // Invalid token - allow as guest
    console.warn('Socket auth failed:', error.message);
    socket.user = null;
    next();
  }
};

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * Generate refresh token (longer expiry)
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = {
  protect,
  socketAuth,
  generateToken,
  generateRefreshToken,
};
