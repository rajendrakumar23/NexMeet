import { useState } from 'react';
import { motion } from 'framer-motion';
import { MdDarkMode, MdNotifications, MdLanguage, MdSecurity, MdDelete } from 'react-icons/md';
import { BsSun, BsMoon } from 'react-icons/bs';
import { toast } from 'react-hot-toast';
import useThemeStore from '../../store/themeStore';
import useAuthStore from '../../store/authStore';
import Sidebar from '../../components/layout/Sidebar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const SettingsPage = () => {
  const { isDark, toggleTheme } = useThemeStore();
  const { user, updateUser } = useAuthStore();
  const [notifications, setNotifications] = useState(user?.settings?.notifications ?? true);
  const [language, setLanguage] = useState(user?.settings?.language || 'en');
  const [privacy, setPrivacy] = useState(user?.settings?.privacy || 'public');

  const saveSettings = () => {
    toast.success('Settings saved!');
  };

  const sections = [
    {
      title: 'Appearance',
      icon: MdDarkMode,
      content: (
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
          <div className="flex items-center gap-3">
            {isDark ? <BsMoon size={18} className="text-indigo-400" /> : <BsSun size={18} className="text-yellow-400" />}
            <div>
              <p className="text-white text-sm font-medium">Dark Mode</p>
              <p className="text-slate-500 text-xs">{isDark ? 'Currently using dark theme' : 'Currently using light theme'}</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-12 h-6 rounded-full transition-colors ${isDark ? 'bg-indigo-500' : 'bg-slate-600'}`}
          >
            <motion.div
              animate={{ x: isDark ? 24 : 2 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
            />
          </button>
        </div>
      )
    },
    {
      title: 'Notifications',
      icon: MdNotifications,
      content: (
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
          <div className="flex items-center gap-3">
            <MdNotifications size={18} className="text-indigo-400" />
            <div>
              <p className="text-white text-sm font-medium">Push Notifications</p>
              <p className="text-slate-500 text-xs">Receive meeting invites and message alerts</p>
            </div>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className={`relative w-12 h-6 rounded-full transition-colors ${notifications ? 'bg-indigo-500' : 'bg-slate-600'}`}
          >
            <motion.div
              animate={{ x: notifications ? 24 : 2 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
            />
          </button>
        </div>
      )
    },
    {
      title: 'Language',
      icon: MdLanguage,
      content: (
        <div className="p-4 rounded-xl bg-white/5">
          <div className="flex items-center gap-3 mb-3">
            <MdLanguage size={18} className="text-indigo-400" />
            <p className="text-white text-sm font-medium">Display Language</p>
          </div>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="ja">日本語</option>
            <option value="zh">中文</option>
          </select>
        </div>
      )
    },
    {
      title: 'Privacy',
      icon: MdSecurity,
      content: (
        <div className="p-4 rounded-xl bg-white/5">
          <div className="flex items-center gap-3 mb-3">
            <MdSecurity size={18} className="text-indigo-400" />
            <p className="text-white text-sm font-medium">Profile Visibility</p>
          </div>
          <div className="flex gap-2">
            {['public', 'friends', 'private'].map(p => (
              <button
                key={p}
                onClick={() => setPrivacy(p)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all ${privacy === p ? 'gradient-bg text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )
    },
  ];

  return (
    <Sidebar>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-xl font-bold text-white">Settings</h1>

        {sections.map(section => (
          <Card key={section.title}>
            <div className="flex items-center gap-2 mb-4">
              <section.icon size={18} className="text-indigo-400" />
              <h2 className="font-semibold text-white">{section.title}</h2>
            </div>
            {section.content}
          </Card>
        ))}

        <Button className="w-full" onClick={saveSettings}>Save Settings</Button>

        {/* Danger Zone */}
        <Card className="border border-red-500/20">
          <div className="flex items-center gap-2 mb-4">
            <MdDelete size={18} className="text-red-400" />
            <h2 className="font-semibold text-red-400">Danger Zone</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/20">
              <div>
                <p className="text-white text-sm font-medium">Delete Account</p>
                <p className="text-slate-500 text-xs">Permanently remove your account</p>
              </div>
              <Button variant="danger" size="sm">Delete</Button>
            </div>
          </div>
        </Card>
      </div>
    </Sidebar>
  );
};

export default SettingsPage;
