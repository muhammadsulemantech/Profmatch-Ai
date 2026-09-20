'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  ShieldCheck,
  Building2,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Upload,
  ArrowLeft,
  Lock,
  Globe,
  HelpCircle,
  FileCheck2,
  Loader2,
  Copy,
  Check,
  Zap,
  Sparkles,
  MessageCircle,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { PaymentMethod, PlanTier } from '@/types/database';
import { getAllCountries } from '@/lib/geography/global-geography';
import { ACADEMIC_PLANS, getPlanConfig, syncLivePricingFromServer, PlanConfig, setUserTierOverride } from '@/lib/services/usage-service';
import { useAuth } from '@/lib/auth/auth-context';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const planParam = (searchParams.get('plan') || 'pro').toUpperCase();
  const requestedCurrency = searchParams.get('currency')?.toUpperCase() === 'USD' ? 'USD' : 'PKR';

  // Determine Target Plan
  const targetTier: PlanTier = useMemo(() => {
    if (planParam === 'ELITE') return 'ELITE';
    if (planParam === 'STARTER' || planParam === 'STUDENT') return 'STARTER';
    return 'PRO';
  }, [planParam]);

  const [currentPlanConfig, setCurrentPlanConfig] = useState<PlanConfig>(() => getPlanConfig(targetTier));

  useEffect(() => {
    setCurrentPlanConfig(getPlanConfig(targetTier));
    syncLivePricingFromServer().then(plans => {
      if (plans && plans[targetTier]) {
        setCurrentPlanConfig(plans[targetTier]);
      }
    });
  }, [targetTier]);

  const planConfig = currentPlanConfig;

  // States
  const allCountries = useMemo(() => getAllCountries(), []);
  const [selectedCountry, setSelectedCountry] = useState<string>('Pakistan');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [loadingMethods, setLoadingMethods] = useState<boolean>(true);

  // Form Inputs
  const [transactionId, setTransactionId] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fetch Payment Methods for selected country
  useEffect(() => {
    let isMounted = true;
    async function loadMethods() {
      setLoadingMethods(true);
      try {
        const res = await fetch(`/api/payments/methods?country=${encodeURIComponent(selectedCountry)}`);
        const data = await res.json();
        if (isMounted && data.success) {
          setPaymentMethods(data.methods || []);
          if (data.methods && data.methods.length > 0) {
            setSelectedMethodId(data.methods[0].id);
          } else {
            setSelectedMethodId('');
          }
        }
      } catch (err) {
        console.error('Failed to load payment methods:', err);
      } finally {
        if (isMounted) setLoadingMethods(false);
      }
    }
    loadMethods();
    return () => {
      isMounted = false;
    };
  }, [selectedCountry]);

  // Selected payment method object
  const activeMethod = useMemo(() => {
    return paymentMethods.find(m => m.id === selectedMethodId);
  }, [paymentMethods, selectedMethodId]);

  // Currency & Pricing Calculation
  const currentCurrency = activeMethod?.currency || (selectedCountry === 'Pakistan' ? 'PKR' : 'USD');
  const currentAmount = currentCurrency === 'PKR' ? planConfig.pricePkr : planConfig.priceUsd;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 8 * 1024 * 1024) {
        setErrorMessage('File size exceeds 8MB limit.');
        return;
      }
      setProofFile(file);
      setErrorMessage(null);

      // Create local preview
      const reader = new FileReader();
      reader.onload = () => {
        setProofPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProof = () => {
    setProofFile(null);
    setProofPreviewUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMethod) {
      setErrorMessage('Please select an active payment channel.');
      return;
    }

    if (!transactionId.trim()) {
      setErrorMessage('Please enter the Transaction ID / Reference Number from your receipt.');
      return;
    }

    if (!proofFile && !proofPreviewUrl) {
      setErrorMessage('Please attach your payment screenshot or transfer receipt so we can verify your account.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/checkout/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planTier: planConfig.tier,
          planName: planConfig.name,
          amount: currentAmount,
          currency: currentCurrency,
          billingInterval: 'monthly',
          paymentMethodId: activeMethod.id,
          paymentMethodName: activeMethod.name,
          transactionId: transactionId.trim(),
          paymentNote: paymentNote.trim(),
          proofFileName: proofFile?.name || 'payment_screenshot.png',
          proofFileUrl: proofPreviewUrl || undefined,
          userEmail: user?.email || 'student@example.com',
          userName: user?.full_name || 'Academic Researcher',
          userId: user?.id || 'usr_student_001',
        }),
      });

      const data = await res.json();
      if (data.success && data.orderReference) {
        // Also set optimistic override so user can preview their access
        setUserTierOverride(planConfig.tier);
        router.push(`/checkout/status/${data.orderReference}`);
      } else {
        setErrorMessage(data.error || 'Failed to submit payment details.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred while communicating with the billing server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 py-10 selection:bg-emerald-500/25 selection:text-emerald-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Worldwide Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/25 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-emerald-400 shrink-0 animate-spin-slow" />
            <span>
              <strong>Worldwide Academic Access:</strong> Not limited to a few countries. Connect with faculty across 190+ countries globally.
            </span>
          </div>
          <Link
            href="/choose-plan"
            className="text-emerald-400 hover:text-emerald-300 font-semibold underline shrink-0"
          >
            ← Change Plan
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Plan Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel bg-slate-900/60 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  Selected Subscription
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{planConfig.name}</h1>
                <p className="text-xs text-slate-400 font-light leading-relaxed">
                  {planConfig.tagline}
                </p>
              </div>

              {/* Price Display */}
              <div className="bg-slate-950/90 rounded-2xl p-4 border border-slate-800 flex items-baseline justify-between shadow-inner">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Subscription Total</span>
                  <div className="text-3xl font-heading font-extrabold text-white">
                    {currentCurrency === 'PKR'
                      ? `Rs. ${currentAmount.toLocaleString()}`
                      : `$${currentAmount}`}
                  </div>
                </div>
                <span className="text-xs text-slate-400">/ month</span>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Plan Capabilities Unlocked:
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {planConfig.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-slate-200 leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trust Badge */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1 to 2 Hour Quick Activation</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-light">
                  Transfer payment via your chosen channel and upload your slip screenshot below. Verification is quick and access is granted upon review.
                </p>
              </div>

              {/* WhatsApp Live Billing Help */}
              <a
                href="https://wa.me/923227342728?text=Hi%20ProfMatch%20AI%20Team%2C%20I%20am%20making%20a%20payment%20for%20my%20academic%20subscription%20and%20need%20assistance."
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-600/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Need Payment Help? WhatsApp Billing Support</span>
              </a>
            </div>
          </div>

          {/* Right Column: Country & Payment Method (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Billing Country & Quick Select Chips */}
            <div className="glass-panel bg-slate-900/60 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-400" /> 1. Select Country for Payment
                </label>
                <span className="text-[11px] text-slate-400">190+ Countries Supported</span>
              </div>

              {/* Quick Select Preset Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCountry('Pakistan')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedCountry === 'Pakistan'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  🇵🇰 Pakistan (SadaPay, NayaPay, Meezan, JazzCash)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCountry('Global')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedCountry === 'Global'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  🌐 International (Wise, USDT Crypto, Card, PayPal)
                </button>
              </div>

              {/* Full Country Dropdown */}
              <select
                value={selectedCountry}
                onChange={e => setSelectedCountry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="Pakistan">Pakistan (Local PKR Accounts)</option>
                <option value="Global">International / Worldwide (USD Accounts)</option>
                {allCountries
                  .filter(c => c.name !== 'Pakistan')
                  .map(c => (
                    <option key={c.code} value={c.name} className="bg-slate-900 text-slate-100">
                      {c.name} ({c.regionLabel})
                    </option>
                  ))}
              </select>
            </div>

            {/* Step 2: Payment Method Selection */}
            <div className="glass-panel bg-slate-900/60 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-400" /> 2. Choose Payment Account
                </label>
                <span className="text-[11px] text-slate-400">
                  {paymentMethods.length} options available
                </span>
              </div>

              {loadingMethods ? (
                <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  Loading payment channels...
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  No local payment channel found. Please choose &quot;International / Worldwide&quot; above for Wise, USDT Crypto or Card.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paymentMethods.map(m => {
                    const isSelected = m.id === selectedMethodId;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMethodId(m.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 text-white ring-1 ring-emerald-500/30 shadow-md'
                            : 'border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{m.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono font-semibold">
                            {m.currency}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {m.account_name || 'Official Account'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 3: Account Details & Proof Upload Form */}
            {activeMethod && (
              <div className="glass-panel bg-slate-900/60 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-400" /> 3. Transfer Details &amp; Slip Upload
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-400">
                    {activeMethod.name}
                  </span>
                </div>

                {/* Account Details Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Account Title / Beneficiary
                    </span>
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span className="truncate mr-2">{activeMethod.account_name}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeMethod.account_name, 'name')}
                        className="text-slate-400 hover:text-emerald-400 p-1 shrink-0"
                        title="Copy Name"
                      >
                        {copiedKey === 'name' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Account Number / Mobile / ID
                    </span>
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-400 font-mono">
                      <span className="truncate mr-2">{activeMethod.account_number}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeMethod.account_number, 'number')}
                        className="text-slate-400 hover:text-emerald-400 p-1 shrink-0"
                        title="Copy Account Number"
                      >
                        {copiedKey === 'number' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {activeMethod.account_identifier && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      IBAN / Identifier / Wallet Address
                    </span>
                    <div className="flex items-center justify-between text-xs font-bold text-white font-mono">
                      <span className="break-all mr-2">{activeMethod.account_identifier}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeMethod.account_identifier!, 'iban')}
                        className="text-slate-400 hover:text-emerald-400 p-1 shrink-0"
                        title="Copy Identifier"
                      >
                        {copiedKey === 'iban' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Transfer Instructions Box */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-bold text-emerald-400">Official Transfer Steps:</span>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-light">
                    {activeMethod.instructions}
                  </p>
                </div>

                {/* Proof & Transaction ID Form */}
                <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-800">
                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Transaction ID */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white flex items-center justify-between">
                      <span>Transaction ID / Reference Number *</span>
                      <span className="text-[10px] text-slate-400">e.g. TID, TRX ID, or Reference from receipt</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 0322984120 or Wise transfer ID"
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                    />
                  </div>

                  {/* Screenshot / Slip Upload Box */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white flex items-center justify-between">
                      <span>Upload Payment Screenshot / Slip *</span>
                      <span className="text-[10px] text-emerald-400">Required for fast verification</span>
                    </label>

                    {proofPreviewUrl ? (
                      <div className="relative p-3 rounded-xl bg-slate-950 border border-emerald-500/40 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0 flex items-center justify-center">
                            {proofFile?.type.includes('pdf') ? (
                              <FileCheck2 className="w-7 h-7 text-emerald-400" />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={proofPreviewUrl}
                                alt="Receipt Preview"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                              {proofFile?.name || 'receipt_screenshot.png'}
                            </p>
                            <p className="text-[10px] text-emerald-400">
                              {(proofFile ? proofFile.size / 1024 : 0).toFixed(0)} KB • Ready for verification
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleRemoveProof}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
                          title="Remove screenshot"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 bg-slate-950/60 flex flex-col items-center justify-center text-center transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all mb-2">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-white group-hover:text-emerald-300">
                          Click or drag to upload payment screenshot
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          PNG, JPG, WEBP, or PDF up to 8MB
                        </p>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    )}

                    <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                      💡 <strong>Note:</strong> Jab aap payment transfer kar lein, to receipt ka screenshot ya transaction details yahan upload kar dein. Verification ke foran baad aapka plan activate ho jaye ga.
                    </p>
                  </div>

                  {/* Remarks Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white">
                      Sender Name / Account Holder (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sent from Muhammad Ali / Meezan Bank"
                      value={paymentNote}
                      onChange={e => setPaymentNote(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting Payment Proof for Verification...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Submit Payment Proof &amp; Activate {planConfig.name}
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080B11] flex items-center justify-center text-slate-400 text-xs">
          Loading Academic Checkout...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
