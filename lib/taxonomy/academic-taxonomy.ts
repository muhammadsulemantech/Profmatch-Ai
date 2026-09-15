// ==========================================================
// PROFMATCH AI — UNIVERSAL ACADEMIC TAXONOMY & INTENT PARSER
// ==========================================================

import { parseLocationFromText } from '@/lib/geography/global-geography';

export interface AcademicDomainDef {
  id: string;
  name: string;
  disciplines: string[];
  sampleDepartments: string[];
  researchMethodologies: string[];
}

export const ACADEMIC_DOMAINS: AcademicDomainDef[] = [
  {
    id: 'computing',
    name: 'Computing, Artificial Intelligence & Informatics',
    disciplines: [
      'Computer Science',
      'Artificial Intelligence',
      'Machine Learning',
      'Data Science',
      'Software Engineering',
      'Human-Computer Interaction',
      'Cybersecurity & Privacy',
      'Robotics & Autonomous Systems',
      'Computer Vision',
      'Natural Language Processing',
      'Information Systems',
      'Distributed Systems & Cloud',
      'Computational Neuroscience',
      'Bioinformatics & Computational Biology',
      'Quantum Computing',
    ],
    sampleDepartments: ['Department of Computer Science', 'School of Computing & Informatics', 'Institute of Artificial Intelligence', 'Department of Software Engineering'],
    researchMethodologies: ['Algorithmic formulation', 'Empirical benchmarking', 'Deep learning architectures', 'Formal verification', 'Software prototyping'],
  },
  {
    id: 'engineering',
    name: 'Engineering & Applied Physical Sciences',
    disciplines: [
      'Electrical & Electronic Engineering',
      'Mechanical Engineering',
      'Civil & Structural Engineering',
      'Chemical Engineering',
      'Biomedical Engineering',
      'Aerospace Engineering',
      'Materials Science & Engineering',
      'Industrial & Systems Engineering',
      'Environmental Engineering',
      'Petroleum & Energy Engineering',
      'Mechatronics & Control Systems',
      'Automotive Engineering',
      'Nuclear Engineering',
      'Semiconductor & Microelectronics Engineering',
    ],
    sampleDepartments: ['Department of Electrical Engineering', 'Department of Mechanical Engineering', 'School of Biomedical Engineering', 'Department of Civil Engineering'],
    researchMethodologies: ['Finite element analysis (FEA)', 'Hardware prototyping', 'Signals processing', 'Thermodynamic modeling', 'Materials characterization'],
  },
  {
    id: 'physical_sciences',
    name: 'Physical, Earth & Mathematical Sciences',
    disciplines: [
      'Mathematics (Pure & Applied)',
      'Statistics & Probability',
      'Physics (Theoretical & Experimental)',
      'Applied Physics',
      'Chemistry (Organic, Inorganic, Physical)',
      'Earth & Planetary Sciences',
      'Geology & Geophysics',
      'Atmospheric & Climate Science',
      'Oceanography & Marine Sciences',
      'Astronomy & Astrophysics',
      'Optics & Photonics',
    ],
    sampleDepartments: ['Department of Physics', 'Department of Chemistry', 'Department of Mathematics', 'Department of Earth & Planetary Sciences'],
    researchMethodologies: ['Spectroscopy', 'Mathematical proofs', 'Numerical simulations', 'Observational astrophysics', 'Crystallography'],
  },
  {
    id: 'life_sciences',
    name: 'Biological, Biomedical & Life Sciences',
    disciplines: [
      'Molecular & Cellular Biology',
      'Biotechnology & Genetic Engineering',
      'Biochemistry & Biophysics',
      'Microbiology & Immunology',
      'Genetics & Genomics',
      'Neuroscience',
      'Ecology & Evolutionary Biology',
      'Plant Biology & Botany',
      'Zoology & Animal Physiology',
      'Marine Biology',
      'Developmental Biology',
    ],
    sampleDepartments: ['Department of Molecular Biology', 'Institute of Biotechnology', 'Department of Immunology', 'School of Biological Sciences'],
    researchMethodologies: ['CRISPR gene editing', 'Western blot & qPCR', 'Cell culture assays', 'Flow cytometry', 'Fluorescence microscopy'],
  },
  {
    id: 'medicine',
    name: 'Clinical Medicine, Public Health & Nursing',
    disciplines: [
      'Medicine & Clinical Sciences',
      'Public Health & Global Health',
      'Epidemiology & Biostatistics',
      'Pharmacy & Pharmaceutical Sciences',
      'Nursing & Patient Care',
      'Dentistry & Oral Health',
      'Health Informatics & Digital Health',
      'Nutrition & Metabolic Health',
      'Physiotherapy & Rehabilitation',
      'Oncology & Cancer Research',
      'Healthcare Management & Health Policy',
    ],
    sampleDepartments: ['Faculty of Medicine', 'School of Public Health', 'Department of Epidemiology', 'College of Pharmacy'],
    researchMethodologies: ['Randomized controlled trials (RCT)', 'Cohort studies', 'Meta-analyses', 'Epidemiological surveillance', 'Biomarker assays'],
  },
  {
    id: 'social_sciences',
    name: 'Social, Behavioral & Policy Sciences',
    disciplines: [
      'Psychology (Cognitive, Clinical, Social)',
      'Sociology',
      'Political Science & Government',
      'International Relations & Diplomacy',
      'Anthropology',
      'Criminology & Criminal Justice',
      'Public Policy & Administration',
      'Economics & Econometrics',
      'Human Geography',
      'Communication & Media Studies',
      'Education & Learning Sciences',
      'Development Studies',
    ],
    sampleDepartments: ['Department of Psychology', 'Department of Political Science', 'School of Public Policy', 'Department of Sociology'],
    researchMethodologies: ['Psychometric testing', 'Qualitative interviews & ethnography', 'Econometric modeling', 'Survey design', 'Discourse analysis'],
  },
  {
    id: 'business',
    name: 'Business, Management & Economics',
    disciplines: [
      'Business Administration',
      'Finance & Banking',
      'Accounting',
      'Marketing & Consumer Behavior',
      'Management & Organizational Behavior',
      'Supply Chain & Operations Management',
      'Entrepreneurship & Innovation',
      'Business Analytics & Decision Science',
      'International Business',
      'Strategic Management',
      'Fintech & Digital Economy',
    ],
    sampleDepartments: ['School of Business', 'Department of Finance', 'Department of Management', 'Department of Marketing'],
    researchMethodologies: ['Case study methodology', 'Empirical regression modeling', 'Field experiments', 'Panel data econometrics', 'Market simulation'],
  },
  {
    id: 'law',
    name: 'Law, Legal Studies & Human Rights',
    disciplines: [
      'Law & Jurisprudence',
      'International Law',
      'Corporate & Commercial Law',
      'Constitutional Law',
      'Criminal Law',
      'Human Rights Law',
      'Intellectual Property & Tech Law',
      'Environmental Law & Climate Policy',
      'Comparative Law',
      'Cyber Law & Data Governance',
    ],
    sampleDepartments: ['Faculty of Law', 'School of Legal Studies', 'Center for Human Rights Law', 'Institute of Technology Law'],
    researchMethodologies: ['Statutory interpretation', 'Case precedent analysis', 'Comparative legal critique', 'Doctrinal research', 'Legislative drafting analysis'],
  },
  {
    id: 'architecture',
    name: 'Architecture, Urban Planning & Design',
    disciplines: [
      'Architecture',
      'Urban Planning & Design',
      'Sustainable Urban Development',
      'Landscape Architecture',
      'Interior Architecture',
      'Industrial & Product Design',
      'Interaction & Service Design',
      'Spatial Analysis & GIS',
      'Building Science & Architectural Technology',
    ],
    sampleDepartments: ['School of Architecture', 'Department of Urban Planning', 'Faculty of Built Environment', 'Institute of Spatial Design'],
    researchMethodologies: ['Design studio critique', 'Spatial GIS mapping', 'Parametric 3D modeling', 'Post-occupancy evaluation', 'Lifecycle building simulation'],
  },
  {
    id: 'humanities',
    name: 'Humanities, Languages & Cultural Studies',
    disciplines: [
      'History',
      'Philosophy & Ethics',
      'English & Comparative Literature',
      'Linguistics & Applied Languages',
      'Cultural Studies',
      'Religious Studies & Theology',
      'Classics & Ancient Civilizations',
      'Area Studies (Asian, Middle Eastern, European, African)',
      'Digital Humanities',
      'Art History & Visual Culture',
    ],
    sampleDepartments: ['Department of History', 'Department of Philosophy', 'Faculty of Arts & Humanities', 'Department of Linguistics'],
    researchMethodologies: ['Archival manuscript research', 'Hermeneutic text analysis', 'Historical contextualization', 'Corpus linguistics', 'Philosophical argument critique'],
  },
  {
    id: 'agriculture',
    name: 'Agricultural, Food & Environmental Sciences',
    disciplines: [
      'Agriculture & Agronomy',
      'Horticulture & Plant Sciences',
      'Soil Science & Land Management',
      'Food Science & Technology',
      'Animal Science & Veterinary Medicine',
      'Forestry & Natural Resources',
      'Agricultural Economics & Agribusiness',
      'Renewable Energy & Biofuels',
      'Sustainable Agriculture & Agroecology',
      'Water Resources & Irrigation Management',
    ],
    sampleDepartments: ['Faculty of Agriculture', 'Department of Food Science', 'Department of Agronomy', 'College of Natural Resources'],
    researchMethodologies: ['Field crop trials', 'Soil chemical composition assays', 'Nutritional spectrometry', 'Remote sensing of vegetation', 'Farm management modeling'],
  },
];

// Flat lookup cache
const DISCIPLINE_TO_DOMAIN_MAP = new Map<string, AcademicDomainDef>();
ACADEMIC_DOMAINS.forEach(domain => {
  domain.disciplines.forEach(disc => {
    DISCIPLINE_TO_DOMAIN_MAP.set(disc.toLowerCase(), domain);
  });
});

export interface FieldAnalysisResult {
  domain: string;
  discipline: string;
  isCustomField: boolean;
  relatedDisciplines: string[];
  targetAcademicUnits: string[];
  expansionKeywords: string[];
  interdisciplinaryMatchPossibilities: string[];
}

/**
 * Dynamic Unknown Field Analyzer
 * Capable of breaking down novel/unlisted fields like "Computational Sustainability",
 * "Marine Biotechnology", "Renewable Energy Policy", "Neuroethics"
 */
export function analyzeAcademicField(input: string): FieldAnalysisResult {
  if (!input || input.trim() === '') {
    return {
      domain: 'Computing, Artificial Intelligence & Informatics',
      discipline: 'Computer Science',
      isCustomField: false,
      relatedDisciplines: ['Artificial Intelligence', 'Data Science'],
      targetAcademicUnits: ['Department of Computer Science'],
      expansionKeywords: ['Algorithms', 'Software Systems'],
      interdisciplinaryMatchPossibilities: ['Engineering', 'Mathematics'],
    };
  }

  const clean = input.trim();
  const lower = clean.toLowerCase();

  // 1. Check exact or direct match in known taxonomy
  for (const domain of ACADEMIC_DOMAINS) {
    for (const d of domain.disciplines) {
      if (d.toLowerCase() === lower || lower.includes(d.toLowerCase()) || d.toLowerCase().includes(lower)) {
        return {
          domain: domain.name,
          discipline: d,
          isCustomField: false,
          relatedDisciplines: domain.disciplines.filter(other => other !== d).slice(0, 4),
          targetAcademicUnits: domain.sampleDepartments,
          expansionKeywords: [d, ...domain.researchMethodologies.slice(0, 3)],
          interdisciplinaryMatchPossibilities: domain.disciplines.slice(0, 3),
        };
      }
    }
  }

  // 2. Dynamic Novel Field Decomposition & Semantic Induction
  const keywords: string[] = [clean];
  const relatedUnits: string[] = [];
  const relatedDisciplines: string[] = [];
  const matchedDomains: AcademicDomainDef[] = [];

  // Semantic heuristic checks
  if (lower.includes('sustain') || lower.includes('climate') || lower.includes('energy') || lower.includes('environment')) {
    const env = ACADEMIC_DOMAINS.find(d => d.id === 'agriculture')!;
    const eng = ACADEMIC_DOMAINS.find(d => d.id === 'engineering')!;
    matchedDomains.push(env, eng);
    relatedDisciplines.push('Environmental Engineering', 'Sustainable Urban Development', 'Renewable Energy & Biofuels');
    relatedUnits.push('Institute of Sustainable Energy', 'Department of Environmental Engineering', 'Center for Climate Solutions');
    keywords.push('Renewable Energy', 'Decarbonization', 'Lifecycle Assessment', 'Green Technologies');
  }

  if (lower.includes('comput') || lower.includes('ai') || lower.includes('data') || lower.includes('digital') || lower.includes('algorithm')) {
    const cs = ACADEMIC_DOMAINS.find(d => d.id === 'computing')!;
    matchedDomains.push(cs);
    relatedDisciplines.push('Computer Science', 'Artificial Intelligence', 'Data Science');
    relatedUnits.push('Department of Computer Science', 'Institute for Informatics & Computing');
    keywords.push('Machine Learning', 'Computational Modeling', 'Algorithmic Optimization');
  }

  if (lower.includes('bio') || lower.includes('gene') || lower.includes('health') || lower.includes('medical') || lower.includes('neuro')) {
    const bio = ACADEMIC_DOMAINS.find(d => d.id === 'life_sciences')!;
    const med = ACADEMIC_DOMAINS.find(d => d.id === 'medicine')!;
    matchedDomains.push(bio, med);
    relatedDisciplines.push('Biotechnology & Genetic Engineering', 'Biomedical Engineering', 'Health Informatics');
    relatedUnits.push('School of Medicine', 'Institute of Biotechnology', 'Department of Biomedical Engineering');
    keywords.push('Molecular Mechanisms', 'Assay Technologies', 'Translational Medicine');
  }

  if (lower.includes('urban') || lower.includes('city') || lower.includes('spatial') || lower.includes('transport')) {
    const arch = ACADEMIC_DOMAINS.find(d => d.id === 'architecture')!;
    matchedDomains.push(arch);
    relatedDisciplines.push('Urban Planning & Design', 'Sustainable Urban Development', 'Civil & Structural Engineering');
    relatedUnits.push('School of Architecture & Urban Planning', 'Center for Urban Studies');
    keywords.push('Smart Cities', 'Urban Infrastructure', 'Spatial GIS Analysis');
  }

  if (lower.includes('policy') || lower.includes('econom') || lower.includes('govern') || lower.includes('manage') || lower.includes('business')) {
    const biz = ACADEMIC_DOMAINS.find(d => d.id === 'business')!;
    const soc = ACADEMIC_DOMAINS.find(d => d.id === 'social_sciences')!;
    matchedDomains.push(biz, soc);
    relatedDisciplines.push('Public Policy & Administration', 'Economics & Econometrics', 'Strategic Management');
    relatedUnits.push('School of Public Policy', 'Department of Economics', 'Faculty of Management');
    keywords.push('Policy Evaluation', 'Empirical Econometrics', 'Governance Frameworks');
  }

  // Primary domain selection
  const primaryDomain = matchedDomains[0]?.name || 'Interdisciplinary & Emerging Academic Studies';

  return {
    domain: primaryDomain,
    discipline: clean,
    isCustomField: true,
    relatedDisciplines: Array.from(new Set(relatedDisciplines)).slice(0, 5),
    targetAcademicUnits: relatedUnits.length > 0 ? Array.from(new Set(relatedUnits)) : ['Interdisciplinary Research Institute', 'Faculty of Advanced Studies'],
    expansionKeywords: Array.from(new Set(keywords)),
    interdisciplinaryMatchPossibilities: Array.from(new Set(relatedDisciplines)).slice(0, 4),
  };
}

export interface ParsedNLQuery {
  country?: string;
  region?: string;
  field?: string;
  domain?: string;
  targetDegree?: string;
  recruitingOnly: boolean;
  interdisciplinary: boolean;
  cleanKeywords: string[];
}

/**
 * Global Natural Language Query Parser
 * Understands: "I want professors in Sweden working on sustainable cities"
 * "Biotechnology researchers in Pakistan"
 * "Robotics faculty in Japan recruiting PhD students"
 */
export function parseNaturalLanguageQuery(query: string): ParsedNLQuery {
  if (!query || query.trim() === '') {
    return {
      recruitingOnly: false,
      interdisciplinary: false,
      cleanKeywords: [],
    };
  }

  const lower = query.toLowerCase();

  // 1. Geographic extraction
  const geo = parseLocationFromText(query);

  // 2. Degree level extraction
  let targetDegree: string | undefined;
  if (lower.includes('phd') || lower.includes('ph.d') || lower.includes('doctorate')) targetDegree = 'PhD';
  else if (lower.includes('ms') || lower.includes('m.s') || lower.includes('master') || lower.includes('msc')) targetDegree = 'MS';
  else if (lower.includes('postdoc') || lower.includes('fellow')) targetDegree = 'Postdoc';
  else if (lower.includes('bachelor') || lower.includes('undergrad')) targetDegree = 'BS';

  // 3. Recruitment intent
  const recruitingOnly = lower.includes('recruit') || lower.includes('taking student') || lower.includes('open position') || lower.includes('hiring') || lower.includes('fall 202');

  // 4. Interdisciplinary intent
  const interdisciplinary = lower.includes('interdisciplinary') || lower.includes('cross-department') || lower.includes('+') || lower.includes('and') || lower.includes('in');

  // 5. Academic Field & Subject identification
  let detectedField: string | undefined;

  // Check known fields
  for (const domain of ACADEMIC_DOMAINS) {
    for (const d of domain.disciplines) {
      if (lower.includes(d.toLowerCase())) {
        detectedField = d;
        break;
      }
    }
    if (detectedField) break;
  }

  // Handle common natural language topics if no exact discipline matched
  if (!detectedField) {
    if (lower.includes('sustainable cit') || lower.includes('smart cit') || lower.includes('urban plan')) detectedField = 'Sustainable Urban Development';
    else if (lower.includes('renewable energy') || lower.includes('clean energy')) detectedField = 'Renewable Energy & Biofuels';
    else if (lower.includes('ai') || lower.includes('artificial intelligence')) detectedField = 'Artificial Intelligence';
    else if (lower.includes('machine learning') || lower.includes('deep learning')) detectedField = 'Machine Learning';
    else if (lower.includes('robot')) detectedField = 'Robotics & Autonomous Systems';
    else if (lower.includes('public health')) detectedField = 'Public Health & Global Health';
    else if (lower.includes('biotech')) detectedField = 'Biotechnology & Genetic Engineering';
    else if (lower.includes('architect')) detectedField = 'Architecture';
    else if (lower.includes('econom')) detectedField = 'Economics & Econometrics';
    else if (lower.includes('psychol')) detectedField = 'Psychology (Cognitive, Clinical, Social)';
    else if (lower.includes('semiconductor') || lower.includes('chip')) detectedField = 'Semiconductor & Microelectronics Engineering';
    else if (lower.includes('business')) detectedField = 'Business Administration';
  }

  // Extract raw clean keywords by removing filler words
  const stopWords = new Set(['i', 'want', 'professors', 'professor', 'faculty', 'researchers', 'researcher', 'in', 'on', 'at', 'for', 'working', 'the', 'a', 'an', 'looking', 'who', 'are', 'is', 'with']);
  const words = lower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
  const cleanKeywords = words.filter(w => w.length > 2 && !stopWords.has(w));

  const fieldAnalysis = detectedField ? analyzeAcademicField(detectedField) : undefined;

  return {
    country: geo.country,
    region: geo.region,
    field: detectedField,
    domain: fieldAnalysis?.domain,
    targetDegree,
    recruitingOnly,
    interdisciplinary,
    cleanKeywords,
  };
}
