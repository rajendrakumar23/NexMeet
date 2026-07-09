import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdVideoCall, MdAdd, MdHistory, MdContentCopy, MdQrCode } from 'react-icons/md';
import { BsCalendar3, BsClock } from 'react-icons/bs';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import api from '../../utils/api';
import Sidebar from '../../components/layout/Sidebar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

const MeetingsPage = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [showQR, setShowQR] = useState(null);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    api.get('/meetings/my/history').then(({ data }) => setMeetings(data.meetings)).catch(() => {});
  }, []);

  const filtered = meetings.filter(m => {
    if (tab === 'active') return m.status === 'active';
    if (tab === 'ended') return m.status === 'ended';
    if (tab === 'scheduled') return m.status === 'scheduled';
    return true;
  });

  return (
    <Sidebar>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text">Meetings</h1>
          <Button onClick={() => navigate('/dashboard')}>
            <MdAdd size={18} /> New Meeting
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'active', 'scheduled', 'ended'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${tab === t ? 'bg-primary text-white' : 'bg-surface text-muted hover:text-text shadow-sm'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Meetings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <MdHistory size={48} className="text-muted/50 mx-auto mb-3" />
              <p className="text-muted">No meetings found</p>
            </div>
          ) : (
            filtered.map(m => (
              <motion.div key={m._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <MdVideoCall size={20} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-text font-semibold text-sm">{m.title}</p>
                        <p className="text-muted text-xs font-mono">{m.meetingId}</p>
                      </div>
                    </div>
                    <Badge variant={m.status === 'active' ? 'success' : m.status === 'ended' ? 'default' : 'warning'}>
                      {m.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted flex-wrap">
                    <span className="flex items-center gap-1">
                      <BsCalendar3 size={12} /> {format(new Date(m.createdAt), 'MMM d, yyyy')}
                    </span>
                    {m.duration > 0 && (
                      <span className="flex items-center gap-1">
                        <BsClock size={12} /> {m.duration}m
                      </span>
                    )}
                    <span>{m.participants?.length || 0} participants</span>
                  </div>

                  <div className="flex gap-2">
                    {m.status === 'active' && (
                      <Button size="sm" className="flex-1" onClick={() => navigate(`/meeting/${m.meetingId}`)}>
                        Join
                      </Button>
                    )}
                    <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(m.meetingId); toast.success('ID copied!'); }}>
                      <MdContentCopy size={14} />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setShowQR(m)}>
                      <MdQrCode size={14} />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* QR Modal */}
      <Modal isOpen={!!showQR} onClose={() => setShowQR(null)} title="Meeting QR Code" size="sm">
        {showQR && (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-2xl">
              <QRCode value={showQR.inviteLink || `${window.location.origin}/join/${showQR.meetingId}`} size={200} />
            </div>
            <p className="text-muted text-sm text-center">
              Scan to join <strong className="text-text">{showQR.title}</strong>
            </p>
            <p className="text-primary font-mono text-lg font-bold">{showQR.meetingId}</p>
          </div>
        )}
      </Modal>
    </Sidebar>
  );
};

export default MeetingsPage;
