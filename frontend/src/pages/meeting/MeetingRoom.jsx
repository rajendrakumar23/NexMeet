import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useIsPresent } from 'framer-motion';
import {
  MdMic, MdMicOff, MdVideocam, MdVideocamOff, MdScreenShare, MdStopScreenShare,
  MdCallEnd, MdChat, MdPeople, MdPanTool, MdMoreVert, MdContentCopy, MdClose,
  MdSend, MdEmojiEmotions
} from 'react-icons/md';
import { BsRecordCircle, BsGrid, BsLayoutSidebarReverse } from 'react-icons/bs';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../../utils/api';
import { getSocket } from '../../socket/socket';
import useAuthStore from '../../store/authStore';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const REACTIONS = ['👍', '❤️', '😂', '😮', '👏', '🎉'];

// WebRTC Configuration
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// Remote Video Component
const RemoteVideo = ({ peer, peerId }) => {
  const videoRef = useRef(null);
  const isPresent = useIsPresent();

  useEffect(() => {
    peer.on('stream', (stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });
  }, [peer]);

  useEffect(() => {
    if (!isPresent) {
      // Optional: Add exit animations or cleanup
    }
  }, [isPresent]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-[#1a1a2e] group">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
    </div>
  );
};

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const socket = getSocket();

  // State
  const [meeting, setMeeting] = useState(null);
  // We will now store peer connections instead of just user info
  const [participants, setParticipants] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [layout, setLayout] = useState('grid'); // grid | speaker
  const [activePanel, setActivePanel] = useState(null); // chat | people | null
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [reactions, setReactions] = useState([]);
  const [duration, setDuration] = useState(0);
  const [showReactions, setShowReactions] = useState(false);

  // Refs
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef({}); // This will store all RTCPeerConnection objects
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);

  // Join meeting & setup media
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await api.post(`/meetings/join/${meetingId}`, {});
        setMeeting(data.meeting);
        // Participants will be populated via socket events

        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // Join socket room
        socket.emit('meeting:join', { meetingId, user: { _id: user._id, name: user.name, avatar: user.avatar, handRaised: false } });

        // Start timer
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to join meeting');
        navigate('/dashboard');
      }
    };
    init();

    return () => {
      cleanup();
    };
  }, [meetingId]);

  // Function to create a peer connection and add stream
  const createPeer = useCallback((targetUserId, initiator) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);

    peer.addStream(localStreamRef.current);

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc:ice-candidate', {
          target: targetUserId,
          candidate: event.candidate,
        });
      }
    };

    peer.ontrack = (event) => {
      // This is where we will receive the remote stream, but we handle it in the RemoteVideo component
      // For simplicity, we'll re-render participants to attach the stream
      setParticipants(prev => prev.map(p => p.userId === targetUserId ? { ...p, stream: event.streams[0] } : p));
    };

    if (initiator) {
      peer.createOffer()
        .then(offer => peer.setLocalDescription(offer))
        .then(() => {
          socket.emit('webrtc:offer', {
            target: targetUserId,
            offer: peer.localDescription,
          });
        });
    }

    peersRef.current[targetUserId] = peer;
    return peer;
  }, [socket]);

  // Socket events
  useEffect(() => {
    socket.on('meeting:user-joined', ({ user: joinedUser }) => {
      if (joinedUser._id === user._id) return;
      toast(`${joinedUser.name} joined`, { icon: '👋' });
      const peer = createPeer(joinedUser._id, true);
      setParticipants(prev => [...prev, { userId: joinedUser._id, user: joinedUser, peer }]);
    });

    socket.on('webrtc:offer', ({ from, offer }) => {
      const peer = createPeer(from, false);
      peer.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => peer.createAnswer())
        .then(answer => peer.setLocalDescription(answer))
        .then(() => {
          socket.emit('webrtc:answer', {
            target: from,
            answer: peer.localDescription,
          });
        });
    });

    socket.on('webrtc:answer', ({ from, answer }) => {
      peersRef.current[from]?.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('meeting:user-left', ({ userId }) => {
      setParticipants(prev => prev.filter(p => p.userId !== userId));
    });

    socket.on('meeting:chat', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    socket.on('meeting:reaction', ({ userId, emoji }) => {
      const id = Date.now();
      setReactions(prev => [...prev, { id, emoji, userId }]);
      setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 3000);
    });

    socket.on('meeting:raise-hand', ({ userId, raised }) => {
      setParticipants(prev => prev.map(p => p.userId === userId ? { ...p, user: { ...p.user, handRaised: raised } } : p));
    });

    socket.on('meeting:ended', () => {
      toast.error('Meeting ended by host');
      navigate('/dashboard');
    });

    socket.on('meeting:mute-user', ({ targetUserId }) => {
      if (targetUserId === user._id) {
        setAudioEnabled(false);
        localStreamRef.current?.getAudioTracks().forEach(t => t.enabled = false);
        toast.error('You were muted by the host');
      }
    });

    socket.on('webrtc:ice-candidate', ({ from, candidate }) => {
      peersRef.current[from]?.addIceCandidate(new RTCIceCandidate(candidate));
    });

    return () => {
      socket.off('meeting:user-joined');
      socket.off('meeting:user-left');
      socket.off('meeting:chat');
      socket.off('meeting:reaction');
      socket.off('meeting:raise-hand');
      socket.off('webrtc:offer');
      socket.off('webrtc:answer');
      socket.off('webrtc:ice-candidate');
      socket.off('meeting:ended');
      socket.off('meeting:mute-user');
    };
  }, [socket]);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const cleanup = () => {
    clearInterval(timerRef.current);
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    Object.values(peersRef.current).forEach(peer => peer.close());
    peersRef.current = {};
    setParticipants([]);

    socket.emit('meeting:leave', { meetingId, userId: user._id });
  };

  const toggleAudio = () => {
    const enabled = !audioEnabled;
    localStreamRef.current?.getAudioTracks().forEach(t => t.enabled = enabled);
    setAudioEnabled(enabled);
    socket.emit('meeting:toggle-audio', { meetingId, userId: user._id, enabled });
  };

  const toggleVideo = () => {
    const enabled = !videoEnabled;
    localStreamRef.current?.getVideoTracks().forEach(t => t.enabled = enabled);
    setVideoEnabled(enabled);
    socket.emit('meeting:toggle-video', { meetingId, userId: user._id, enabled });
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        stream.getVideoTracks()[0].onended = () => stopScreenShare();
        setScreenSharing(true);
        socket.emit('meeting:screen-share', { meetingId, userId: user._id, sharing: true });
      } catch { toast.error('Screen share cancelled'); }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    setScreenSharing(false);
    socket.emit('meeting:screen-share', { meetingId, userId: user._id, sharing: false });
  };

  const toggleHand = () => {
    const raised = !handRaised;
    setHandRaised(raised);
    socket.emit('meeting:raise-hand', { meetingId, userId: user._id, raised });
    if (raised) toast('Hand raised ✋', { icon: '✋' });
  };

  const sendReaction = (emoji) => {
    socket.emit('meeting:reaction', { meetingId, userId: user._id, emoji });
    setShowReactions(false);
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const msg = { id: Date.now(), sender: { name: user.name, avatar: user.avatar }, content: chatInput, time: new Date() };
    socket.emit('meeting:chat', { meetingId, ...msg });
    setChatMessages(prev => [...prev, msg]);
    setChatInput('');
  };

  const endMeeting = async () => {
    if (meeting?.host?._id === user._id) {
      await api.put(`/meetings/end/${meetingId}`);
      socket.emit('meeting:end', { meetingId });
    }
    cleanup();
    navigate('/dashboard');
  };

  const copyMeetingId = () => {
    navigator.clipboard.writeText(meetingId);
    toast.success('Meeting ID copied!');
  };

  const formatTime = (s) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const isHost = meeting?.host?._id === user?._id;

  return (
    <div className="h-screen bg-[#0a0a14] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 glass border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">N</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{meeting?.title || 'NexMeet'}</p>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs font-mono">{meetingId}</span>
              <button onClick={copyMeetingId} className="text-slate-500 hover:text-indigo-400 transition-colors">
                <MdContentCopy size={12} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 rounded-full px-3 py-1">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-red-400 text-xs font-mono">{formatTime(duration)}</span>
          </div>
          <Badge variant="info">{participants.length + 1} participants</Badge>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className={`h-full grid gap-3 ${
            participants.length < 1 ? 'grid-cols-1' :
            participants.length < 2 ? 'grid-cols-2' :
            participants.length < 4 ? 'grid-cols-2' :
            participants.length < 6 ? 'grid-cols-3' : 'grid-cols-4'
          }`}>
            {/* Local Video */}
            <div className="relative rounded-2xl overflow-hidden bg-[#1a1a2e] group">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              {!videoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e]">
                  <Avatar src={user?.avatar} name={user?.name} size="xl" />
                </div>
              )}
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <span className="text-white text-xs bg-black/60 px-2 py-1 rounded-full font-medium">
                  You {isHost && '(Host)'}
                </span>
                {!audioEnabled && <MdMicOff size={14} className="text-red-400" />}
                {handRaised && <span>✋</span>}
              </div>
              {screenSharing && (
                <div className="absolute top-3 right-3 bg-green-500/20 border border-green-500/30 rounded-full px-2 py-0.5 text-xs text-green-400">
                  Sharing
                </div>
              )}
            </div>

            {/* Remote Participants (placeholder tiles) */}
            {participants.map(({ userId, user: pUser, peer, stream }) => (
              <div key={userId} className="relative rounded-2xl overflow-hidden bg-[#1a1a2e] flex items-center justify-center">
                {stream ? <video srcObject={stream} autoPlay playsInline className="w-full h-full object-cover" /> : <Avatar src={pUser.avatar} name={pUser.name} size="xl" />}
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <span className="text-white text-xs bg-black/60 px-2 py-1 rounded-full">{pUser.name}</span>
                  {pUser.handRaised && <span>✋</span>}
                </div>
                {isHost && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => socket.emit('meeting:mute-user', { meetingId, targetUserId: userId })}
                      className="p-1.5 rounded-lg bg-black/60 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <MdMicOff size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Side Panel */}
        <AnimatePresence>
          {activePanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="glass border-l border-white/10 flex flex-col overflow-hidden shrink-0"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="font-semibold text-white capitalize">{activePanel}</h3>
                <button onClick={() => setActivePanel(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400">
                  <MdClose size={18} />
                </button>
              </div>

              {activePanel === 'people' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {/* Add self to participants list */}
                  {[
                    { userId: user._id, user: { ...user, handRaised } },
                    ...participants
                  ].map(({ userId, user: pUser }) => (
                    <div key={userId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar src={pUser.avatar} name={pUser.name} size="sm" online={true} />
                        <div>
                          <p className="text-white text-sm font-medium">{pUser.name} {userId === user._id && '(You)'}</p>
                          {meeting?.host?._id === userId && <Badge variant="info" className="text-xs">Host</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {pUser.handRaised && <span>✋</span>}
                        {/* Mute button for host */}
                        {isHost && userId !== user._id && <button onClick={() => socket.emit('meeting:mute-user', { meetingId, targetUserId: userId })} className="text-slate-400 hover:text-red-400"><MdMicOff size={16} /></button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activePanel === 'chat' && (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.length === 0 && (
                      <p className="text-slate-500 text-sm text-center mt-8">No messages yet. Say hello! 👋</p>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex gap-2 ${msg.sender?.name === user.name ? 'flex-row-reverse' : ''}`}>
                        <Avatar src={msg.sender?.avatar} name={msg.sender?.name} size="xs" />
                        <div className={`max-w-[75%] ${msg.sender?.name === user.name ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                          <span className="text-xs text-slate-500">{msg.sender?.name}</span>
                          <div className={`px-3 py-2 rounded-2xl text-sm ${msg.sender?.name === user.name ? 'gradient-bg text-white' : 'bg-white/10 text-white'}`}>
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-4 border-t border-white/10 flex gap-2">
                    <input
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      placeholder="Message..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                    />
                    <Button size="icon" onClick={sendChatMessage}><MdSend size={18} /></Button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Reactions */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-none">
        <AnimatePresence>
          {reactions.map(r => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -80, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              className="text-3xl pointer-events-none"
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Controls Bar */}
      <div className="glass border-t border-white/10 px-4 py-4 flex items-center justify-center gap-3 shrink-0">
        {/* Audio */}
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={toggleAudio}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${audioEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 text-white'}`}
        >
          {audioEnabled ? <MdMic size={22} /> : <MdMicOff size={22} />}
        </motion.button>

        {/* Video */}
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={toggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${videoEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 text-white'}`}
        >
          {videoEnabled ? <MdVideocam size={22} /> : <MdVideocamOff size={22} />}
        </motion.button>

        {/* Screen Share */}
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={toggleScreenShare}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${screenSharing ? 'bg-green-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
        >
          {screenSharing ? <MdStopScreenShare size={22} /> : <MdScreenShare size={22} />}
        </motion.button>

        {/* Raise Hand */}
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={toggleHand}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${handRaised ? 'bg-yellow-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
        >
          <MdPanTool size={22} />
        </motion.button>

        {/* Reactions */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setShowReactions(!showReactions)}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
          >
            <MdEmojiEmotions size={22} />
          </motion.button>
          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-14 left-1/2 -translate-x-1/2 glass rounded-2xl p-3 flex gap-2"
              >
                {REACTIONS.map(emoji => (
                  <button key={emoji} onClick={() => sendReaction(emoji)} className="text-2xl hover:scale-125 transition-transform">
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Layout Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => setLayout(l => l === 'grid' ? 'speaker' : 'grid')}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
        >
          {layout === 'grid' ? <BsLayoutSidebarReverse size={20} /> : <BsGrid size={20} />}
        </motion.button>

        {/* Chat */}
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => setActivePanel(p => p === 'chat' ? null : 'chat')}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all relative ${activePanel === 'chat' ? 'gradient-bg text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
        >
          <MdChat size={22} />
          {chatMessages.length > 0 && activePanel !== 'chat' && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-indigo-500 rounded-full text-xs flex items-center justify-center">
              {chatMessages.length > 9 ? '9+' : chatMessages.length}
            </span>
          )}
        </motion.button>

        {/* Participants */}
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => setActivePanel(p => p === 'people' ? null : 'people')}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${activePanel === 'people' ? 'gradient-bg text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
        >
          <MdPeople size={22} />
        </motion.button>

        {/* End Call */}
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={endMeeting}
          className="w-14 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all ml-2"
        >
          <MdCallEnd size={24} />
        </motion.button>
      </div>
    </div>
  );
};

export default MeetingRoom;
