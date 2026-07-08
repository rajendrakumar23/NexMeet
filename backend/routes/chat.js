const express = require('express');
const router = express.Router();
const { getConversations, createConversation, getMessages, sendMessage, editMessage, deleteMessage, markRead } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.get('/messages/:conversationId', getMessages);
router.post('/messages', upload.single('file'), sendMessage);
router.put('/messages/:id', editMessage);
router.delete('/messages/:id', deleteMessage);
router.put('/conversations/:id/read', markRead);

module.exports = router;
