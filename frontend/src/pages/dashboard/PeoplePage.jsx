import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdPersonAdd, MdSearch, MdCheck, MdClose } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import useAuthStore from '../../store/authStore';
import Sidebar from '../../components/layout/Sidebar';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const PeoplePage = () => {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState(user?.friends || []);
  const [requests, setRequests] = useState(user?.friendRequests || []);
  const [tab, setTab] = useState('search');

  const searchUsers = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) return setSearchResults([]);
    try {
      const { data } = await api.get(`/users/search?q=${q}`);
      setSearchResults(data.users);
    } catch {}
  };

  const sendRequest = async (userId) => {
    try {
      await api.post(`/users/friend-request/${userId}`);
      toast.success('Friend request sent!');
      setSearchResults(prev => prev.map(u => u._id === userId ? { ...u, requestSent: true } : u));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send request'); }
  };

  const acceptRequest = async (userId) => {
    try {
      await api.put(`/users/friend-request/${userId}/accept`);
      toast.success('Friend request accepted!');
      setRequests(prev => prev.filter(r => r._id !== userId));
    } catch { toast.error('Failed to accept request'); }
  };

  return (
    <Sidebar>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">People</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {['search', 'friends', 'requests'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${tab === t ? 'gradient-bg text-white' : 'glass text-slate-400 hover:text-white'}`}>
              {t} {t === 'requests' && requests.length > 0 && <span className="ml-1 bg-indigo-500 text-white text-xs rounded-full px-1.5">{requests.length}</span>}
            </button>
          ))}
        </div>

        {/* Search */}
        {tab === 'search' && (
          <div className="space-y-4">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => searchUsers(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map(u => (
                <motion.div key={u._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card hover className="flex items-center gap-3">
                    <Avatar src={u.avatar} name={u.name} size="md" online={u.isOnline} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{u.name}</p>
                      <p className="text-slate-500 text-xs truncate">{u.email}</p>
                    </div>
                    <Button size="icon" variant={u.requestSent ? 'secondary' : 'primary'} onClick={() => !u.requestSent && sendRequest(u._id)} disabled={u.requestSent}>
                      {u.requestSent ? <MdCheck size={16} /> : <MdPersonAdd size={16} />}
                    </Button>
                  </Card>
                </motion.div>
              ))}
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="text-slate-500 text-sm col-span-full text-center py-8">No users found for "{searchQuery}"</p>
              )}
              {searchQuery.length < 2 && (
                <p className="text-slate-500 text-sm col-span-full text-center py-8">Type at least 2 characters to search</p>
              )}
            </div>
          </div>
        )}

        {/* Friends */}
        {tab === 'friends' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.length === 0 ? (
              <p className="text-slate-500 text-sm col-span-full text-center py-12">No friends yet. Search for people to connect!</p>
            ) : (
              friends.map(f => (
                <Card key={f._id || f} hover className="flex items-center gap-3">
                  <Avatar src={f.avatar} name={f.name} size="md" online={f.isOnline} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{f.name || 'Friend'}</p>
                    <Badge variant={f.isOnline ? 'success' : 'default'} className="text-xs">{f.isOnline ? 'Online' : 'Offline'}</Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Friend Requests */}
        {tab === 'requests' && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-12">No pending friend requests</p>
            ) : (
              requests.map(r => (
                <Card key={r._id || r} className="flex items-center gap-3">
                  <Avatar src={r.avatar} name={r.name} size="md" />
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{r.name || 'User'}</p>
                    <p className="text-slate-500 text-xs">Sent you a friend request</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => acceptRequest(r._id || r)}>
                      <MdCheck size={16} /> Accept
                    </Button>
                    <Button size="sm" variant="danger">
                      <MdClose size={16} />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default PeoplePage;
