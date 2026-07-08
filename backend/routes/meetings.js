const express = require('express');
const router = express.Router();
const { createMeeting, getMeeting, joinMeeting, endMeeting, getMyMeetings, inviteByEmail, getMeetingQR } = require('../controllers/meetingController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/create', createMeeting);
router.get('/my/history', getMyMeetings);
router.get('/:meetingId', getMeeting);
router.post('/join/:meetingId', joinMeeting);
router.put('/end/:meetingId', endMeeting);
router.post('/invite/:meetingId', inviteByEmail);
router.get('/qr/:meetingId', getMeetingQR);

module.exports = router;
