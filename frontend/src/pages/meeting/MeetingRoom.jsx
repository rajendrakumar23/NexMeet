import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdMic, MdMicOff, MdVideocam, MdVideocamOff, MdScreenShare, MdStopScreenShare,
  MdCallEnd, MdChat, MdPeople, MdPanTool, MdMoreVert, MdContentCopy, MdClose,
  MdSend, MdEmojiEmotions, MdPushPin, MdInfoOutline
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
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

/**
 * VideoTile Component: Renders a single participant's video or avatar.
 * It's memoized to prevent re-renders unless its specific props change.
 */
const VideoTile = memo(({ participant, isSelf, isSharingScreen, isActiveSpeaker }) => {
  const videoRef = useRef(null);
  const { user, stream, audioEnabled, videoEnabled } = participant;

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const containerClasses = `
    relative aspect-video bg-[#1a1a2e] rounded-2xl overflow-hidden
    flex items-center justify-center transition-all duration-300
    shadow-lg group
    ${isActiveSpeaker && !isSelf ? 'ring-4 ring-indigo-500 glow' : 'ring-2 ring-transparent'}
  `;

  return (
    <div className={containerClasses}>
      {stream && videoEnabled && !isSharingScreen ? (
        <video ref={videoRef} autoPlay playsInline muted={isSelf} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Avatar src={user?.avatar} name={user?.name} size="xl" />
        </div>
      )}

      {isSharingScreen && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
            <MdScreenShare size={48} className="text-green-400 mb-2" />
            <p className="text-white font-semibold">Sharing Screen</p>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded-lg">
            {user?.name} {isSelf && '(You)'}
          </span>
          <div className="flex items-center gap-2">
            {participant.handRaised && <span>✋</span>}
            {!audioEnabled && <MdMicOff size={16} className="text-red-400" />}
          </div>
        </div>
      </div>
    </div>
  );
});

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const socket = getSocket();

  // State
  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [mainView, setMainView] = useState({ type: 'grid', userId: null }); // type: 'grid' | 'speaker' | 'screenshare'
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
  const audioContextRef = useRef(null);
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
        setupAudioAnalysis(stream);

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

  // Active Speaker Detection
  const setupAudioAnalysis = (stream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const analyser = audioContextRef.current.createAnalyser();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 512;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      if (average > 30 && audioEnabled) { // Threshold for speaking
        socket.emit('meeting:speaking', { meetingId, userId: user._id });
      }
    };
    setInterval(checkVolume, 200);
  };
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
      setParticipants(prev => prev.map(p =>
        p.userId === targetUserId ? { ...p, stream: event.streams[0] } : p
      ));
      setupAudioAnalysis(event.streams[0]);
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
      const peer = createPeer(joinedUser._id, true); // I am the initiator
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
      toast(`${peersRef.current[userId]?.user?.name || 'Someone'} left.`);
      setParticipants(prev => prev.filter(p => p.userId !== userId));
      if (peersRef.current[userId]) {
        peersRef.current[userId].close();
        delete peersRef.current[userId];
      }
      if (activeSpeaker === userId) setActiveSpeaker(null);
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
      if (userId === user._id) return;
      setParticipants(prev => prev.map(p => p.userId === userId ? { ...p, handRaised: raised } : p));
    });

    socket.on('meeting:speaking', ({ userId }) => {
      setActiveSpeaker(userId);
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
      socket.off('meeting:speaking');
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
    audioContextRef.current?.close();
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
        const videoTrack = stream.getVideoTracks()[0];
        
        // Replace video track in all peer connections
        Object.values(peersRef.current).forEach(peer => {
          const sender = peer.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(videoTrack);
        });

        screenStreamRef.current = stream;
        videoTrack.onended = () => stopScreenShare();

        setScreenSharing(true);
        setVideoEnabled(true); // Screen sharing is a form of video
        setMainView({ type: 'screenshare', userId: user._id });
        socket.emit('meeting:screen-share', { meetingId, userId: user._id, sharing: true });

        // Update local video ref to show screen share
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      } catch { toast.error('Screen share cancelled'); }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    const localVideoTrack = localStreamRef.current.getVideoTracks()[0];
    Object.values(peersRef.current).forEach(peer => {
      const sender = peer.getSenders().find(s => s.track?.kind === 'video');
      if (sender) sender.replaceTrack(localVideoTrack);
    });

    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    setScreenSharing(false);
    setMainView({ type: 'grid', userId: null });
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

  // Dynamic Grid Logic
  const allParticipants = [{ userId: user._id, user, stream: localStreamRef.current, audioEnabled, videoEnabled, isSelf: true }, ...participants];
  const participantCount = allParticipants.length;

  const gridClasses = () => {
    if (mainView.type !== 'grid') return 'grid-cols-1';
    if (participantCount <= 1) return 'grid-cols-1';
    if (participantCount === 2) return 'grid-cols-2';
    if (participantCount <= 4) return 'grid-cols-2 grid-rows-2';
    if (participantCount <= 6) return 'grid-cols-3 grid-rows-2';
    if (participantCount <= 9) return 'grid-cols-3 grid-rows-3';
    if (participantCount <= 12) return 'grid-cols-4 grid-rows-3';
    if (participantCount <= 16) return 'grid-cols-4 grid-rows-4';
    return 'grid-cols-5'; // For more than 16, with scrolling
  };

  return (
    <div className="h-screen bg-[#0f0f1a] text-white flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 glass border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
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

        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 rounded-full px-3 py-1">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-red-400 text-xs font-mono">{formatTime(duration)}</span>
          </div>
          <Badge variant="info">{participants.length + 1} participants</Badge>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Main View: Grid or Speaker */}
        <div className="flex-1 p-2 md:p-4 overflow-y-auto">
          <div className={`w-full h-full grid gap-2 md:gap-4 ${gridClasses()}`}>
            {allParticipants
              .filter(p => p.userId !== user._id) // Exclude self from main grid
              .map((p) => (
                <VideoTile
                  key={p.userId}
                  participant={p}
                  isActiveSpeaker={activeSpeaker === p.userId}
                />
              ))}
          </div>
        </div>

        {/* Self Video (Picture-in-Picture) */}
        <motion.div
          drag
          dragMomentum={false}
          className="absolute bottom-24 right-4 w-40 md:w-60 z-30 cursor-move"
        >
          <VideoTile
            participant={{ userId: user._id, user, stream: localStreamRef.current, audioEnabled, videoEnabled, handRaised }}
            isSelf={true}
            isSharingScreen={screenSharing}
            isActiveSpeaker={activeSpeaker === user._id}
          />
        </div>

        {/* Side Panel */}
        <AnimatePresence>
          {activePanel && (
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute top-0 right-0 h-full w-full max-w-sm md:relative md:max-w-xs glass border-l border-white/10 flex flex-col overflow-hidden shrink-0 z-40"
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
                  {allParticipants.map(({ userId, user: pUser, handRaised: pHandRaised }) => (
                    <div key={userId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar src={pUser.avatar} name={pUser.name} size="sm" online={true} />
                        <div>
                          <p className="text-white text-sm font-medium">{pUser.name} {userId === user._id && '(You)'}</p>
                          {meeting?.host?._id === userId && <Badge variant="info" className="text-xs">Host</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(userId === user._id ? handRaised : pHandRaised) && <span>✋</span>}
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
      <div className="glass border-t border-white/10 px-4 py-3 flex items-center justify-center gap-2 md:gap-4 flex-wrap shrink-0 z-30">
        {/* Audio */}
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={toggleAudio}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${audioEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 text-white'}`}
        >
          {audioEnabled ? <MdMic size={22} /> : <MdMicOff size={22} />}
        </motion.button>

        {/* Video */}
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={toggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${videoEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 text-white'}`}
        >
          {videoEnabled ? <MdVideocam size={22} /> : <MdVideocamOff size={22} />}
        </motion.button>

        {/* Screen Share */}
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={toggleScreenShare}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${screenSharing ? 'bg-green-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
        >
          {screenSharing ? <MdStopScreenShare size={22} /> : <MdScreenShare size={22} />}
        </motion.button>

        {/* Raise Hand */}
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={toggleHand}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${handRaised ? 'bg-yellow-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
        >
          <MdPanTool size={22} />
        </motion.button>

        {/* Reactions */}
        <div className="relative">
          <motion.button aria-label="Send reaction"
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

        {/* Chat */}
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setActivePanel(p => p === 'chat' ? null : 'chat')}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all relative ${activePanel === 'chat' ? 'bg-indigo-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
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
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setActivePanel(p => p === 'people' ? null : 'people')}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${activePanel === 'people' ? 'bg-indigo-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
        >
          <MdPeople size={22} />
        </motion.button>

        {/* End Call */}
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
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
