'use client';

import { useState, useMemo } from 'react';
import { mockDb } from '@/lib/supabase/mock-db';
import {
  User,
  GraduationCap,
  BookOpen,
  Award,
  Globe,
  FileText,
  Save,
  CheckCircle2,
  Sparkles,
  Plus,
  Trash2,
  Layers
} from 'lucide-react';
import { getAllCountries, getRegionsForCountry, getCountryByNameOrCode } from '@/lib/geography/global-geography';
import { ACADEMIC_DOMAINS } from '@/lib/taxonomy/academic-taxonomy';

export default function ProfilePage() {
  const student = mockDb.studentProfiles[0];
  const academic = mockDb.academicProfiles[0];
  const research = mockDb.researchProfiles[0];
  const cvDoc = mockDb.studentDocuments[0];

  const countries = useMemo(() => getAllCountries(), []);

  const [saved, setSaved] = useState(false);
  const [targetDegree, setTargetDegree] = useState(student.target_degree || 'PhD');
  const [targetCountry, setTargetCountry] = useState(student.target_country || 'United States');
  const [targetRegion, setTargetRegion] = useState(student.target_region || student.target_state || 'Texas');
  const [academicDomain, setAcademicDomain] = useState(student.desired_domain || 'Computing, Artificial Intelligence & Informatics');
  const [desiredField, setDesiredField] = useState(student.desired_field || 'Artificial Intelligence & NLP');
  const [fundingPref, setFundingPref] = useState(student.funding_preference || 'Fully Funded (RA/TA)');
  const [bio, setBio] = useState(student.bio || '');

  const [cgpa, setCgpa] = useState(academic.cgpa?.toString() || '3.92');
  const [currentDegree, setCurrentDegree] = useState(academic.current_degree || 'Bachelor of Science (B.Sc.)');
  const [major, setMajor] = useState(academic.major || 'Computer Science and Engineering');
  const [university, setUniversity] = useState(academic.university || 'National University of Sciences and Technology (NUST)');
  const [gradYear, setGradYear] = useState(academic.graduation_year?.toString() || '2026');

  const [thesisTitle, setThesisTitle] = useState(research.thesis_title || '');
  const [thesisAbstract, setThesisAbstract] = useState(research.thesis_abstract || '');
  const [interests, setInterests] = useState<string[]>(research.research_interests || []);
  const [newInterest, setNewInterest] = useState('');

  const selectedCountryObj = getCountryByNameOrCode(targetCountry);
  const availableRegions = selectedCountryObj ? getRegionsForCountry(selectedCountryObj.name) : [];

  const handleAddInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (item: string) => {
    setInterests(interests.filter(i => i !== item));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    student.target_degree = targetDegree;
    student.target_country = targetCountry;
    student.target_state = targetRegion;
    student.target_region = targetRegion;
    student.desired_field = desiredField;
    student.desired_domain = academicDomain;
    student.funding_preference = fundingPref;
    student.bio = bio;

    academic.cgpa = parseFloat(cgpa) || 3.9;
    academic.current_degree = currentDegree;
    academic.major = major;
    academic.university = university;
    academic.graduation_year = parseInt(gradYear, 10) || 2026;

    research.thesis_title = thesisTitle;
    research.thesis_abstract = thesisAbstract;
    research.research_interests = interests;
    research.academic_domain = academicDomain;
    research.primary_discipline = desiredField;

    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2">
            <Globe className="w-3 h-3" /> Universal Academic Grounding Profile
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-emerald-400" /> Student Research & Geographic Profile
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            This profile data is directly injected into the Cold Email Generator to guarantee 100% personalized, fact-checked professor outreach across all countries and disciplines.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25 hover:scale-[1.02] transition-all"
        >
          <Save className="w-4 h-4" /> Save Profile
        </button>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Research profile updated successfully! All future generated outreach will ground against these parameters.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Target Degree & Admissions Preferences */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Target Academic Destination</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Academic Degree</label>
              <select
                value={targetDegree}
                onChange={e => setTargetDegree(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="PhD">Ph.D. (Doctor of Philosophy / Doctorate)</option>
                <option value="MS">M.S. / M.Sc. (Master of Science with Thesis)</option>
                <option value="MA">M.A. (Master of Arts)</option>
                <option value="MPhil">M.Phil. (Master of Philosophy)</option>
                <option value="Postdoc">Postdoctoral Fellowship</option>
                <option value="Research Internship">Visiting / Research Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" /> Target Destination Country
              </label>
              <select
                value={targetCountry}
                onChange={e => {
                  setTargetCountry(e.target.value);
                  setTargetRegion('');
                }}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {countries.map(c => (
                  <option key={c.code} value={c.name}>
                    {c.name} ({c.continent})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target {selectedCountryObj ? selectedCountryObj.regionLabel : 'Region / Province / State'}
              </label>
              {availableRegions.length > 0 ? (
                <select
                  value={targetRegion}
                  onChange={e => setTargetRegion(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">All Regions</option>
                  {availableRegions.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={targetRegion}
                  onChange={e => setTargetRegion(e.target.value)}
                  placeholder="e.g. Zurich, Tokyo, Ontario, Bavaria"
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" /> Overarching Academic Domain
              </label>
              <select
                value={academicDomain}
                onChange={e => setAcademicDomain(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {ACADEMIC_DOMAINS.map(d => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Desired Research Discipline / Sub-field</label>
              <input
                type="text"
                value={desiredField}
                onChange={e => setDesiredField(e.target.value)}
                placeholder="e.g. Sustainable Urbanism, Molecular Assays, Econometrics"
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Funding Requirement</label>
              <select
                value={fundingPref}
                onChange={e => setFundingPref(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Fully Funded (RA/TA)">Fully Funded (Research Assistantship / Teaching Assistantship)</option>
                <option value="Fellowship / Scholarship">External Fellowship / Government Scholarship</option>
                <option value="Self / Partial">Self-Funded or Partial</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Academic Bio & Statement of Purpose Summary</label>
              <textarea
                rows={3}
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Current Academic History */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Undergraduate / Current Academic Credentials</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Current Institution</label>
              <input
                type="text"
                value={university}
                onChange={e => setUniversity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Degree & Major</label>
              <input
                type="text"
                value={major}
                onChange={e => setMajor(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Cumulative GPA</label>
              <input
                type="text"
                value={cgpa}
                onChange={e => setCgpa(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Expected Graduation Year</label>
              <input
                type="number"
                value={gradYear}
                onChange={e => setGradYear(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Research Focus & Thesis */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Research Focus & Scholarly Keywords</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Research Keywords / Specific Topics</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {interests.map(item => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => handleRemoveInterest(item)}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInterest}
                  onChange={e => setNewInterest(e.target.value)}
                  placeholder="e.g. Sustainable Cities, CRISPR Assays, Applied Econometrics"
                  className="flex-1 px-3.5 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddInterest}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Keyword
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Thesis / Capstone / Major Project Title</label>
              <input
                type="text"
                value={thesisTitle}
                onChange={e => setThesisTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Thesis Abstract & Analytical Methodology</label>
              <textarea
                rows={3}
                value={thesisAbstract}
                onChange={e => setThesisAbstract(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Academic Documents */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileText className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">Attached Academic Curriculum Vitae</h2>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{cvDoc.file_name}</p>
                <p className="text-[11px] text-slate-400">
                  {Math.round(cvDoc.file_size / 1024)} KB &bull; Uploaded for AI synthesis
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              Active CV
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25 hover:scale-[1.02] transition-all"
          >
            <Save className="w-4 h-4" /> Save All Profile Changes
          </button>
        </div>
      </form>
    </div>
  );
}
