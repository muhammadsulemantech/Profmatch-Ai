'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  FileEdit,
  Users,
  Flag,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  Database,
  Globe,
  FileCheck,
  CreditCard,
  Wallet,
  Sparkles,
  Check,
} from 'lucide-react';
import { mockDb } from '@/lib/supabase/mock-db';
import { Professor, University, DataQualityMetrics, PaymentMethod, Payment, Order } from '@/types/database';
import { saveCustomPlans } from '@/lib/services/usage-service';
import { SettingsTab, SiteSettings } from '@/components/admin/settings-tab';
import { GlobalDataTab } from '@/components/admin/global-data-tab';
import { PaymentMethodsTab } from '@/components/admin/payment-methods-tab';
import { PaymentsTab } from '@/components/admin/payments-tab';
import { PricingTab, PricingPlan } from '@/components/admin/pricing-tab';
import { ContentTab, HeroContent } from '@/components/admin/content-tab';
import { FlagsTab } from '@/components/admin/flags-tab';
import { UsersTab } from '@/components/admin/users-tab';
import { AuditTab } from '@/components/admin/audit-tab';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'settings' | 'globalData' | 'paymentMethods' | 'orders' | 'content' | 'pricing' | 'flags' | 'users' | 'audit'
  >('settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Settings state
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'ProfMatch AI',
    tagline: 'Global faculty discovery. Deep research verification. High-converting ethical outreach.',
    supportEmail: 'profmatchsupport@gmail.com',
    primaryEmail: 'profmatchsupport@gmail.com',
    defaultCountry: 'Global (All Countries)',
    maintenanceMode: false,
    announcement: {
      enabled: true,
      message: '🌍 Global Academic Expansion Live! Over 190 countries, all academic fields & verified faculty discovery.',
      link: '/search',
    },
  });

  // Hero CMS content state
  const [heroContent, setHeroContent] = useState<HeroContent>({
    title: 'Discover & Connect with Research Faculty Across Any Global Institution',
    subtitle: 'Stop sending generic cold emails. ProfMatch AI verifies faculty appointments, recent publications, and public academic emails across any country and any academic discipline.',
    badge: 'Global Academic Discovery & Verified Outreach Engine',
    primaryCta: 'Start Global Faculty Discovery',
  });

  // Pricing plans state
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>(
    mockDb.siteContent.pricing?.content?.plans || []
  );

  // User management states
  const [users, setUsers] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userPlanFilter, setUserPlanFilter] = useState<'ALL' | 'PAID' | 'FREE' | 'ADMIN'>('ALL');

  // Feature flags & audit states
  const [flags, setFlags] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Global Data Governance States
  const [universities, setUniversities] = useState<University[]>(mockDb.universities);
  const [professors, setProfessors] = useState<Professor[]>(mockDb.professors);
  const [dataQuality, setDataQuality] = useState<DataQualityMetrics>(mockDb.dataQualityMetrics);
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('All');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  // Payment Methods & Orders States
  const [adminPaymentMethods, setAdminPaymentMethods] = useState<PaymentMethod[]>(mockDb.paymentMethods);
  const [adminPayments, setAdminPayments] = useState<Payment[]>(mockDb.payments);
  const [adminOrders, setAdminOrders] = useState<Order[]>(mockDb.orders);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('ALL');
  const [paymentSearch, setPaymentSearch] = useState('');

  // Payment Method Modal States
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [isAddingMethod, setIsAddingMethod] = useState<boolean>(false);
  const [methodForm, setMethodForm] = useState({
    name: '',
    type: 'mobile_wallet',
    country: 'Pakistan',
    currency: 'PKR',
    account_name: '',
    account_number: '',
    account_identifier: '',
    instructions: '',
    enabled: true,
    sort_order: 1,
  });

  // Payment Review Modal State
  const [reviewingPayment, setReviewingPayment] = useState<Payment | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | null>(null);

  useEffect(() => {
    fetchAdminData(false);
  }, [activeTab]);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchAdminData = async (isSilent: boolean = false) => {
    if (!isSilent) setLoading(true);
    try {
      const sRes = await fetch('/api/admin/settings');
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.settings) setSettings(sData.settings);
      }

      const cRes = await fetch('/api/admin/content');
      if (cRes.ok) {
        const cData = await cRes.json();
        if (cData.content?.hero) {
          setHeroContent({
            title: cData.content.hero.title || '',
            subtitle: cData.content.hero.subtitle || '',
            badge: cData.content.hero.content?.badge || '',
            primaryCta: cData.content.hero.content?.primaryCta || '',
          });
        }
        if (cData.content?.pricing?.content?.plans) {
          setPricingPlans(cData.content.pricing.content.plans);
        }
      }

      const uRes = await fetch('/api/admin/users');
      if (uRes.ok) {
        const uData = await uRes.json();
        if (uData.users) setUsers(uData.users);
      }

      const fRes = await fetch('/api/admin/feature-flags');
      if (fRes.ok) {
        const fData = await fRes.json();
        if (fData.flags) setFlags(fData.flags);
      }

      const aRes = await fetch('/api/admin/audit-logs');
      if (aRes.ok) {
        const aData = await aRes.json();
        if (aData.logs) setAuditLogs(aData.logs);
      }

      // Sync Global Data & Quality
      setUniversities([...mockDb.universities]);
      setProfessors([...mockDb.professors]);
      setDataQuality({
        totalUniversities: mockDb.universities.length,
        totalProfessors: mockDb.professors.length,
        verifiedProfessors: mockDb.professors.filter(p => p.verification_status === 'VERIFIED').length,
        partiallyVerifiedProfessors: mockDb.professors.filter(p => p.verification_status === 'PARTIALLY_VERIFIED').length,
        unverifiedProfessors: mockDb.professors.filter(p => p.verification_status === 'UNVERIFIED').length,
        missingEmailsCount: mockDb.professors.filter(p => !p.email || p.email_verification_status === 'NOT_FOUND').length,
        staleRecordsCount: mockDb.professors.filter(p => p.freshness_status === 'STALE').length,
        brokenSourcesCount: 0,
        duplicateProfessorsCount: 0,
        duplicateUniversitiesCount: 0,
        failedSearchesCount: 0,
      });

      // Sync Payment Methods & Orders
      const pmRes = await fetch('/api/admin/payment-methods');
      if (pmRes.ok) {
        const pmData = await pmRes.json();
        if (pmData.methods) setAdminPaymentMethods(pmData.methods);
      }
      const payRes = await fetch('/api/admin/payments');
      if (payRes.ok) {
        const payData = await payRes.json();
        if (payData.payments) setAdminPayments(payData.payments);
        if (payData.orders) setAdminOrders(payData.orders);
      }
    } catch {
      if (!isSilent) showNotice('error', 'Error syncing admin telemetry from server.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Pricing Plan handlers
  const handleUpdatePlan = (planIdx: number, field: string, value: any) => {
    setPricingPlans(prev => {
      const copy = [...prev];
      copy[planIdx] = { ...copy[planIdx], [field]: value };
      return copy;
    });
  };

  const handleUpdateFeature = (planIdx: number, featIdx: number, value: string) => {
    setPricingPlans(prev => {
      const copy = [...prev];
      const newFeats = [...copy[planIdx].features];
      newFeats[featIdx] = value;
      copy[planIdx] = { ...copy[planIdx], features: newFeats };
      return copy;
    });
  };

  const handleAddFeature = (planIdx: number) => {
    setPricingPlans(prev => {
      const copy = [...prev];
      copy[planIdx] = { ...copy[planIdx], features: [...copy[planIdx].features, 'New Plan Feature'] };
      return copy;
    });
  };

  const handleRemoveFeature = (planIdx: number, featIdx: number) => {
    setPricingPlans(prev => {
      const copy = [...prev];
      copy[planIdx] = { ...copy[planIdx], features: copy[planIdx].features.filter((_, i) => i !== featIdx) };
      return copy;
    });
  };

  const handleAddPlan = () => {
    setPricingPlans(prev => [
      ...prev,
      {
        name: 'New Custom Tier',
        tier: 'PRO',
        price: '$29',
        period: 'per month',
        description: 'Custom academic research plan tailored for intensive candidate outreach.',
        features: ['Unlimited Searches', 'Priority Outreach Drafts', 'Dedicated Support'],
        cta: 'Upgrade Plan',
        highlighted: false,
      },
    ]);
  };

  const handleRemovePlan = (planIdx: number) => {
    if (!confirm('Are you sure you want to remove this pricing plan?')) return;
    setPricingPlans(prev => prev.filter((_, i) => i !== planIdx));
  };

  const handleSavePricingOnly = async () => {
    setSaving(true);
    try {
      const pRes = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: 'pricing',
          title: 'Transparent Worldwide Academic Subscriptions',
          subtitle: 'Access verified faculty across 190+ countries. Free to explore; upgrade for full worldwide contacts and autonomous outreach.',
          content: { plans: pricingPlans },
        }),
      });

      try {
        await fetch('/api/pricing', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plans: pricingPlans }),
        });
      } catch (e) {
        console.warn('API pricing direct sync warning:', e);
      }

      const pData = await pRes.json();
      if (pRes.ok && pData.section?.content?.plans) {
        setPricingPlans(pData.section.content.plans);
      }

      const planMap: Record<string, any> = {};
      pricingPlans.forEach(p => {
        const tierKey = p.tier.toUpperCase();
        planMap[tierKey] = {
          tier: tierKey,
          name: p.name,
          pricePkr: p.pricePkr !== undefined ? Number(p.pricePkr) : (p.price?.includes('3,500') ? 3500 : p.price?.includes('8,000') ? 8000 : p.price?.includes('16,000') ? 16000 : 0),
          priceUsd: p.priceUsd !== undefined ? Number(p.priceUsd) : (p.price?.includes('12') ? 12 : p.price?.includes('29') ? 29 : p.price?.includes('59') ? 59 : 0),
          searchesLimit: p.searchesLimit !== undefined ? Number(p.searchesLimit) : (tierKey === 'FREE' ? 3 : tierKey === 'STARTER' ? 50 : tierKey === 'PRO' ? 250 : 999999),
          draftsLimit: p.draftsLimit !== undefined ? Number(p.draftsLimit) : (tierKey === 'FREE' ? 2 : tierKey === 'STARTER' ? 30 : tierKey === 'PRO' ? 150 : 999999),
          autopilotBatchLimit: p.autopilotLimit !== undefined ? Number(p.autopilotLimit) : (tierKey === 'FREE' ? 0 : tierKey === 'STARTER' ? 5 : tierKey === 'PRO' ? 20 : 500),
          features: p.features,
          tagline: p.description,
          badge: p.badge,
          highlighted: Boolean(p.highlighted),
          ctaText: p.cta || p.ctaText || 'Get Started',
        };
      });
      saveCustomPlans(planMap);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profmatch_pricing_updated', { detail: { plans: pricingPlans, planMap } }));
        localStorage.setItem('profmatch_pricing_last_sync', String(Date.now()));
      }

      showNotice('success', 'Academic packages & pricing successfully published live across all pages!');
    } catch (err: any) {
      showNotice('error', err.message || 'Error publishing pricing plans.');
    } finally {
      setSaving(false);
    }
  };

  // Payment method handlers
  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = !!editingMethod;
      const res = await fetch('/api/admin/payment-methods', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id: editingMethod.id, ...methodForm } : methodForm),
      });
      const data = await res.json();
      if (data.success) {
        showNotice('success', isEdit ? 'Payment method updated successfully!' : 'Payment method created successfully!');
        setEditingMethod(null);
        setIsAddingMethod(false);
        fetchAdminData();
      } else {
        showNotice('error', data.error || 'Failed to save payment method');
      }
    } catch {
      showNotice('error', 'Error communicating with payment methods endpoint');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePaymentMethod = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete payment method "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/payment-methods?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotice('success', `Payment method "${name}" deleted.`);
        fetchAdminData();
      } else {
        showNotice('error', 'Failed to delete payment method.');
      }
    } catch {
      showNotice('error', 'Error deleting payment method.');
    }
  };

  const handleTogglePaymentMethod = async (method: PaymentMethod) => {
    try {
      const res = await fetch('/api/admin/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: method.id, enabled: !method.enabled }),
      });
      if (res.ok) {
        showNotice('success', `${method.name} ${!method.enabled ? 'enabled' : 'disabled'}.`);
        fetchAdminData();
      }
    } catch {
      showNotice('error', 'Failed to toggle status.');
    }
  };

  const handleExecutePaymentReview = async () => {
    if (!reviewingPayment || !reviewAction) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: reviewingPayment.id,
          action: reviewAction,
          adminNote: reviewNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotice('success', data.message);
        setReviewingPayment(null);
        setReviewAction(null);
        setReviewNote('');
        fetchAdminData();
      } else {
        showNotice('error', data.error || 'Failed to update payment status');
      }
    } catch {
      showNotice('error', 'Error updating payment status.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok && data.settings) {
        setSettings(data.settings);
        showNotice('success', 'Global site settings updated successfully!');
        fetchAdminData(true);
      } else {
        showNotice('error', data.error || 'Failed to save settings.');
      }
    } catch {
      showNotice('error', 'Error communicating with settings endpoint.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContent = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: 'hero',
          title: heroContent.title,
          subtitle: heroContent.subtitle,
          content: {
            badge: heroContent.badge,
            primaryCta: heroContent.primaryCta,
          },
        }),
      });

      const pRes = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: 'pricing',
          title: 'Transparent Global Academic Pricing',
          subtitle: 'Free to start exploring faculty worldwide; upgrade when launching multi-country campaigns.',
          content: { plans: pricingPlans },
        }),
      });

      const pData = await pRes.json();
      if (pRes.ok && pData.section?.content?.plans) {
        setPricingPlans(pData.section.content.plans);
        showNotice('success', 'Global editorial copy & pricing plans published live!');
        fetchAdminData(true);
      } else {
        showNotice('error', pData.error || 'Failed to publish content updates.');
      }
    } catch {
      showNotice('error', 'Error publishing content.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFlag = async (flagKey: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: flagKey,
          enabled: !currentStatus,
        }),
      });
      if (res.ok) {
        setFlags(prev =>
          prev.map(f => (f.flag_key === flagKey ? { ...f, is_enabled: !currentStatus } : f))
        );
        showNotice('success', `Feature flag ${flagKey} toggled.`);
        fetchAdminData(true);
      }
    } catch {
      showNotice('error', 'Failed to toggle feature flag.');
    }
  };

  const handleToggleSuspendUser = async (userId: string, currentlySuspended?: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          updates: { is_suspended: !currentlySuspended },
        }),
      });
      if (res.ok) {
        setUsers(prev =>
          prev.map(u => (u.id === userId ? { ...u, is_suspended: !currentlySuspended } : u))
        );
        showNotice('success', `User account ${!currentlySuspended ? 'suspended' : 'reactivated'}.`);
        fetchAdminData(true);
      }
    } catch {
      showNotice('error', 'Failed to modify user status.');
    }
  };

  const handleUpdateUserPlan = async (userId: string, targetPlan: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          plan_tier: targetPlan,
        }),
      });
      if (res.ok) {
        setUsers(prev =>
          prev.map(u =>
            u.id === userId
              ? {
                  ...u,
                  plan_tier: targetPlan,
                  is_paid: targetPlan !== 'FREE',
                  subscription_status: 'active',
                }
              : u
          )
        );
        showNotice('success', `User plan changed to ${targetPlan} successfully!`);
      }
    } catch {
      showNotice('error', 'Failed to update user plan.');
    }
  };

  const handleReverifyProfessor = (profId: string) => {
    setProfessors(prev =>
      prev.map(p =>
        p.id === profId
          ? { ...p, verification_status: 'VERIFIED', freshness_status: 'FRESH', last_verified_at: new Date().toISOString() }
          : p
      )
    );
    showNotice('success', 'Faculty profile and publication metadata verified with official university registry.');
  };

  const filteredAdminProfessors = useMemo(() => {
    return professors.filter(p => {
      if (selectedCountryFilter !== 'All' && p.university_country !== selectedCountryFilter) {
        return false;
      }
      if (adminSearchQuery.trim() !== '') {
        const q = adminSearchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesUni = (p.university_name || '').toLowerCase().includes(q);
        const matchesDisc = (p.primary_discipline || '').toLowerCase().includes(q);
        return matchesName || matchesUni || matchesDisc;
      }
      return true;
    });
  }, [professors, selectedCountryFilter, adminSearchQuery]);

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Banner Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2">
              <Lock className="w-3 h-3 text-emerald-400" /> Global Governance &amp; Telemetry Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Platform Administration
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-light">
              Global institutional registry, verification telemetry, editorial content, and immutable security audit stream.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchAdminData(false)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-sm text-xs flex items-center gap-1.5"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Alert Notices */}
        {notification && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-panel bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-xl">
            <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" /> Global Universities
            </p>
            <p className="text-2xl font-extrabold text-white mt-1">{universities.length}</p>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <Check className="w-3 h-3" /> Across 190+ countries
            </p>
          </div>

          <div className="glass-panel bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-xl">
            <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Faculty
            </p>
            <p className="text-2xl font-extrabold text-white mt-1">
              {dataQuality.verifiedProfessors} / {dataQuality.totalProfessors}
            </p>
            <p className="text-[11px] text-emerald-400 mt-1">100% Verifiable sources</p>
          </div>

          <div className="glass-panel bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-xl">
            <p className="text-xs font-medium text-slate-400">Feature Switches</p>
            <p className="text-2xl font-extrabold text-white mt-1">
              {flags.filter(f => f.is_enabled).length} / {flags.length || 6}
            </p>
            <p className="text-[11px] text-amber-400 mt-1">Operational flags active</p>
          </div>

          <div className="glass-panel bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-xl">
            <p className="text-xs font-medium text-slate-400">Security Audit Logs</p>
            <p className="text-2xl font-extrabold text-white mt-1">{auditLogs.length || 1}</p>
            <p className="text-[11px] text-emerald-400 mt-1">Immutable audit records</p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-slate-800 gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap font-semibold ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Global Settings
          </button>
          <button
            onClick={() => setActiveTab('globalData')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap font-semibold ${
              activeTab === 'globalData'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Global Data &amp; Quality
          </button>
          <button
            onClick={() => setActiveTab('paymentMethods')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap font-semibold ${
              activeTab === 'paymentMethods'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" /> Payment Methods
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap font-semibold ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Orders &amp; Payments
            {adminPayments.filter(p => p.status === 'PENDING').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                {adminPayments.filter(p => p.status === 'PENDING').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap font-semibold ${
              activeTab === 'pricing'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Packages &amp; Pricing
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap font-semibold ${
              activeTab === 'content'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" /> Content CMS
          </button>
          <button
            onClick={() => setActiveTab('flags')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap font-semibold ${
              activeTab === 'flags'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
            }`}
          >
            <Flag className="w-3.5 h-3.5" /> Feature Flags
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap font-semibold ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> User Accounts
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap font-semibold ${
              activeTab === 'audit'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Audit Stream
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            setSettings={setSettings}
            saving={saving}
            onSave={handleSaveSettings}
          />
        )}

        {activeTab === 'globalData' && (
          <GlobalDataTab
            dataQuality={dataQuality}
            professors={professors}
            filteredAdminProfessors={filteredAdminProfessors}
            selectedCountryFilter={selectedCountryFilter}
            setSelectedCountryFilter={setSelectedCountryFilter}
            adminSearchQuery={adminSearchQuery}
            setAdminSearchQuery={setAdminSearchQuery}
            onReverifyProfessor={handleReverifyProfessor}
          />
        )}

        {activeTab === 'paymentMethods' && (
          <PaymentMethodsTab
            adminPaymentMethods={adminPaymentMethods}
            isAddingMethod={isAddingMethod}
            setIsAddingMethod={setIsAddingMethod}
            editingMethod={editingMethod}
            setEditingMethod={setEditingMethod}
            methodForm={methodForm}
            setMethodForm={setMethodForm}
            saving={saving}
            onSaveMethod={handleSavePaymentMethod}
            onToggleMethod={handleTogglePaymentMethod}
            onDeleteMethod={handleDeletePaymentMethod}
          />
        )}

        {activeTab === 'orders' && (
          <PaymentsTab
            adminPayments={adminPayments}
            selectedPaymentStatus={selectedPaymentStatus}
            setSelectedPaymentStatus={setSelectedPaymentStatus}
            paymentSearch={paymentSearch}
            setPaymentSearch={setPaymentSearch}
            reviewingPayment={reviewingPayment}
            setReviewingPayment={setReviewingPayment}
            reviewAction={reviewAction}
            setReviewAction={setReviewAction}
            reviewNote={reviewNote}
            setReviewNote={setReviewNote}
            saving={saving}
            onExecutePaymentReview={handleExecutePaymentReview}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingTab
            pricingPlans={pricingPlans}
            saving={saving}
            onAddPlan={handleAddPlan}
            onRemovePlan={handleRemovePlan}
            onUpdatePlan={handleUpdatePlan}
            onAddFeature={handleAddFeature}
            onRemoveFeature={handleRemoveFeature}
            onUpdateFeature={handleUpdateFeature}
            onSavePricing={handleSavePricingOnly}
          />
        )}

        {activeTab === 'content' && (
          <ContentTab
            heroContent={heroContent}
            setHeroContent={setHeroContent}
            pricingPlans={pricingPlans}
            saving={saving}
            onSaveContent={handleSaveContent}
            onAddPlan={handleAddPlan}
            onRemovePlan={handleRemovePlan}
            onUpdatePlan={handleUpdatePlan}
            onAddFeature={handleAddFeature}
            onRemoveFeature={handleRemoveFeature}
            onUpdateFeature={handleUpdateFeature}
          />
        )}

        {activeTab === 'flags' && (
          <FlagsTab
            flags={flags}
            onToggleFlag={handleToggleFlag}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab
            users={users}
            userSearchTerm={userSearchTerm}
            setUserSearchTerm={setUserSearchTerm}
            userPlanFilter={userPlanFilter}
            setUserPlanFilter={setUserPlanFilter}
            onUpdateUserPlan={handleUpdateUserPlan}
            onToggleSuspendUser={handleToggleSuspendUser}
          />
        )}

        {activeTab === 'audit' && (
          <AuditTab auditLogs={auditLogs} />
        )}
      </div>
    </div>
  );
}
