const express = require('express');
const router = express.Router();
const {
  getChannels,
  getChannel,
  createChannel,
  deleteChannel,
  getChannelMessages,
} = require('../controllers/channelController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// All channel routes require authentication
router.use(protect);

router.route('/')
  .get(getChannels)
  .post(validate('createChannel'), createChannel);

router.route('/:id')
  .get(getChannel)
  .delete(deleteChannel);

router.get('/:name/messages', getChannelMessages);

module.exports = router;
