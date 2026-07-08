import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdVideoCall, MdAdd, MdHistory, MdPeople, MdSmartToy, MdContentCopy } from 'react-icons/md';
import { BsClock, BsCalendar3 } from 'react-icons/bs';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../../utils/api';
import useAuthStore from '../../store/authStore';
import Sidebar from '../../components/layout/Sidebar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [joinId, setJoinId] = useState('');
  const [createdMeeting, setCreatedMeeting] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/meetings/my/history').then(({ data }) => setMeetings(data.meetings)).catch(() => {});
  }, []);

  const createMeeting = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/meetings/create', { title: meetingTitle || 'My Meeting' });
      setCreatedMeeting(data.meeting);
      toast.success('Meeting created!');
    } catch { toast.error('Failed to create meeting'); }
    finally { setLoading(false); }
  };

  const joinMeeting = () => {
    if (!joinId.trim()) return toast.error('Enter a meeting ID');
    navigate(`/meeting/${joinId.trim()}`);
  };

  const copyLink = (link) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copied!');
  };

  const stats = [
    { label: 'Meetings Hosted', value: meetings.filter(m => m.host?._id === user?._id).length, icon: MdVideoCall, color: 'from-indigo-500 to-purple-500' },
    { label: 'Total Meetings', value: meetings.length, icon: BsCalendar3, color: 'from-purple-500 to-pink-500' },
    { label: 'Hours in Meetings', value: Math.round(meetings.reduce((a, m) => a + (m.duration || 0), 0) / 60), icon: BsClock, color: 'from-cyan-500 to-blue-500' },
    { label: 'Connections', value: user?.friends?.length || 0, icon: MdPeople, color: 'from-green-500 to-teal-500' },
  ];

  return (
    <Sidebar>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        {/* Welcome */}
        <motion.div variants={fadeUp}>
          <Card className="gradient-border relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar src={user?.avatar} name={user?.name} size="lg" online={true} />
                <div>
                  <h1 className="text-2xl font-black text-white">
                    Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}! 👋
                  </h1>
                  <p className="text-slate-400 text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setShowCreateModal(true)} size="md">
                  <MdAdd size={18} /> New Meeting
                </Button>
                <Button variant="secondary" onClick={() => setShowJoinModal(true)} size="md">
                  <MdVideoCall size={18} /> Join
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} hover>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon size={20} className="text-white" />
              </div>
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
            </Card>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fadeUp}>
          <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: MdAdd, label: 'New Meeting', color: 'from-indigo-500 to-purple-500', action: () => setShowCreateModal(true) },
              { icon: MdVideoCall, label: 'Join Meeting', color: 'from-purple-500 to-pink-500', action: () => setShowJoinModal(true) },
              { icon: MdSmartToy, label: 'AI Assistant', color: 'from-cyan-500 to-blue-500', action: () => navigate('/ai') },
              { icon: MdPeople, label: 'Find People', color: 'from-green-500 to-teal-500', action: () => navigate('/people') },
            ].map((item) => (
              <motion.button
                key={item.label}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={item.action}
                className="glass rounded-2xl p-5 flex flex-col items-center gap-3 hover:border-indigo-500/40 transition-all cursor-pointer border border-white/10"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                  <item.icon size={24} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-white">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Recent Meetings */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Recent Meetings</h2>
            <Link to="/meetings" className="text-sm text-indigo-400 hover:text-indigo-300">View all</Link>
          </div>
          <div className="space-y-3">
            {meetings.length === 0 ? (
              <Card className="text-center py-12">
                <MdHistory size={48} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No meetings yet. Create your first meeting!</p>
              </Card>
            ) : (
              meetings.slice(0, 5).map((meeting) => (
                <motion.div key={meeting._id} whileHover={{ x: 4 }}>
                  <Card className="flex items-center justify-between gap-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                        <MdVideoCall size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{meeting.title}</p>
                        <p className="text-slate-500 text-xs">
                          ID: {meeting.meetingId} • {format(new Date(meeting.createdAt), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={meeting.status === 'active' ? 'success' : meeting.status === 'ended' ? 'default' : 'warning'}>
                        {meeting.status}
                      </Badge>
                      {meeting.status === 'active' && (
                        <Button size="sm" onClick={() => navigate(`/meeting/${meeting.meetingId}`)}>Join</Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Create Meeting Modal */}
      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); setCreatedMeeting(null); }} title="Create Meeting">
        {!createdMeeting ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-1.5">Meeting Title</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                placeholder="My Awesome Meeting"
                value={meetingTitle}
                onChange={e => setMeetingTitle(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={createMeeting} loading={loading}>Create Meeting</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
              <p className="text-green-400 font-semibold mb-1">Meeting Created! 🎉</p>
              <p className="text-2xl font-black text-white tracking-widest">{createdMeeting.meetingId}</p>
            </div>
            <div className="flex gap-2">
              <input readOnly value={createdMeeting.inviteLink} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300" />
              <Button variant="secondary" size="icon" onClick={() => copyLink(createdMeeting.inviteLink)}>
                <MdContentCopy size={18} />
              </Button>
            </div>
            <Button className="w-full" onClick={() => navigate(`/meeting/${createdMeeting.meetingId}`)}>
              Start Meeting
            </Button>
          </div>
        )}
      </Modal>

      {/* Join Meeting Modal */}
      <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} title="Join Meeting">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">Meeting ID</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-xl font-bold tracking-widest placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
              placeholder="XXXXXXXXXX"
              value={joinId}
              onChange={e => setJoinId(e.target.value.toUpperCase())}
              maxLength={10}
            />
          </div>
          <Button className="w-full" onClick={joinMeeting}>Join Meeting</Button>
        </div>
      </Modal>
    </Sidebar>
  );
};

export default Dashboard;
