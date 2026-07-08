import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/dashboard/Dashboard';
import MeetingRoom from './pages/meeting/MeetingRoom';
import MeetingsPage from './pages/meeting/MeetingsPage';
import ChatPage from './pages/chat/ChatPage';
import AIPage from './pages/ai/AIPage';
import ProfilePage from './pages/profile/ProfilePage';
import PeoplePage from './pages/dashboard/PeoplePage';
import SettingsPage from './pages/dashboard/SettingsPage';
import AdminPanel from './pages/admin/AdminPanel';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import FloatingAI from './components/ai/FloatingAI';

const App = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e1e2e', color: '#e2e8f0', border: '1px solid rgba(99,102,241,0.3)' },
          success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/join/:meetingId" element={<Navigate to="/dashboard" replace />} />

        {/* Protected */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/meeting/:meetingId" element={<ProtectedRoute><MeetingRoom /></ProtectedRoute>} />
        <Route path="/meetings" element={<ProtectedRoute><MeetingsPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute><AIPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/people" element={<ProtectedRoute><PeoplePage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Floating AI Widget */}
      <FloatingAI />
    </BrowserRouter>
  );
};

export default App;
