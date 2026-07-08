require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Express 5 compatible mongo sanitizer (req.query is read-only in Express 5)
const mongoSanitize = require('express-mongo-sanitize');
function safeMongoSanitize(options) {
  return (req, res, next) => {
    if (req.body) mongoSanitize.sanitize(req.body, options);
    // Do NOT reassign req.query or req.params — read-only in Express 5 + Node 25
    next();
  };
}

const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Routes
const authRoutes = require('./routes/auth');
const meetingRoutes = require('./routes/meetings');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');

connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] },
});

// Middleware
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(safeMongoSanitize({ allowDots: true, replaceWith: '_' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests' },
  standardHeaders: false,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'NexMeet API is running 🚀' }));

// =====================
// SOCKET.IO EVENTS
// =====================
const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // User comes online
  socket.on('user:online', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    io.emit('user:status', { userId, isOnline: true });
  });

  // --- CHAT EVENTS ---
  socket.on('chat:join', (conversationId) => socket.join(conversationId));

  socket.on('chat:message', (data) => {
    io.to(data.conversationId).emit('chat:message', data);
  });

  socket.on('chat:typing', (data) => {
    socket.to(data.conversationId).emit('chat:typing', data);
  });

  socket.on('chat:stop-typing', (data) => {
    socket.to(data.conversationId).emit('chat:stop-typing', data);
  });

  socket.on('chat:message-edited', (data) => {
    io.to(data.conversationId).emit('chat:message-edited', data);
  });

  socket.on('chat:message-deleted', (data) => {
    io.to(data.conversationId).emit('chat:message-deleted', data);
  });

  // --- MEETING EVENTS ---
  socket.on('meeting:join', ({ meetingId, user }) => {
    socket.join(meetingId);
    socket.to(meetingId).emit('meeting:user-joined', { user, socketId: socket.id });
    console.log(`${user.name} joined meeting ${meetingId}`);
  });

  socket.on('meeting:leave', ({ meetingId, userId }) => {
    socket.leave(meetingId);
    socket.to(meetingId).emit('meeting:user-left', { userId, socketId: socket.id });
  });

  // WebRTC signaling
  socket.on('meeting:offer', ({ to, offer, from }) => {
    io.to(to).emit('meeting:offer', { offer, from, socketId: socket.id });
  });

  socket.on('meeting:answer', ({ to, answer }) => {
    io.to(to).emit('meeting:answer', { answer, socketId: socket.id });
  });

  socket.on('meeting:ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('meeting:ice-candidate', { candidate, socketId: socket.id });
  });

  socket.on('meeting:toggle-audio', ({ meetingId, userId, enabled }) => {
    socket.to(meetingId).emit('meeting:toggle-audio', { userId, enabled });
  });

  socket.on('meeting:toggle-video', ({ meetingId, userId, enabled }) => {
    socket.to(meetingId).emit('meeting:toggle-video', { userId, enabled });
  });

  socket.on('meeting:raise-hand', ({ meetingId, userId, raised }) => {
    io.to(meetingId).emit('meeting:raise-hand', { userId, raised });
  });

  socket.on('meeting:reaction', ({ meetingId, userId, emoji }) => {
    io.to(meetingId).emit('meeting:reaction', { userId, emoji });
  });

  socket.on('meeting:screen-share', ({ meetingId, userId, sharing }) => {
    socket.to(meetingId).emit('meeting:screen-share', { userId, sharing });
  });

  socket.on('meeting:end', ({ meetingId }) => {
    io.to(meetingId).emit('meeting:ended');
  });

  socket.on('meeting:chat', (data) => {
    io.to(data.meetingId).emit('meeting:chat', data);
  });

  socket.on('meeting:mute-user', ({ meetingId, targetUserId }) => {
    io.to(meetingId).emit('meeting:mute-user', { targetUserId });
  });

  // --- NOTIFICATIONS ---
  socket.on('notification:send', ({ toUserId, notification }) => {
    const targetSocket = onlineUsers.get(toUserId);
    if (targetSocket) io.to(targetSocket).emit('notification:new', notification);
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('user:status', { userId: socket.userId, isOnline: false });
    }
    console.log('Socket disconnected:', socket.id);
  });
});

// Make io accessible in controllers
app.set('io', io);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 NexMeet Server running on port ${PORT}`));
