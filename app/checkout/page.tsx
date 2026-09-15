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
  Sparkles,
  Lock,
  Globe,
  HelpCircle,
  FileCheck2,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { PaymentMethod } from '@/types/database';
import { getAllCountries } from '@/lib/geography/global-geography';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const planParam = searchParams.get('plan') || 'student';
  const isPro = planParam.toLowerCase() === 'pro';

  // Plan Details (Dynamically computed based on currency/tier)
  const planInfo = useMemo(() => {
    if (isPro) {
      return {
        tier: 'PRO' as const,
        name: 'Research Lab & Scholar Pro',
        priceUsd: 49,
        pricePkr: 13500,
        period: 'month',
        features: [
          'Unlimited Global Professor Searches across 190+ Countries',
          '250 AI Grounded Discipline-Aware Emails / month',
          'Priority Faculty Verification Queue & Phone/Office Indexing',
          'Automated Multi-Stage Polite Follow-up Engine',
          'Comprehensive Portal Application Deadlines & Status Tracker',
        ],
      };
    }
    return {
      tier: 'STUDENT' as const,
      name: 'Graduate Applicant Pro',
      priceUsd: 19,
      pricePkr: 5200,
      period: 'month',
      features: [
        'Unlimited Global Professor Searches across 190+ Countries',
        '75 AI Grounded Discipline-Aware Emails / month',
        'Interdisciplinary Cross-Department Matching',
        'Automated Polite Follow-up Scheduler',
        'Application Tracker & Portal Deadlines',
        'Email Deliverability & Spam Safeguards',
      ],
    };
  }, [isPro]);

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

  // Current amount & currency according to selected method
  const currentCurrency = activeMethod?.currency || (selectedCountry === 'Pakistan' ? 'PKR' : 'USD');
  const currentAmount = currentCurrency === 'PKR' ? planInfo.pricePkr : planInfo.priceUsd;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('File size exceeds 5MB limit.');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMethod) {
      setErrorMessage('Please select an active payment method.');
      return;
    }

    if (!transactionId.trim()) {
      setErrorMessage('Please provide a Transaction ID or payment reference number.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/checkout/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planTier: planInfo.tier,
          planName: planInfo.name,
          amount: currentAmount,
          currency: currentCurrency,
          billingInterval: 'monthly',
          paymentMethodId: activeMethod.id,
          paymentMethodName: activeMethod.name,
          transactionId: transactionId.trim(),
          paymentNote: paymentNote.trim(),
          proofFileName: proofFile?.name || 'payment_receipt.png',
          proofFileUrl: proofPreviewUrl || undefined,
          userEmail: 'student@example.com',
          userName: 'Alex Vance',
        }),
      });

      const data = await res.json();
      if (data.success && data.orderReference) {
        router.push(`/checkout/status/${data.orderReference}`);
      } else {
        setErrorMessage(data.error || 'Failed to submit payment details.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred while communicating with the server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#172033] py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back button & Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-xs text-[#556070] hover:text-[#172033] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Subscription Plans
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold bg-[#F1F2EE] text-[#5C8F86] border border-[#E5E7EB]">
            <Lock className="w-3 h-3 text-[#3157A4]" /> Secure SSL Verified Checkout
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Plan Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded p-6 sm:p-8 border border-[#E5E7EB] shadow-sm space-y-6">
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5C8F86]">
                  Subscription Order
                </span>
                <h1 className="text-2xl font-serif font-bold text-[#172033]">{planInfo.name}</h1>
                <p className="text-xs text-[#556070] font-light">
                  Billed monthly. Upgrade, pause, or cancel anytime from your student profile.
                </p>
              </div>

              <div className="bg-[#FAF9F5] rounded p-4 border border-[#E5E7EB] flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-[#556070]">Total Due Today</span>
                  <div className="text-3xl font-serif font-bold text-[#172033]">
                    {currentCurrency === 'PKR' ? `Rs. ${currentAmount.toLocaleString()}` : `$${currentAmount}`}
                  </div>
                </div>
                <span className="text-xs text-[#556070]">/ {planInfo.period}</span>
              </div>

              {/* Feature checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-[#172033] uppercase tracking-wider">What is Included:</h4>
                <ul className="space-y-2.5 text-xs text-[#556070] font-light">
                  {planInfo.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#5C8F86] shrink-0 mt-0.5" />
                      <span className="text-[#172033]">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded bg-[#FAF9F5] border border-[#E5E7EB] text-[11px] text-[#556070] leading-relaxed flex items-start gap-2 font-light">
                <ShieldCheck className="w-4 h-4 text-[#5C8F86] shrink-0 mt-0.5" />
                <span>
                  Payments are reviewed by our operations team. Once verified, your researcher account is unlocked immediately and all search quotas update.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Country & Payment Method (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Billing Country */}
            <div className="bg-white rounded p-6 border border-[#E5E7EB] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#172033] flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#3157A4]" /> 1. Select Billing Country
                </label>
                <span className="text-[11px] text-[#556070]">190+ Countries Supported</span>
              </div>

              <select
                value={selectedCountry}
                onChange={e => setSelectedCountry(e.target.value)}
                className="w-full bg-white border border-[#E5E7EB] rounded px-4 py-2.5 text-xs text-[#172033] focus:outline-none focus:border-[#3157A4] transition-colors"
              >
                {allCountries.map(c => (
                  <option key={c.code} value={c.name}>
                    {c.name} ({c.regionLabel})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Payment Method Selection */}
            <div className="bg-white rounded p-6 border border-[#E5E7EB] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#172033] flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-[#3157A4]" /> 2. Choose Payment Channel
                </label>
                <span className="text-[11px] text-[#556070]">
                  {paymentMethods.length} options available for {selectedCountry}
                </span>
              </div>

              {loadingMethods ? (
                <div className="flex items-center justify-center py-8 text-xs text-[#556070] gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#3157A4]" />
                  Loading payment channels...
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="p-4 rounded bg-[#FEF9C3] border border-[#FEF08A] text-[#854D0E] text-xs">
                  No local payment channel is currently configured for {selectedCountry}. Please select another country or contact support.
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
                        className={`p-4 rounded border text-left transition-all relative ${
                          isSelected
                            ? 'border-[#3157A4] bg-[#EBF2FE]/60 text-[#172033] ring-1 ring-[#3157A4]/30'
                            : 'border-[#E5E7EB] bg-white text-[#556070] hover:border-[#3157A4]/30 hover:bg-[#FAF9F5]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[#172033]">{m.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#F1F2EE] text-[#556070] border border-[#E5E7EB]">
                            {m.currency}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#556070] truncate">
                          {m.account_name || 'Official Account'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 3: Payment Details & Instructions */}
            {activeMethod && (
              <div className="bg-white rounded p-6 border border-[#E5E7EB] shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#172033] flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#3157A4]" /> 3. Payment Instructions & Details
                  </span>
                  <span className="text-[11px] font-medium text-[#3157A4]">
                    {activeMethod.name}
                  </span>
                </div>

                {/* Account Info Display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded bg-[#FAF9F5] border border-[#E5E7EB] space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#556070]">
                      Account Title / Beneficiary
                    </span>
                    <div className="flex items-center justify-between text-xs font-bold text-[#172033]">
                      <span>{activeMethod.account_name}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeMethod.account_name, 'name')}
                        className="text-[#556070] hover:text-[#3157A4] p-1"
                        title="Copy Name"
                      >
                        {copiedKey === 'name' ? <Check className="w-3.5 h-3.5 text-[#5C8F86]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded bg-[#FAF9F5] border border-[#E5E7EB] space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#556070]">
                      Account Number / Wallet
                    </span>
                    <div className="flex items-center justify-between text-xs font-bold text-[#3157A4] font-mono">
                      <span>{activeMethod.account_number}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeMethod.account_number, 'number')}
                        className="text-[#556070] hover:text-[#3157A4] p-1"
                        title="Copy Account Number"
                      >
                        {copiedKey === 'number' ? <Check className="w-3.5 h-3.5 text-[#5C8F86]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {activeMethod.account_identifier && (
                  <div className="p-3.5 rounded bg-[#FAF9F5] border border-[#E5E7EB] space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#556070]">
                      IBAN / Account Identifier
                    </span>
                    <div className="flex items-center justify-between text-xs font-bold text-[#172033] font-mono">
                      <span>{activeMethod.account_identifier}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeMethod.account_identifier!, 'iban')}
                        className="text-[#556070] hover:text-[#3157A4] p-1"
                      >
                        {copiedKey === 'iban' ? <Check className="w-3.5 h-3.5 text-[#5C8F86]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Instructions text */}
                <div className="p-4 rounded bg-[#FAF9F5] border border-[#E5E7EB] space-y-1.5">
                  <span className="text-[11px] font-bold text-[#172033]">Transfer Instructions:</span>
                  <p className="text-xs text-[#556070] leading-relaxed font-light">
                    {activeMethod.instructions}
                  </p>
                </div>

                {/* Submission Form */}
                <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-[#E5E7EB]">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#172033] flex items-center justify-between">
                      <span>Transaction Reference / Slip ID *</span>
                      <span className="text-[10px] text-[#556070]">e.g. TID from JazzCash or Bank transfer receipt</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Transaction ID (e.g. 0322984120)"
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value)}
                      className="w-full bg-white border border-[#E5E7EB] rounded px-4 py-2.5 text-xs text-[#172033] placeholder-[#8C95A6] focus:outline-none focus:border-[#3157A4] transition-colors font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#172033]">
                      Upload Receipt Screenshot (Optional)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded bg-[#FAF9F5] border border-[#E5E7EB] hover:bg-[#F1F2EE] text-xs font-medium text-[#172033] transition-colors shadow-sm">
                        <Upload className="w-3.5 h-3.5 text-[#3157A4]" />
                        <span>{proofFile ? proofFile.name : 'Choose Image / Document'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      {proofFile && (
                        <span className="text-[11px] text-[#5C8F86] flex items-center gap-1 font-medium">
                          <Check className="w-3.5 h-3.5" /> Attached ({(proofFile.size / 1024).toFixed(0)} KB)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#172033]">
                      Remarks / Student Email (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Any relevant transfer remarks..."
                      value={paymentNote}
                      onChange={e => setPaymentNote(e.target.value)}
                      className="w-full bg-white border border-[#E5E7EB] rounded p-3 text-xs text-[#172033] placeholder-[#8C95A6] focus:outline-none focus:border-[#3157A4] transition-colors"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded bg-[#3157A4] hover:bg-[#254587] text-white font-medium text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting Confirmation...
                      </>
                    ) : (
                      <>
                        <FileCheck2 className="w-4 h-4" /> Submit Payment for Verification
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
        <div className="max-w-6xl mx-auto px-4 py-20 text-center text-xs text-[#556070] flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#3157A4]" /> Loading Checkout Portal...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}

