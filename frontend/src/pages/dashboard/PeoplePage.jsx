import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdPersonAdd, MdSearch, MdCheck, MdClose, MdChat, MdVideoCall } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import useAuthStore from '../../store/authStore';
import Sidebar from '../../components/layout/Sidebar';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const PeoplePage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState('search');

  useEffect(() => { fetchFriendsAndRequests(); }, []);

  const fetchFriendsAndRequests = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setFriends(data.user.friends || []);
      setRequests(data.user.friendRequests || []);
    } catch {}
  };

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

  const openChat = async (friendId) => {
    try {
      await api.post('/chat/conversations', { participantId: friendId });
      navigate('/chat');
    } catch { navigate('/chat'); }
  };

  const startVideoCall = async (friend) => {
    try {
      const { data } = await api.post('/meetings/create', {
        title: `Call with ${friend.name}`,
        type: 'instant',
      });
      navigate(`/meeting/${data.meeting.meetingId}`);
    } catch { toast.error('Failed to start call'); }
  };

  return (
    <Sidebar>
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-text">People</h1>

        {/* Tabs */}
        <div className="flex gap-2">
          {['search', 'friends', 'requests'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${tab === t ? 'bg-primary text-white' : 'bg-surface text-muted hover:text-text shadow-sm'}`}>
              {t} {t === 'requests' && requests.length > 0 && <span className="ml-1 bg-indigo-500 text-white text-xs rounded-full px-1.5">{requests.length}</span>}
            </button>
          ))}
        </div>

        {/* Search */}
        {tab === 'search' && (
          <div className="space-y-4">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
              <input
                className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-text placeholder-muted focus:outline-none focus:border-primary transition-all"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => searchUsers(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map(u => (
                <motion.div key={u._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="flex items-center gap-3">
                    <Avatar src={u.avatar} name={u.name} size="md" online={u.isOnline} />
                    <div className="flex-1 min-w-0">
                      <p className="text-text font-semibold text-sm truncate">{u.name}</p>
                      <p className="text-muted text-xs truncate">{u.email}</p>
                    </div>
                    <Button size="icon" variant={u.requestSent ? 'ghost' : 'primary'} onClick={() => !u.requestSent && sendRequest(u._id)} disabled={u.requestSent}>
                      {u.requestSent ? <MdCheck size={16} /> : <MdPersonAdd size={16} />}
                    </Button>
                  </Card>
                </motion.div>
              ))}
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="text-muted text-sm col-span-full text-center py-8">No users found for "{searchQuery}"</p>
              )}
              {searchQuery.length < 2 && (
                <p className="text-muted text-sm col-span-full text-center py-8">Type at least 2 characters to search</p>
              )}
            </div>
          </div>
        )}

        {/* Friends */}
        {tab === 'friends' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.length === 0 ? ( 
              <p className="text-muted text-sm col-span-full text-center py-12">No friends yet. Search for people to connect!</p>
            ) : (
              friends.map(f => (
                <motion.div key={f._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="flex items-center gap-3">
                    <Avatar src={f.avatar} name={f.name} size="md" online={f.isOnline} />
                    <div className="flex-1 min-w-0">
                      <p className="text-text font-semibold text-sm">{f.name}</p>
                      <Badge variant={f.isOnline ? 'success' : 'default'} className="text-xs">
                        {f.isOnline ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openChat(f._id)} title="Chat">
                        <MdChat size={17} />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => startVideoCall(f)} title="Video Call">
                        <MdVideoCall size={18} />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Friend Requests */}
        {tab === 'requests' && (
          <div className="space-y-3">
            {requests.length === 0 ? ( 
              <p className="text-muted text-sm text-center py-12">No pending friend requests</p>
            ) : (
              requests.map(r => (
                <Card key={r._id || r} className="flex items-center gap-3">
                  <Avatar src={r.avatar} name={r.name} size="md" />
                  <div className="flex-1">
                    <p className="text-text font-semibold text-sm">{r.name || 'User'}</p>
                    <p className="text-muted text-xs">Sent you a friend request</p>
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
