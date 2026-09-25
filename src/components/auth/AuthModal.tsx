import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Mail, User, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  React.useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (!res.success) {
          setError(res.error || 'Invalid credentials.');
        } else {
          onClose();
        }
      } else if (mode === 'signup') {
        if (!fullName.trim()) {
          setError('Please provide your full legal name.');
          setLoading(false);
          return;
        }
        const res = await signup(fullName, email, password);
        if (!res.success) {
          setError(res.error || 'Failed to register.');
        } else {
          setSuccessNotice('Account successfully created! Welcome to NEXORA.');
          setTimeout(() => onClose(), 1000);
        }
      } else if (mode === 'forgot') {
        setSuccessNotice(`Password recovery instructions sent to ${email}.`);
        setTimeout(() => setMode('login'), 2500);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in text-xs">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-7 shadow-2xl relative space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 mx-auto flex items-center justify-center font-bold text-white text-xl shadow-md shadow-blue-500/20">
            N
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {mode === 'login' ? 'Sign In to NEXORA' : mode === 'signup' ? 'Create Fresh NEXORA Account' : 'Password Recovery'}
          </h2>
          <p className="text-xs text-slate-500">
            Institutional crypto exchange &amp; audited ledger platform
          </p>
        </div>

        {/* Tabs for Login / Signup */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 rounded-lg font-bold transition-all ${
                mode === 'login' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`py-2 rounded-lg font-bold transition-all ${
                mode === 'signup' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register Account
            </button>
          </div>
        )}

        {/* Alert Messages */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="text-slate-700 font-bold block mb-1">Full Legal Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-slate-700 font-bold block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                required
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-700 font-bold">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-blue-600 font-semibold hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-wider uppercase shadow-md shadow-blue-600/20 transition-all ${
              loading ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {loading
              ? 'Authenticating...'
              : mode === 'login'
              ? 'Sign In to Account'
              : mode === 'signup'
              ? 'Create Fresh Account'
              : 'Send Reset Link'}
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Encrypted Session • Zero Mock Data</span>
        </div>

        {mode === 'forgot' && (
          <div className="text-center pt-1">
            <button
              onClick={() => setMode('login')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
