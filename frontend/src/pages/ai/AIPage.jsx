import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdSend, MdSmartToy, MdPerson, MdContentCopy, MdRefresh } from 'react-icons/md';
import { BsStars, BsCode, BsTranslate, BsFileText, BsBug } from 'react-icons/bs';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/ui/Button';

const QUICK_PROMPTS = [
  { icon: BsFileText, label: 'Summarize Meeting', prompt: 'Summarize a typical team standup meeting with action items' },
  { icon: BsCode, label: 'Explain Code', prompt: 'Explain what a React useEffect hook does and best practices' },
  { icon: BsBug, label: 'Fix Bug', prompt: 'Help me fix a common JavaScript async/await bug' },
  { icon: BsTranslate, label: 'Translate Text', prompt: 'Translate "Hello, how are you?" to Spanish, French, and Japanese' },
  { icon: BsStars, label: 'Generate Notes', prompt: 'Generate a meeting notes template for a product planning session' },
  { icon: BsCode, label: 'React Component', prompt: 'Generate a reusable React button component with TypeScript' },
];

// Simple markdown renderer (bold, code blocks, lists)
const SimpleMarkdown = ({ content }) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('```')) return null;
        if (line.startsWith('# ')) return <h3 key={i} className="font-bold text-white text-base">{line.slice(2)}</h3>;
        if (line.startsWith('## ')) return <h4 key={i} className="font-semibold text-white">{line.slice(3)}</h4>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-slate-200">{line.slice(2)}</li>;
        if (line.match(/^\d+\./)) return <li key={i} className="ml-4 list-decimal text-slate-200">{line.replace(/^\d+\.\s/, '')}</li>;
        if (!line.trim()) return <br key={i} />;
        // Bold
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-slate-200 leading-relaxed">
            {parts.map((p, j) =>
              p.startsWith('**') ? <strong key={j} className="text-white font-semibold">{p.slice(2, -2)}</strong> : p
            )}
          </p>
        );
      })}
    </div>
  );
};

const AIPage = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm **NexMeet AI**, your intelligent assistant. I can help you with:\n\n- 📝 Meeting summaries & notes\n- 💻 Code explanation & debugging\n- 🌐 Text translation\n- 📧 Email generation\n- 🔍 General questions\n\nWhat can I help you with today?",
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (prompt = input) => {
    if (!prompt.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post('/ai/chat', { prompt });
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied!');
  };

  const clearChat = () => setMessages([{ role: 'assistant', content: "Chat cleared! How can I help you?" }]);

  return (
    <Sidebar>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-bg rounded-2xl flex items-center justify-center glow-sm">
              <MdSmartToy size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">NexMeet AI</h1>
              <p className="text-slate-400 text-xs">Powered by advanced AI</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={clearChat}>
            <MdRefresh size={16} /> Clear
          </Button>
        </div>

        {/* Quick Prompts */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {QUICK_PROMPTS.map((qp) => (
            <motion.button
              key={qp.label}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => sendMessage(qp.prompt)}
              className="flex items-center gap-2 px-3 py-2 glass rounded-xl text-sm text-slate-300 hover:text-white border border-white/10 hover:border-indigo-500/50 transition-all whitespace-nowrap shrink-0"
            >
              <qp.icon size={14} className="text-indigo-400" />
              {qp.label}
            </motion.button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'gradient-bg' : 'bg-white/10'}`}>
                {msg.role === 'assistant' ? <MdSmartToy size={16} className="text-white" /> : <MdPerson size={16} className="text-white" />}
              </div>
              <div className={`max-w-[80%] group relative flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'assistant' ? 'glass text-white rounded-tl-sm' : 'gradient-bg text-white rounded-tr-sm'}`}>
                  {msg.role === 'assistant' ? <SimpleMarkdown content={msg.content} /> : msg.content}
                </div>
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => copyMessage(msg.content)}
                    className="absolute -top-7 right-0 hidden group-hover:flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-[#1e1e2e] border border-white/10 rounded-lg px-2 py-1 transition-colors"
                  >
                    <MdContentCopy size={12} /> Copy
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center">
                <MdSmartToy size={16} className="text-white" />
              </div>
              <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-2 h-2 bg-indigo-400 rounded-full"
                    animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                ))}
                <span className="text-slate-400 text-xs ml-1">Thinking...</span>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="mt-4">
          <div className="glass rounded-2xl p-3 flex items-end gap-3 border border-white/10 focus-within:border-indigo-500/50 transition-colors">
            <textarea
              className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none resize-none max-h-32 min-h-[40px]"
              placeholder="Ask me anything... (Enter to send, Shift+Enter for new line)"
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            />
            <Button size="icon" onClick={() => sendMessage()} disabled={!input.trim() || loading}>
              <MdSend size={18} />
            </Button>
          </div>
          <p className="text-xs text-slate-600 text-center mt-2">AI responses may not always be accurate. Verify important information.</p>
        </div>
      </div>
    </Sidebar>
  );
};

export default AIPage;
