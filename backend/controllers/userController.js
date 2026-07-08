const User = require('../models/User');

// @GET /api/users/search?q=
exports.searchUsers = async (req, res) => {
  const { q } = req.query;
  const users = await User.find({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ],
    _id: { $ne: req.user._id },
  }).select('name email avatar isOnline').limit(20);
  res.json({ success: true, users });
};

// @GET /api/users/:id
exports.getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
};

// @POST /api/users/friend-request/:id
exports.sendFriendRequest = async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ success: false, message: 'User not found' });
  if (target.friendRequests.includes(req.user._id))
    return res.status(400).json({ success: false, message: 'Request already sent' });

  target.friendRequests.push(req.user._id);
  target.notifications.push({
    type: 'friend_request',
    message: `${req.user.name} sent you a friend request`,
    from: req.user._id,
  });
  await target.save();
  res.json({ success: true, message: 'Friend request sent' });
};

// @PUT /api/users/friend-request/:id/accept
exports.acceptFriendRequest = async (req, res) => {
  const requester = await User.findById(req.params.id);
  req.user.friends.push(requester._id);
  req.user.friendRequests = req.user.friendRequests.filter(id => id.toString() !== req.params.id);
  requester.friends.push(req.user._id);
  await req.user.save();
  await requester.save();
  res.json({ success: true, message: 'Friend request accepted' });
};

// @GET /api/users/notifications
exports.getNotifications = async (req, res) => {
  const user = await User.findById(req.user._id).populate('notifications.from', 'name avatar');
  res.json({ success: true, notifications: user.notifications.reverse() });
};

// @PUT /api/users/notifications/read
exports.markNotificationsRead = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { 'notifications.$[].read': true });
  res.json({ success: true });
};
