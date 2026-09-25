import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, ShieldCheck, KeyRound, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
];

export const SettingsView: React.FC = () => {
  const { user, updateUserAvatar, updateUserData, verifyCurrentEmail } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [country, setCountry] = useState(user?.country || 'United States');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorActive, setTwoFactorActive] = useState(true);

  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  if (!user) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserData(fullName, country);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setPasswordMessage({ text: 'New password must be at least 8 characters.', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'Passwords do not match.', isError: true });
      return;
    }

    setPasswordMessage({ text: 'Password successfully updated! Security credentials refreshed.' });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMessage(null), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-blue-600" /> Account Security &amp; Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal identity, verified credentials, password, and two-factor authentication.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 text-xs">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" /> Profile Information
          </h2>

          {/* Avatar selector */}
          <div>
            <label className="text-slate-700 font-bold block mb-2">Profile Avatar</label>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 overflow-hidden border-2 border-blue-600 shadow-sm">
                <img
                  src={user.avatarUrl || AVATAR_PRESETS[0]}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 block">Choose Avatar Preset:</span>
                <div className="flex items-center gap-2">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => updateUserAvatar(preset)}
                      className="w-7 h-7 rounded-full overflow-hidden border border-slate-300 hover:border-blue-600 transition-all hover:scale-110"
                    >
                      <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3.5">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Full Legal Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">Email Address</label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-500 cursor-not-allowed font-mono-numbers"
                />
                {user.emailVerified ? (
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold border border-emerald-200 whitespace-nowrap">
                    VERIFIED
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={verifyCurrentEmail}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold border border-blue-200 whitespace-nowrap transition-colors"
                  >
                    VERIFY
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">Country / Jurisdiction</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            {profileSaved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Profile successfully updated.
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95"
            >
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Security & Credentials Card */}
        <div className="md:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" /> Security Credentials
            </h2>

            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">New Secure Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {passwordMessage && (
                <div
                  className={`p-3 rounded-xl text-xs border flex items-center gap-2 ${
                    passwordMessage.isError
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  {passwordMessage.isError ? (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  <span className="font-semibold">{passwordMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-all active:scale-95"
              >
                Update Password
              </button>
            </form>
          </div>

          {/* 2FA Toggle & Sessions */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Two-Factor Authentication (2FA)</h3>
                  <p className="text-[11px] text-slate-500">Enhanced protection for asset withdrawals.</p>
                </div>
              </div>
              <button
                onClick={() => setTwoFactorActive(!twoFactorActive)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                  twoFactorActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {twoFactorActive ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            <div className="border-t border-slate-100 pt-3 text-xs text-slate-500 space-y-1 font-mono-numbers">
              <div className="flex justify-between">
                <span>Active Login Session:</span>
                <span className="text-emerald-600 font-bold">Current Browser Session</span>
              </div>
              <div className="flex justify-between">
                <span>Account Role:</span>
                <span className="text-blue-700 font-bold">{user.role}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
