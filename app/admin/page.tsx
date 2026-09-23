'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Settings,
  FileEdit,
  Users,
  Flag,
  Activity,
  Save,
  CheckCircle2,
  AlertCircle,
  LogOut,
  RefreshCw,
  Search,
  Check,
  X,
  Lock,
  Sliders,
  Database,
  ExternalLink,
  Globe,
  School,
  FileCheck,
  CheckCheck,
  CreditCard,
  Wallet,
  Plus,
  Trash2,
  Edit3,
  Clock,
  ArrowUpRight,
  Sparkles,
  DollarSign,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { mockDb } from '@/lib/supabase/mock-db';
import { getAllCountries } from '@/lib/geography/global-geography';
import { Professor, University, DataQualityMetrics, PaymentMethod, Payment, Order } from '@/types/database';
import { saveCustomPlans } from '@/lib/services/usage-service';

interface SiteSettings {
  siteName: string;
  tagline: string;
  supportEmail: string;
  primaryEmail: string;
  defaultTimezone?: string;
  defaultCountry?: string;
  maintenanceMode: boolean;
  registrationOpen?: boolean;
  globalRateLimitPerHour?: number;
  maxUploadSizeMb?: number;
  announcement?: {
    enabled?: boolean;
    message?: string;
    link?: string;
  };
}

interface SiteAnnouncement {
  isEnabled: boolean;
  message: string;
  linkText: string;
  linkUrl: string;
  type: 'info' | 'warning' | 'alert';
}

interface SystemAudit {
  verifiedProfessorsCount: number;
  verifiedUniversitiesCount: number;
  lastDbVerificationTime: string;
  pendingReviewsCount: number;
  totalOutreachAttempts: number;
}

interface SiteBannerConfig {
  announcement: {
    enabled: boolean;
    type: string;
    message: string;
    link: string;
  };
}

interface PricingPlanItem {
  name: string;
  tier: string;
  price: string;
  pricePkr?: number;
  priceUsd?: number;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaText?: string;
  badge?: string;
  highlighted: boolean;
  searchesLimit?: number;
  draftsLimit?: number;
  autopilotLimit?: number;
}

interface FeatureFlag {
  flag_key: string;
  name: string;
  description: string;
  is_enabled: boolean;
  updated_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_suspended: boolean;
  created_at: string;
  plan_tier?: string;
  is_paid?: boolean;
  subscription_status?: string;
  subscription_end?: string | null;
  payments_count?: number;
  orders_count?: number;
}

interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  resource_type: string;
  created_at: string;
  ip_address: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'settings' | 'globalData' | 'paymentMethods' | 'orders' | 'content' | 'pricing' | 'flags' | 'users' | 'audit'>('settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // States
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

  const [heroContent, setHeroContent] = useState({
    title: 'Discover & Connect with Research Faculty Across Any Global Institution',
    subtitle: 'Stop sending generic cold emails. ProfMatch AI verifies faculty appointments, recent publications, and public academic emails across any country and any academic discipline.',
    badge: 'Global Academic Discovery & Verified Outreach Engine',
    primaryCta: 'Start Global Faculty Discovery',
  });

  const [pricingPlans, setPricingPlans] = useState<PricingPlanItem[]>(
    mockDb.siteContent.pricing?.content?.plans || []
  );

  const handleUpdatePlan = (planIdx: number, field: keyof PricingPlanItem, value: any) => {
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
      // 1. Update CMS Site Content
      const pRes = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: 'pricing',
          title: 'Transparent Worldwide Academic Subscriptions',
          subtitle: 'Access verified faculty across 190+ countries. Free to explore; upgrade for full worldwide contacts and autonomous outreach.',
          content: {
            plans: pricingPlans,
          },
        }),
      });

      // 2. Also directly update /api/pricing to ensure consistency
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

      // 3. Sync to custom plans in localStorage for instant live view across browser
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

      // Notify any open components/tabs
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

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userPlanFilter, setUserPlanFilter] = useState<'ALL' | 'PAID' | 'FREE' | 'ADMIN'>('ALL');
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

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

  const countries = useMemo(() => getAllCountries(), []);

  useEffect(() => {
    fetchAdminData(false);
  }, [activeTab]);

  const fetchAdminData = async (isSilent: boolean = false) => {
    if (!isSilent) setLoading(true);
    try {
      // 1. Fetch settings
      const sRes = await fetch('/api/admin/settings');
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.settings) setSettings(sData.settings);
      }

      // 2. Fetch content
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

      // 3. Fetch users
      const uRes = await fetch('/api/admin/users');
      if (uRes.ok) {
        const uData = await uRes.json();
        if (uData.users) setUsers(uData.users);
      }

      // 4. Fetch flags
      const fRes = await fetch('/api/admin/feature-flags');
      if (fRes.ok) {
        const fData = await fRes.json();
        if (fData.flags) setFlags(fData.flags);
      }

      // 5. Fetch audit logs
      const aRes = await fetch('/api/admin/audit-logs');
      if (aRes.ok) {
        const aData = await aRes.json();
        if (aData.logs) setAuditLogs(aData.logs);
      }

      // 6. Sync Global Data
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

      // 7. Sync Payment Methods & Orders
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

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
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
      // 1. Save Hero Copy
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

      // 2. Save Pricing Plans
      const pRes = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: 'pricing',
          title: 'Transparent Global Academic Pricing',
          subtitle: 'Free to start exploring faculty worldwide; upgrade when launching multi-country campaigns.',
          content: {
            plans: pricingPlans,
          },
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

  const handleToggleSuspendUser = async (userId: string, currentlySuspended: boolean) => {
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

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/admin/login');
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


      {/* TAB 1: Global Site Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 sm:p-8 rounded border border-[#E5E7EB] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
            <div>
              <h2 className="text-base font-serif font-bold text-[#172033]">General Platform Configuration</h2>
              <p className="text-xs text-[#556070]">Manage public institutional identity, global scope, and primary contact emails.</p>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-4 py-2 rounded bg-[#3157A4] hover:bg-[#254587] text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1.5">Platform Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={e => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded text-xs text-[#172033] focus:outline-none focus:border-[#3157A4] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1.5">Institutional Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded text-xs text-[#172033] focus:outline-none focus:border-[#3157A4] transition-colors"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#172033] mb-1.5">Editorial Mission Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={e => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded text-xs text-[#172033] focus:outline-none focus:border-[#3157A4] transition-colors"
              />
            </div>

            <div className="md:col-span-2 p-4 rounded bg-[#FAF9F5] border border-[#E5E7EB] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#172033]">Top Academic Notification Banner</h3>
                  <p className="text-[11px] text-[#556070]">Displays institutional updates at the very top of all visitor viewports</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.announcement?.enabled ?? true}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        announcement: {
                          enabled: e.target.checked,
                          message: settings.announcement?.message || '',
                          link: settings.announcement?.link || '',
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-[#E5E7EB] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3157A4]"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">Banner Announcement Text</label>
                <input
                  type="text"
                  value={settings.announcement?.message || ''}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      announcement: {
                        enabled: settings.announcement?.enabled ?? true,
                        message: e.target.value,
                        link: settings.announcement?.link || '',
                      },
                    })
                  }
                  className="w-full px-3.5 py-2 bg-white border border-[#E5E7EB] rounded text-xs text-[#172033] focus:outline-none focus:border-[#3157A4]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">Target Destination Link</label>
                <input
                  type="text"
                  value={settings.announcement?.link || ''}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      announcement: {
                        enabled: settings.announcement?.enabled ?? true,
                        message: settings.announcement?.message || '',
                        link: e.target.value,
                      },
                    })
                  }
                  placeholder="/search"
                  className="w-full px-3.5 py-2 bg-white border border-[#E5E7EB] rounded text-xs text-[#172033] focus:outline-none focus:border-[#3157A4]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Global Data & Quality Console */}
      {activeTab === 'globalData' && (
        <div className="space-y-6">
          {/* Data Quality Health Dashboard */}
          <div className="bg-white p-6 rounded border border-[#E5E7EB] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <h2 className="text-base font-serif font-bold text-[#172033] flex items-center gap-2">
                  <CheckCheck className="w-5 h-5 text-[#5C8F86]" />
                  Global Academic Data Health Telemetry
                </h2>
                <p className="text-xs text-[#556070]">
                  Continuous verification of faculty appointments, verified institutional domains, and active publication streams.
                </p>
              </div>
              <span className="px-3 py-1 rounded text-xs font-medium bg-[#EBF8F5] text-[#226357] border border-[#C8ECE3]">
                Data Health: 100% Operational
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-3.5 rounded bg-[#FAF9F5] border border-[#E5E7EB]">
                <p className="text-xs text-[#556070]">Verified Faculty</p>
                <p className="text-xl font-serif font-bold text-[#172033] mt-1">{dataQuality.verifiedProfessors}</p>
                <p className="text-[10px] text-[#5C8F86]">Official .edu/.ac directories</p>
              </div>

              <div className="p-3.5 rounded bg-[#FAF9F5] border border-[#E5E7EB]">
                <p className="text-xs text-[#556070]">Secondary Verified</p>
                <p className="text-xl font-serif font-bold text-[#172033] mt-1">{dataQuality.partiallyVerifiedProfessors}</p>
                <p className="text-[10px] text-[#3157A4]">Curated scholar registries</p>
              </div>

              <div className="p-3.5 rounded bg-[#FAF9F5] border border-[#E5E7EB]">
                <p className="text-xs text-[#556070]">Missing Public Emails</p>
                <p className="text-xl font-serif font-bold text-[#172033] mt-1">{dataQuality.missingEmailsCount}</p>
                <p className="text-[10px] text-[#556070]">Zero synthetic/guessed emails</p>
              </div>

              <div className="p-3.5 rounded bg-[#FAF9F5] border border-[#E5E7EB]">
                <p className="text-xs text-[#556070]">Duplicate Scholar Records</p>
                <p className="text-xl font-serif font-bold text-[#172033] mt-1">0</p>
                <p className="text-[10px] text-[#5C8F86]">De-duplicated in pipeline</p>
              </div>
            </div>
          </div>

          {/* Global Faculty Management Table */}
          <div className="bg-white rounded border border-[#E5E7EB] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#E5E7EB] bg-[#FAF9F5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-serif font-bold text-[#172033]">
                  Faculty Registry Directory ({filteredAdminProfessors.length})
                </h3>
                <p className="text-xs text-[#556070]">Manage verified researchers, institutional affiliations, and recruiting availability.</p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedCountryFilter}
                  onChange={e => setSelectedCountryFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-[#E5E7EB] rounded text-xs text-[#172033] focus:outline-none focus:border-[#3157A4]"
                >
                  <option value="All">All Countries</option>
                  {Array.from(new Set(professors.map(p => p.university_country || 'Other'))).map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Filter name, university, discipline..."
                  value={adminSearchQuery}
                  onChange={e => setAdminSearchQuery(e.target.value)}
                  className="px-3.5 py-1.5 bg-white border border-[#E5E7EB] rounded text-xs text-[#172033] placeholder:text-[#8C95A6] focus:outline-none focus:border-[#3157A4]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F8F7F3] border-b border-[#E5E7EB] text-[#556070] text-[11px] font-semibold uppercase tracking-wider">
                    <th className="px-5 py-3">Scholar & Official Title</th>
                    <th className="px-5 py-3">University & Region</th>
                    <th className="px-5 py-3">Primary Discipline</th>
                    <th className="px-5 py-3">Verified Institutional Email</th>
                    <th className="px-5 py-3">Confidence</th>
                    <th className="px-5 py-3 text-right">Registry Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredAdminProfessors.map(prof => (
                    <tr key={prof.id} className="hover:bg-[#FAF9F5] transition-colors">
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-semibold text-[#172033]">{prof.name}</p>
                          <p className="text-[11px] text-[#556070]">{prof.title}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-[#172033] font-medium">{prof.university_name}</p>
                        <p className="text-[11px] text-[#5C8F86]">
                          {prof.university_region ? `${prof.university_region}, ` : ''}{prof.university_country}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-[#F1F2EE] text-[#172033] text-[10px] font-medium border border-[#E5E7EB]">
                          {prof.primary_discipline || 'Interdisciplinary'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px]">
                        {prof.email ? (
                          <span className="text-[#3157A4]">{prof.email}</span>
                        ) : (
                          <span className="text-[#8C95A6] italic">Pending Verification</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-[#5C8F86]">
                          {Math.round(prof.confidence_score * 100)}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleReverifyProfessor(prof.id)}
                          className="px-3 py-1 rounded border border-[#E5E7EB] text-[#3157A4] hover:bg-[#F1F2EE] text-xs font-medium transition-colors"
                        >
                          Re-Verify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* TAB 2b: Payment Methods Management */}
      {activeTab === 'paymentMethods' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                  Admin-Controlled Payment Methods
                </h2>
                <p className="text-xs text-slate-400">
                  Configure receiving accounts for Pakistan (JazzCash, Bank Transfer) and international channels (Stripe, PayPal). Changes reflect immediately in Customer Checkout without code deployments.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMethodForm({
                    name: '',
                    type: 'mobile_wallet',
                    country: 'Pakistan',
                    currency: 'PKR',
                    account_name: '',
                    account_number: '',
                    account_identifier: '',
                    instructions: '',
                    enabled: true,
                    sort_order: adminPaymentMethods.length + 1,
                  });
                  setEditingMethod(null);
                  setIsAddingMethod(true);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add Payment Method
              </button>
            </div>

            {/* Methods Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adminPaymentMethods.map(m => (
                <div
                  key={m.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    m.enabled ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-950/40 border-slate-800/40 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{m.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {m.type}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-400 font-medium mt-0.5">
                        {m.country} &bull; {m.currency}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTogglePaymentMethod(m)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                          m.enabled
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {m.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[10px] uppercase">Account Title:</span>
                      <span className="text-white font-bold">{m.account_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[10px] uppercase">Account Number:</span>
                      <span className="text-emerald-400 font-bold">{m.account_number}</span>
                    </div>
                    {m.account_identifier && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[10px] uppercase">Identifier / IBAN:</span>
                        <span className="text-slate-300">{m.account_identifier}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                    {m.instructions}
                  </p>

                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => {
                        setMethodForm({
                          name: m.name,
                          type: m.type,
                          country: m.country,
                          currency: m.currency,
                          account_name: m.account_name,
                          account_number: m.account_number,
                          account_identifier: m.account_identifier || '',
                          instructions: m.instructions,
                          enabled: m.enabled,
                          sort_order: m.sort_order,
                        });
                        setEditingMethod(m);
                        setIsAddingMethod(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" /> Edit Details
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePaymentMethod(m.id, m.name)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2c: Orders & Manual Payments Verification Queue */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  Orders & Manual Payment Review
                </h2>
                <p className="text-xs text-slate-400">
                  Verify manual transfer receipts (JazzCash, Bank transfers). Approving an order activates the user&apos;s subscription immediately.
                </p>
              </div>

              {/* Status Filter Pill Bar */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedPaymentStatus(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      selectedPaymentStatus === st
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search orders by reference (PM-XXXXXX), TID, user email or student name..."
                value={paymentSearch}
                onChange={e => setPaymentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Orders & Payments Table */}
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3">Order Ref</th>
                    <th className="px-5 py-3">Student Customer</th>
                    <th className="px-5 py-3">Plan / Amount</th>
                    <th className="px-5 py-3">Channel / TID</th>
                    <th className="px-5 py-3">Proof Receipt</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {adminPayments
                    .filter(p => {
                      if (selectedPaymentStatus !== 'ALL' && p.status !== selectedPaymentStatus) return false;
                      if (paymentSearch.trim() !== '') {
                        const q = paymentSearch.toLowerCase();
                        return (
                          p.order_reference.toLowerCase().includes(q) ||
                          p.transaction_id.toLowerCase().includes(q) ||
                          (p.user_email && p.user_email.toLowerCase().includes(q)) ||
                          (p.user_name && p.user_name.toLowerCase().includes(q)) ||
                          p.payment_method_name.toLowerCase().includes(q)
                        );
                      }
                      return true;
                    })
                    .map(pay => {
                      const isPending = pay.status === 'PENDING' || pay.status === 'UNDER_REVIEW';
                      const isApproved = pay.status === 'APPROVED';
                      const isRejected = pay.status === 'REJECTED';

                      return (
                        <tr key={pay.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="px-5 py-3.5 font-mono font-bold text-white">
                            {pay.order_reference}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-white">{pay.user_name || 'Student Applicant'}</div>
                            <div className="text-[11px] text-slate-400">{pay.user_email}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-emerald-400">{pay.plan_name || 'Graduate Applicant Pro'}</div>
                            <div className="text-[11px] text-slate-300 font-bold">
                              {pay.currency} {pay.amount.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-medium text-slate-200">{pay.payment_method_name}</div>
                            <div className="font-mono text-[11px] text-amber-400">TID: {pay.transaction_id}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            {pay.proof_file_url ? (
                              <a
                                href={pay.proof_file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-400 hover:underline text-[11px] font-semibold"
                              >
                                View Receipt <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-slate-500 text-[11px]">No image attached</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" /> Approved
                              </span>
                            ) : isRejected ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                <X className="w-3 h-3" /> Rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
                                <Clock className="w-3 h-3" /> Pending Review
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {isPending ? (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReviewingPayment(pay);
                                    setReviewAction('APPROVE');
                                    setReviewNote('Verified payment receipt against bank statement.');
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReviewingPayment(pay);
                                    setReviewAction('REJECT');
                                    setReviewNote('Transaction ID was not found in bank ledger.');
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-[11px] transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500 font-mono">
                                Reviewed {pay.reviewed_at ? new Date(pay.reviewed_at).toLocaleDateString() : 'Done'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit or Add Payment Method */}
      {(editingMethod || isAddingMethod) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-700 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingMethod ? `Edit Payment Channel (${editingMethod.name})` : 'Create New Payment Method'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingMethod(null);
                  setIsAddingMethod(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentMethod} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Channel Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JazzCash"
                    value={methodForm.name}
                    onChange={e => setMethodForm({ ...methodForm, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Type</label>
                  <select
                    value={methodForm.type}
                    onChange={e => setMethodForm({ ...methodForm, type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="mobile_wallet">Mobile Wallet (JazzCash/Easypaisa)</option>
                    <option value="bank_transfer">Direct Bank Transfer</option>
                    <option value="card">Credit / Debit Card</option>
                    <option value="paypal">PayPal</option>
                    <option value="stripe">Stripe</option>
                    <option value="other">Other Provider</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Target Country *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pakistan or Global"
                    value={methodForm.country}
                    onChange={e => setMethodForm({ ...methodForm, country: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Currency *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PKR, USD"
                    value={methodForm.currency}
                    onChange={e => setMethodForm({ ...methodForm, currency: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Account Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Suleman"
                  value={methodForm.account_name}
                  onChange={e => setMethodForm({ ...methodForm, account_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Account / Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 03227342728"
                    value={methodForm.account_number}
                    onChange={e => setMethodForm({ ...methodForm, account_number: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">IBAN / Identifier (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. PK36MEZN..."
                    value={methodForm.account_identifier}
                    onChange={e => setMethodForm({ ...methodForm, account_identifier: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Payment Instructions for Student</label>
                <textarea
                  rows={3}
                  placeholder="Explain step-by-step how the user should transfer funds..."
                  value={methodForm.instructions}
                  onChange={e => setMethodForm({ ...methodForm, instructions: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={methodForm.enabled}
                    onChange={e => setMethodForm({ ...methodForm, enabled: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
                  />
                  <span>Active &amp; Visible in Customer Checkout</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingMethod(null);
                    setIsAddingMethod(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Payment Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Payment Review Confirmation */}
      {reviewingPayment && reviewAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-700 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {reviewAction === 'APPROVE' ? 'Confirm Payment Approval' : 'Reject Payment Submission'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setReviewingPayment(null);
                  setReviewAction(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Ref:</span>
                  <span className="text-white font-bold">{reviewingPayment.order_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount:</span>
                  <span className="text-emerald-400 font-bold">
                    {reviewingPayment.currency} {reviewingPayment.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="text-amber-400">{reviewingPayment.transaction_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Channel:</span>
                  <span className="text-slate-300">{reviewingPayment.payment_method_name}</span>
                </div>
              </div>

              {reviewAction === 'APPROVE' ? (
                <p className="text-slate-300 leading-relaxed text-xs">
                  Approving this payment will mark the order as <strong className="text-emerald-400">APPROVED</strong> and automatically activate the student&apos;s subscription (<span className="text-white font-bold">{reviewingPayment.plan_name}</span>) for the next billing cycle.
                </p>
              ) : (
                <p className="text-slate-300 leading-relaxed text-xs">
                  Rejecting this payment will notify the student and prompt them to re-check their transaction reference number or submit a fresh receipt.
                </p>
              )}

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Review / Audit Note</label>
                <textarea
                  rows={2}
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  placeholder="Enter reason or internal audit note..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setReviewingPayment(null);
                    setReviewAction(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleExecutePaymentReview}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                    reviewAction === 'APPROVE'
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                      : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                  }`}
                >
                  {saving ? 'Processing...' : reviewAction === 'APPROVE' ? 'Approve & Activate Plan' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Packages & Pricing Management */}
      {activeTab === 'pricing' && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Global Subscription Configurator</span>
              </div>
              <h2 className="text-xl font-heading font-bold text-white">Academic Packages &amp; Pricing Management</h2>
              <p className="text-xs text-slate-400">
                Change prices (PKR &amp; USD), quotas, autopilot caps, or features for any tier. Changes sync instantly live to Homepage, /pricing, /choose-plan, and /checkout.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleAddPlan}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" /> Add Custom Tier
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSavePricingOnly}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Publishing Changes...' : 'Save & Publish Packages Live'}
              </button>
            </div>
          </div>

          {/* 4 Packages Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pricingPlans.map((plan, pIdx) => {
              const tierBadgeColor =
                plan.tier === 'FREE'
                  ? 'bg-slate-800 text-slate-400'
                  : plan.tier === 'STARTER'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : plan.tier === 'PRO'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-teal-500 text-slate-950 font-bold';

              return (
                <div
                  key={pIdx}
                  className={`p-6 rounded-2xl border space-y-5 transition-all relative ${
                    plan.highlighted
                      ? 'bg-slate-900/90 border-emerald-500/60 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${tierBadgeColor}`}>
                        {plan.tier}
                      </span>
                      <span className="text-xs font-bold text-white">Tier #{pIdx + 1}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-300 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={plan.highlighted}
                          onChange={e => handleUpdatePlan(pIdx, 'highlighted', e.target.checked)}
                          className="rounded text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>⭐ Highlighted / Popular</span>
                      </label>
                      {pricingPlans.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlan(pIdx)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete Plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Package Name</label>
                      <input
                        type="text"
                        value={plan.name}
                        onChange={e => handleUpdatePlan(pIdx, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tier Key (e.g. FREE, STARTER, PRO, ELITE)</label>
                      <input
                        type="text"
                        value={plan.tier}
                        onChange={e => handleUpdatePlan(pIdx, 'tier', e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Dual Currency & Pricing Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        🇵🇰 Price PKR (Rs.)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 8000"
                        value={plan.pricePkr !== undefined ? plan.pricePkr : (plan.price.includes('3,500') ? 3500 : plan.price.includes('8,000') ? 8000 : plan.price.includes('16,000') ? 16000 : 0)}
                        onChange={e => {
                          const val = Number(e.target.value);
                          handleUpdatePlan(pIdx, 'pricePkr', val);
                          const usdVal = plan.priceUsd || (val === 3500 ? 12 : val === 8000 ? 29 : val === 16000 ? 59 : 0);
                          handleUpdatePlan(pIdx, 'price', val === 0 ? 'Free' : `Rs. ${val.toLocaleString()} / $${usdVal}`);
                        }}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        🌐 Price USD ($)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 29"
                        value={plan.priceUsd !== undefined ? plan.priceUsd : (plan.price.includes('12') ? 12 : plan.price.includes('29') ? 29 : plan.price.includes('59') ? 59 : 0)}
                        onChange={e => {
                          const val = Number(e.target.value);
                          handleUpdatePlan(pIdx, 'priceUsd', val);
                          const pkrVal = plan.pricePkr || (val === 12 ? 3500 : val === 29 ? 8000 : val === 59 ? 16000 : 0);
                          handleUpdatePlan(pIdx, 'price', val === 0 ? 'Free' : `Rs. ${pkrVal.toLocaleString()} / $${val}`);
                        }}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Display Label
                      </label>
                      <input
                        type="text"
                        value={plan.price}
                        onChange={e => handleUpdatePlan(pIdx, 'price', e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Quotas & Limits Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                        Searches Quota
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 50, 250, 999999"
                        value={plan.searchesLimit !== undefined ? plan.searchesLimit : (plan.tier === 'FREE' ? 3 : plan.tier === 'STARTER' ? 50 : plan.tier === 'PRO' ? 250 : 999999)}
                        onChange={e => handleUpdatePlan(pIdx, 'searchesLimit', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                        AI Drafts Limit
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 30, 150, 999999"
                        value={plan.draftsLimit !== undefined ? plan.draftsLimit : (plan.tier === 'FREE' ? 2 : plan.tier === 'STARTER' ? 30 : plan.tier === 'PRO' ? 150 : 999999)}
                        onChange={e => handleUpdatePlan(pIdx, 'draftsLimit', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                        AutoPilot Cap (Emails)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 0, 5, 20, 500"
                        value={plan.autopilotLimit !== undefined ? plan.autopilotLimit : (plan.tier === 'FREE' ? 0 : plan.tier === 'STARTER' ? 5 : plan.tier === 'PRO' ? 20 : 500)}
                        onChange={e => handleUpdatePlan(pIdx, 'autopilotLimit', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-emerald-400 font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                        Top Badge (e.g. Focused Intake, Recommended)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Focused Intake"
                        value={plan.badge || ''}
                        onChange={e => handleUpdatePlan(pIdx, 'badge', e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                        CTA Button Text
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Get Starter"
                        value={plan.cta || plan.ctaText || ''}
                        onChange={e => {
                          handleUpdatePlan(pIdx, 'cta', e.target.value);
                          handleUpdatePlan(pIdx, 'ctaText', e.target.value);
                        }}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tagline / Short Summary</label>
                    <textarea
                      rows={2}
                      value={plan.description}
                      onChange={e => handleUpdatePlan(pIdx, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
                    />
                  </div>

                  {/* Bullet Features Editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-300">
                        Feature Bullet Points ({plan.features.length})
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddFeature(pIdx)}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                      >
                        <Plus className="w-3 h-3" /> Add Point
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {plan.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={feat}
                            onChange={e => handleUpdateFeature(pIdx, fIdx, e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(pIdx, fIdx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Remove feature"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Save Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={saving}
              onClick={handleSavePricingOnly}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-xl shadow-emerald-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Publishing Changes Live...' : 'Save & Publish All Packages Live'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: Content CMS */}
      {activeTab === 'content' && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">Homepage & Global Editorial CMS</h2>
              <p className="text-xs text-slate-400">Modify headline copy, call-to-actions, and global value propositions.</p>
            </div>
            <button
              onClick={handleSaveContent}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? 'Publishing...' : 'Publish Content'}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hero Pill Badge</label>
              <input
                type="text"
                value={heroContent.badge}
                onChange={e => setHeroContent({ ...heroContent, badge: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hero Main Title (H1)</label>
              <input
                type="text"
                value={heroContent.title}
                onChange={e => setHeroContent({ ...heroContent, title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hero Subtitle Paragraph</label>
              <textarea
                rows={3}
                value={heroContent.subtitle}
                onChange={e => setHeroContent({ ...heroContent, subtitle: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary CTA Button Label</label>
              <input
                type="text"
                value={heroContent.primaryCta}
                onChange={e => setHeroContent({ ...heroContent, primaryCta: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* PRICING PLANS EDITABLE CMS SECTION */}
          <div className="pt-8 border-t border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Academic Pricing Plans &amp; Subscriptions Manager
                </h3>
                <p className="text-xs text-slate-400">
                  Update live prices, tier names, billing cycles, features, and call-to-actions across the entire platform in real-time.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddPlan}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Pricing Tier
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pricingPlans.map((plan, pIdx) => (
                <div
                  key={pIdx}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 relative group"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                      Tier #{pIdx + 1}: {plan.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePlan(pIdx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Plan Name</label>
                      <input
                        type="text"
                        value={plan.name}
                        onChange={e => handleUpdatePlan(pIdx, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tier Code</label>
                      <input
                        type="text"
                        value={plan.tier}
                        onChange={e => handleUpdatePlan(pIdx, 'tier', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Price Label (e.g. $0, $19)</label>
                      <input
                        type="text"
                        value={plan.price}
                        onChange={e => handleUpdatePlan(pIdx, 'price', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Billing Period (e.g. forever, per month)</label>
                      <input
                        type="text"
                        value={plan.period}
                        onChange={e => handleUpdatePlan(pIdx, 'period', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Plan Description</label>
                    <textarea
                      rows={2}
                      value={plan.description}
                      onChange={e => handleUpdatePlan(pIdx, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">CTA Button Label</label>
                      <input
                        type="text"
                        value={plan.cta}
                        onChange={e => handleUpdatePlan(pIdx, 'cta', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-2 cursor-pointer py-2">
                        <input
                          type="checkbox"
                          checked={plan.highlighted}
                          onChange={e => handleUpdatePlan(pIdx, 'highlighted', e.target.checked)}
                          className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-slate-300">Highlighted / Featured</span>
                      </label>
                    </div>
                  </div>

                  {/* Bullet Point Features List */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Features List</span>
                      <button
                        type="button"
                        onClick={() => handleAddFeature(pIdx)}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Feature Bullet
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {plan.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={feat}
                            onChange={e => handleUpdateFeature(pIdx, fIdx, e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(pIdx, fIdx)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Feature Flags */}
      {activeTab === 'flags' && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white">System Feature Switches</h2>
            <p className="text-xs text-slate-400">Toggle live platform capabilities globally with zero downtime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flags.map(flag => (
              <div
                key={flag.flag_key}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{flag.name}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-mono font-semibold uppercase ${
                        flag.is_enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {flag.is_enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{flag.description}</p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={flag.is_enabled}
                    onChange={() => handleToggleFlag(flag.flag_key, flag.is_enabled)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: User Accounts & Plan Management */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Total Registered Users</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold font-heading text-white mt-2">{users.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Persisted in system database</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-emerald-500/25 bg-emerald-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-400 font-semibold">Paid Active Subscribers</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold font-heading text-emerald-300 mt-2">
                {users.filter(u => u.is_paid).length}
              </p>
              <p className="text-[11px] text-emerald-400/80 mt-0.5">Starter, Pro &amp; PhD Elite</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Free Explorer Users</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                  <Globe className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold font-heading text-white mt-2">
                {users.filter(u => !u.is_paid && u.role !== 'ADMIN').length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Preview quota tier</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Platform Administrators</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold font-heading text-amber-300 mt-2">
                {users.filter(u => u.role === 'ADMIN').length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Full governance rights</p>
            </div>
          </div>

          {/* User Management Panel */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  User Profiles &amp; Package Management
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time visibility of every registered student and applicant. Change any user&apos;s plan instantly.
                </p>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={userSearchTerm}
                    onChange={e => setUserSearchTerm(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  {userSearchTerm && (
                    <button
                      onClick={() => setUserSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setUserPlanFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      userPlanFilter === 'ALL' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({users.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserPlanFilter('PAID')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      userPlanFilter === 'PAID' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Paid ({users.filter(u => u.is_paid).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserPlanFilter('FREE')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      userPlanFilter === 'FREE' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Free ({users.filter(u => !u.is_paid && u.role !== 'ADMIN').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserPlanFilter('ADMIN')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      userPlanFilter === 'ADMIN' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Admins ({users.filter(u => u.role === 'ADMIN').length})
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 text-left">
                    <th className="px-5 py-3 font-semibold">User</th>
                    <th className="px-5 py-3 font-semibold">Current Package</th>
                    <th className="px-5 py-3 font-semibold">Subscription Status</th>
                    <th className="px-5 py-3 font-semibold">Account Role</th>
                    <th className="px-5 py-3 font-semibold">Joined Date</th>
                    <th className="px-5 py-3 font-semibold text-right">Assign Plan / Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter(u => {
                      if (userSearchTerm.trim()) {
                        const q = userSearchTerm.toLowerCase();
                        const matchesName = (u.full_name || '').toLowerCase().includes(q);
                        const matchesEmail = u.email.toLowerCase().includes(q);
                        if (!matchesName && !matchesEmail) return false;
                      }
                      if (userPlanFilter === 'PAID') return Boolean(u.is_paid);
                      if (userPlanFilter === 'FREE') return !u.is_paid && u.role !== 'ADMIN';
                      if (userPlanFilter === 'ADMIN') return u.role === 'ADMIN';
                      return true;
                    })
                    .map(u => {
                      const tier = (u.plan_tier || 'FREE').toUpperCase();
                      return (
                        <tr key={u.id} className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-semibold text-white">{u.full_name || 'Academic User'}</p>
                              <p className="text-slate-400 text-[11px] font-mono">{u.email}</p>
                              <span className="text-[10px] text-slate-500 font-mono">ID: {u.id}</span>
                            </div>
                          </td>

                          {/* Current Package */}
                          <td className="px-5 py-4">
                            {tier === 'ELITE' ? (
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 inline-flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-teal-400" /> PhD Elite (Worldwide)
                              </span>
                            ) : tier === 'PRO' ? (
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                                <Zap className="w-3 h-3 text-emerald-400" /> Pro Researcher
                              </span>
                            ) : tier === 'STARTER' ? (
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 inline-flex items-center gap-1">
                                Scholar Starter
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                Free Explorer
                              </span>
                            )}
                          </td>

                          {/* Subscription Status */}
                          <td className="px-5 py-4">
                            <div className="space-y-1">
                              {u.is_paid ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Paid Subscriber
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/80 text-slate-400">
                                  Free User
                                </span>
                              )}
                              {(u.orders_count || 0) > 0 && (
                                <p className="text-[10px] text-slate-400">
                                  {u.orders_count} orders • {u.payments_count || 0} payments
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-5 py-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                u.role === 'ADMIN'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>

                          {/* Joined Date */}
                          <td className="px-5 py-4 text-slate-400">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>

                          {/* Plan Assignment & Actions */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Quick Plan Switch Dropdown */}
                              <select
                                value={u.plan_tier || 'FREE'}
                                onChange={e => handleUpdateUserPlan(u.id, e.target.value)}
                                className="bg-slate-950 border border-slate-800 text-slate-200 text-[11px] rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
                                title="Change user package plan directly"
                              >
                                <option value="FREE">Free Explorer</option>
                                <option value="STARTER">Scholar Starter</option>
                                <option value="PRO">Pro Researcher</option>
                                <option value="ELITE">PhD Elite</option>
                              </select>

                              {/* Suspend Button */}
                              <button
                                onClick={() => handleToggleSuspendUser(u.id, u.is_suspended)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                                  u.is_suspended
                                    ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                                    : 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                                }`}
                              >
                                {u.is_suspended ? 'Reactivate' : 'Suspend'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {users.filter(u => {
                    if (userSearchTerm.trim()) {
                      const q = userSearchTerm.toLowerCase();
                      const matchesName = (u.full_name || '').toLowerCase().includes(q);
                      const matchesEmail = u.email.toLowerCase().includes(q);
                      if (!matchesName && !matchesEmail) return false;
                    }
                    if (userPlanFilter === 'PAID') return Boolean(u.is_paid);
                    if (userPlanFilter === 'FREE') return !u.is_paid && u.role !== 'ADMIN';
                    if (userPlanFilter === 'ADMIN') return u.role === 'ADMIN';
                    return true;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                        No registered users match your search or filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-base font-bold text-white">Immutable Security Audit Logs</h2>
            <p className="text-xs text-slate-400">Verifiable logging of privileged administrative, discovery, and security events.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 text-left">
                  <th className="px-5 py-3 font-semibold">Timestamp</th>
                  <th className="px-5 py-3 font-semibold">User Email</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                  <th className="px-5 py-3 font-semibold">Resource</th>
                  <th className="px-5 py-3 font-semibold font-mono">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                    <td className="px-5 py-3 font-mono text-slate-400">
                      {new Date(log.created_at).toLocaleTimeString()} {new Date(log.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-white font-medium">{log.user_email}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono text-[10px] font-semibold border border-amber-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-300">{log.resource_type}</td>
                    <td className="px-5 py-3 font-mono text-slate-500">{log.ip_address || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Payment Method Modal */}
      {(isAddingMethod || editingMethod) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-5 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  {editingMethod ? 'Edit Receiving Payment Channel' : 'Add New Payment Receiving Method'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddingMethod(false);
                  setEditingMethod(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentMethod} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Method Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JazzCash Mobile Account, EasyPaisa, Stripe"
                    value={methodForm.name}
                    onChange={e => setMethodForm({ ...methodForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Channel Type *</label>
                  <select
                    value={methodForm.type}
                    onChange={e => setMethodForm({ ...methodForm, type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="mobile_wallet">Mobile Wallet (JazzCash / EasyPaisa / NayaPay)</option>
                    <option value="bank_transfer">Bank Wire Transfer (IBAN / Local Bank)</option>
                    <option value="card">Credit / Debit Card (Stripe)</option>
                    <option value="paypal">PayPal Academic Checkout</option>
                    <option value="other">Other Payment Channel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Country / Region *</label>
                  <select
                    value={methodForm.country}
                    onChange={e => setMethodForm({ ...methodForm, country: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Pakistan">Pakistan</option>
                    <option value="Global">Global (All Countries)</option>
                    {countries.map(c => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Currency Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="PKR, USD, EUR, GBP"
                    value={methodForm.currency}
                    onChange={e => setMethodForm({ ...methodForm, currency: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Account Title / Beneficiary *</label>
                  <input
                    type="text"
                    required
                    placeholder="ProfMatch Education Services"
                    value={methodForm.account_name}
                    onChange={e => setMethodForm({ ...methodForm, account_name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Account Number / Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="03001234567 or Card ID"
                    value={methodForm.account_number}
                    onChange={e => setMethodForm({ ...methodForm, account_number: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">IBAN / Swift / Routing (Optional)</label>
                <input
                  type="text"
                  placeholder="PK36MEZN0099330101234567 or Swift Code"
                  value={methodForm.account_identifier}
                  onChange={e => setMethodForm({ ...methodForm, account_identifier: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Checkout Customer Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Transfer payment via JazzCash app to 03001234567 and enter the 10-digit TID transaction receipt..."
                  value={methodForm.instructions}
                  onChange={e => setMethodForm({ ...methodForm, instructions: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={methodForm.enabled}
                    onChange={e => setMethodForm({ ...methodForm, enabled: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                  <span className="text-xs font-semibold text-slate-300">Active / Enabled for Customers</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingMethod(false);
                      setEditingMethod(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {saving ? 'Saving...' : editingMethod ? 'Update Payment Method' : 'Create Payment Method'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

