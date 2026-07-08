const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser, banUser, getAnalytics, getAllMeetings } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/ban', banUser);
router.get('/analytics', getAnalytics);
router.get('/meetings', getAllMeetings);

module.exports = router;
