import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdDashboard, MdVideoCall, MdChat, MdPeople, MdSettings,
  MdAdminPanelSettings, MdLogout, MdNotifications, MdSearch,
  MdMenu, MdClose, MdSmartToy
} from 'react-icons/md';
import useAuthStore from '../../store/authStore';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import api from '../../utils/api';
import { getSocket, connectSocket } from '../../socket/socket';
import { toast } from 'react-hot-toast';

const navItems = [
  { icon: MdDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: MdVideoCall, label: 'Meetings', path: '/meetings' },
  { icon: MdChat, label: 'Chat', path: '/chat' },
  { icon: MdPeople, label: 'People', path: '/people' },
  { icon: MdSmartToy, label: 'AI Assistant', path: '/ai' },
  { icon: MdSettings, label: 'Settings', path: '/settings' },
];

const Sidebar = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    // Fetch unread notifications count
    api.get('/users/notifications').then(({ data }) => {
      setUnreadCount(data.notifications.filter(n => !n.read).length);
    }).catch(() => {});

    // Listen for real-time notifications
    const socket = connectSocket(user._id);
    socket.on(`notification:${user._id}`, (notification) => {
      setUnreadCount(prev => prev + 1);
      toast(notification.message, { icon: '🔔' });
    });

    return () => socket.off(`notification:${user._id}`);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 p-4 mb-2 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 gradient-bg rounded-xl flex items-center justify-center glow-sm shrink-0">
          <span className="text-white font-black">N</span>
        </div>
        {!collapsed && <span className="font-black text-xl gradient-text">NexMeet</span>}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2 space-y-1">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path;
          return (
            <Link key={path} to={path} onClick={() => setMobileOpen(false)}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                  ${active ? 'gradient-bg text-white glow-sm' : 'text-slate-400 hover:text-white hover:bg-white/10'}
                  ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon size={20} className="shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{label}</span>}
              </motion.div>
            </Link>
          );
        })}

        {user?.role === 'admin' && (
          <Link to="/admin" onClick={() => setMobileOpen(false)}>
            <motion.div
              whileHover={{ x: 4 }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-yellow-400 hover:bg-yellow-500/10 transition-all ${collapsed ? 'justify-center' : ''}`}
            >
              <MdAdminPanelSettings size={20} />
              {!collapsed && <span className="text-sm font-medium">Admin</span>}
            </motion.div>
          </Link>
        )}
      </nav>

      {/* User Profile */}
      <div className={`p-3 border-t border-white/10 ${collapsed ? 'flex justify-center' : ''}`}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <Link to="/profile">
              <Avatar src={user?.avatar} name={user?.name} size="sm" online={true} />
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors">
              <MdLogout size={18} />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors">
            <MdLogout size={20} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f0f1a]">
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.2 }}
        className="hidden lg:flex flex-col glass border-r border-white/10 shrink-0 overflow-hidden"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-64 glass z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="glass border-b border-white/10 px-4 py-3 flex items-center gap-4 shrink-0">
          <button className="lg:hidden p-2 text-slate-400 hover:text-white" onClick={() => setMobileOpen(true)}>
            <MdMenu size={22} />
          </button>
          <button className="hidden lg:block p-2 text-slate-400 hover:text-white" onClick={() => setCollapsed(!collapsed)}>
            <MdMenu size={22} />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                placeholder="Search users, meetings..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Link to="/people" className="relative p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors" onClick={() => setUnreadCount(0)}>
              <MdNotifications size={22} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Link to="/profile">
              <Avatar src={user?.avatar} name={user?.name} size="sm" online={true} />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Sidebar;
