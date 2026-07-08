import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdEmail, MdLock } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 👋');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a] px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative">
        <div className="glass rounded-3xl p-8 gradient-border">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center glow-sm">
                <span className="text-white font-black">N</span>
              </div>
              <span className="font-black text-2xl gradient-text">NexMeet</span>
            </Link>
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-slate-400 text-sm mt-1">Sign in to your NexMeet account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" type="email" placeholder="you@example.com" icon={MdEmail}
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <Input label="Password" type="password" placeholder="Your password" icon={MdLock}
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-indigo-400 hover:text-indigo-300">Forgot password?</Link>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>Sign In</Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <p className="text-xs text-indigo-400 text-center font-medium">Demo: demo@nexmeet.com / demo123</p>
          </div>

          <p className="text-center text-slate-400 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">Sign up free</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
