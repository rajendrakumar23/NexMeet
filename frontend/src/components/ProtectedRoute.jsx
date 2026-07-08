import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, fetchMe, token } = useAuthStore();
  const [checking, setChecking] = useState(!user && !!token);

  useEffect(() => {
    if (!user && token) {
      fetchMe().finally(() => setChecking(false));
    }
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center glow pulse-glow">
            <span className="text-white font-black text-lg">N</span>
          </div>
          <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
};

export default ProtectedRoute;
