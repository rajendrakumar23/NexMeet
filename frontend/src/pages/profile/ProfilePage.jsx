import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { MdEdit, MdSave, MdLock, MdDelete, MdCamera } from 'react-icons/md';
import { BsPerson, BsPhone, BsEnvelope } from 'react-icons/bs';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import useAuthStore from '../../store/authStore';
import Sidebar from '../../components/layout/Sidebar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';

const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', bio: user?.bio || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const saveProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.put('/auth/update-profile', form);
      updateUser(data.user);
      setEditing(false);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setLoading(false); }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const { data } = await api.put('/auth/upload-avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser(data.user);
      toast.success('Avatar updated!');
    } catch { toast.error('Failed to upload avatar'); }
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('Password changed!');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    finally { setLoading(false); }
  };

  return (
    <Sidebar>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10" />
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative group">
              <Avatar src={user?.avatar} name={user?.name} size="xl" online={true} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MdCamera size={24} className="text-white" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-black text-white">{user?.name}</h1>
              <p className="text-slate-400">{user?.email}</p>
              {user?.bio && <p className="text-slate-300 text-sm mt-2">{user.bio}</p>}
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs border border-indigo-500/30 capitalize">
                  {user?.role}
                </span>
                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs border border-green-500/30">
                  Online
                </span>
              </div>
            </div>

            <Button variant="secondary" size="sm" onClick={() => setEditing(!editing)}>
              <MdEdit size={16} /> {editing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </Card>

        {/* Edit Form */}
        {editing && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <h2 className="text-lg font-bold text-white mb-4">Edit Profile</h2>
              <div className="space-y-4">
                <Input label="Full Name" icon={BsPerson} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <Input label="Phone" icon={BsPhone} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 8900" />
                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-1.5">Bio</label>
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all resize-none"
                    rows={3}
                    placeholder="Tell us about yourself..."
                    value={form.bio}
                    onChange={e => setForm({ ...form, bio: e.target.value })}
                    maxLength={200}
                  />
                  <p className="text-xs text-slate-500 text-right">{form.bio.length}/200</p>
                </div>
                <Button onClick={saveProfile} loading={loading}>
                  <MdSave size={16} /> Save Changes
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Account Info */}
        <Card>
          <h2 className="text-lg font-bold text-white mb-4">Account Information</h2>
          <div className="space-y-3">
            {[
              { label: 'Email', value: user?.email, icon: BsEnvelope },
              { label: 'Phone', value: user?.phone || 'Not set', icon: BsPhone },
              { label: 'Member since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-', icon: BsPerson },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <item.icon size={16} className="text-indigo-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-white text-sm font-medium">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Security */}
        <Card>
          <h2 className="text-lg font-bold text-white mb-4">Security</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <MdLock size={16} className="text-indigo-400" />
                <div>
                  <p className="text-white text-sm font-medium">Password</p>
                  <p className="text-slate-500 text-xs">Last changed recently</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setShowPasswordModal(true)}>Change</Button>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="border border-red-500/20">
          <h2 className="text-lg font-bold text-red-400 mb-4">Danger Zone</h2>
          <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/20">
            <div>
              <p className="text-white text-sm font-medium">Delete Account</p>
              <p className="text-slate-500 text-xs">Permanently delete your account and all data</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
              <MdDelete size={16} /> Delete
            </Button>
          </div>
        </Card>
      </div>

      {/* Change Password Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change Password">
        <div className="space-y-4">
          <Input label="Current Password" type="password" icon={MdLock} value={passwordForm.currentPassword}
            onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
          <Input label="New Password" type="password" icon={MdLock} value={passwordForm.newPassword}
            onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
          <Input label="Confirm New Password" type="password" icon={MdLock} value={passwordForm.confirm}
            onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
          <Button className="w-full" onClick={changePassword} loading={loading}>Change Password</Button>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Account">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <p className="text-red-400 text-sm">⚠️ This action is irreversible. All your data, meetings, and messages will be permanently deleted.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1">Delete My Account</Button>
          </div>
        </div>
      </Modal>
    </Sidebar>
  );
};

export default ProfilePage;
