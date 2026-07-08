import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdSmartToy, MdClose, MdSend } from 'react-icons/md';
import { useLocation } from 'react-router-dom';
import api from '../../utils/api';
import useAuthStore from '../../store/authStore';

const FloatingAI = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hi! How can I help you? 👋' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  // Don't show on meeting page or AI page
  const hidden = location.pathname.startsWith('/meeting/') || location.pathname === '/ai' || !isAuthenticated;
  if (hidden) return null;

  const send = async () => {
    if (!input.trim() || loading) return;
    const prompt = input;
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post('/ai/chat', { prompt });
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 w-80 glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="gradient-bg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MdSmartToy size={18} className="text-white" />
                <span className="text-white font-semibold text-sm">NexMeet AI</span>
                <span className="w-2 h-2 bg-green-400 rounded-full" />
              </div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <MdClose size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto p-3 space-y-3 bg-[#0f0f1a]">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${msg.role === 'assistant' ? 'bg-white/10 text-white' : 'gradient-bg text-white'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-1 px-3 py-2 bg-white/10 rounded-xl w-fit">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                      animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }} />
                  ))}
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10 bg-[#0f0f1a] flex gap-2">
              <input
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                placeholder="Ask anything..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
              />
              <button onClick={send} disabled={!input.trim() || loading}
                className="w-8 h-8 gradient-bg rounded-xl flex items-center justify-center text-white disabled:opacity-50 transition-opacity">
                <MdSend size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className="w-14 h-14 gradient-bg rounded-2xl flex items-center justify-center shadow-lg glow pulse-glow"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <MdClose size={24} className="text-white" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MdSmartToy size={24} className="text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default FloatingAI;
