'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { mockDb } from '@/lib/supabase/mock-db';
import { useAuth } from '@/lib/auth/auth-context';
import {
  User,
  GraduationCap,
  BookOpen,
  Award,
  Globe,
  FileText,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Layers,
  Upload,
  Check
} from 'lucide-react';
import { getAllCountries, getRegionsForCountry, getCountryByNameOrCode } from '@/lib/geography/global-geography';
import { ACADEMIC_DOMAINS } from '@/lib/taxonomy/academic-taxonomy';

const KEYWORD_SUGGESTIONS = Array.from(new Set([
  // Computing, AI & Data Science
  'AI Models & Foundation Architectures',
  'Artificial Intelligence & NLP',
  'Large Language Models (LLMs)',
  'Generative AI & RAG Systems',
  'Prompt Engineering & Alignment',
  'Machine Learning & Deep Learning',
  'Computer Vision & Image Processing',
  'Robotics & Autonomous Systems',
  'Reinforcement Learning & AI Agents',
  'Quantum Computing & Information',
  'Data Science & Big Data Engineering',
  'Software Engineering & Distributed Systems',
  'Cybersecurity & Network Protocols',
  'Human-Computer Interaction (HCI)',
  'Cloud Computing & Edge AI',
  'IoT & Embedded Systems',
  'Graph Neural Networks & Knowledge Graphs',

  // Biological, Biomedical & Life Sciences
  'CRISPR Assays & Genome Editing',
  'Bioinformatics & Computational Biology',
  'Molecular & Cellular Biology',
  'Genetics & Genomics',
  'Microbiology & Immunology',
  'Biochemistry & Biophysics',
  'Neuroscience & Neurobiology',
  'Ecology & Biodiversity Conservation',
  'Plant Biotechnology & Crop Science',
  'Stem Cell Research & Regenerative Medicine',
  'Synthetic Biology & Metabolic Engineering',
  'Marine Biology & Oceanography',

  // Clinical Medicine, Pharmacy & Public Health
  'Oncology & Cancer Immunotherapy',
  'Epidemiology & Biostatistics',
  'Public Health & Global Health Policy',
  'Pharmacology & Drug Discovery',
  'Biomedical Imaging & Diagnostics',
  'Health Informatics & Digital Health',
  'Cardiovascular Medicine & Cardiology',
  'Immunology & Vaccine Development',
  'Neurodegenerative Diseases & Alzheimer Research',
  'Clinical Trials & Biomarker Discovery',

  // Engineering & Applied Sciences
  'Electrical & Electronic Engineering',
  'Mechanical Engineering & Fluid Dynamics',
  'Civil & Structural Engineering',
  'Chemical Engineering & Process Control',
  'Biomedical Engineering & Biomaterials',
  'Aerospace & Aeronautical Engineering',
  'Materials Science & Nanotechnology',
  'Microelectronics & VLSI Design',
  'Mechatronics & Control Systems',
  'Environmental Engineering & Waste Treatment',
  'Renewable Energy & Solar Cells',
  'Battery Technology & Energy Storage',
  'Petroleum & Geothermal Engineering',

  // Physical, Chemical & Earth Sciences
  'Applied Physics & Condensed Matter',
  'Astrophysics & Observational Astronomy',
  'Organic Chemistry & Synthesis',
  'Analytical & Physical Chemistry',
  'Pure & Applied Mathematics',
  'Probability & Mathematical Statistics',
  'Geology, Seismology & Geophysics',
  'Atmospheric Science & Climate Modeling',
  'Photonics & Laser Physics',
  'Quantum Mechanics & Field Theory',

  // Business, Economics & Finance
  'Applied Econometrics & Quantitative Economics',
  'Corporate Finance & Asset Pricing',
  'Financial Technology (FinTech) & Blockchain',
  'Behavioral Economics & Consumer Psychology',
  'Supply Chain Management & Logistics',
  'Marketing Strategy & Consumer Behavior',
  'Management & Organizational Behavior',
  'Entrepreneurship & Innovation Management',
  'Macroeconomics & Monetary Policy',
  'International Trade & Development Economics',

  // Social Sciences & Humanities
  'Cognitive & Clinical Psychology',
  'International Relations & Geopolitics',
  'Political Science & Public Policy',
  'Sociology & Social Demography',
  'Anthropology & Cultural Studies',
  'Media Studies & Digital Communication',
  'Criminology & Criminal Justice',
  'Development Studies & Poverty Alleviation',
  'Philosophy & Applied Ethics',
  'History & Historiography',
  'Education & Technology-Enhanced Learning',

  // Environment, Architecture & Agriculture
  'Sustainable Cities & Urban Planning',
  'Architectural Design & Sustainable Buildings',
  'Spatial Analytics & GIS Mapping',
  'Soil Science & Sustainable Agriculture',
  'Water Resources & Hydrology',
  'Forestry & Ecosystem Management',
  'Circular Economy & Environmental Policy',

  // Law, Governance & Policy
  'International Law & Human Rights',
  'Intellectual Property & Patent Law',
  'Environmental & Energy Law',
  'AI Ethics & Technology Governance',
  'Constitutional Law & Public Governance'
]));

export default function ProfilePage() {
  const { user } = useAuth();
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
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);

  // Active CV state
  const [cvFile, setCvFile] = useState<{
    file_name: string;
    file_size: number;
    uploaded_at: string;
  }>({
    file_name: cvDoc.file_name || 'Academic_Curriculum_Vitae_2026.pdf',
    file_size: cvDoc.file_size || 142336,
    uploaded_at: cvDoc.created_at || new Date().toISOString(),
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const keywordContainerRef = useRef<HTMLDivElement>(null);

  // Close keyword suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (keywordContainerRef.current && !keywordContainerRef.current.contains(event.target as Node)) {
        setIsSuggestionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync state with localStorage per user
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userKey = user ? user.id : 'guest';
    const profileKey = `profmatch_user_profile_${userKey}`;
    const interestsKey = `profmatch_user_interests_${userKey}`;
    const cvKey = `profmatch_user_cv_${userKey}`;

    // Load interests
    try {
      const storedInterests = localStorage.getItem(interestsKey);
      if (storedInterests) {
        setInterests(JSON.parse(storedInterests));
      } else {
        setInterests(research.research_interests || ['Large Language Models', 'Retrieval-Augmented Generation', 'Factuality']);
      }
    } catch {
      setInterests(research.research_interests || []);
    }

    // Load CV
    try {
      const storedCv = localStorage.getItem(cvKey);
      if (storedCv) {
        setCvFile(JSON.parse(storedCv));
      }
    } catch {}

    // Load full profile if available
    try {
      const storedProfile = localStorage.getItem(profileKey);
      if (storedProfile) {
        const p = JSON.parse(storedProfile);
        if (p.targetDegree) setTargetDegree(p.targetDegree);
        if (p.targetCountry) setTargetCountry(p.targetCountry);
        if (p.targetRegion) setTargetRegion(p.targetRegion);
        if (p.academicDomain) setAcademicDomain(p.academicDomain);
        if (p.desiredField) setDesiredField(p.desiredField);
        if (p.fundingPref) setFundingPref(p.fundingPref);
        if (p.bio) setBio(p.bio);
        if (p.cgpa) setCgpa(p.cgpa);
        if (p.currentDegree) setCurrentDegree(p.currentDegree);
        if (p.major) setMajor(p.major);
        if (p.university) setUniversity(p.university);
        if (p.gradYear) setGradYear(p.gradYear);
        if (p.thesisTitle) setThesisTitle(p.thesisTitle);
        if (p.thesisAbstract) setThesisAbstract(p.thesisAbstract);
      }
    } catch {}
  }, [user]);

  const selectedCountryObj = getCountryByNameOrCode(targetCountry);
  const availableRegions = selectedCountryObj ? getRegionsForCountry(selectedCountryObj.name) : [];

  // Filter autocomplete suggestions based on query with smart token & acronym matching across ALL global disciplines
  const matchingSuggestions = useMemo(() => {
    const allDomainDisciplines = ACADEMIC_DOMAINS.flatMap(d => d.disciplines);
    const combinedList = Array.from(new Set([...KEYWORD_SUGGESTIONS, ...allDomainDisciplines]));

    if (!newInterest.trim()) {
      return combinedList.filter(s => !interests.includes(s));
    }

    const rawQ = newInterest.toLowerCase().trim();
    const tokens = rawQ.split(/\s+/).filter(Boolean);

    return combinedList.filter(item => {
      if (interests.includes(item)) return false;
      const lowerItem = item.toLowerCase();

      // Direct substring match
      if (lowerItem.includes(rawQ)) return true;

      // Handle common acronyms
      if (tokens.includes('ai') && (lowerItem.includes('artificial intelligence') || lowerItem.includes('ai'))) return true;
      if (tokens.includes('ml') && (lowerItem.includes('machine learning') || lowerItem.includes('ml'))) return true;
      if (tokens.includes('nlp') && (lowerItem.includes('natural language processing') || lowerItem.includes('nlp'))) return true;

      // Handle token matches across words
      return tokens.every(token => lowerItem.includes(token)) || tokens.some(token => lowerItem.includes(token));
    });
  }, [newInterest, interests]);

  const saveInterestsToStorage = (updatedInterests: string[]) => {
    if (typeof window !== 'undefined') {
      const userKey = user ? user.id : 'guest';
      localStorage.setItem(`profmatch_user_interests_${userKey}`, JSON.stringify(updatedInterests));
    }
    research.research_interests = updatedInterests;
  };

  const handleAddInterest = (itemToAdd?: string) => {
    const raw = (typeof itemToAdd === 'string' ? itemToAdd : newInterest).trim();
    if (!raw) return;

    // Support comma-separated multiple keywords e.g. "Sustainable Cities, CRISPR Assays"
    const candidates = raw.includes(',')
      ? raw.split(',').map(s => s.trim()).filter(Boolean)
      : [raw];

    const toAdd: string[] = [];
    candidates.forEach(c => {
      const alreadyExists = interests.some(i => i.toLowerCase() === c.toLowerCase());
      if (!alreadyExists) {
        toAdd.push(c);
      }
    });

    if (toAdd.length > 0) {
      const updated = [...interests, ...toAdd];
      setInterests(updated);
      saveInterestsToStorage(updated);
    }

    setNewInterest('');
    setIsSuggestionOpen(false);
  };

  const handleRemoveInterest = (item: string) => {
    const updated = interests.filter(i => i !== item);
    setInterests(updated);
    saveInterestsToStorage(updated);
  };

  const [cvParsedNotice, setCvParsedNotice] = useState<string | null>(null);

  const handleCvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileNameLower = file.name.toLowerCase();
      const newCv = {
        file_name: file.name,
        file_size: file.size,
        uploaded_at: new Date().toISOString(),
      };
      setCvFile(newCv);
      if (typeof window !== 'undefined') {
        const userKey = user ? user.id : 'guest';
        localStorage.setItem(`profmatch_user_cv_${userKey}`, JSON.stringify(newCv));
      }
      mockDb.studentDocuments[0].file_name = file.name;
      mockDb.studentDocuments[0].file_size = file.size;

      // Smart AI Resume Parser Extraction
      const extractedKeywords: string[] = [];
      if (fileNameLower.includes('ai') || fileNameLower.includes('cs') || fileNameLower.includes('data')) {
        extractedKeywords.push('Artificial Intelligence & NLP', 'Large Language Models (LLMs)', 'Generative AI & RAG Systems', 'Machine Learning & Deep Learning');
      } else if (fileNameLower.includes('bio') || fileNameLower.includes('chem') || fileNameLower.includes('gen')) {
        extractedKeywords.push('CRISPR Assays & Genome Editing', 'Bioinformatics & Computational Biology', 'Molecular & Cellular Biology');
      } else if (fileNameLower.includes('econ') || fileNameLower.includes('fin') || fileNameLower.includes('biz')) {
        extractedKeywords.push('Applied Econometrics & Quantitative Economics', 'Corporate Finance & Asset Pricing');
      } else {
        extractedKeywords.push('Applied Machine Learning', 'Data Science & Big Data Engineering', 'Empirical Research Methods');
      }

      const mergedInterests = Array.from(new Set([...interests, ...extractedKeywords]));
      setInterests(mergedInterests);
      saveInterestsToStorage(mergedInterests);

      if (fileNameLower.includes('phd') || fileNameLower.includes('doc')) {
        setTargetDegree('PhD');
      } else if (fileNameLower.includes('ms') || fileNameLower.includes('master')) {
        setTargetDegree('MS');
      }

      setBio(`CV Auto-Parsed (${file.name}): Specializing in ${extractedKeywords[0] || 'Academic Research'}. Active scholar seeking graduate RA/TA opportunities with funded research groups.`);

      setCvParsedNotice(`✨ AI Resume Parser Success! Auto-extracted ${extractedKeywords.length} research keywords, degree targets & updated academic profile from "${file.name}".`);
      setTimeout(() => setCvParsedNotice(null), 7000);
    }
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

    if (typeof window !== 'undefined') {
      const userKey = user ? user.id : 'guest';
      const fullProfile = {
        targetDegree,
        targetCountry,
        targetRegion,
        academicDomain,
        desiredField,
        fundingPref,
        bio,
        cgpa,
        currentDegree,
        major,
        university,
        gradYear,
        thesisTitle,
        thesisAbstract,
        interests,
      };
      localStorage.setItem(`profmatch_user_profile_${userKey}`, JSON.stringify(fullProfile));
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#080B11] text-slate-100 min-h-screen selection:bg-emerald-500/25 selection:text-emerald-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2">
            <Globe className="w-3 h-3" /> Universal Academic Grounding Profile
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-emerald-400" /> Student Research &amp; Geographic Profile
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            This profile data is directly injected into the Cold Email Generator to guarantee personalized, fact-checked professor outreach across all countries and disciplines.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25 hover:scale-[1.02] transition-all"
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
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
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
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
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
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
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
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
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
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
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
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
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
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Funding Requirement</label>
              <select
                value={fundingPref}
                onChange={e => setFundingPref(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Fully Funded (RA/TA)">Fully Funded (Research Assistantship / Teaching Assistantship)</option>
                <option value="Fellowship / Scholarship">External Fellowship / Government Scholarship</option>
                <option value="Self / Partial">Self-Funded or Partial</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Academic Bio &amp; Statement of Purpose Summary</label>
              <textarea
                rows={3}
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Current Academic History */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
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
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Degree &amp; Major</label>
              <input
                type="text"
                value={major}
                onChange={e => setMajor(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Cumulative GPA</label>
              <input
                type="text"
                value={cgpa}
                onChange={e => setCgpa(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Expected Graduation Year</label>
              <input
                type="number"
                value={gradYear}
                onChange={e => setGradYear(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Research Focus & Thesis */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Research Focus &amp; Scholarly Keywords</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Research Keywords / Specific Topics</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {interests.map(item => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => handleRemoveInterest(item)}
                      className="text-slate-400 hover:text-rose-400 transition-colors"
                      title="Remove keyword"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div ref={keywordContainerRef} className="relative flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={e => {
                      setNewInterest(e.target.value);
                      setIsSuggestionOpen(true);
                    }}
                    onFocus={() => setIsSuggestionOpen(true)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddInterest();
                      } else if (e.key === 'Escape') {
                        setIsSuggestionOpen(false);
                      }
                    }}
                    placeholder="e.g. Sustainable Cities, CRISPR Assays, Applied Econometrics"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />

                  {/* Autocomplete Suggestion Dropdown */}
                  {isSuggestionOpen && matchingSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-800">
                      <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-950 flex items-center justify-between sticky top-0 z-10 border-b border-slate-800">
                        <span>Suggested Research Keywords</span>
                        <span className="text-emerald-400 font-bold">{matchingSuggestions.length} Available</span>
                      </div>
                      {matchingSuggestions.map(item => (
                        <button
                          key={item}
                          type="button"
                          onMouseDown={e => {
                            e.preventDefault();
                            handleAddInterest(item);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-emerald-500/15 hover:text-emerald-300 transition-colors flex items-center justify-between"
                        >
                          <span>{item}</span>
                          <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  id="btn-add-keyword"
                  onClick={e => {
                    e.preventDefault();
                    handleAddInterest();
                  }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-all ${
                    newInterest.trim()
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" /> Add Keyword
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Thesis / Capstone / Major Project Title</label>
              <input
                type="text"
                value={thesisTitle}
                onChange={e => setThesisTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Thesis Abstract &amp; Analytical Methodology</label>
              <textarea
                rows={3}
                value={thesisAbstract}
                onChange={e => setThesisAbstract(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Academic Documents */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold text-white">Attached Academic Curriculum Vitae (AI Auto-Parser)</h2>
            </div>
            <label
              htmlFor="cv-file-upload-input"
              className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Upload className="w-3.5 h-3.5" /> Upload &amp; AI Parse CV
            </label>
          </div>

          {cvParsedNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{cvParsedNotice}</span>
            </div>
          )}

          <input
            id="cv-file-upload-input"
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleCvFileUpload}
            className="hidden"
          />

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{cvFile.file_name}</p>
                <p className="text-[11px] text-slate-400">
                  {Math.round(cvFile.file_size / 1024)} KB &bull; Uploaded {new Date(cvFile.uploaded_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                Active CV
              </span>
              <label
                htmlFor="cv-file-upload-input"
                className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Upload New File"
              >
                <Upload className="w-4 h-4" />
              </label>
            </div>
          </div>

          {/* Interactive Drag & Drop Upload Zone (Always Available) */}
          <label
            htmlFor="cv-file-upload-input"
            className="block border-2 border-dashed border-slate-800 hover:border-purple-500/50 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-950/40 space-y-1.5"
          >
            <Upload className="w-6 h-6 text-purple-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-200">Click to upload or drag &amp; drop your updated CV (PDF, DOCX)</p>
            <p className="text-[10px] text-slate-500">Max file size 15MB &bull; Native upload supported on mobile, laptop &amp; PC</p>
          </label>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25 hover:scale-[1.02] transition-all"
          >
            <Save className="w-4 h-4" /> Save All Profile Changes
          </button>
        </div>
      </form>
    </div>
  );
}
