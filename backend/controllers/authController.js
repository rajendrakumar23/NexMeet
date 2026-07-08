const User = require('../models/User');
const { sendTokenResponse } = require('../utils/token');
const { sendOTPEmail } = require('../utils/email');
const { generateOTP } = require('../utils/helpers');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// Express 5 handles async errors automatically — no try/catch needed

// @POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  const user = await User.create({ name, email, password });
  sendTokenResponse(user, 201, res);
};

// @POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Please provide email and password' });

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password)))
    return res.status(401).json({ success: false, message: 'Invalid credentials' });

  user.isOnline = true;
  await user.save({ validateBeforeSave: false });
  sendTokenResponse(user, 200, res);
};

// @POST /api/auth/logout
exports.logout = async (req, res) => {
  req.user.isOnline = false;
  req.user.lastSeen = Date.now();
  await req.user.save({ validateBeforeSave: false });
  res.json({ success: true, message: 'Logged out' });
};

// @POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return res.status(404).json({ success: false, message: 'No user with that email' });

  const otp = generateOTP();
  user.resetPasswordOTP = otp;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });
  await sendOTPEmail(user.email, otp);
  res.json({ success: true, message: 'OTP sent to email' });
};

// @POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  const { email, otp, password } = req.body;
  const user = await User.findOne({
    email,
    resetPasswordOTP: otp,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user)
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

  user.password = password;
  user.resetPasswordOTP = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendTokenResponse(user, 200, res);
};

// @PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword)))
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully' });
};

// @GET /api/auth/me
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('friends', 'name avatar isOnline')
    .populate('friendRequests', 'name avatar email');
  res.json({ success: true, user });
};

// @PUT /api/auth/update-profile
exports.updateProfile = async (req, res) => {
  const { name, phone, bio, settings } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, bio, settings },
    { new: true, runValidators: true }
  );
  res.json({ success: true, user });
};

// @PUT /api/auth/upload-avatar
exports.uploadAvatar = async (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, message: 'No file uploaded' });

  if (req.user.avatarPublicId) {
    await cloudinary.uploader.destroy(req.user.avatarPublicId);
  }

  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: 'nexmeet/avatars',
    width: 300,
    crop: 'scale',
  });

  fs.unlinkSync(req.file.path);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: result.secure_url, avatarPublicId: result.public_id },
    { new: true }
  );
  res.json({ success: true, user });
};
