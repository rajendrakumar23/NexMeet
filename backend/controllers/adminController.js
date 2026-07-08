const User = require('../models/User');
const Meeting = require('../models/Meeting');

// @GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  const users = await User.find().select('-password').sort('-createdAt');
  res.json({ success: true, count: users.length, users });
};

// @DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'User deleted' });
};

// @PUT /api/admin/users/:id/ban
exports.banUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isBanned: !req.body.ban }, { new: true });
  res.json({ success: true, user });
};

// @GET /api/admin/analytics
exports.getAnalytics = async (req, res) => {
  const [totalUsers, totalMeetings, activeMeetings, onlineUsers] = await Promise.all([
    User.countDocuments(),
    Meeting.countDocuments(),
    Meeting.countDocuments({ status: 'active' }),
    User.countDocuments({ isOnline: true }),
  ]);
  res.json({ success: true, analytics: { totalUsers, totalMeetings, activeMeetings, onlineUsers } });
};

// @GET /api/admin/meetings
exports.getAllMeetings = async (req, res) => {
  const meetings = await Meeting.find().populate('host', 'name email').sort('-createdAt').limit(50);
  res.json({ success: true, meetings });
};
