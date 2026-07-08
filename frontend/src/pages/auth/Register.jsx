import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdEmail, MdLock, MdPerson } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register(form.name, form.email, form.password);
      toast.success('Welcome to NexMeet! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a] px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="glass rounded-3xl p-8 gradient-border">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center glow-sm">
                <span className="text-white font-black">N</span>
              </div>
              <span className="font-black text-2xl gradient-text">NexMeet</span>
            </Link>
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="text-slate-400 text-sm mt-1">Join thousands of teams on NexMeet</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" placeholder="John Doe" icon={MdPerson} value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} error={errors.name} />
            <Input label="Email" type="email" placeholder="you@example.com" icon={MdEmail} value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} error={errors.email} />
            <Input label="Password" type="password" placeholder="Min. 6 characters" icon={MdLock} value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} error={errors.password} />
            <Input label="Confirm Password" type="password" placeholder="Repeat password" icon={MdLock} value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })} error={errors.confirm} />

            <Button type="submit" className="w-full mt-2" size="lg" loading={loading}>
              Create Account
            </Button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
