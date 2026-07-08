const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  phone: { type: String, default: '' },
  bio: { type: String, default: '', maxlength: 200 },
  avatar: { type: String, default: '' },
  avatarPublicId: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  notifications: [{
    type: { type: String },
    message: String,
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  settings: {
    darkMode: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true },
    language: { type: String, default: 'en' },
    privacy: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
  },
  resetPasswordOTP: String,
  resetPasswordExpire: Date,
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
