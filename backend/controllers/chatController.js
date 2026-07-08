const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// @GET /api/chat/conversations
exports.getConversations = async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .populate('participants', 'name avatar isOnline lastSeen')
    .populate('lastMessage')
    .sort('-updatedAt');
  res.json({ success: true, conversations });
};

// @POST /api/chat/conversations
exports.createConversation = async (req, res) => {
  const { participantId, isGroup, groupName, participants } = req.body;

  if (isGroup) {
    const conv = await Conversation.create({
      participants: [req.user._id, ...participants],
      isGroup: true,
      groupName,
      groupAdmin: req.user._id,
    });
    await conv.populate('participants', 'name avatar isOnline');
    return res.status(201).json({ success: true, conversation: conv });
  }

  let conv = await Conversation.findOne({
    isGroup: false,
    participants: { $all: [req.user._id, participantId], $size: 2 },
  }).populate('participants', 'name avatar isOnline lastSeen').populate('lastMessage');

  if (!conv) {
    conv = await Conversation.create({ participants: [req.user._id, participantId] });
    await conv.populate('participants', 'name avatar isOnline lastSeen');
  }
  res.status(201).json({ success: true, conversation: conv });
};

// @GET /api/chat/messages/:conversationId
exports.getMessages = async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const messages = await Message.find({ conversation: req.params.conversationId, isDeleted: false })
    .populate('sender', 'name avatar')
    .populate('replyTo')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));
  res.json({ success: true, messages: messages.reverse() });
};

// @POST /api/chat/messages
exports.sendMessage = async (req, res) => {
  const { conversationId, content, type, replyTo } = req.body;
  let fileUrl = '', fileName = '', fileSize = 0;

  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, { folder: 'nexmeet/chat' });
    fileUrl = result.secure_url;
    fileName = req.file.originalname;
    fileSize = req.file.size;
    fs.unlinkSync(req.file.path);
  }

  const message = await Message.create({
    sender: req.user._id,
    content,
    type: type || 'text',
    fileUrl,
    fileName,
    fileSize,
    conversation: conversationId,
    replyTo,
  });

  await Conversation.findByIdAndUpdate(conversationId, { lastMessage: message._id });
  await message.populate('sender', 'name avatar');
  res.status(201).json({ success: true, message });
};

// @PUT /api/chat/messages/:id
exports.editMessage = async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
  if (message.sender.toString() !== req.user._id.toString())
    return res.status(403).json({ success: false, message: 'Not authorized' });

  message.content = req.body.content;
  message.isEdited = true;
  await message.save();
  res.json({ success: true, message });
};

// @DELETE /api/chat/messages/:id
exports.deleteMessage = async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
  if (message.sender.toString() !== req.user._id.toString())
    return res.status(403).json({ success: false, message: 'Not authorized' });

  message.isDeleted = true;
  message.content = 'This message was deleted';
  await message.save();
  res.json({ success: true, message });
};

// @PUT /api/chat/messages/:id/read
exports.markRead = async (req, res) => {
  await Message.updateMany(
    { conversation: req.params.id, readBy: { $ne: req.user._id } },
    { $push: { readBy: req.user._id } }
  );
  res.json({ success: true });
};
