import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdPeople, MdVideoCall, MdAnalytics, MdDelete, MdBlock, MdAdminPanelSettings } from 'react-icons/md';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import Sidebar from '../../components/layout/Sidebar';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const AdminPanel = () => {
  const [tab, setTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'analytics') {
        const { data } = await api.get('/admin/analytics');
        setAnalytics(data.analytics);
      } else if (tab === 'users') {
        const { data } = await api.get('/admin/users');
        setUsers(data.users);
      } else if (tab === 'meetings') {
        const { data } = await api.get('/admin/meetings');
        setMeetings(data.meetings);
      }
    } catch { toast.error('Failed to fetch data'); }
    finally { setLoading(false); }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      toast.success('User deleted');
    } catch { toast.error('Failed to delete user'); }
  };

  const banUser = async (id, ban) => {
    try {
      const { data } = await api.put(`/admin/users/${id}/ban`, { ban });
      setUsers(prev => prev.map(u => u._id === id ? data.user : u));
      toast.success(ban ? 'User banned' : 'User unbanned');
    } catch { toast.error('Failed to update user'); }
  };

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: MdAnalytics },
    { id: 'users', label: 'Users', icon: MdPeople },
    { id: 'meetings', label: 'Meetings', icon: MdVideoCall },
  ];

  return (
    <Sidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
            <MdAdminPanelSettings size={22} className="text-yellow-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            <p className="text-slate-400 text-sm">Manage users, meetings, and analytics</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'gradient-bg text-white' : 'glass text-slate-400 hover:text-white'}`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* Analytics */}
        {tab === 'analytics' && analytics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: analytics.totalUsers, color: 'from-indigo-500 to-purple-500', icon: MdPeople },
              { label: 'Total Meetings', value: analytics.totalMeetings, color: 'from-purple-500 to-pink-500', icon: MdVideoCall },
              { label: 'Active Meetings', value: analytics.activeMeetings, color: 'from-green-500 to-teal-500', icon: MdVideoCall },
              { label: 'Online Users', value: analytics.onlineUsers, color: 'from-cyan-500 to-blue-500', icon: MdPeople },
            ].map(stat => (
              <Card key={stat.label} hover>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon size={20} className="text-white" />
                </div>
                <div className="text-3xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
              </Card>
            ))}
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs text-slate-500 font-medium pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <Avatar src={u.avatar} name={u.name} size="sm" online={u.isOnline} />
                          <span className="text-white text-sm font-medium">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-400 text-sm">{u.email}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={u.role === 'admin' ? 'warning' : 'default'}>{u.role}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={u.isBanned ? 'danger' : u.isOnline ? 'success' : 'default'}>
                          {u.isBanned ? 'Banned' : u.isOnline ? 'Online' : 'Offline'}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-slate-500 text-xs">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button onClick={() => banUser(u._id, !u.isBanned)}
                            className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-slate-400 hover:text-yellow-400 transition-colors">
                            <MdBlock size={16} />
                          </button>
                          <button onClick={() => deleteUser(u._id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors">
                            <MdDelete size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && !loading && (
                <p className="text-center text-slate-500 py-8">No users found</p>
              )}
            </div>
          </Card>
        )}

        {/* Meetings */}
        {tab === 'meetings' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Title', 'Meeting ID', 'Host', 'Status', 'Participants', 'Created'].map(h => (
                      <th key={h} className="text-left text-xs text-slate-500 font-medium pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {meetings.map(m => (
                    <tr key={m._id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 pr-4 text-white text-sm font-medium">{m.title}</td>
                      <td className="py-3 pr-4 text-indigo-400 text-sm font-mono">{m.meetingId}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <Avatar src={m.host?.avatar} name={m.host?.name} size="xs" />
                          <span className="text-slate-300 text-sm">{m.host?.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={m.status === 'active' ? 'success' : m.status === 'ended' ? 'default' : 'warning'}>
                          {m.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-slate-400 text-sm">{m.participants?.length || 0}</td>
                      <td className="py-3 text-slate-500 text-xs">{format(new Date(m.createdAt), 'MMM d, yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {meetings.length === 0 && !loading && (
                <p className="text-center text-slate-500 py-8">No meetings found</p>
              )}
            </div>
          </Card>
        )}
      </div>
    </Sidebar>
  );
};

export default AdminPanel;
