import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BsArrowRight, BsStars, BsCameraVideo, BsChatDots, BsShieldCheck, BsPeopleFill } from 'react-icons/bs';
import { MdSmartToy, MdScreenShare, MdRecordVoiceOver } from 'react-icons/md';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

const features = [
  { icon: BsCameraVideo, title: 'HD Video Calls', desc: 'Crystal clear 1080p video with up to 100 participants in a single meeting.', color: 'from-indigo-500 to-purple-500' },
  { icon: BsChatDots, title: 'Real-time Chat', desc: 'Instant messaging with file sharing, emoji reactions, and voice notes.', color: 'from-purple-500 to-pink-500' },
  { icon: MdSmartToy, title: 'AI Assistant', desc: 'Built-in AI to summarize meetings, generate notes, fix code, and more.', color: 'from-cyan-500 to-blue-500' },
  { icon: MdScreenShare, title: 'Screen Sharing', desc: 'Share your screen, window, or tab with one click during meetings.', color: 'from-green-500 to-teal-500' },
  { icon: BsShieldCheck, title: 'End-to-End Security', desc: 'JWT auth, encrypted connections, and meeting passwords for full security.', color: 'from-orange-500 to-red-500' },
  { icon: BsPeopleFill, title: 'Team Collaboration', desc: 'Group chats, friend system, and real-time presence indicators.', color: 'from-pink-500 to-rose-500' },
];

const testimonials = [
  { name: 'Sarah Johnson', role: 'Product Manager', text: 'NexMeet completely replaced Zoom for our team. The AI meeting summaries alone save us hours every week.', avatar: 'SJ' },
  { name: 'Alex Chen', role: 'Software Engineer', text: 'The integrated AI assistant is incredible. I use it to explain code and fix bugs right during meetings.', avatar: 'AC' },
  { name: 'Maria Garcia', role: 'CEO, StartupX', text: 'Premium quality at an unbeatable price. The UI is stunning and everything just works perfectly.', avatar: 'MG' },
];

const faqs = [
  { q: 'How many participants can join a meeting?', a: 'NexMeet supports up to 100 participants in a single meeting on the free plan, and unlimited on Premium.' },
  { q: 'Is NexMeet free to use?', a: 'Yes! NexMeet has a generous free tier. Premium plans unlock advanced features like recording, AI summaries, and more.' },
  { q: 'How does the AI assistant work?', a: 'Our AI assistant is powered by advanced language models. It can summarize meetings, generate notes, explain code, and answer questions.' },
  { q: 'Is my data secure?', a: 'Absolutely. We use JWT authentication, bcrypt password hashing, and encrypted connections to keep your data safe.' },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col items-center gap-6">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-indigo-400 border border-indigo-500/30">
                <BsStars className="text-yellow-400" />
                Introducing NexMeet AI — The Future of Meetings
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-black text-white leading-tight max-w-4xl">
              Meet, Chat &{' '}
              <span className="gradient-text">Collaborate</span>
              {' '}with AI
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-slate-400 max-w-2xl">
              The all-in-one platform combining HD video calls, real-time chat, and an AI assistant. Built for modern teams.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
              <Link to="/register">
                <Button size="xl" className="group">
                  Start for Free
                  <BsArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="xl">Watch Demo</Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-8 mt-8">
              {[['10K+', 'Active Users'], ['500K+', 'Meetings Hosted'], ['99.9%', 'Uptime'], ['4.9★', 'Rating']].map(([val, label]) => (
                <div key={label} className="text-center">
                  <div className="text-2xl font-black gradient-text">{val}</div>
                  <div className="text-sm text-slate-500">{label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-16 relative"
          >
            <div className="glass rounded-3xl p-4 max-w-4xl mx-auto gradient-border">
              <div className="bg-[#1a1a2e] rounded-2xl overflow-hidden">
                {/* Mock meeting UI */}
                <div className="bg-[#0f0f1a] px-4 py-3 flex items-center gap-3 border-b border-white/10">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-xs text-slate-500 mx-auto">NexMeet — Team Standup • 4 participants</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4">
                  {['Alex', 'Sarah', 'Mike', 'You'].map((name, i) => (
                    <div key={name} className={`aspect-video rounded-xl flex items-center justify-center relative overflow-hidden ${i === 3 ? 'ring-2 ring-indigo-500' : ''}`}
                      style={{ background: `linear-gradient(135deg, hsl(${i * 60 + 200}, 70%, 20%), hsl(${i * 60 + 240}, 70%, 15%))` }}>
                      <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-white font-bold">
                        {name[0]}
                      </div>
                      <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-0.5 rounded-full">{name}</span>
                      {i === 1 && <span className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full" />}
                    </div>
                  ))}
                </div>
                {/* Controls */}
                <div className="flex items-center justify-center gap-3 pb-4">
                  {['🎤', '📷', '🖥️', '✋', '💬', '⚙️'].map(emoji => (
                    <div key={emoji} className="w-10 h-10 rounded-full glass flex items-center justify-center text-lg cursor-pointer hover:bg-white/20 transition-colors">
                      {emoji}
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white cursor-pointer hover:bg-red-600 transition-colors">
                    📞
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Everything you need to <span className="gradient-text">collaborate</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              NexMeet combines the best of video conferencing, team chat, and AI assistance in one beautiful platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card hover className="h-full">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4`}>
                    <f.icon size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Simple <span className="gradient-text">Pricing</span></h2>
            <p className="text-slate-400 text-lg">Start free, upgrade when you need more.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                name: 'Free', price: '$0', period: 'forever', color: 'border-white/10',
                features: ['Up to 100 participants', '40-min meeting limit', 'Real-time chat', 'Basic AI assistant', '5GB storage'],
                cta: 'Get Started Free', variant: 'secondary'
              },
              {
                name: 'Premium', price: '$12', period: '/month', color: 'border-indigo-500/50', popular: true,
                features: ['Unlimited participants', 'Unlimited meeting time', 'Advanced AI features', 'Meeting recording', 'Custom backgrounds', '100GB storage', 'Priority support'],
                cta: 'Start Premium', variant: 'primary'
              }
            ].map((plan) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`glass rounded-2xl p-8 border ${plan.color} relative ${plan.popular ? 'glow' : ''}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-bg text-white text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black gradient-text">{plan.price}</span>
                  <span className="text-slate-400">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-slate-300 text-sm">
                      <span className="text-green-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <Button variant={plan.variant} className="w-full">{plan.cta}</Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">Loved by <span className="gradient-text">thousands</span></h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full">
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm">{t.avatar}</div>
                    <div>
                      <p className="text-white font-semibold text-sm">{t.name}</p>
                      <p className="text-slate-500 text-xs">{t.role}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">Frequently Asked <span className="gradient-text">Questions</span></h2>
          </motion.div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card>
                  <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                  <p className="text-slate-400 text-sm">{faq.a}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="max-w-4xl mx-auto glass rounded-3xl p-12 text-center gradient-border">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Ready to <span className="gradient-text">get started?</span>
          </h2>
          <p className="text-slate-400 text-lg mb-8">Join thousands of teams already using NexMeet.</p>
          <Link to="/register">
            <Button size="xl" className="group">
              Create Free Account
              <BsArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">N</span>
              </div>
              <span className="font-black text-xl gradient-text">NexMeet</span>
            </div>
            <p className="text-slate-500 text-sm">© 2026 NexMeet. Built with ❤️ for modern teams.</p>
            <div className="flex gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
