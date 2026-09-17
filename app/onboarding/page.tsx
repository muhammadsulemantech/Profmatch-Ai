'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  User,
  BookOpen,
  FolderGit2,
  Send,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  UploadCloud,
  FileCheck,
  Globe,
  Layers
} from 'lucide-react';
import { mockDb } from '@/lib/supabase/mock-db';
import { getAllCountries, getRegionsForCountry, getCountryByNameOrCode } from '@/lib/geography/global-geography';
import { ACADEMIC_DOMAINS } from '@/lib/taxonomy/academic-taxonomy';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const countries = getAllCountries();

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal & Target
    fullName: 'Alex Vance',
    country: 'Pakistan',
    targetDegree: 'PhD',
    targetCountry: 'United States',
    targetRegion: 'Texas',
    targetIntake: 'Fall 2027',
    fundingPreference: 'Fully Funded (RA/TA)',
    academicDomain: 'Computing, Artificial Intelligence & Informatics',
    desiredField: 'Artificial Intelligence & Machine Learning',
    bio: 'Passionate about reliable reasoning, cross-disciplinary optimization, and neuro-symbolic methods.',

    // Step 2: Academic Background
    currentDegree: 'Bachelor of Science (B.Sc.)',
    major: 'Computer Science & Engineering',
    university: 'National University of Sciences and Technology (NUST)',
    graduationYear: 2026,
    cgpa: 3.92,
    gradingScale: '4.0',
    achievements: 'Ranked 1st in Department; ACM ICPC Regional Finalist',

    // Step 3: Research & Projects
    researchInterests: ['Artificial Intelligence', 'Machine Learning', 'Computational Optimization', 'Information Extraction'],
    thesisTitle: 'Mitigating Factual Drift in Retrieval-Augmented Generative Pipelines',
    thesisAbstract: 'Investigated constraint-guided beam search and graph-augmented context injection to reduce entity drift in retrieval-augmented generative systems.',
    newInterest: '',

    // Projects
    projects: [
      {
        title: 'FactGuard: Grounded LLM Verification Engine',
        description: 'Built a multi-agent verification pipeline that checks each generated claim against extracted triples from scientific literature.',
        technologies: 'PyTorch, Transformers, FastAPI, Knowledge Graphs',
      },
    ],
    newProjectTitle: '',
    newProjectDesc: '',
    newProjectTech: '',

    // Step 4: Documents
    cvUploaded: true,
    cvFileName: 'Alex_Vance_Academic_CV_2026.pdf',
  });

  const selectedCountryObj = getCountryByNameOrCode(formData.targetCountry);
  const availableRegions = selectedCountryObj ? getRegionsForCountry(selectedCountryObj.name) : [];

  const handleAddInterest = () => {
    if (formData.newInterest.trim()) {
      setFormData({
        ...formData,
        researchInterests: [...formData.researchInterests, formData.newInterest.trim()],
        newInterest: '',
      });
    }
  };

  const handleRemoveInterest = (idx: number) => {
    setFormData({
      ...formData,
      researchInterests: formData.researchInterests.filter((_, i) => i !== idx),
    });
  };

  const handleAddProject = () => {
    if (formData.newProjectTitle.trim() && formData.newProjectDesc.trim()) {
      setFormData({
        ...formData,
        projects: [
          ...formData.projects,
          {
            title: formData.newProjectTitle,
            description: formData.newProjectDesc,
            technologies: formData.newProjectTech || 'Methodology / Frameworks',
          },
        ],
        newProjectTitle: '',
        newProjectDesc: '',
        newProjectTech: '',
      });
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Sync with in-memory store
      const sp = mockDb.studentProfiles[0];
      sp.target_degree = formData.targetDegree;
      sp.target_country = formData.targetCountry;
      sp.target_state = formData.targetRegion;
      sp.target_region = formData.targetRegion;
      sp.target_intake = formData.targetIntake;
      sp.funding_preference = formData.fundingPreference;
      sp.desired_field = formData.desiredField;
      sp.desired_domain = formData.academicDomain;
      sp.bio = formData.bio;

      const ap = mockDb.academicProfiles[0];
      ap.current_degree = formData.currentDegree;
      ap.major = formData.major;
      ap.university = formData.university;
      ap.graduation_year = formData.graduationYear;
      ap.cgpa = formData.cgpa;
      ap.grading_scale = formData.gradingScale;
      ap.achievements = formData.achievements;

      const rp = mockDb.researchProfiles[0];
      rp.research_interests = formData.researchInterests;
      rp.thesis_title = formData.thesisTitle;
      rp.thesis_abstract = formData.thesisAbstract;
      rp.academic_domain = formData.academicDomain;
      rp.primary_discipline = formData.desiredField;

      router.push('/dashboard');
      router.refresh();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Step Indicator Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-400">
          <span className={step >= 1 ? 'text-emerald-400' : ''}>1. Target & Geography</span>
          <span className={step >= 2 ? 'text-emerald-400' : ''}>2. Academic History</span>
          <span className={step >= 3 ? 'text-emerald-400' : ''}>3. Research & Projects</span>
          <span className={step >= 4 ? 'text-emerald-400' : ''}>4. Documents & Finish</span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Container */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                Target Degree & Global Geography Preferences
              </h2>
              <p className="text-xs text-slate-400">Specify your academic goals and target country so we discover accredited faculty worldwide.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Country of Residence / Origin</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={e => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Academic Degree</label>
                <select
                  value={formData.targetDegree}
                  onChange={e => setFormData({ ...formData, targetDegree: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="PhD">Ph.D. (Doctor of Philosophy / Doctorate)</option>
                  <option value="MS">M.S. / M.Sc. (Master of Science with Thesis)</option>
                  <option value="MA">M.A. (Master of Arts)</option>
                  <option value="MPhil">M.Phil. (Master of Philosophy)</option>
                  <option value="Postdoc">Postdoctoral Fellowship</option>
                  <option value="Research Internship">Visiting / Funded Research Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" /> Target Destination Country
                </label>
                <select
                  value={formData.targetCountry}
                  onChange={e => setFormData({ ...formData, targetCountry: e.target.value, targetRegion: '' })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {countries.map(c => (
                    <option key={c.code} value={c.name}>
                      {c.name} ({c.continent})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target {selectedCountryObj ? selectedCountryObj.regionLabel : 'State / Province / Region'}
                </label>
                {availableRegions.length > 0 ? (
                  <select
                    value={formData.targetRegion}
                    onChange={e => setFormData({ ...formData, targetRegion: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
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
                    value={formData.targetRegion}
                    placeholder="e.g. Zurich, Tokyo, Ontario, Bavaria"
                    onChange={e => setFormData({ ...formData, targetRegion: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Admission Cycle</label>
                <input
                  type="text"
                  value={formData.targetIntake}
                  placeholder="Fall 2027"
                  onChange={e => setFormData({ ...formData, targetIntake: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" /> Academic Domain
                </label>
                <select
                  value={formData.academicDomain}
                  onChange={e => setFormData({ ...formData, academicDomain: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {ACADEMIC_DOMAINS.map(d => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Desired Discipline / Specialized Field</label>
                <input
                  type="text"
                  value={formData.desiredField}
                  onChange={e => setFormData({ ...formData, desiredField: e.target.value })}
                  placeholder="e.g. Renewable Energy, Biotechnology, Public Health"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Funding Preference</label>
              <select
                value={formData.fundingPreference}
                onChange={e => setFormData({ ...formData, fundingPreference: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Fully Funded (RA/TA)">Fully Funded (Research Assistantship / Teaching Assistantship)</option>
                <option value="Government / External Scholarship">External Fellowship / Government Scholarship</option>
                <option value="Self / Partial Funding">Self or Partial Funding</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                Academic Qualifications & Credentials
              </h2>
              <p className="text-xs text-slate-400">Used to accurately frame your background across any global academic institution.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Current/Completed Degree</label>
                <input
                  type="text"
                  value={formData.currentDegree}
                  onChange={e => setFormData({ ...formData, currentDegree: e.target.value })}
                  placeholder="e.g. B.Sc., B.Tech, B.A., M.Sc."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Undergraduate Major / Discipline</label>
                <input
                  type="text"
                  value={formData.major}
                  onChange={e => setFormData({ ...formData, major: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Institution / University Name</label>
                <input
                  type="text"
                  value={formData.university}
                  onChange={e => setFormData({ ...formData, university: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Graduation Year</label>
                <input
                  type="number"
                  value={formData.graduationYear}
                  onChange={e => setFormData({ ...formData, graduationYear: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Cumulative GPA (Scale: {formData.gradingScale})</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cgpa}
                  onChange={e => setFormData({ ...formData, cgpa: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Grading Scale</label>
                <input
                  type="text"
                  value={formData.gradingScale}
                  onChange={e => setFormData({ ...formData, gradingScale: e.target.value })}
                  placeholder="4.0, 10.0, First Class Honours, etc."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Honors, Grants & Achievements</label>
              <textarea
                rows={2}
                value={formData.achievements}
                onChange={e => setFormData({ ...formData, achievements: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-emerald-400" />
                Research Profile, Lab Work & Scholarly Projects
              </h2>
              <p className="text-xs text-slate-400">The core ground truth used by AI to compute match scores and cite your projects.</p>
            </div>

            {/* Research Interests Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Research Keywords & Topics</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.researchInterests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                  >
                    {interest}
                    <button type="button" onClick={() => handleRemoveInterest(idx)} className="hover:text-rose-400 ml-1">
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Sustainable Urbanism, Molecular Assays, Econometrics"
                  value={formData.newInterest}
                  onChange={e => setFormData({ ...formData, newInterest: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
                  className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddInterest}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl border border-slate-700"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Thesis */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Thesis / Capstone / Major Project Title</label>
                <input
                  type="text"
                  value={formData.thesisTitle}
                  onChange={e => setFormData({ ...formData, thesisTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Thesis Abstract / Summary</label>
                <textarea
                  rows={3}
                  value={formData.thesisAbstract}
                  onChange={e => setFormData({ ...formData, thesisAbstract: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Existing Projects */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-slate-300">Featured Research & Technical Projects</label>
              {formData.projects.map((proj, pIdx) => (
                <div key={pIdx} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1">
                  <h4 className="font-bold text-emerald-300">{proj.title}</h4>
                  <p className="text-slate-400">{proj.description}</p>
                  <p className="text-[11px] text-slate-500 font-mono">Tools/Methods: {proj.technologies}</p>
                </div>
              ))}

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
                <p className="text-xs font-semibold text-slate-300">Add Another Project</p>
                <input
                  type="text"
                  placeholder="Project Title"
                  value={formData.newProjectTitle}
                  onChange={e => setFormData({ ...formData, newProjectTitle: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <textarea
                  rows={2}
                  placeholder="Brief summary of research methodology and findings"
                  value={formData.newProjectDesc}
                  onChange={e => setFormData({ ...formData, newProjectDesc: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Key Methods / Tools / Technologies"
                    value={formData.newProjectTech}
                    onChange={e => setFormData({ ...formData, newProjectTech: e.target.value })}
                    className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddProject}
                    className="px-4 py-2 bg-slate-800 text-xs font-semibold text-emerald-400 rounded-xl border border-slate-700"
                  >
                    Save Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                Attach Academic Documents & Launch
              </h2>
              <p className="text-xs text-slate-400">Confirm your CV and profile grounding before entering the global portal.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">{formData.cvFileName}</p>
                <p className="text-xs text-emerald-400 font-medium">Academic CV Verified & Indexed</p>
              </div>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                Your profile is now calibrated to search across 190+ countries and discover faculty matching your background.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Ready for Global Faculty Discovery
              </p>
              <p className="text-slate-300">
                Targeting: <strong className="text-white">{formData.targetDegree}</strong> in <strong className="text-white">{formData.desiredField}</strong> ({formData.targetCountry})
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Previous Step
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
            >
              Next Step <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {loading ? 'Entering Portal...' : 'Complete & Launch Dashboard'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
