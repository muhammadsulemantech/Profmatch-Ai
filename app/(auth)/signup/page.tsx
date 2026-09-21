'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  Edit2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

export default function SignupPage() {
  const router = useRouter();
  const { setAuthenticatedUser, loginWithGoogle } = useAuth();

  // Registration step: 'details' | 'verify'
  const [step, setStep] = useState<'details' | 'verify'>('details');

  // Step 1: Input details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [targetDegree, setTargetDegree] = useState('PhD');

  // Step 2: 6-Digit OTP inputs
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 15-Minute Expiration countdown (starts when code is sent)
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15 * 60);

  // Resend cooldown timer (60 seconds)
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Countdown timer effect
  useEffect(() => {
    if (step !== 'verify' || !expiresAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setSecondsRemaining(diffSecs);

      if (diffSecs === 0) {
        setError('Verification code has expired (15-minute limit). Please click "Resend Code" to get a fresh code.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [step, expiresAt]);

  // Resend cooldown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // STEP 1: Handle Send OTP Request
  const handleInitiateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Please provide your full name (at least 2 characters).');
      setLoading(false);
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      setLoading(false);
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
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
        setError(data.error || 'Failed to send verification code. Please try again.');
        setLoading(false);
        return;
      }

      // Success: move to Step 2
      setExpiresAt(data.expiresAt || Date.now() + 15 * 60 * 1000);
      setSecondsRemaining(15 * 60);
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      setStep('verify');
      setSuccessMsg(`A 6-digit verification code was sent to ${email.trim()}`);
      setLoading(false);

      // Focus first OTP input
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 200);
    } catch {
      setError('Network error. Failed to communicate with server.');
      setLoading(false);
    }
  };

  // OTP Input handlers (auto-jump, backspace, paste)
  const handleOtpChange = (index: number, val: string) => {
    setError(null);

    // If user pasted a 6-digit code or multiple digits
    const digitsOnly = val.replace(/\D/g, '');
    if (digitsOnly.length > 1) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digitsOnly[i] || '';
      }
      setOtp(newOtp);
      const nextIndex = Math.min(5, digitsOnly.length);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const singleDigit = digitsOnly.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = singleDigit;
    setOtp(newOtp);

    // Auto-advance to next input
    if (singleDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);
    const targetIdx = Math.min(5, pasted.length);
    otpInputRefs.current[targetIdx]?.focus();
  };

  // STEP 2: Verify Code and Finalize Registration
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullCode = otp.join('').trim();

    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    if (secondsRemaining <= 0) {
      setError('Verification code has expired. Please click "Resend Code" to get a new one.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

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

      // Success: hydrate user state and redirect
      if (data.user) {
        setAuthenticatedUser(data.user);
      }
      setSuccessMsg('Email verified successfully! Redirecting to your dashboard...');

      setTimeout(() => {
        router.push('/choose-plan');
        router.refresh();
      }, 1000);
    } catch {
      setError('Connection failed during code verification.');
      setLoading(false);
    }
  };

  // STEP 2: Resend Code
  const handleResendOtp = async () => {
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
        setError(data.error || 'Failed to resend code. Please try again.');
        setLoading(false);
        return;
      }

      setExpiresAt(data.expiresAt || Date.now() + 15 * 60 * 1000);
      setSecondsRemaining(15 * 60);
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      setSuccessMsg(`A fresh 6-digit code has been sent to ${email.trim()}`);
      setLoading(false);
      otpInputRefs.current[0]?.focus();
    } catch {
      setError('Failed to resend code. Network connection error.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#080B11] flex items-center justify-center px-4 pt-24 sm:pt-28 pb-16 selection:bg-emerald-500/25 selection:text-emerald-300">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-2xl shadow-emerald-500/5 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            {step === 'details' ? (
              <GraduationCap className="w-6 h-6" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            )}
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            {step === 'details' ? 'Academic Outreach Registry' : 'Email Security Verification'}
          </div>
          <h1 className="text-2xl font-heading font-bold text-white tracking-tight">
            {step === 'details' ? 'Create Researcher Account' : 'Enter Verification Code'}
          </h1>
          <p className="text-xs text-slate-400">
            {step === 'details'
              ? 'Begin discovering matched faculty and preparing evidence-based outreach.'
              : `We sent a 6-digit code to ${email}. Please enter it below to verify.`}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{successMsg}</span>
          </div>
        )}

        {/* =========================================================
            STEP 1: MANUAL SIGNUP FORM
           ========================================================= */}
        {step === 'details' && (
          <>
            {/* Google OAuth Signup Button */}
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
                Sign Up with Google
              </button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-widest absolute">
                Or Register with Email
              </span>
            </div>

            <form onSubmit={handleInitiateSignup} autoComplete="off" className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Elena Rostova"
                    autoComplete="name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="elena.rostova@university.edu"
                    autoComplete="new-email"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Degree</label>
                <select
                  value={targetDegree}
                  onChange={(e) => setTargetDegree(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="PhD">Doctoral (PhD Candidate)</option>
                  <option value="MS">Master of Science (MS / MSc)</option>
                  <option value="Postdoc">Postdoctoral Fellowship</option>
                  <option value="Internship">Research Assistant / Lab Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Sending Verification Code...
                  </>
                ) : (
                  <>
                    Create Researcher Account
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* =========================================================
            STEP 2: 6-DIGIT OTP VERIFICATION SCREEN
           ========================================================= */}
        {step === 'verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* Email summary & edit trigger */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
              <div className="flex items-center gap-2 truncate">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate font-medium">{email}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('details');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1 text-[11px] font-semibold shrink-0 ml-2"
              >
                <Edit2 className="w-3 h-3" />
                Change
              </button>
            </div>

            {/* 6 OTP Input Boxes */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-center text-slate-300">
                Enter 6-Digit Code
              </label>
              <div className="flex justify-between gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold font-mono text-white bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all selection:bg-transparent"
                  />
                ))}
              </div>
            </div>

            {/* Timer & Expiry Display */}
            <div className="flex items-center justify-between text-xs px-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Expires in:</span>
                <span className={`font-mono font-semibold ${secondsRemaining < 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {formatTime(secondsRemaining)}
                </span>
              </div>

              {/* Resend Code Button */}
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={handleResendOtp}
                className="text-emerald-400 hover:text-emerald-300 disabled:text-slate-600 disabled:cursor-not-allowed font-medium transition-colors text-xs"
              >
                {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
              </button>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6 || secondsRemaining <= 0}
              className="w-full py-2.5 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Verifying Code &amp; Activating Account...
                </>
              ) : (
                <>
                  Verify Code &amp; Complete Signup
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link href="/login" className="text-emerald-400 font-medium hover:underline">
            Sign in to existing account
          </Link>
        </p>
      </div>
    </div>
  );
}
