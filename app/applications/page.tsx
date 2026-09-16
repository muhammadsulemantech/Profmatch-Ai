'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Building2,
  Calendar,
  ExternalLink,
  Plus,
  FileText,
  Clock,
  ArrowUpRight,
  Filter,
  Trash2,
  Edit3,
  CheckCircle2,
  X,
  Search,
  Sparkles,
  Layers
} from 'lucide-react';
import { mockDb } from '@/lib/supabase/mock-db';
import { useAuth } from '@/lib/auth/auth-context';
import { ApplicationTrackerItem } from '@/types/database';

export default function ApplicationsPage() {
  const router = useRouter();
  const { user, requireAuth } = useAuth();

  const [applications, setApplications] = useState<ApplicationTrackerItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Modal State for Add / Edit Application
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);

  // Form Fields
  const [universityName, setUniversityName] = useState('');
  const [programName, setProgramName] = useState('');
  const [degree, setDegree] = useState('PhD');
  const [intake, setIntake] = useState('Fall 2027');
  const [deadline, setDeadline] = useState('2026-12-15');
  const [status, setStatus] = useState<ApplicationTrackerItem['status']>('Shortlisted');
  const [fundingStatus, setFundingStatus] = useState<ApplicationTrackerItem['funding_status']>('Pending');
  const [portalUrl, setPortalUrl] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!user) {
      setApplications([]);
      return;
    }

    const isSampleDemoStudent = user.id === 'usr_student_001';
    const appKey = `profmatch_user_applications_${user.id}`;
    let localApps: any[] = [];
    try {
      const stored = localStorage.getItem(appKey);
      if (stored) localApps = JSON.parse(stored);
    } catch {}

    const mockUserApps = mockDb.applications.filter((a) => a.user_id === user.id);
    const combinedMap = new Map();
    [...localApps, ...mockUserApps].forEach((a) => combinedMap.set(a.id, a));
    let finalApps = Array.from(combinedMap.values());

    if (isSampleDemoStudent && finalApps.length === 0) {
      finalApps = mockDb.applications;
    }

    setApplications(finalApps);
  }, [user]);

  const saveApplicationsToStorage = (updatedApps: ApplicationTrackerItem[]) => {
    setApplications(updatedApps);
    if (typeof window !== 'undefined' && user) {
      const appKey = `profmatch_user_applications_${user.id}`;
      localStorage.setItem(appKey, JSON.stringify(updatedApps));
    }
  };

  const openAddModal = () => {
    setEditingAppId(null);
    setUniversityName('');
    setProgramName('');
    setDegree('PhD');
    setIntake('Fall 2027');
    setDeadline('2026-12-15');
    setStatus('Shortlisted');
    setFundingStatus('Pending');
    setPortalUrl('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (app: ApplicationTrackerItem) => {
    setEditingAppId(app.id);
    setUniversityName(app.university_name || '');
    setProgramName(app.program_name || '');
    setDegree(app.degree || 'PhD');
    setIntake(app.intake || 'Fall 2027');
    setDeadline(app.deadline || '');
    setStatus(app.status || 'Shortlisted');
    setFundingStatus(app.funding_status || 'Pending');
    setPortalUrl(app.portal_url || '');
    setNotes(app.notes || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!universityName.trim() || !programName.trim()) return;

    const userId = user?.id || 'usr_guest';

    if (editingAppId) {
      const updated: ApplicationTrackerItem[] = applications.map((a) =>
        a.id === editingAppId
          ? {
              ...a,
              university_name: universityName.trim(),
              program_name: programName.trim(),
              degree,
              intake,
              deadline,
              status: status as ApplicationTrackerItem['status'],
              funding_status: fundingStatus as ApplicationTrackerItem['funding_status'],
              portal_url: portalUrl.trim(),
              notes: notes.trim(),
              updated_at: new Date().toISOString(),
            }
          : a
      );
      saveApplicationsToStorage(updated);
    } else {
      const newApp: ApplicationTrackerItem = {
        id: `app_${Date.now()}`,
        user_id: userId,
        university_id: `uni_${Date.now()}`,
        university_name: universityName.trim(),
        program_name: programName.trim(),
        degree,
        intake,
        deadline,
        status: status as ApplicationTrackerItem['status'],
        funding_status: fundingStatus as ApplicationTrackerItem['funding_status'],
        portal_url: portalUrl.trim(),
        notes: notes.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updated = [newApp, ...applications];
      saveApplicationsToStorage(updated);
      mockDb.applications.unshift(newApp as any);
    }

    setIsModalOpen(false);
  };

  const handleDeleteApplication = (id: string) => {
    if (confirm('Are you sure you want to remove this application file?')) {
      const updated = applications.filter((a) => a.id !== id);
      saveApplicationsToStorage(updated);
    }
  };

  const handleStatusChange = (appId: string, newStatus: string) => {
    const updated: ApplicationTrackerItem[] = applications.map((a) =>
      a.id === appId ? { ...a, status: newStatus as ApplicationTrackerItem['status'], updated_at: new Date().toISOString() } : a
    );
    saveApplicationsToStorage(updated);
  };

  // Filtered List
  const filteredApplications = applications.filter((a) => {
    if (filterStatus === 'ALL') return true;
    return a.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const stages = [
    { label: 'All Tracked', key: 'ALL', count: applications.length },
    { label: 'Shortlisted', key: 'Shortlisted', count: applications.filter((a) => a.status === 'Shortlisted').length },
    { label: 'Contacted', key: 'Contacted', count: applications.filter((a) => a.status === 'Contacted').length },
    { label: 'Applied', key: 'Applied', count: applications.filter((a) => a.status === 'Applied').length },
    { label: 'Interview', key: 'Interview', count: applications.filter((a) => a.status === 'Interview').length },
    { label: 'Offer', key: 'Offer', count: applications.filter((a) => a.status === 'Offer').length },
  ];

  const statusStyles: Record<string, string> = {
    Shortlisted: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    Contacted: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    Replied: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    Applied: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
    Interview: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    Offer: 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40',
    Rejected: 'bg-red-500/15 text-red-400 border border-red-500/30',
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 py-10 selection:bg-emerald-500/25 selection:text-emerald-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
              <span>Graduate Admissions Tracker</span>
              <span className="text-slate-600">•</span>
              <span>2026 / 2027 Cycle</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white tracking-tight">
              Application &amp; Outreach Pipeline
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Systematically monitor faculty contact, portal submissions, funding agreements, and official institutional deadlines.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className={`px-4 py-2 text-xs font-medium rounded-xl border transition-all flex items-center gap-1.5 shadow-sm ${
                  filterStatus !== 'ALL'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-900 text-slate-200 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-emerald-400" />
                {filterStatus === 'ALL' ? 'Filter Pipeline' : `Status: ${filterStatus}`}
              </button>

              {isFilterDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-xl py-2 z-30">
                  <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Filter by Status
                  </div>
                  {['ALL', 'Shortlisted', 'Contacted', 'Applied', 'Interview', 'Offer', 'Rejected'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setFilterStatus(st);
                        setIsFilterDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors flex items-center justify-between ${
                        filterStatus === st
                          ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{st === 'ALL' ? 'All Applications' : st}</span>
                      {filterStatus === st && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => requireAuth('add new application', openAddModal)}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              Add Application
            </button>
          </div>
        </div>

        {/* Stage Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stages.map((stg) => {
            const isActive = filterStatus === stg.key;
            return (
              <button
                key={stg.key}
                type="button"
                onClick={() => setFilterStatus(stg.key)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <span className={`text-[11px] font-medium block ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {stg.label}
                </span>
                <span className="text-2xl font-heading font-bold text-white mt-1 block">
                  {stg.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Applications Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-sm overflow-hidden space-y-0">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              Active Institutional Files ({filteredApplications.length})
            </h2>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Real-time synchronization active
            </span>
          </div>

          {filteredApplications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="px-5 py-3.5">University &amp; Program</th>
                    <th className="px-5 py-3.5">Faculty Advisor</th>
                    <th className="px-5 py-3.5">Intake</th>
                    <th className="px-5 py-3.5">Submission Deadline</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Funding Type</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                  {filteredApplications.map((app) => {
                    const badgeClass = statusStyles[app.status] || statusStyles.Shortlisted;
                    return (
                      <tr key={app.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-heading font-bold text-white flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{app.university_name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {app.program_name} ({app.degree})
                          </div>
                        </td>
                        <td className="px-5 py-4 text-white">
                          {app.professor_name ? (
                            <Link href={`/professors/${app.professor_id}`} className="text-emerald-400 hover:underline font-semibold flex items-center gap-1">
                              {app.professor_name}
                              <ArrowUpRight className="w-3 h-3 opacity-60" />
                            </Link>
                          ) : (
                            <span className="text-slate-500 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-300 font-medium">
                          {app.intake || 'Fall 2027'}
                        </td>
                        <td className="px-5 py-4 text-white">
                          {app.deadline ? (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span className="font-mono text-[11px]">
                                {new Date(app.deadline).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-950 border focus:outline-none cursor-pointer ${badgeClass}`}
                          >
                            <option value="Shortlisted" className="bg-slate-900 text-slate-200">Shortlisted</option>
                            <option value="Contacted" className="bg-slate-900 text-slate-200">Contacted</option>
                            <option value="Applied" className="bg-slate-900 text-slate-200">Applied</option>
                            <option value="Interview" className="bg-slate-900 text-slate-200">Interview</option>
                            <option value="Offer" className="bg-slate-900 text-slate-200">Offer</option>
                            <option value="Rejected" className="bg-slate-900 text-slate-200">Rejected</option>
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[11px] text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                            {app.funding_status || 'Fully Funded (RA/TA)'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {app.portal_url && (
                              <a
                                href={app.portal_url}
                                target="_blank"
                                rel="noreferrer"
                                title="Open University Portal"
                                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <Link
                              href={app.professor_id ? `/outreach/generate?professorId=${app.professor_id}` : '/search'}
                              title="Compose Outreach Draft"
                              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => openEditModal(app)}
                              title="Edit Application"
                              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteApplication(app.id)}
                              title="Delete File"
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h4 className="font-heading font-bold text-base text-white">No Tracked Applications Found</h4>
              <p className="max-w-md mx-auto leading-relaxed">
                {filterStatus !== 'ALL'
                  ? `No applications currently match the filter status '${filterStatus}'.`
                  : 'Start tracking your institutional applications and admissions deadlines.'}
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                {filterStatus !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setFilterStatus('ALL')}
                    className="px-3.5 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 font-medium"
                  >
                    Clear Filter
                  </button>
                )}
                <button
                  type="button"
                  onClick={openAddModal}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-md shadow-emerald-500/20"
                >
                  + Add Application
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Application Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-white">
                    {editingAppId ? 'Edit Application File' : 'Add Graduate Application'}
                  </h3>
                  <p className="text-xs text-slate-400">Track portal submission deadlines and advisor agreements.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">University Name</label>
                <input
                  type="text"
                  required
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                  placeholder="e.g. University of Texas at Austin"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Program &amp; Department</label>
                  <input
                    type="text"
                    required
                    value={programName}
                    onChange={(e) => setProgramName(e.target.value)}
                    placeholder="e.g. Ph.D. in Computer Science"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Degree Tier</label>
                  <select
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="PhD">Doctoral (PhD Candidate)</option>
                    <option value="MS">Master of Science (MS)</option>
                    <option value="Postdoc">Postdoctoral Fellowship</option>
                    <option value="Internship">Research Internship</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Intake</label>
                  <select
                    value={intake}
                    onChange={(e) => setIntake(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Fall 2027">Fall 2027</option>
                    <option value="Spring 2027">Spring 2027</option>
                    <option value="Fall 2026">Fall 2026</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Deadline Date</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Pipeline Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ApplicationTrackerItem['status'])}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Applied">Applied</option>
                    <option value="Interview">Interview</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Funding Type</label>
                  <select
                    value={fundingStatus}
                    onChange={(e) => setFundingStatus(e.target.value as ApplicationTrackerItem['funding_status'])}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Pending">Pending Evaluation</option>
                    <option value="Secured">Secured (RA/TA / Grant)</option>
                    <option value="Not Applied">Not Applied</option>
                    <option value="Denied">Denied</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Application Portal URL</label>
                <input
                  type="url"
                  value={portalUrl}
                  onChange={(e) => setPortalUrl(e.target.value)}
                  placeholder="https://gradschool.university.edu/admissions"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold shadow-lg shadow-emerald-500/20 transition-all"
                >
                  {editingAppId ? 'Save Changes' : 'Add Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

