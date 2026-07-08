import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdEmail, MdLock } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: email, 2: otp+new password
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ otp: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const sendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp: form.otp, password: form.password });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a] px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass rounded-3xl p-8 gradient-border">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center glow-sm">
                <span className="text-white font-black">N</span>
              </div>
              <span className="font-black text-2xl gradient-text">NexMeet</span>
            </Link>
            <h1 className="text-2xl font-bold text-white">{step === 1 ? 'Forgot Password' : 'Reset Password'}</h1>
            <p className="text-slate-400 text-sm mt-1">
              {step === 1 ? 'Enter your email to receive an OTP' : `OTP sent to ${email}`}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={sendOTP} className="space-y-4">
              <Input label="Email" type="email" placeholder="you@example.com" icon={MdEmail}
                value={email} onChange={e => setEmail(e.target.value)} required />
              <Button type="submit" className="w-full" size="lg" loading={loading}>Send OTP</Button>
            </form>
          ) : (
            <form onSubmit={resetPassword} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1.5">Enter OTP</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-2xl font-bold tracking-widest focus:outline-none focus:border-indigo-500 transition-all"
                  placeholder="000000" maxLength={6} value={form.otp}
                  onChange={e => setForm({ ...form, otp: e.target.value })} required
                />
              </div>
              <Input label="New Password" type="password" placeholder="Min. 6 characters" icon={MdLock}
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              <Input label="Confirm Password" type="password" placeholder="Repeat password" icon={MdLock}
                value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
              <Button type="submit" className="w-full" size="lg" loading={loading}>Reset Password</Button>
              <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-slate-400 hover:text-white transition-colors">
                ← Back to email
              </button>
            </form>
          )}

          <p className="text-center text-slate-400 text-sm mt-6">
            Remember your password?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
