const Meeting = require('../models/Meeting');
const User = require('../models/User');
const { sendMeetingInvite } = require('../utils/email');
const qrcode = require('qrcode');

// @POST /api/meetings/create
exports.createMeeting = async (req, res) => {
  const { title, scheduledAt, password, type } = req.body;
  const meeting = await Meeting.create({
    title: title || 'NexMeet Meeting',
    host: req.user._id,
    participants: [req.user._id],
    scheduledAt,
    password,
    type: type || 'instant',
    status: type === 'scheduled' ? 'scheduled' : 'active',
    startedAt: type !== 'scheduled' ? Date.now() : undefined,
  });

  meeting.inviteLink = `${process.env.CLIENT_URL}/join/${meeting.meetingId}`;
  await meeting.save();
  await meeting.populate('host', 'name avatar');
  res.status(201).json({ success: true, meeting });
};

// @GET /api/meetings/:meetingId
exports.getMeeting = async (req, res) => {
  const meeting = await Meeting.findOne({ meetingId: req.params.meetingId })
    .populate('host', 'name avatar')
    .populate('participants', 'name avatar isOnline');
  if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
  res.json({ success: true, meeting });
};

// @POST /api/meetings/join/:meetingId
exports.joinMeeting = async (req, res) => {
  const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
  if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
  if (meeting.status === 'ended') return res.status(400).json({ success: false, message: 'Meeting has ended' });
  if (meeting.password && meeting.password !== req.body.password)
    return res.status(401).json({ success: false, message: 'Wrong meeting password' });

  if (!meeting.participants.includes(req.user._id)) {
    meeting.participants.push(req.user._id);
    await meeting.save();
  }
  await meeting.populate('host', 'name avatar');
  await meeting.populate('participants', 'name avatar isOnline');
  res.json({ success: true, meeting });
};

// @PUT /api/meetings/end/:meetingId
exports.endMeeting = async (req, res) => {
  const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
  if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
  if (meeting.host.toString() !== req.user._id.toString())
    return res.status(403).json({ success: false, message: 'Only host can end meeting' });

  meeting.status = 'ended';
  meeting.endedAt = Date.now();
  if (meeting.startedAt)
    meeting.duration = Math.round((meeting.endedAt - meeting.startedAt) / 60000);
  await meeting.save();
  res.json({ success: true, meeting });
};

// @GET /api/meetings/my/history
exports.getMyMeetings = async (req, res) => {
  const meetings = await Meeting.find({
    $or: [{ host: req.user._id }, { participants: req.user._id }]
  }).populate('host', 'name avatar').sort('-createdAt').limit(20);
  res.json({ success: true, meetings });
};

// @POST /api/meetings/invite/:meetingId
exports.inviteByEmail = async (req, res) => {
  const { email } = req.body;
  const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
  if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
  await sendMeetingInvite(email, meeting.meetingId, meeting.inviteLink, req.user.name);
  res.json({ success: true, message: 'Invite sent' });
};

// @GET /api/meetings/qr/:meetingId
exports.getMeetingQR = async (req, res) => {
  const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
  if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
  const qr = await qrcode.toDataURL(meeting.inviteLink);
  res.json({ success: true, qr });
};
