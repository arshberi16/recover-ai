import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2, Sparkles, KeyRound, RotateCcw, Copy, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sendOTPEmail } from '../../services/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp, demoLogin, loading } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [step, setStep] = useState<'form' | 'otp_verify'>('form');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [copied, setCopied] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    let interval: any;
    if (step === 'otp_verify' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleStartSignupOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please provide both email and password.');
      return;
    }

    if (tab === 'signup') {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setStep('otp_verify');
      setTimer(60);
      setEnteredOtp('');
      
      // Dispatch background OTP email via service
      sendOTPEmail(email, fullName || email.split('@')[0], code);
      setSuccessMsg(`6-digit OTP code dispatched to ${email}`);
    } else {
      const res = await signIn(email, password);
      if (res.error) {
        setErrorMsg(res.error.message || 'Invalid login credentials');
      } else {
        setSuccessMsg('Signed in successfully!');
        setTimeout(() => onClose(), 800);
      }
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (enteredOtp.trim() !== generatedOtp.trim()) {
      setErrorMsg('Invalid OTP code. Please check the code and try again.');
      return;
    }

    const res = await signUp(email, password, fullName || email.split('@')[0]);
    if (res.error) {
      setErrorMsg(res.error.message || 'Signup failed');
    } else {
      setSuccessMsg('Identity verified & account created successfully!');
      setTimeout(() => {
        setStep('form');
        onClose();
      }, 900);
    }
  };

  const handleResendOTP = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setTimer(60);
    setErrorMsg('');
    sendOTPEmail(email, fullName || email.split('@')[0], code);
    setSuccessMsg(`New 6-digit OTP code sent to ${email}`);
  };

  const handleDemoLogin = () => {
    demoLogin('Payment Operations Lead');
    setSuccessMsg('Logged in as Payment Operations Lead!');
    setTimeout(() => onClose(), 600);
  };

  const handleCopyOTP = () => {
    navigator.clipboard.writeText(generatedOtp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => { setStep('form'); onClose(); }} 
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
                2FA Verified
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">Secure SSO & Multi-Tenant Payment Operations Isolation</p>
          </div>
        </div>

        {step === 'form' ? (
          <>
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
                Sign In to Account
              </button>
              <button
                onClick={() => { setTab('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
                  tab === 'signup'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                Create New Account (with OTP)
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

            {/* Initial Form */}
            <form onSubmit={handleStartSignupOTP} className="space-y-4">
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full justify-center py-2.5 font-bold"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                {tab === 'signin' ? 'Sign In to Portal' : 'Continue to OTP Verification'}
              </Button>
            </form>

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
          </>
        ) : (
          /* STEP 2: OTP Verification UI */
          <div className="space-y-5">
            {/* Interactive Demo OTP Toast Banner */}
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                  <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Verification OTP Dispatched:
                </span>
                <span className="font-mono font-extrabold text-base tracking-widest text-blue-600 dark:text-blue-400">
                  {generatedOtp}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-blue-200/60 dark:border-blue-800/60">
                <span className="text-blue-600/80 dark:text-blue-300/80">Code sent to <strong>{email}</strong></span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyOTP}
                    className="hover:underline flex items-center gap-1 font-bold text-blue-700 dark:text-blue-300"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={() => setEnteredOtp(generatedOtp)}
                    className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px]"
                  >
                    Auto-Fill
                  </button>
                </div>
              </div>
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

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 text-center">
                  Enter 6-Digit One-Time Password (OTP)
                </label>
                <div className="relative max-w-xs mx-auto">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="8 3 9 2 1 0"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                    className="w-full text-center tracking-[0.5em] font-mono text-xl font-extrabold py-3 bg-slate-50 dark:bg-slate-800 border-2 border-blue-500/50 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 shadow-inner"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || enteredOtp.length < 6}
                className="w-full justify-center py-3 font-bold bg-blue-600 hover:bg-blue-500 text-white"
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Verify OTP & Create Account
              </Button>
            </form>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="hover:underline text-slate-600 dark:text-slate-400 font-medium"
              >
                &larr; Back to Email & Password
              </button>

              <button
                type="button"
                disabled={timer > 0}
                onClick={handleResendOTP}
                className={`flex items-center gap-1 font-bold ${
                  timer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600 hover:underline dark:text-blue-400'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {timer > 0 ? `Resend Code in ${timer}s` : 'Resend OTP Code'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
