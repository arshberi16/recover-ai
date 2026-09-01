import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2, Sparkles, KeyRound, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp, demoLogin, resetPassword, sendResetCodeEmail, loading } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot_password'>('signin');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Show / Hide Password state
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Forgot password flow states
  const [resetStep, setResetStep] = useState<'send_code' | 'enter_new_pass'>('send_code');
  const [generatedResetCode, setGeneratedResetCode] = useState('');
  const [inputResetCode, setInputResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [sendingReset, setSendingReset] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (tab === 'signup') {
      if (!email || !password) {
        setErrorMsg('Please provide both email and password.');
        return;
      }
      const res = await signUp(email, password, fullName || email.split('@')[0]);
      if (res.error) {
        setErrorMsg(res.error.message || 'Account registration failed');
      } else {
        setSuccessMsg(`Account created successfully! Welcome email sent to ${email}`);
        setTimeout(() => {
          onClose();
        }, 900);
      }
    } else if (tab === 'signin') {
      if (!email || !password) {
        setErrorMsg('Please provide both email and password.');
        return;
      }
      const res = await signIn(email, password);
      if (res.error) {
        setErrorMsg(res.error.message || 'Invalid login credentials');
      } else {
        setSuccessMsg('Signed in successfully!');
        setTimeout(() => onClose(), 800);
      }
    }
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter your valid merchant work email.');
      return;
    }

    setSendingReset(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedResetCode(code);

    await sendResetCodeEmail(email, code);
    setSendingReset(false);

    setResetStep('enter_new_pass');
    setSuccessMsg(`6-digit Password Reset code dispatched to ${email}. Check your inbox!`);
  };

  const handleConfirmNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!inputResetCode || inputResetCode.trim() !== generatedResetCode.trim()) {
      setErrorMsg('Invalid 6-digit verification code. Please check your email inbox.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    await resetPassword(email, newPassword);
    setSuccessMsg('Password reset successfully! You can now Sign In with your new password.');
    setTimeout(() => {
      setTab('signin');
      setPassword(newPassword);
      setResetStep('send_code');
      setSuccessMsg('Password updated! Click Sign In to continue.');
    }, 1200);
  };

  const handleDemoLogin = () => {
    demoLogin('Payment Operations Lead');
    setSuccessMsg('Logged in as Payment Operations Lead!');
    setTimeout(() => onClose(), 600);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="RecoverAI Merchant Authentication"
    >
      <div className="space-y-5">
        {/* Branding Header */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center gap-3 shadow-md">
          <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-400/30">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="font-bold text-sm text-white flex items-center gap-1.5">
              RecoverAI Enterprise Portal
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Email Security
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">Secure SSO & Multi-Tenant Payment Operations Isolation</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => { setTab('signin'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
              tab === 'signin'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('signup'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
              tab === 'signup'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            Create New Account
          </button>
          <button
            onClick={() => { setTab('forgot_password'); setResetStep('send_code'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
              tab === 'forgot_password'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            Forgot Password?
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Forgot Password View */}
        {tab === 'forgot_password' ? (
          <div className="space-y-4">
            {resetStep === 'send_code' ? (
              <form onSubmit={handleSendResetCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Enter Registered Merchant Work Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      placeholder="merchant@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={sendingReset}
                  className="w-full justify-center py-2.5 font-bold bg-rose-600 hover:bg-rose-500 text-white"
                  icon={sendingReset ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                >
                  {sendingReset ? 'Sending Reset Email...' : 'Send Password Reset Email'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleConfirmNewPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">6-Digit Verification Code (Sent to Email)</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={inputResetCode}
                      onChange={(e) => setInputResetCode(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold tracking-widest text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Enter New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                      title={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full justify-center py-2.5 font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Update Password & Sign In
                </Button>
              </form>
            )}
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Aarav Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Merchant Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  placeholder="payment.ops@merchant.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
                {tab === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setTab('forgot_password'); setErrorMsg(''); setSuccessMsg(''); }}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full justify-center py-2.5 font-bold bg-blue-600 hover:bg-blue-500 text-white"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {tab === 'signin' ? 'Sign In to Portal' : 'Create Merchant Account'}
            </Button>
          </form>
        )}

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400">Or Quick Test</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        <button
          onClick={handleDemoLogin}
          className="w-full py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-blue-500" />
          Instant Demo Payment Ops Admin Login
        </button>
      </div>
    </Modal>
  );
};
