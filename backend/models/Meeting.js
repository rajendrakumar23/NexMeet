const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const meetingSchema = new mongoose.Schema({
  meetingId: { type: String, default: () => uuidv4().slice(0, 10).toUpperCase(), unique: true },
  title: { type: String, default: 'NexMeet Meeting' },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  scheduledAt: { type: Date },
  startedAt: { type: Date },
  endedAt: { type: Date },
  duration: { type: Number, default: 0 }, // minutes
  status: { type: String, enum: ['scheduled', 'active', 'ended'], default: 'scheduled' },
  isRecorded: { type: Boolean, default: false },
  recordingUrl: { type: String, default: '' },
  password: { type: String, default: '' },
  maxParticipants: { type: Number, default: 100 },
  type: { type: String, enum: ['instant', 'scheduled'], default: 'instant' },
  inviteLink: { type: String },
  chat: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);
