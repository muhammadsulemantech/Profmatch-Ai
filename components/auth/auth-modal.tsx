'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  GraduationCap,
  ShieldCheck,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Clock,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalReason, login, setAuthenticatedUser, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [targetDegree, setTargetDegree] = useState('PhD');

  // OTP Fields
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15 * 60);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isAuthModalOpen) {
      document.body.style.overflow = 'hidden';
      // Reset state when opening
      setStep('form');
      setError(null);
      setSuccessMsg(null);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAuthModalOpen]);

  // 15-Minute Countdown timer
  useEffect(() => {
    if (step !== 'otp' || !expiresAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setSecondsRemaining(diffSecs);

      if (diffSecs === 0) {
        setError('Verification code has expired (15-minute limit). Please request a new code.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [step, expiresAt]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isAuthModalOpen) return null;

  // Handle Form Submit (Login OR Send OTP)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!fullName.trim() || fullName.trim().length < 2) {
          setError('Please enter your full name (minimum 2 characters).');
          setLoading(false);
          return;
        }

        if (!email.trim() || !email.includes('@')) {
          setError('Please enter a valid email address.');
          setLoading(false);
          return;
        }

        if (!password || password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }

        // Send 6-Digit OTP via Google SMTP
        const res = await fetch('/api/auth/signup/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: email.trim(),
            password,
            targetDegree,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || 'Failed to dispatch verification code.');
          setLoading(false);
          return;
        }

        // Move to OTP Step
        setExpiresAt(data.expiresAt || Date.now() + 15 * 60 * 1000);
        setSecondsRemaining(15 * 60);
        setResendCooldown(60);
        setOtp(['', '', '', '', '', '']);
        setStep('otp');
        setSuccessMsg(`A 6-digit code was sent to ${email.trim()}`);
        setLoading(false);

        setTimeout(() => {
          otpRefs.current[0]?.focus();
        }, 150);
      } else {
        // Login Flow
        const res = await login(email.trim(), password);
        if (!res.success) {
          setError(res.error || 'Invalid email or password.');
        }
        setLoading(false);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Handle OTP Inputs
  const handleOtpChange = (index: number, val: string) => {
    setError(null);
    const digitsOnly = val.replace(/\D/g, '');

    if (digitsOnly.length > 1) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digitsOnly[i] || '';
      }
      setOtp(newOtp);
      const targetIdx = Math.min(5, digitsOnly.length);
      otpRefs.current[targetIdx]?.focus();
      return;
    }

    const single = digitsOnly.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = single;
    setOtp(newOtp);

    if (single && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otp.join('').trim();

    if (fullCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    if (secondsRemaining <= 0) {
      setError('Code has expired. Click "Resend code" to request a new code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signup/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: fullCode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Wrong verification code. Please check your email and try again.');
        setLoading(false);
        return;
      }

      // Success: Hydrate user and close modal
      if (data.user) {
        setAuthenticatedUser(data.user);
      }
      setSuccessMsg('Account verified successfully!');
      setTimeout(() => {
        closeAuthModal();
      }, 800);
    } catch {
      setError('Failed to verify code. Please check connection.');
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/signup/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to resend code.');
        setLoading(false);
        return;
      }

      setExpiresAt(data.expiresAt || Date.now() + 15 * 60 * 1000);
      setSecondsRemaining(15 * 60);
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      setSuccessMsg(`A fresh 6-digit code has been dispatched to ${email.trim()}`);
      setLoading(false);
      otpRefs.current[0]?.focus();
    } catch {
      setError('Failed to resend code.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-start pt-20 sm:pt-24 pb-8 px-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md my-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-emerald-500/10 overflow-hidden shrink-0">
        {/* Modal Top Decorative Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-5">
          {/* Header */}
          <div className="space-y-1.5 text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
              <GraduationCap className="w-6 h-6" />
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" /> {step === 'otp' ? 'Security Verification' : 'Account Required'}
            </span>

            <h2 className="text-xl font-heading font-bold text-white tracking-tight">
              {step === 'otp'
                ? 'Enter Verification Code'
                : mode === 'signup'
                ? 'Create Researcher Account'
                : 'Welcome Back'}
            </h2>

            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              {step === 'otp'
                ? `Enter the 6-digit code dispatched to ${email}`
                : authModalReason || 'Please sign in or create an account to activate research workflows.'}
            </p>
          </div>

          {/* Tab Switcher (Only visible in form step) */}
          {step === 'form' && (
            <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'signup'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'login'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Log In
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-snug font-medium">{error}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-snug font-medium">{successMsg}</div>
            </div>
          )}

          {/* =========================================================
              STEP 1: LOGIN / SIGNUP DETAILS
             ========================================================= */}
          {step === 'form' && (
            <>
              {/* Google OAuth Button */}
              <div>
                <button
                  type="button"
                  onClick={() => loginWithGoogle()}
                  className="w-full py-2.5 rounded-xl font-semibold bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 text-xs transition-all flex items-center justify-center gap-2.5 shadow-sm"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Continue with Google
                </button>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-900 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-widest absolute">
                  Or Email Form
                </span>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} autoComplete={mode === 'signup' ? 'off' : 'on'} className="space-y-3.5">
                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Alex Morgan"
                          autoComplete="name"
                          className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Target Degree</label>
                      <select
                        value={targetDegree}
                        onChange={(e) => setTargetDegree(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="PhD">Doctoral (PhD Candidate)</option>
                        <option value="MS">Master of Science (MS / MSc)</option>
                        <option value="Postdoc">Postdoctoral Fellowship</option>
                        <option value="Internship">Research Assistant / Lab Internship</option>
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="researcher@university.edu"
                      autoComplete={mode === 'signup' ? 'new-email' : 'username'}
                      className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      {mode === 'signup' ? 'Sending Verification Code...' : 'Signing In...'}
                    </>
                  ) : (
                    <>
                      {mode === 'signup' ? 'Send Verification Code' : 'Sign In & Continue'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* =========================================================
              STEP 2: MODAL OTP VERIFICATION SCREEN
             ========================================================= */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate font-medium">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-slate-400 hover:text-emerald-400 text-[11px] font-semibold flex items-center gap-1 shrink-0 ml-2"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-center text-slate-300 mb-2">
                  Enter 6-Digit Code
                </label>
                <div className="flex justify-between gap-1.5 sm:gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-10 h-11 sm:w-11 sm:h-12 text-center text-lg font-bold font-mono text-white bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Expires in:</span>
                  <span className={`font-mono font-semibold ${secondsRemaining < 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {formatTime(secondsRemaining)}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleResend}
                  className="text-emerald-400 hover:text-emerald-300 disabled:text-slate-600 disabled:cursor-not-allowed font-medium text-xs"
                >
                  {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend code'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6 || secondsRemaining <= 0}
                className="w-full py-2.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Verifying Code...
                  </>
                ) : (
                  <>
                    Verify &amp; Activate Account
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
