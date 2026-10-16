'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { mockDb } from '@/lib/supabase/mock-db';
import { useAuth } from '@/lib/auth/auth-context';
import { User, Globe, Save, CheckCircle2 } from 'lucide-react';
import {
  getAllCountries,
  getRegionsForCountry,
  getCountryByNameOrCode,
} from '@/lib/geography/global-geography';
import { ACADEMIC_DOMAINS } from '@/lib/taxonomy/academic-taxonomy';
import {
  compressAndSaveAvatar,
  getSavedAvatar,
  removeSavedAvatar,
} from '@/lib/utils/avatar';

import { AvatarSection } from '@/components/profile/avatar-section';
import { TargetDestinationSection } from '@/components/profile/target-destination-section';
import { AcademicHistorySection } from '@/components/profile/academic-history-section';
import { ResearchFocusSection } from '@/components/profile/research-focus-section';
import { AcademicCvSection } from '@/components/profile/academic-cv-section';

const KEYWORD_SUGGESTIONS = Array.from(
  new Set([
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
    'Constitutional Law & Public Governance',
  ])
);

export default function ProfilePage() {
  const { user, setAuthenticatedUser } = useAuth();
  const student = mockDb.studentProfiles[0];
  const academic = mockDb.academicProfiles[0];
  const research = mockDb.researchProfiles[0];
  const cvDoc = mockDb.studentDocuments[0];

  const countries = useMemo(() => getAllCountries(), []);

  const [saved, setSaved] = useState(false);
  const [fullName, setFullName] = useState(() => {
    if (typeof window !== 'undefined') {
      const userKey = user ? user.id : 'guest';
      const storedName = localStorage.getItem(`profmatch_user_name_${userKey}`);
      if (storedName) return storedName;
      const storedProfile = localStorage.getItem(`profmatch_user_profile_${userKey}`);
      if (storedProfile) {
        try {
          const p = JSON.parse(storedProfile);
          if (p.fullName) return p.fullName;
        } catch {}
      }
    }
    return user?.full_name || '';
  });
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
  const [gradYear, setGradYear] = useState(academic.graduation_year || 2026);

  const [thesisTitle, setThesisTitle] = useState('');
  const [thesisAbstract, setThesisAbstract] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);

  // Active CV state (null by default for new users)
  const [cvFile, setCvFile] = useState<{
    file_name: string;
    file_size: number;
    uploaded_at: string;
  } | null>(null);
  const [isParsingCv, setIsParsingCv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const keywordContainerRef = useRef<HTMLDivElement>(null);
  const profileAvatarInputRef = useRef<HTMLInputElement>(null);

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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

    // Load interests - strictly start at 0 for new accounts
    try {
      const storedInterests = localStorage.getItem(interestsKey);
      if (storedInterests !== null) {
        const parsed = JSON.parse(storedInterests);
        // If it was the legacy mock list from previous versions, clear down to 0
        const isLegacyMock = Array.isArray(parsed) && (
          (parsed.length === 8 && parsed.includes('Applied Machine Learning') && parsed.includes('Data Science & Big Data Engineering')) ||
          (parsed.length === 3 && parsed.includes('Large Language Models') && parsed.includes('Factuality')) ||
          (parsed.length === 5 && parsed.includes('Faithful Reasoning & Hallucination Mitigation'))
        );
        if (isLegacyMock) {
          setInterests([]);
          localStorage.setItem(interestsKey, JSON.stringify([]));
        } else if (Array.isArray(parsed)) {
          setInterests(parsed);
        } else {
          setInterests([]);
        }
      } else {
        // Brand new account: start at 0 keywords
        setInterests([]);
      }
    } catch {
      setInterests([]);
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
        if (p.fullName) setFullName(p.fullName);
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
        if (p.thesisTitle) {
          if (p.thesisTitle === 'Mitigating Factual Hallucinations in Multi-Hop RAG Systems' && !localStorage.getItem(cvKey)) {
            setThesisTitle('');
          } else {
            setThesisTitle(p.thesisTitle);
          }
        }
        if (p.thesisAbstract) {
          if (p.thesisAbstract.includes('Investigated constraint-guided beam search') && !localStorage.getItem(cvKey)) {
            setThesisAbstract('');
          } else {
            setThesisAbstract(p.thesisAbstract);
          }
        }
      }
    } catch {}

    // Load stored name if not dirty
    const storedName = localStorage.getItem(`profmatch_user_name_${userKey}`);
    if (storedName) {
      setFullName(storedName);
    } else if (user?.full_name) {
      setFullName(user.full_name);
    }

    // Load Avatar
    const savedAvatar = getSavedAvatar(userKey);
    setAvatarUrl(savedAvatar);

    const handleAvatarUpdate = (e: any) => {
      if (e?.detail) {
        setAvatarUrl(e.detail);
      } else {
        setAvatarUrl(getSavedAvatar(user ? user.id : 'guest'));
      }
    };

    window.addEventListener('profmatch_avatar_updated', handleAvatarUpdate);
    window.addEventListener('storage', handleAvatarUpdate);
    return () => {
      window.removeEventListener('profmatch_avatar_updated', handleAvatarUpdate);
      window.removeEventListener('storage', handleAvatarUpdate);
    };
  }, [user, research.research_interests]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const dataUrl = await compressAndSaveAvatar(file, user ? user.id : 'guest');
      setAvatarUrl(dataUrl);
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      alert('Failed to process image. Please try another image file.');
    } finally {
      setIsUploadingAvatar(false);
      if (profileAvatarInputRef.current) {
        profileAvatarInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = () => {
    removeSavedAvatar(user ? user.id : 'guest');
    setAvatarUrl(null);
  };

  const selectedCountryObj = getCountryByNameOrCode(targetCountry);
  const availableRegions = selectedCountryObj ? getRegionsForCountry(selectedCountryObj.name) : [];

  // Filter autocomplete suggestions based on query
  const matchingSuggestions = useMemo(() => {
    const allDomainDisciplines = ACADEMIC_DOMAINS.flatMap((d) => d.disciplines);
    const combinedList = Array.from(new Set([...KEYWORD_SUGGESTIONS, ...allDomainDisciplines]));

    if (!newInterest.trim()) {
      return combinedList.filter((s) => !interests.includes(s));
    }

    const rawQ = newInterest.toLowerCase().trim();
    const tokens = rawQ.split(/\s+/).filter(Boolean);

    return combinedList.filter((item) => {
      if (interests.includes(item)) return false;
      const lowerItem = item.toLowerCase();

      if (lowerItem.includes(rawQ)) return true;
      if (tokens.includes('ai') && (lowerItem.includes('artificial intelligence') || lowerItem.includes('ai'))) return true;
      if (tokens.includes('ml') && (lowerItem.includes('machine learning') || lowerItem.includes('ml'))) return true;
      if (tokens.includes('nlp') && (lowerItem.includes('natural language processing') || lowerItem.includes('nlp'))) return true;

      return tokens.every((token) => lowerItem.includes(token)) || tokens.some((token) => lowerItem.includes(token));
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

    const candidates = raw.includes(',')
      ? raw.split(',').map((s) => s.trim()).filter(Boolean)
      : [raw];

    const toAdd: string[] = [];
    candidates.forEach((c) => {
      const alreadyExists = interests.some((i) => i.toLowerCase() === c.toLowerCase());
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
    const updated = interests.filter((i) => i !== item);
    setInterests(updated);
    saveInterestsToStorage(updated);
  };

  const handleClearAllInterests = () => {
    setInterests([]);
    saveInterestsToStorage([]);
  };

  const [cvParsedNotice, setCvParsedNotice] = useState<string | null>(null);

  const handleCvFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingCv(true);
    setCvParsedNotice('🤖 Reading and analyzing CV text via AI engine...');

    const newCv = {
      file_name: file.name,
      file_size: file.size,
      uploaded_at: new Date().toISOString(),
    };
    setCvFile(newCv);
    const userKey = user ? user.id : 'guest';
    if (typeof window !== 'undefined') {
      localStorage.setItem(`profmatch_user_cv_${userKey}`, JSON.stringify(newCv));
    }
    mockDb.studentDocuments[0].file_name = file.name;
    mockDb.studentDocuments[0].file_size = file.size;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/profile/parse-cv', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Parse server returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.parsed) {
        const p = data.parsed;

        // 1. Research Keywords extracted directly from CV text
        if (Array.isArray(p.keywords) && p.keywords.length > 0) {
          setInterests(p.keywords);
          saveInterestsToStorage(p.keywords);
        }

        // 2. Degrees & Major
        if (p.targetDegree) setTargetDegree(p.targetDegree);
        if (p.currentDegree) setCurrentDegree(p.currentDegree);
        if (p.major) setMajor(p.major);
        if (p.academicDomain) setAcademicDomain(p.academicDomain);
        if (p.desiredField) setDesiredField(p.desiredField);

        // 3. University & Metrics
        if (p.university) setUniversity(p.university);
        if (p.cgpa) setCgpa(p.cgpa);
        if (p.gradYear) setGradYear(p.gradYear);

        // 4. Thesis / Project
        if (p.thesisTitle) setThesisTitle(p.thesisTitle);
        if (p.thesisAbstract) setThesisAbstract(p.thesisAbstract);

        // 5. Bio
        if (p.bio) setBio(p.bio);

        // Save updated full profile
        if (typeof window !== 'undefined') {
          const updatedProfile = {
            targetDegree: p.targetDegree || targetDegree,
            targetCountry,
            targetRegion,
            academicDomain: p.academicDomain || academicDomain,
            desiredField: p.desiredField || desiredField,
            fundingPref,
            bio: p.bio || bio,
            cgpa: p.cgpa || cgpa,
            currentDegree: p.currentDegree || currentDegree,
            major: p.major || major,
            university: p.university || university,
            gradYear: p.gradYear || gradYear,
            thesisTitle: p.thesisTitle || thesisTitle,
            thesisAbstract: p.thesisAbstract || thesisAbstract,
          };
          localStorage.setItem(`profmatch_user_profile_${userKey}`, JSON.stringify(updatedProfile));
        }

        setCvParsedNotice(
          `✨ AI Resume Parser Success! Auto-extracted ${p.keywords?.length || 0} genuine research keywords, degree credentials & thesis from "${file.name}".`
        );
      } else {
        throw new Error('No parsed data returned');
      }
    } catch (err: any) {
      console.warn('[CV AUTO PARSE WARNING]', err);
      // Clean fallback
      setCvParsedNotice(`✨ Academic CV "${file.name}" uploaded successfully.`);
    } finally {
      setIsParsingCv(false);
      setTimeout(() => setCvParsedNotice(null), 8000);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
    academic.graduation_year = Number(gradYear) || 2026;

    research.thesis_title = thesisTitle;
    research.thesis_abstract = thesisAbstract;
    research.research_interests = interests;
    research.academic_domain = academicDomain;
    research.primary_discipline = desiredField;

    const trimmedName = fullName.trim();
    if (typeof window !== 'undefined') {
      const userKey = user ? user.id : 'guest';
      const fullProfile = {
        fullName: trimmedName,
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
      if (trimmedName) {
        localStorage.setItem(`profmatch_user_name_${userKey}`, trimmedName);
      }
    }

    if (user && trimmedName) {
      setAuthenticatedUser({
        ...user,
        full_name: trimmedName,
      });

      // Sync name to server & database
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fullName: trimmedName,
        }),
      }).catch(() => {});
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('profmatch_user_name_updated', { detail: trimmedName }));
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
        {/* Section 0: Researcher Profile Photo & Identity */}
        <AvatarSection
          avatarUrl={avatarUrl}
          userName={user?.full_name}
          fullName={fullName}
          onFullNameChange={setFullName}
          isUploadingAvatar={isUploadingAvatar}
          onAvatarUpload={handleAvatarUpload}
          onRemoveAvatar={handleRemoveAvatar}
          profileAvatarInputRef={profileAvatarInputRef}
        />

        {/* Section 1: Target Degree & Admissions Preferences */}
        <TargetDestinationSection
          targetDegree={targetDegree}
          setTargetDegree={setTargetDegree}
          targetCountry={targetCountry}
          setTargetCountry={setTargetCountry}
          targetRegion={targetRegion}
          setTargetRegion={setTargetRegion}
          academicDomain={academicDomain}
          setAcademicDomain={setAcademicDomain}
          desiredField={desiredField}
          setDesiredField={setDesiredField}
          fundingPref={fundingPref}
          setFundingPref={setFundingPref}
          bio={bio}
          setBio={setBio}
          countries={countries}
          selectedCountryObj={selectedCountryObj}
          availableRegions={availableRegions}
        />

        {/* Section 2: Current Academic History */}
        <AcademicHistorySection
          university={university}
          setUniversity={setUniversity}
          major={major}
          setMajor={setMajor}
          cgpa={cgpa}
          setCgpa={setCgpa}
          gradYear={Number(gradYear)}
          setGradYear={setGradYear}
        />

        {/* Section 3: Research Focus & Thesis */}
        <ResearchFocusSection
          interests={interests}
          newInterest={newInterest}
          setNewInterest={setNewInterest}
          matchingSuggestions={matchingSuggestions}
          isSuggestionOpen={isSuggestionOpen}
          setIsSuggestionOpen={setIsSuggestionOpen}
          handleAddInterest={handleAddInterest}
          handleRemoveInterest={handleRemoveInterest}
          handleClearAllInterests={handleClearAllInterests}
          keywordContainerRef={keywordContainerRef}
          thesisTitle={thesisTitle}
          setThesisTitle={setThesisTitle}
          thesisAbstract={thesisAbstract}
          setThesisAbstract={setThesisAbstract}
        />

        {/* Section 4: Academic Documents */}
        <AcademicCvSection
          cvFile={cvFile}
          cvParsedNotice={cvParsedNotice}
          isParsingCv={isParsingCv}
          fileInputRef={fileInputRef}
          onCvFileUpload={handleCvFileUpload}
        />

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
