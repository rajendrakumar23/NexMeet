# NexMeet 🚀

> Premium video conferencing + real-time chat + AI assistant — all in one platform.

![NexMeet](https://img.shields.io/badge/NexMeet-v1.0.0-6366f1?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square)
![Node](https://img.shields.io/badge/Node.js-20-339933?style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square)

---

## ✨ Features

- 🎥 **HD Video Meetings** — WebRTC-powered, up to 100 participants
- 💬 **Real-time Chat** — Private & group chat with Socket.io
- 🤖 **AI Assistant** — Floating chatbot + dedicated AI page
- 🔐 **Full Auth** — JWT, bcrypt, OTP password reset
- 📱 **Fully Responsive** — Mobile, tablet, desktop
- 🌙 **Dark/Light Mode** — Glassmorphism UI
- 👑 **Admin Panel** — User management & analytics
- 📊 **Dashboard** — Meetings, stats, quick actions
- 🔔 **Real-time Notifications** — Socket.io powered
- 📷 **Profile Pictures** — Cloudinary upload
- 🔗 **QR Code Join** — Scan to join meetings
- 📧 **Email Invites** — Nodemailer integration

---

## 🗂 Folder Structure

```
nexmeet/
├── backend/
│   ├── config/          # DB & Cloudinary config
│   ├── controllers/     # Route handlers (MVC)
│   ├── middleware/       # Auth, upload, error handlers
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routers
│   ├── utils/           # Token, email, helpers
│   ├── uploads/         # Temp file storage
│   └── server.js        # Entry point + Socket.io
│
└── frontend/
    └── src/
        ├── components/
        │   ├── ai/          # FloatingAI widget
        │   ├── layout/      # Navbar, Sidebar
        │   └── ui/          # Button, Card, Input, Avatar, Badge, Modal
        ├── pages/
        │   ├── auth/        # Login, Register, ForgotPassword
        │   ├── dashboard/   # Dashboard, PeoplePage, SettingsPage
        │   ├── meeting/     # MeetingRoom, MeetingsPage
        │   ├── chat/        # ChatPage
        │   ├── ai/          # AIPage
        │   ├── profile/     # ProfilePage
        │   ├── admin/       # AdminPanel
        │   └── Home.jsx     # Landing page
        ├── store/           # Zustand state (auth, chat, theme)
        ├── socket/          # Socket.io client
        └── utils/           # Axios instance
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account (for avatars)
- Gmail app password (for emails)

### 1. Clone & Install

```bash
# Backend
cd backend
npm install
cp .env.example .env   # Fill in your values

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

**backend/.env**
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/nexmeet
JWT_SECRET=your_secret_here
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=NexMeet <you@gmail.com>
CLIENT_URL=http://localhost:5173
OPENROUTER_API_KEY=sk-...   # Optional
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open **http://localhost:5173**

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register | ❌ |
| POST | `/api/auth/login` | Login | ❌ |
| POST | `/api/auth/logout` | Logout | ✅ |
| POST | `/api/auth/forgot-password` | Send OTP | ❌ |
| POST | `/api/auth/reset-password` | Reset with OTP | ❌ |
| PUT | `/api/auth/change-password` | Change password | ✅ |
| GET | `/api/auth/me` | Get current user | ✅ |
| PUT | `/api/auth/update-profile` | Update profile | ✅ |
| PUT | `/api/auth/upload-avatar` | Upload avatar | ✅ |
| POST | `/api/meetings/create` | Create meeting | ✅ |
| GET | `/api/meetings/:id` | Get meeting | ✅ |
| POST | `/api/meetings/join/:id` | Join meeting | ✅ |
| PUT | `/api/meetings/end/:id` | End meeting | ✅ |
| GET | `/api/meetings/my/history` | My meetings | ✅ |
| POST | `/api/meetings/invite/:id` | Email invite | ✅ |
| GET | `/api/meetings/qr/:id` | QR code | ✅ |
| GET | `/api/chat/conversations` | Get conversations | ✅ |
| POST | `/api/chat/conversations` | Create conversation | ✅ |
| GET | `/api/chat/messages/:id` | Get messages | ✅ |
| POST | `/api/chat/messages` | Send message | ✅ |
| PUT | `/api/chat/messages/:id` | Edit message | ✅ |
| DELETE | `/api/chat/messages/:id` | Delete message | ✅ |
| GET | `/api/users/search` | Search users | ✅ |
| POST | `/api/users/friend-request/:id` | Send request | ✅ |
| PUT | `/api/users/friend-request/:id/accept` | Accept request | ✅ |
| GET | `/api/users/notifications` | Notifications | ✅ |
| POST | `/api/ai/chat` | AI chat | ✅ |
| GET | `/api/admin/users` | All users | 👑 |
| DELETE | `/api/admin/users/:id` | Delete user | 👑 |
| PUT | `/api/admin/users/:id/ban` | Ban user | 👑 |
| GET | `/api/admin/analytics` | Analytics | 👑 |
| GET | `/api/admin/meetings` | All meetings | 👑 |

---

## 🔌 Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `user:online` | Client → Server | User comes online |
| `user:status` | Server → Client | Online status broadcast |
| `chat:join` | Client → Server | Join conversation room |
| `chat:message` | Bidirectional | Send/receive message |
| `chat:typing` | Client → Server | Typing indicator |
| `meeting:join` | Client → Server | Join meeting room |
| `meeting:offer` | Bidirectional | WebRTC offer |
| `meeting:answer` | Bidirectional | WebRTC answer |
| `meeting:ice-candidate` | Bidirectional | ICE candidate |
| `meeting:toggle-audio` | Bidirectional | Mute/unmute |
| `meeting:toggle-video` | Bidirectional | Camera on/off |
| `meeting:screen-share` | Bidirectional | Screen share |
| `meeting:raise-hand` | Bidirectional | Raise hand |
| `meeting:reaction` | Bidirectional | Emoji reaction |
| `meeting:chat` | Bidirectional | In-meeting chat |
| `meeting:end` | Client → Server | End meeting |
| `meeting:ended` | Server → Client | Meeting ended |
| `notification:send` | Client → Server | Send notification |
| `notification:new` | Server → Client | Receive notification |

---

## 🌐 Deployment

### Backend → Render

1. Push backend to GitHub
2. Create new **Web Service** on [render.com](https://render.com)
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Add all environment variables from `.env`

### Frontend → Vercel

1. Push frontend to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Set **Framework**: Vite
4. Add environment variables:
   - `VITE_API_URL=https://your-backend.onrender.com/api`
   - `VITE_SOCKET_URL=https://your-backend.onrender.com`

### Database → MongoDB Atlas

1. Create cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create database user
3. Whitelist IP `0.0.0.0/0` (for Render)
4. Copy connection string to `MONGO_URI`

---

## 🛡 Security

- JWT authentication on all protected routes
- Bcrypt password hashing (12 rounds)
- Rate limiting (100 req/15min)
- Helmet.js security headers
- MongoDB sanitization (NoSQL injection prevention)
- CORS configured for frontend origin only
- Input validation on all endpoints

---

## 🤖 AI Integration

The AI assistant works in two modes:

1. **With OpenAI key** — Uses GPT-3.5-turbo for real responses
2. **Without key (demo)** — Returns smart mock responses

To enable real AI, add your `OPENAI_API_KEY` to backend `.env`.

---

## 📄 License

MIT © 2024 NexMeet
