import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdSend, MdAdd, MdSearch, MdAttachFile, MdEmojiEmotions, MdEdit, MdDelete, MdCheck, MdDoneAll, MdVideoCall, MdArrowBack } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';
import api from '../../utils/api';
import { getSocket, connectSocket } from '../../socket/socket';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import Sidebar from '../../components/layout/Sidebar';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { playNotificationSound } from '../../utils/sound';

const getOtherParticipant = (conversation, currentUser) => {
  if (!conversation || !currentUser) return null;
  return conversation.participants.find(p => p._id !== currentUser._id);
};

const ChatPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { conversations, activeConversation, messages, typingUsers, fetchConversations, setActiveConversation, fetchMessages, addMessage, updateMessage, deleteMessage, setTyping } = useChatStore();
  const socket = connectSocket(user?._id);

  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchUsers, setSearchUsers] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [convSearch, setConvSearch] = useState('');
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    // Load friends list for new chat
    api.get('/auth/me').then(({ data }) => setFriendsList(data.user.friends || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id);
      socket.emit('chat:join', activeConversation._id);
    }
  }, [activeConversation]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket listeners
  useEffect(() => {
    socket.on('chat:message', (msg) => {
      if (msg.conversation === activeConversation?._id) {
        // Sirf doosre ka message add karo — apna message sendMessage mein already add ho gaya
        if (msg.sender?._id !== user._id) {
          addMessage(msg);
          playNotificationSound();
        }
      }
    });

    socket.on('chat:typing', ({ conversationId, userId, userName }) => {
      if (conversationId === activeConversation?._id && userId !== user._id) {
        setTyping(conversationId, userId, true);
      }
    });

    socket.on('chat:stop-typing', ({ conversationId, userId }) => {
      setTyping(conversationId, userId, false);
    });

    socket.on('chat:message-edited', ({ message }) => updateMessage(message));
    socket.on('chat:message-deleted', ({ messageId }) => deleteMessage(messageId));

    return () => {
      socket.off('chat:message');
      socket.off('chat:typing');
      socket.off('chat:stop-typing');
      socket.off('chat:message-edited');
      socket.off('chat:message-deleted');
    };
  }, [socket, activeConversation]);

  const handleTyping = () => {
    socket.emit('chat:typing', { conversationId: activeConversation._id, userId: user._id, userName: user.name });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat:stop-typing', { conversationId: activeConversation._id, userId: user._id });
    }, 1500);
  };

  const sendMessage = async (content = input, type = 'text') => {
    if (!content.trim() || !activeConversation) return;
    try {
      const { data } = await api.post('/chat/messages', { conversationId: activeConversation._id, content, type });
      addMessage(data.message);
      socket.emit('chat:message', { ...data.message, conversationId: activeConversation._id });
      setInput('');
      setShowEmoji(false);
    } catch { toast.error('Failed to send message'); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', activeConversation._id);
    formData.append('type', file.type.startsWith('image') ? 'image' : 'file');
    try {
      const { data } = await api.post('/chat/messages', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      addMessage(data.message);
      socket.emit('chat:message', { ...data.message, conversationId: activeConversation._id });
    } catch { toast.error('Failed to upload file'); }
  };

  const handleEdit = async () => {
    try {
      const { data } = await api.put(`/chat/messages/${editingMessage._id}`, { content: editContent });
      updateMessage(data.message);
      socket.emit('chat:message-edited', { message: data.message, conversationId: activeConversation._id });
      setEditingMessage(null);
    } catch { toast.error('Failed to edit message'); }
  };

  const handleDelete = async (msgId) => {
    try {
      await api.delete(`/chat/messages/${msgId}`);
      deleteMessage(msgId);
      socket.emit('chat:message-deleted', { messageId: msgId, conversationId: activeConversation._id });
    } catch { toast.error('Failed to delete message'); }
  };

  const searchForUsers = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) return setSearchUsers([]);
    const { data } = await api.get(`/users/search?q=${q}`);
    setSearchUsers(data.users);
  };

  const startConversation = async (userId) => {
    const { data } = await api.post('/chat/conversations', { participantId: userId });
    await fetchConversations();
    setActiveConversation(data.conversation);
    setShowNewChat(false);
  };

  // const navigate = useNavigate();

  const startVideoCallFromChat = async () => {
    const other = getOtherParticipant(activeConversation);
    try {
      const { data } = await api.post('/meetings/create', {
        title: `Call with ${other?.name || 'User'}`,
        type: 'instant',
      });
      // Send meeting link as message
      await api.post('/chat/messages', {
        conversationId: activeConversation._id,
        content: `📹 Video call started! Join: ${window.location.origin}/meeting/${data.meeting.meetingId}`,
        type: 'text',
      });
      navigate(`/meeting/${data.meeting.meetingId}`);
    } catch { toast.error('Failed to start video call'); }
  };

  const isTyping = activeConversation && Object.entries(typingUsers).some(([key, val]) => key.startsWith(activeConversation._id) && val);
  
  const filteredConvs = conversations.filter(c => {
    const other = getOtherParticipant(c);
    return !convSearch || other?.name?.toLowerCase().includes(convSearch.toLowerCase()) || c.groupName?.toLowerCase().includes(convSearch.toLowerCase());
  });

  return (
    <Sidebar>
      <div className="flex rounded-2xl overflow-hidden bg-surface border border-border h-full md:h-[calc(100dvh-8rem)] shadow-sm">
        {/* Conversations List */}
        <div className={`w-full md:w-80 shrink-0 md:border-r border-border flex flex-col ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-text">Messages</h2>
              <Button size="icon" variant="ghost" onClick={() => setShowNewChat(true)}>
                <MdAdd size={20} />
              </Button>
            </div>
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
              <input
                className="w-full bg-secondary border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-text placeholder-muted focus:outline-none focus:border-primary"
                placeholder="Search conversations..."
                value={convSearch}
                onChange={e => setConvSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConvs.length === 0 && (
              <div className="text-center py-12 text-muted text-sm">
                <MdAdd size={32} className="mx-auto mb-2 opacity-50" />
                No conversations yet
              </div>
            )}
            {filteredConvs.map(conv => {
              const other = getOtherParticipant(conv, user);
              const active = activeConversation?._id === conv._id;
              return (
                <motion.button
                  key={conv._id}
                  whileHover={{ x: 4 }}
                  onClick={() => setActiveConversation(conv)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-left ${active ? 'bg-primary/10 border-r-2 border-primary' : 'hover:bg-secondary'}`}
                >
                  <Avatar src={other?.avatar} name={other?.name || conv.groupName} size="md" online={other?.isOnline} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-text text-sm font-semibold truncate">{conv.isGroup ? conv.groupName : other?.name}</p>
                      {conv.lastMessage && (
                        <span className="text-muted text-xs shrink-0">
                          {format(new Date(conv.updatedAt), 'HH:mm')}
                        </span>
                      )}
                    </div>
                    <p className="text-muted text-xs truncate">
                      {conv.lastMessage?.isDeleted ? 'Message deleted' : conv.lastMessage?.content || 'Start a conversation'}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex-col overflow-hidden ${activeConversation ? 'flex' : 'hidden md:flex'}`}>
          {activeConversation ? (
            <>
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-border flex items-center gap-3 shrink-0">
              {/* Mobile Back Button */}
              <button onClick={() => setActiveConversation(null)} className="md:hidden p-1 text-muted hover:text-text"><MdArrowBack size={22} /></button>
              {(() => {
                const other = getOtherParticipant(activeConversation, user);
                return (
                  <>
                    <Avatar src={other?.avatar} name={other?.name || activeConversation.groupName} size="md" online={other?.isOnline} />
                    <div className="flex-1">
                      <p className="text-text font-semibold">{activeConversation.isGroup ? activeConversation.groupName : other?.name}</p>
                      <p className="text-xs text-muted">{other?.isOnline ? 'Online' : 'Offline'}</p>
                    </div>
                    <button
                      onClick={startVideoCallFromChat}
                      className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary-hover transition-all"
                      title="Start video call"
                    >
                      <MdVideoCall size={22} />
                    </button>
                  </>
                );
              })()}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMine = msg.sender?._id === user._id;
                return (
                  <motion.div
                    key={msg._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 group ${isMine ? 'flex-row-reverse' : ''}`}
                  >
                    {!isMine && <Avatar src={msg.sender?.avatar} name={msg.sender?.name} size="sm" />}
                    <div className={`max-w-[70%] flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                      {!isMine && <span className="text-xs text-muted">{msg.sender?.name}</span>}
                      <div className={`relative px-4 py-2.5 rounded-2xl text-sm ${isMine ? 'bg-primary text-white rounded-tr-sm' : 'bg-secondary text-text rounded-tl-sm'} ${msg.isDeleted ? 'opacity-50 italic' : ''}`}>
                        {msg.type === 'image' && msg.fileUrl ? (
                          <img src={msg.fileUrl} alt="shared" className="max-w-xs rounded-xl" />
                        ) : msg.type === 'file' ? (
                          <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-dark hover:underline">
                            <MdAttachFile size={16} /> {msg.fileName}
                          </a>
                        ) : (
                          msg.content
                        )}
                        {msg.isEdited && <span className={`text-xs opacity-60 ml-1 ${isMine ? 'text-white/70' : 'text-muted'}`}>(edited)</span>}

                        {/* Message actions */}
                        {!msg.isDeleted && isMine && (
                          <div className="absolute -top-8 right-0 hidden group-hover:flex gap-1 bg-surface rounded-lg p-1 border border-border shadow-md">
                            <button onClick={() => { setEditingMessage(msg); setEditContent(msg.content); }} className="p-1 hover:text-primary text-muted transition-colors">
                              <MdEdit size={14} />
                            </button>
                            <button onClick={() => handleDelete(msg._id)} className="p-1 hover:text-danger text-muted transition-colors">
                              <MdDelete size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted/70">{format(new Date(msg.createdAt), 'HH:mm')}</span>
                        {isMine && (
                          msg.readBy?.length > 1 ? <MdDoneAll size={14} className="text-primary" /> : <MdCheck size={14} className="text-muted" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-2 items-center">
                  <div className="flex gap-1 bg-secondary rounded-2xl px-4 py-3">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-2 h-2 bg-muted rounded-full"
                        animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Edit Message Bar */}
            {editingMessage && (
              <div className="px-4 py-2 bg-primary/10 border-t border-primary/20 flex items-center gap-2">
                <MdEdit size={16} className="text-primary" />
                <input
                  className="flex-1 bg-transparent text-text text-sm focus:outline-none"
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEdit()}
                  autoFocus
                />
                <button onClick={handleEdit} className="text-primary hover:text-primary-hover text-sm font-medium">Save</button>
                <button onClick={() => setEditingMessage(null)} className="text-muted hover:text-text text-sm">Cancel</button>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-border">
              <div className="flex items-end gap-2">
                <div className="flex-1 bg-secondary border border-border rounded-2xl px-4 py-3 flex items-end gap-2 focus-within:border-primary transition-colors">
                  <textarea
                    className="flex-1 bg-transparent text-text text-sm placeholder-muted focus:outline-none resize-none max-h-32"
                    placeholder="Type a message..."
                    rows={1}
                    value={input}
                    onChange={e => { setInput(e.target.value); handleTyping(); }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setShowEmoji(!showEmoji)} className="p-1.5 text-muted hover:text-warning transition-colors">
                      <MdEmojiEmotions size={20} />
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-muted hover:text-primary transition-colors">
                      <MdAttachFile size={20} />
                    </button>
                  </div>
                </div>
                <Button size="icon" onClick={() => sendMessage()} disabled={!input.trim()}>
                  <MdSend size={20} />
                </Button>
              </div>

              {/* Emoji Picker */}
              <AnimatePresence>
                {showEmoji && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-20 right-4 z-50">
                    <EmojiPicker
                      theme="light"
                      onEmojiClick={(e) => setInput(prev => prev + e.emoji)}
                      height={350}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </>
          ) : (
            <div className="flex-1 items-center justify-center hidden md:flex">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <MdSend size={36} />
                </div>
                <h3 className="text-text font-bold text-xl mb-2">Your Messages</h3>
                <p className="text-muted text-sm">Select a conversation or start a new one</p>
                <Button variant="primary" className="mt-4" onClick={() => setShowNewChat(true)}>
                  <MdAdd size={18} /> New Message
                </Button>
              </div>
            </div>
          )}
        </div>

        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
      </div>

      {/* New Chat Modal */}
      <Modal isOpen={showNewChat} onClose={() => { setShowNewChat(false); setSearchQuery(''); setSearchUsers([]); }} title="New Message">
        <div className="space-y-4 w-[90vw] md:w-full">
          <input
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-muted focus:outline-none focus:border-primary"
            placeholder="Search users..."
            value={searchQuery}
            onChange={e => searchForUsers(e.target.value)}
          />
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {/* Show friends when no search */}
            {searchQuery.length < 2 && friendsList.map(u => (
              <motion.button
                key={u._id}
                whileHover={{ x: 4 }}
                onClick={() => startConversation(u._id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
              >
                <Avatar src={u.avatar} name={u.name} size="md" online={u.isOnline} />
                <div>
                  <p className="text-text font-medium text-sm">{u.name}</p>
                  <p className="text-muted text-xs">Friend</p>
                </div>
              </motion.button>
            ))}
            {/* Show search results */}
            {searchQuery.length >= 2 && searchUsers.map(u => (
              <motion.button
                key={u._id}
                whileHover={{ x: 4 }}
                onClick={() => startConversation(u._id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
              >
                <Avatar src={u.avatar} name={u.name} size="md" online={u.isOnline} />
                <div>
                  <p className="text-text font-medium text-sm">{u.name}</p>
                  <p className="text-muted text-xs">{u.email}</p>
                </div>
              </motion.button>
            ))}
            {searchQuery.length >= 2 && searchUsers.length === 0 && (
              <p className="text-muted text-sm text-center py-4">No users found</p>
            )}
          </div>
        </div>
      </Modal>
    </Sidebar>
  );
};

export default ChatPage;
