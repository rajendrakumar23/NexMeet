const express = require('express');
const router = express.Router();
const { searchUsers, getUserById, sendFriendRequest, acceptFriendRequest, getNotifications, markNotificationsRead } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/search', searchUsers);
router.get('/notifications', getNotifications);
router.put('/notifications/read', markNotificationsRead);
router.get('/:id', getUserById);
router.post('/friend-request/:id', sendFriendRequest);
router.put('/friend-request/:id/accept', acceptFriendRequest);

module.exports = router;
