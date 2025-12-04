const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  refreshToken,
  logout,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// Public routes
router.post('/register', validate('register'), register);
router.post('/login', validate('login'), login);
router.post('/refresh', refreshToken);

// Protected routes
router.use(protect); // All routes below require authentication
router.get('/me', getMe);
router.post('/logout', logout);
router.put('/profile', updateProfile);

module.exports = router;
