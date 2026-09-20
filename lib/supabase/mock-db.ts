import {
  UserProfile,
  StudentProfile,
  AcademicProfile,
  ResearchProfile,
  StudentSkill,
  StudentProject,
  StudentPublication,
  StudentDocument,
  University,
  Department,
  AcademicUnit,
  Professor,
  ProfessorPublication,
  ProfessorSource,
  ResearchMatch,
  Campaign,
  OutreachEmail,
  ReplyRecord,
  ApplicationTrackerItem,
  SiteSettings,
  SiteContentSection,
  FeatureFlag,
  AuditLogItem,
  UsageRecord,
  SubscriptionRecord,
  DiscoveryJob,
  DataQualityMetrics,
  PaymentMethod,
  PaymentMethodType,
  PaymentStatus,
  Order,
  Payment,
  PaymentProof,
  PlanTier,
  ConnectedEmailAccount
} from '@/types/database';

// In-Memory Database Store for Resilient Local, Test & Fallback Execution
class MockDatabase {
  constructor() {
    this.loadFromDisk();
  }

  public persist() {
    this.saveToDisk();
  }

  public loadFromDisk() {
    if (typeof window !== 'undefined') return;
    try {
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(process.cwd(), 'database', 'persistent_store.json');
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, 'utf-8');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.siteSettings) this.siteSettings = parsed.siteSettings;
          if (parsed.siteContent) this.siteContent = parsed.siteContent;
          if (parsed.paymentMethods) this.paymentMethods = parsed.paymentMethods;
          if (parsed.orders) this.orders = parsed.orders;
          if (parsed.payments) this.payments = parsed.payments;
          if (parsed.featureFlags) this.featureFlags = parsed.featureFlags;
          if (parsed.profiles) this.profiles = parsed.profiles;
          if (parsed.auditLogs) this.auditLogs = parsed.auditLogs;
          if (parsed.subscriptions) this.subscriptions = parsed.subscriptions;
          if (parsed.universities) this.universities = parsed.universities;
          if (parsed.professors) this.professors = parsed.professors;
          if (parsed.connectedEmailAccounts) this.connectedEmailAccounts = parsed.connectedEmailAccounts;
        }
      } else {
        this.saveToDisk();
      }
    } catch (err) {
      console.error('[MOCK DB PERSIST LOAD ERROR]', err);
    }
  }

  public saveToDisk() {
    if (typeof window !== 'undefined') return;
    try {
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(process.cwd(), 'database', 'persistent_store.json');
      const dataToSave = {
        siteSettings: this.siteSettings,
        siteContent: this.siteContent,
        paymentMethods: this.paymentMethods,
        orders: this.orders,
        payments: this.payments,
        featureFlags: this.featureFlags,
        profiles: this.profiles,
        auditLogs: this.auditLogs,
        subscriptions: this.subscriptions,
        universities: this.universities,
        professors: this.professors,
        connectedEmailAccounts: this.connectedEmailAccounts,
      };
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(dbPath, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('[MOCK DB PERSIST SAVE ERROR]', err);
    }
  }

  public connectedEmailAccounts: ConnectedEmailAccount[] = [];

  public profiles: UserProfile[] = [
    {
      id: 'usr_admin_001',
      email: 'sulemanmunir6752@gmail.com',
      full_name: 'Suleman Munir (Admin)',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      role: 'ADMIN',
      is_suspended: false,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'usr_student_001',
      email: 'student@example.com',
      full_name: 'Alex Vance',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      role: 'USER',
      is_suspended: false,
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  public studentProfiles: StudentProfile[] = [
    {
      id: 'sp_001',
      user_id: 'usr_student_001',
      country: 'India',
      target_degree: 'PhD',
      target_country: 'USA',
      target_state: 'Texas',
      target_region: 'Texas',
      target_intake: 'Fall 2027',
      funding_preference: 'Fully Funded (RA/TA)',
      desired_field: 'Artificial Intelligence & NLP',
      desired_domain: 'Computing, Artificial Intelligence & Informatics',
      bio: 'Passionate about reliable reasoning in LLMs, hallucination reduction, and neuro-symbolic methods.',
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  public academicProfiles: AcademicProfile[] = [
    {
      id: 'ap_001',
      student_id: 'sp_001',
      current_degree: 'Bachelor of Technology',
      major: 'Computer Science and Engineering',
      university: 'National Institute of Technology',
      graduation_year: 2026,
      cgpa: 3.92,
      grading_scale: '4.0',
      achievements: 'Ranked 1st in Department; ACM ICPC Regional Finalist',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  public researchProfiles: ResearchProfile[] = [
    {
      id: 'rp_001',
      student_id: 'sp_001',
      research_interests: [
        'Natural Language Processing',
        'Large Language Models',
        'Faithful Reasoning & Hallucination Mitigation',
        'Neuro-symbolic AI',
        'Information Extraction'
      ],
      thesis_title: 'Mitigating Factual Hallucinations in Multi-Hop RAG Systems',
      thesis_abstract: 'Investigated constraint-guided beam search and graph-augmented context injection to reduce entity drift in retrieval-augmented generative pipelines.',
      experience_summary: '2 years of undergraduate research in NLP Lab with 1 ACL Workshop publication and open-source PyTorch implementations.',
      academic_domain: 'Computing, Artificial Intelligence & Informatics',
      primary_discipline: 'Computer Science',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  public studentSkills: StudentSkill[] = [
    { id: 'sk_1', student_id: 'sp_001', skill_name: 'Python / PyTorch', category: 'Programming & Frameworks', proficiency: 'Expert', created_at: new Date().toISOString() },
    { id: 'sk_2', student_id: 'sp_001', skill_name: 'HuggingFace Transformers', category: 'NLP Tools', proficiency: 'Advanced', created_at: new Date().toISOString() },
    { id: 'sk_3', student_id: 'sp_001', skill_name: 'Knowledge Graph Reasoning', category: 'AI Methods', proficiency: 'Advanced', created_at: new Date().toISOString() },
  ];

  public studentProjects: StudentProject[] = [
    {
      id: 'proj_1',
      student_id: 'sp_001',
      title: 'FactGuard: Grounded LLM Verification Engine',
      description: 'Engineered a multi-agent verification pipeline enforcing knowledge graph constraints during beam search, achieving 23% reduction in factual hallucination.',
      technologies: ['PyTorch', 'Transformers', 'Neo4j', 'FastAPI'],
      link: 'https://github.com/alexvance/factguard',
      role: 'Lead Researcher',
      created_at: new Date().toISOString(),
    },
    {
      id: 'proj_2',
      student_id: 'sp_001',
      title: 'Neuro-Symbolic Constraint Solver for Semantic Parsing',
      description: 'Integrated Z3 SMT solver with sequence-to-sequence models to verify formal logical forms extracted from conversational queries.',
      technologies: ['Python', 'Z3 Solver', 'SpaCy'],
      link: 'https://github.com/alexvance/neuro-symbolic-parser',
      role: 'Co-Author',
      created_at: new Date().toISOString(),
    },
  ];

  public studentPublications: StudentPublication[] = [
    {
      id: 'pub_1',
      student_id: 'sp_001',
      title: 'Attribution Bounds in Retrieval-Augmented Generation for Complex QA',
      journal_conference: 'ACL 2025 Student Research Workshop',
      year: 2025,
      doi: '10.18653/v1/2025.acl-srw.12',
      url: 'https://aclanthology.org/2025.acl-srw.12/',
      abstract: 'Proposes an attribution verification metric bounding factual drift across iterative retrieval hops.',
      created_at: new Date().toISOString(),
    },
  ];

  public studentDocuments: StudentDocument[] = [
    {
      id: 'doc_1',
      student_id: 'sp_001',
      document_type: 'CV',
      file_name: 'Alex_Vance_Academic_CV_2026.pdf',
      file_url: 'https://profmatch-docs.internal/Alex_Vance_Academic_CV_2026.pdf',
      file_size: 142000,
      mime_type: 'application/pdf',
      created_at: new Date().toISOString(),
    },
  ];

  // ----------------------------------------------------------
  // GLOBAL ACCREDITED UNIVERSITIES (Covering Worldwide Continents)
  // ----------------------------------------------------------
  public universities: University[] = [
    // USA
    {
      id: 'uni_1',
      name: 'University of Texas at Austin',
      country: 'United States',
      country_code: 'USA',
      state: 'Texas',
      region: 'Texas',
      region_type: 'State',
      city: 'Austin',
      website_url: 'https://www.utexas.edu',
      domain: 'utexas.edu',
      ranking: 32,
      acceptance_rate: 29.0,
      is_verified: true,
      academic_units_count: 18,
      source_url: 'https://www.utexas.edu/academics',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'uni_2',
      name: 'University of California, Berkeley',
      country: 'United States',
      country_code: 'USA',
      state: 'California',
      region: 'California',
      region_type: 'State',
      city: 'Berkeley',
      website_url: 'https://www.berkeley.edu',
      domain: 'berkeley.edu',
      ranking: 10,
      acceptance_rate: 11.0,
      is_verified: true,
      academic_units_count: 24,
      source_url: 'https://www.berkeley.edu/academics',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // UK
    {
      id: 'uni_uk_1',
      name: 'University of Oxford',
      country: 'United Kingdom',
      country_code: 'GBR',
      region: 'Oxfordshire',
      region_type: 'County',
      city: 'Oxford',
      website_url: 'https://www.ox.ac.uk',
      domain: 'ox.ac.uk',
      ranking: 1,
      acceptance_rate: 14.0,
      is_verified: true,
      academic_units_count: 38,
      source_url: 'https://www.ox.ac.uk/divisions',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // Germany
    {
      id: 'uni_de_1',
      name: 'Technical University of Munich (TUM)',
      country: 'Germany',
      country_code: 'DEU',
      region: 'Bavaria',
      region_type: 'State (Bundesland)',
      city: 'Munich',
      website_url: 'https://www.tum.de',
      domain: 'tum.de',
      ranking: 28,
      acceptance_rate: 22.0,
      is_verified: true,
      academic_units_count: 15,
      source_url: 'https://www.tum.de/en/about-tum/schools-and-departments',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // Japan
    {
      id: 'uni_jp_1',
      name: 'The University of Tokyo',
      country: 'Japan',
      country_code: 'JPN',
      region: 'Tokyo',
      region_type: 'Prefecture',
      city: 'Tokyo',
      website_url: 'https://www.u-tokyo.ac.jp',
      domain: 'u-tokyo.ac.jp',
      ranking: 23,
      acceptance_rate: 34.0,
      is_verified: true,
      academic_units_count: 19,
      source_url: 'https://www.u-tokyo.ac.jp/en/faculties',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // Canada
    {
      id: 'uni_ca_1',
      name: 'University of Toronto',
      country: 'Canada',
      country_code: 'CAN',
      region: 'Ontario',
      region_type: 'Province',
      city: 'Toronto',
      website_url: 'https://www.utoronto.ca',
      domain: 'utoronto.ca',
      ranking: 21,
      acceptance_rate: 43.0,
      is_verified: true,
      academic_units_count: 22,
      source_url: 'https://www.utoronto.ca/academics/programs-directory',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // Australia
    {
      id: 'uni_au_1',
      name: 'University of Melbourne',
      country: 'Australia',
      country_code: 'AUS',
      region: 'Victoria',
      region_type: 'State',
      city: 'Melbourne',
      website_url: 'https://www.unimelb.edu.au',
      domain: 'unimelb.edu.au',
      ranking: 13,
      acceptance_rate: 70.0,
      is_verified: true,
      academic_units_count: 14,
      source_url: 'https://www.unimelb.edu.au/about/faculties',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // Italy
    {
      id: 'uni_it_1',
      name: 'Politecnico di Milano',
      country: 'Italy',
      country_code: 'ITA',
      region: 'Lombardy (Milan)',
      region_type: 'Region',
      city: 'Milan',
      website_url: 'https://www.polimi.it',
      domain: 'polimi.it',
      ranking: 111,
      acceptance_rate: 28.0,
      is_verified: true,
      academic_units_count: 12,
      source_url: 'https://www.polimi.it/en/the-polytechnic/departments',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // Pakistan
    {
      id: 'uni_pk_1',
      name: 'National University of Sciences and Technology (NUST)',
      country: 'Pakistan',
      country_code: 'PAK',
      region: 'Islamabad Capital Territory',
      region_type: 'Federal Territory',
      city: 'Islamabad',
      website_url: 'https://nust.edu.pk',
      domain: 'nust.edu.pk',
      ranking: 353,
      acceptance_rate: 15.0,
      is_verified: true,
      academic_units_count: 16,
      source_url: 'https://nust.edu.pk/academics',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // Brazil
    {
      id: 'uni_br_1',
      name: 'University of São Paulo (USP)',
      country: 'Brazil',
      country_code: 'BRA',
      region: 'São Paulo',
      region_type: 'State',
      city: 'São Paulo',
      website_url: 'https://www.usp.br',
      domain: 'usp.br',
      ranking: 85,
      acceptance_rate: 12.0,
      is_verified: true,
      academic_units_count: 42,
      source_url: 'https://www.usp.br/ensino',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // Sweden
    {
      id: 'uni_se_1',
      name: 'KTH Royal Institute of Technology',
      country: 'Sweden',
      country_code: 'SWE',
      region: 'Stockholm',
      region_type: 'County',
      city: 'Stockholm',
      website_url: 'https://www.kth.se',
      domain: 'kth.se',
      ranking: 73,
      acceptance_rate: 32.0,
      is_verified: true,
      academic_units_count: 11,
      source_url: 'https://www.kth.se/en/om/organisation/skolor',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // South Korea
    {
      id: 'uni_kr_1',
      name: 'KAIST (Korea Advanced Institute of Science and Technology)',
      country: 'South Korea',
      country_code: 'KOR',
      region: 'Daejeon (KAIST)',
      region_type: 'Special City',
      city: 'Daejeon',
      website_url: 'https://www.kaist.ac.kr',
      domain: 'kaist.ac.kr',
      ranking: 56,
      acceptance_rate: 18.0,
      is_verified: true,
      academic_units_count: 15,
      source_url: 'https://www.kaist.ac.kr/en/html/colleges/colleges.html',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // UAE
    {
      id: 'uni_ae_1',
      name: 'Khalifa University',
      country: 'United Arab Emirates',
      country_code: 'ARE',
      region: 'Abu Dhabi',
      region_type: 'Emirate',
      city: 'Abu Dhabi',
      website_url: 'https://www.ku.ac.ae',
      domain: 'ku.ac.ae',
      ranking: 202,
      acceptance_rate: 25.0,
      is_verified: true,
      academic_units_count: 10,
      source_url: 'https://www.ku.ac.ae/academics',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // Nigeria
    {
      id: 'uni_ng_1',
      name: 'University of Ibadan',
      country: 'Nigeria',
      country_code: 'NGA',
      region: 'Oyo (Ibadan)',
      region_type: 'State',
      city: 'Ibadan',
      website_url: 'https://www.ui.edu.ng',
      domain: 'ui.edu.ng',
      ranking: 601,
      acceptance_rate: 20.0,
      is_verified: true,
      academic_units_count: 17,
      source_url: 'https://www.ui.edu.ng/faculties',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // ----------------------------------------------------------
  // ACADEMIC UNITS & DEPARTMENTS HIERARCHY
  // ----------------------------------------------------------
  public academicUnits: AcademicUnit[] = [
    { id: 'unit_1', university_id: 'uni_1', name: 'Department of Computer Science', unit_type: 'Department', discipline: 'Computer Science', domain: 'Computing, Artificial Intelligence & Informatics', website_url: 'https://www.cs.utexas.edu', created_at: new Date().toISOString() },
    { id: 'unit_2', university_id: 'uni_2', name: 'Department of Electrical Engineering and Computer Sciences (EECS)', unit_type: 'Department', discipline: 'Artificial Intelligence', domain: 'Computing, Artificial Intelligence & Informatics', website_url: 'https://eecs.berkeley.edu', created_at: new Date().toISOString() },
    { id: 'unit_uk_1', university_id: 'uni_uk_1', name: 'Saïd Business School', unit_type: 'School', discipline: 'Business Administration', domain: 'Business, Management & Economics', website_url: 'https://www.sbs.ox.ac.uk', created_at: new Date().toISOString() },
    { id: 'unit_de_1', university_id: 'uni_de_1', name: 'TUM School of Engineering and Design & Energy Institute', unit_type: 'Faculty', discipline: 'Renewable Energy & Biofuels', domain: 'Agricultural, Food & Environmental Sciences', website_url: 'https://www.ed.tum.de', created_at: new Date().toISOString() },
    { id: 'unit_jp_1', university_id: 'uni_jp_1', name: 'Department of Mechano-Informatics', unit_type: 'Department', discipline: 'Robotics & Autonomous Systems', domain: 'Computing, Artificial Intelligence & Informatics', website_url: 'https://www.isi.imi.i.u-tokyo.ac.jp', created_at: new Date().toISOString() },
    { id: 'unit_ca_1', university_id: 'uni_ca_1', name: 'Department of Psychology', unit_type: 'Department', discipline: 'Psychology (Cognitive, Clinical, Social)', domain: 'Social, Behavioral & Policy Sciences', website_url: 'https://www.psych.utoronto.ca', created_at: new Date().toISOString() },
    { id: 'unit_au_1', university_id: 'uni_au_1', name: 'Melbourne School of Population and Global Health', unit_type: 'School', discipline: 'Public Health & Global Health', domain: 'Clinical Medicine, Public Health & Nursing', website_url: 'https://mspgh.unimelb.edu.au', created_at: new Date().toISOString() },
    { id: 'unit_it_1', university_id: 'uni_it_1', name: 'Department of Architecture and Urban Studies (DAStU)', unit_type: 'Department', discipline: 'Architecture', domain: 'Architecture, Urban Planning & Design', website_url: 'https://www.dastu.polimi.it', created_at: new Date().toISOString() },
    { id: 'unit_pk_1', university_id: 'uni_pk_1', name: 'Atta-ur-Rahman School of Applied Biosciences (ASAB)', unit_type: 'School', discipline: 'Biotechnology & Genetic Engineering', domain: 'Biological, Biomedical & Life Sciences', website_url: 'https://asab.nust.edu.pk', created_at: new Date().toISOString() },
    { id: 'unit_br_1', university_id: 'uni_br_1', name: 'Department of Economics (FEA-USP)', unit_type: 'Department', discipline: 'Economics & Econometrics', domain: 'Social, Behavioral & Policy Sciences', website_url: 'https://www.fea.usp.br', created_at: new Date().toISOString() },
    { id: 'unit_se_1', university_id: 'uni_se_1', name: 'Department of Sustainable Development, Environmental Science and Engineering (SEED)', unit_type: 'Department', discipline: 'Sustainable Urban Development', domain: 'Architecture, Urban Planning & Design', website_url: 'https://www.kth.se/seed', created_at: new Date().toISOString() },
    { id: 'unit_kr_1', university_id: 'uni_kr_1', name: 'School of Electrical Engineering & Center for Advanced Materials', unit_type: 'School', discipline: 'Semiconductor & Microelectronics Engineering', domain: 'Engineering & Applied Physical Sciences', website_url: 'https://ee.kaist.ac.kr', created_at: new Date().toISOString() },
    { id: 'unit_ae_1', university_id: 'uni_ae_1', name: 'Department of Industrial and Systems Engineering', unit_type: 'Department', discipline: 'International Business', domain: 'Business, Management & Economics', website_url: 'https://www.ku.ac.ae/academics/college-of-engineering', created_at: new Date().toISOString() },
    { id: 'unit_ng_1', university_id: 'uni_ng_1', name: 'Department of Epidemiology and Medical Statistics', unit_type: 'Department', discipline: 'Public Health & Global Health', domain: 'Clinical Medicine, Public Health & Nursing', website_url: 'https://publichealth.ui.edu.ng', created_at: new Date().toISOString() },
  ];

  public departments: Department[] = [
    { id: 'dept_1', university_id: 'uni_1', name: 'Department of Computer Science', field: 'Computer Science', website_url: 'https://www.cs.utexas.edu', created_at: new Date().toISOString() },
    { id: 'dept_2', university_id: 'uni_2', name: 'Department of EECS', field: 'Artificial Intelligence', website_url: 'https://eecs.berkeley.edu', created_at: new Date().toISOString() },
    { id: 'dept_3', university_id: 'uni_uk_1', name: 'Saïd Business School', field: 'Business Administration', website_url: 'https://www.sbs.ox.ac.uk', created_at: new Date().toISOString() },
    { id: 'dept_4', university_id: 'uni_de_1', name: 'TUM Energy Institute', field: 'Renewable Energy', website_url: 'https://www.ed.tum.de', created_at: new Date().toISOString() },
  ];

  // ----------------------------------------------------------
  // GLOBAL VERIFIED PROFESSORS & RESEARCHERS
  // ----------------------------------------------------------
  public professors: Professor[] = [
    // 1. USA + AI
    {
      id: 'prof_1',
      university_id: 'uni_1',
      university_name: 'University of Texas at Austin',
      university_country: 'United States',
      university_state: 'Texas',
      university_region: 'Texas',
      university_city: 'Austin',
      department_id: 'dept_1',
      department_name: 'Department of Computer Science',
      academic_domain: 'Computing, Artificial Intelligence & Informatics',
      primary_discipline: 'Artificial Intelligence',
      interdisciplinary_tags: ['Natural Language Processing', 'Data Science', 'Cognitive Science'],
      name: 'Dr. Greg Durrett',
      title: 'Associate Professor',
      position: 'TAUR Lab Director',
      email: 'gdurrett@cs.utexas.edu',
      email_verification_status: 'VERIFIED',
      office: 'GDC 3.828',
      profile_url: 'https://www.cs.utexas.edu/~gdurrett/',
      lab_url: 'https://tara-nlp-lab.github.io/',
      google_scholar_url: 'https://scholar.google.com/citations?user=GregDurrett',
      research_interests: ['Large Language Models', 'Reasoning & Faithfulness', 'Information Extraction', 'Question Answering', 'Hallucination Mitigation'],
      keywords: ['NLP', 'LLM Reasoning', 'Interpretability', 'Retrieval Augmented Generation', 'PyTorch'],
      recruiting_status: 'VERIFIED_RECRUITING',
      recruiting_notes: 'Actively seeking 2 PhD students for Fall 2027 focusing on LLM factual grounding and reasoning reliability.',
      recruiting_evidence: 'Official faculty webpage states: "I am actively recruiting PhD students for Fall 2027 interested in faithful NLP representations."',
      confidence_score: 0.99,
      verification_status: 'VERIFIED',
      freshness_status: 'FRESH',
      last_verified_at: new Date().toISOString(),
      publications: [
        {
          id: 'ppub_1',
          professor_id: 'prof_1',
          title: 'Faithful Reasoning with Large Language Models via Explicit Grounding',
          year: 2024,
          venue: 'ACL 2024',
          citations_count: 142,
          doi: '10.18653/v1/2024.acl-long.88',
          abstract: 'We investigate methods to constrain LLM generative steps using formal knowledge graphs and retrieved evidence to eliminate factual hallucinations in multi-hop question answering.',
          url: 'https://aclanthology.org/2024.acl-long.88/',
          source_provider: 'OpenAlex',
          created_at: new Date().toISOString(),
        },
      ],
      sources: [
        {
          id: 'src_1',
          professor_id: 'prof_1',
          source_type: 'UNIVERSITY_FACULTY_PAGE',
          source_url: 'https://www.cs.utexas.edu/~gdurrett/',
          snippet: 'Associate Professor in Computer Science at UT Austin. Leads research on natural language processing and structured reasoning.',
          verified_at: new Date().toISOString(),
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // 2. USA + AI (UC Berkeley)
    {
      id: 'prof_us_2',
      university_id: 'uni_2',
      university_name: 'University of California, Berkeley',
      university_country: 'United States',
      university_state: 'California',
      university_region: 'California',
      university_city: 'Berkeley',
      academic_domain: 'Computing, Artificial Intelligence & Informatics',
      primary_discipline: 'Artificial Intelligence',
      interdisciplinary_tags: ['Robotics & Autonomous Systems', 'Philosophy & Ethics', 'Cognitive Science'],
      name: 'Dr. Stuart Russell',
      title: 'Professor of Computer Science',
      position: 'Director of Center for Human-Compatible AI (CHAI)',
      email: 'russell@cs.berkeley.edu',
      email_verification_status: 'VERIFIED',
      profile_url: 'https://people.eecs.berkeley.edu/~russell/',
      lab_url: 'https://humancompatible.ai/',
      research_interests: ['Provably Beneficial AI', 'Value Alignment', 'Inverse Reinforcement Learning', 'Bounded Rationality'],
      keywords: ['AI Safety', 'Probabilistic Programming', 'Reinforcement Learning', 'Autonomous Agents'],
      recruiting_status: 'POSSIBLY_RECRUITING',
      recruiting_notes: 'Accepts inquiries from highly qualified graduate students with strong mathematical backgrounds.',
      recruiting_evidence: 'CHAI research website lists ongoing fellowship funding for doctoral candidates in beneficial AI.',
      confidence_score: 0.98,
      verification_status: 'VERIFIED',
      freshness_status: 'FRESH',
      last_verified_at: new Date().toISOString(),
      publications: [
        {
          id: 'ppub_us2_1',
          professor_id: 'prof_us_2',
          title: 'Human-Compatible Artificial Intelligence: Foundational Invariants',
          year: 2024,
          venue: 'Journal of Artificial Intelligence Research',
          citations_count: 310,
          url: 'https://jair.org/index.php/jair/article/view/1420',
          source_provider: 'Crossref',
          created_at: new Date().toISOString(),
        }
      ],
      sources: [
        {
          id: 'src_us2_1',
          professor_id: 'prof_us_2',
          source_type: 'UNIVERSITY_FACULTY_PAGE',
          source_url: 'https://people.eecs.berkeley.edu/~russell/',
          snippet: 'Professor of Electrical Engineering and Computer Sciences, UC Berkeley.',
          verified_at: new Date().toISOString(),
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // 3. UK + Business (Oxford)
    {
      id: 'prof_uk_1',
      university_id: 'uni_uk_1',
      university_name: 'University of Oxford',
      university_country: 'United Kingdom',
      university_region: 'Oxfordshire',
      university_city: 'Oxford',
      academic_domain: 'Business, Management & Economics',
      primary_discipline: 'Business Administration',
      interdisciplinary_tags: ['Finance & Banking', 'Corporate Law', 'Public Policy & Administration'],
      name: 'Dr. Colin Mayer',
      title: 'Emeritus Professor of Management Studies',
      position: 'Academic Lead, Future of the Corporation Initiative',
      email: 'colin.mayer@sbs.ox.ac.uk',
      email_verification_status: 'VERIFIED',
      profile_url: 'https://www.sbs.ox.ac.uk/about-us/people/colin-mayer',
      research_interests: ['Corporate Governance', 'Purpose-Driven Enterprise', 'Financial Regulation', 'Business Ethics'],
      keywords: ['Corporate Finance', 'Stakeholder Capitalism', 'Business Policy', 'Economic Reform'],
      recruiting_status: 'POSSIBLY_RECRUITING',
      recruiting_notes: 'Supervises DPhil candidates examining responsible corporate architecture and governance.',
      recruiting_evidence: 'Saïd Business School faculty portal confirms research supervision eligibility for DPhil candidates.',
      confidence_score: 0.96,
      verification_status: 'VERIFIED',
      freshness_status: 'FRESH',
      last_verified_at: new Date().toISOString(),
      publications: [
        {
          id: 'ppub_uk1_1',
          professor_id: 'prof_uk_1',
          title: 'Prosperity: Better Business Makes the Greater Good',
          year: 2023,
          venue: 'Oxford University Press',
          citations_count: 512,
          url: 'https://academic.oup.com/book/mayer-prosperity',
          source_provider: 'Crossref',
          created_at: new Date().toISOString(),
        }
      ],
      sources: [
        {
          id: 'src_uk1_1',
          professor_id: 'prof_uk_1',
          source_type: 'UNIVERSITY_FACULTY_PAGE',
          source_url: 'https://www.sbs.ox.ac.uk/about-us/people/colin-mayer',
          snippet: 'Professor of Management Studies at Saïd Business School, University of Oxford.',
          verified_at: new Date().toISOString(),
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // 4. Germany + Renewable Energy (TU Munich)
    {
      id: 'prof_de_1',
      university_id: 'uni_de_1',
      university_name: 'Technical University of Munich (TUM)',
      university_country: 'Germany',
      university_region: 'Bavaria',
      university_city: 'Munich',
      academic_domain: 'Agricultural, Food & Environmental Sciences',
      primary_discipline: 'Renewable Energy & Biofuels',
      interdisciplinary_tags: ['Chemical Engineering', 'Environmental Engineering', 'Electrical & Electronic Engineering'],
      name: 'Dr. Michael Sterner',
      title: 'Professor for Energy Storage and Renewable Energies',
      position: 'Head of Energy Systems Group',
      email: 'michael.sterner@tum.de',
      email_verification_status: 'VERIFIED',
      profile_url: 'https://www.ed.tum.de/en/energy-systems/prof-sterner',
      research_interests: ['Power-to-X', 'Hydrogen Storage Systems', 'Renewable Grid Integration', 'Clean Synthetic Fuels'],
      keywords: ['Energy Storage', 'Power-to-Gas', 'Decarbonization', 'Smart Grids', 'Electrolysis'],
      recruiting_status: 'VERIFIED_RECRUITING',
      recruiting_notes: 'Funded PhD positions available under the European Clean Hydrogen Alliance Grant for 2026/2027.',
      recruiting_evidence: 'TUM portal post: "Open PhD Position in Power-to-Gas and Hydrogen Integration under Horizon Europe."',
      confidence_score: 0.97,
      verification_status: 'VERIFIED',
      freshness_status: 'FRESH',
      last_verified_at: new Date().toISOString(),
      publications: [
        {
          id: 'ppub_de1_1',
          professor_id: 'prof_de_1',
          title: 'Power-to-Gas: Decarbonizing Energy Systems through Long-Term Chemical Storage',
          year: 2024,
          venue: 'Applied Energy Journal',
          citations_count: 240,
          url: 'https://doi.org/10.1016/j.apenergy.2024.12093',
          source_provider: 'OpenAlex',
          created_at: new Date().toISOString(),
        }
      ],
      sources: [
        {
          id: 'src_de1_1',
          professor_id: 'prof_de_1',
          source_type: 'UNIVERSITY_FACULTY_PAGE',
          source_url: 'https://www.ed.tum.de/en/energy-systems/prof-sterner',
          snippet: 'Full Professor for Energy Systems at TUM School of Engineering and Design.',
          verified_at: new Date().toISOString(),
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // 5. Japan + Robotics (Univ of Tokyo)
    {
      id: 'prof_jp_1',
      university_id: 'uni_jp_1',
      university_name: 'The University of Tokyo',
      university_country: 'Japan',
      university_region: 'Tokyo',
      university_city: 'Tokyo',
      academic_domain: 'Computing, Artificial Intelligence & Informatics',
      primary_discipline: 'Robotics & Autonomous Systems',
      interdisciplinary_tags: ['Mechanical Engineering', 'Mechatronics & Control Systems', 'Computer Vision'],
      name: 'Dr. Masayuki Inaba',
      title: 'Professor of Mechano-Informatics',
      position: 'Director of JSK Robotics Laboratory',
      email: 'inaba@jsk.t.u-tokyo.ac.jp',
      email_verification_status: 'VERIFIED',
      profile_url: 'https://www.isi.imi.i.u-tokyo.ac.jp/member/inaba.html',
      lab_url: 'https://www.jsk.t.u-tokyo.ac.jp/',
      research_interests: ['Humanoid Robotics', 'Musculoskeletal Body Systems', 'Tactile Sensor Integration', 'Autonomous Manipulation'],
      keywords: ['Humanoid Robots', 'JSK Lab', 'Control Theory', 'Embodied AI', 'ROS2'],
      recruiting_status: 'VERIFIED_RECRUITING',
      recruiting_notes: 'Accepts MEXT scholarship and international doctoral students for musculoskeletal robotics research.',
      recruiting_evidence: 'JSK Laboratory Admissions page explicitly invites international PhD applicants under MEXT & UTokyo fellowships.',
      confidence_score: 0.99,
      verification_status: 'VERIFIED',
      freshness_status: 'FRESH',
      last_verified_at: new Date().toISOString(),
      publications: [
        {
          id: 'ppub_jp1_1',
          professor_id: 'prof_jp_1',
          title: 'Design of Musculoskeletal Humanoids with Redundant Sensorimotor Neural Controls',
          year: 2024,
          venue: 'IEEE Transactions on Robotics (T-RO)',
          citations_count: 185,
          url: 'https://ieeexplore.ieee.org/document/9482012',
          source_provider: 'Crossref',
          created_at: new Date().toISOString(),
        }
      ],
      sources: [
        {
          id: 'src_jp1_1',
          professor_id: 'prof_jp_1',
          source_type: 'LAB_PAGE',
          source_url: 'https://www.jsk.t.u-tokyo.ac.jp/',
          snippet: 'JSK Robotics Lab, Graduate School of Information Science and Technology, The University of Tokyo.',
          verified_at: new Date().toISOString(),
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // 6. Canada + Psychology (Univ of Toronto)
    {
      id: 'prof_ca_1',
      university_id: 'uni_ca_1',
      university_name: 'University of Toronto',
      university_country: 'Canada',
      university_region: 'Ontario',
      university_city: 'Toronto',
      academic_domain: 'Social, Behavioral & Policy Sciences',
      primary_discipline: 'Psychology (Cognitive, Clinical, Social)',
      interdisciplinary_tags: ['Neuroscience', 'Education & Learning Sciences', 'Human-Computer Interaction'],
      name: 'Dr. Laurel Trainor',
      title: 'Professor of Psychology, Neuroscience & Behaviour',
      position: 'Director of Auditory Development Lab',
      email: 'ljt@psych.utoronto.ca',
      email_verification_status: 'VERIFIED',
      profile_url: 'https://www.psych.utoronto.ca/people/directories/all-faculty/laurel-trainor',
      research_interests: ['Auditory Cognitive Neuroscience', 'Infant Development', 'Music Cognition & Social Interaction', 'EEG Evoked Potentials'],
      keywords: ['Cognitive Psychology', 'Developmental Psychology', 'EEG', 'Auditory Cortex', 'Infant Cognition'],
      recruiting_status: 'VERIFIED_RECRUITING',
      recruiting_notes: 'Recruiting graduate researchers with background in psycholinguistics, music perception, or cognitive EEG.',
      recruiting_evidence: 'Laboratory noticeboard announces SSHRC/NSERC funded graduate research assistantships.',
      confidence_score: 0.95,
      verification_status: 'VERIFIED',
      freshness_status: 'FRESH',
      last_verified_at: new Date().toISOString(),
      publications: [
        {
          id: 'ppub_ca1_1',
          professor_id: 'prof_ca_1',
          title: 'Neural Oscillations and Synchrony in Auditory-Motor Communication',
          year: 2023,
          venue: 'Nature Reviews Neuroscience',
          citations_count: 290,
          url: 'https://doi.org/10.1038/s41583-023-00712-4',
          source_provider: 'Crossref',
          created_at: new Date().toISOString(),
        }
      ],
      sources: [
        {
          id: 'src_ca1_1',
          professor_id: 'prof_ca_1',
          source_type: 'UNIVERSITY_FACULTY_PAGE',
          source_url: 'https://www.psych.utoronto.ca/people/directories/all-faculty/laurel-trainor',
          snippet: 'Faculty directory of the Department of Psychology, University of Toronto.',
          verified_at: new Date().toISOString(),
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // 7. Australia + Public Health (Melbourne)
    {
      id: 'prof_au_1',
      university_id: 'uni_au_1',
      university_name: 'University of Melbourne',
      university_country: 'Australia',
      university_region: 'Victoria',
      university_city: 'Melbourne',
      academic_domain: 'Clinical Medicine, Public Health & Nursing',
      primary_discipline: 'Public Health & Global Health',
      interdisciplinary_tags: ['Epidemiology & Biostatistics', 'Microbiology & Immunology', 'Medicine & Clinical Sciences'],
      name: 'Dr. Sharon Lewin',
      title: 'Professor of Infectious Diseases & Director',
      position: 'Director of Peter Doherty Institute for Infection and Immunity',
      email: 'sharon.lewin@unimelb.edu.au',
      email_verification_status: 'VERIFIED',
      profile_url: 'https://findanexpert.unimelb.edu.au/profile/13812-sharon-lewin',
      research_interests: ['Infectious Disease Epidemiology', 'Viral Reservoirs & Latency', 'Pandemic Preparedness', 'Global Health Equity'],
      keywords: ['Infectious Diseases', 'Public Health Policy', 'Immunology', 'Translational Medicine', 'Doherty Institute'],
      recruiting_status: 'VERIFIED_RECRUITING',
      recruiting_notes: 'Openings for doctoral students examining post-pandemic genomic surveillance and infectious disease policy.',
      recruiting_evidence: 'Doherty Institute Postgraduate Portal lists active NHMRC-funded PhD scholarship projects for 2026/2027.',
      confidence_score: 0.99,
      verification_status: 'VERIFIED',
      freshness_status: 'FRESH',
      last_verified_at: new Date().toISOString(),
      publications: [
        {
          id: 'ppub_au1_1',
          professor_id: 'prof_au_1',
          title: 'Global Surveillance Architectures for Emerging Viral Pathogens',
          year: 2024,
          venue: 'The Lancet Infectious Diseases',
          citations_count: 380,
          url: 'https://doi.org/10.1016/S1473-3099(24)00112-X',
          source_provider: 'Crossref',
          created_at: new Date().toISOString(),
        }
      ],
      sources: [
        {
          id: 'src_au1_1',
          professor_id: 'prof_au_1',
          source_type: 'UNIVERSITY_FACULTY_PAGE',
          source_url: 'https://findanexpert.unimelb.edu.au/profile/13812-sharon-lewin',
          snippet: 'Professor Sharon Lewin AO, Melbourne School of Population and Global Health.',
          verified_at: new Date().toISOString(),
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // 8. Italy + Architecture (Politecnico di Milano)
    {
      id: 'prof_it_1',
      university_id: 'uni_it_1',
      university_name: 'Politecnico di Milano',
      university_country: 'Italy',
      university_region: 'Lombardy (Milan)',
      university_city: 'Milan',
      academic_domain: 'Architecture, Urban Planning & Design',
      primary_discipline: 'Architecture',
      interdisciplinary_tags: ['Urban Planning & Design', 'Sustainable Urban Development', 'Landscape Architecture'],
      name: 'Dr. Cino Zucchi',
      title: 'Full Professor of Architectural and Urban Design',
      position: 'Lead Chair of Architecture Studio',
      email: 'cino.zucchi@polimi.it',
      email_verification_status: 'VERIFIED',
      profile_url: 'https://www.dastu.polimi.it/docenti/cino-zucchi',
      research_interests: ['Post-Industrial Urban Regeneration', 'Sustainable Housing Typologies', 'Spatial Metamorphism', 'Public Space Design'],
      keywords: ['Urban Morphology', 'Architectural Design', 'Italian Architecture', 'Heritage Conservation', 'Parametric Urbanism'],
      recruiting_status: 'POSSIBLY_RECRUITING',
      recruiting_notes: 'Accepts doctoral proposals focused on urban ecological retrofitting and European architectural heritage.',
      recruiting_evidence: 'DAStU PhD program portal confirms prospective international applicant mentorship.',
      confidence_score: 0.97,
      verification_status: 'VERIFIED',
      freshness_status: 'FRESH',
      last_verified_at: new Date().toISOString(),
      publications: [
        {
          id: 'ppub_it1_1',
          professor_id: 'prof_it_1',
          title: 'Resilient Urban Palimpsests: Retrofitting Historic Industrial Fabric for Sustainable Habitation',
          year: 2023,
          venue: 'Journal of Architectural Education',
          citations_count: 88,
          url: 'https://doi.org/10.1080/10464883.2023.21894',
          source_provider: 'OpenAlex',
          created_at: new Date().toISOString(),
        }
      ],
      sources: [
        {
          id: 'src_it1_1',
          professor_id: 'prof_it_1',
          source_type: 'DEPARTMENT_DIRECTORY',
          source_url: 'https://www.dastu.polimi.it/docenti/cino-zucchi',
          snippet: 'Department of Architecture and Urban Studies (DAStU), Politecnico di Milano.',
          verified_at: new Date().toISOString(),
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // 9. Pakistan + Biotechnology (NUST)
    {
      id: 'prof_pk_1',
      university_id: 'uni_pk_1',
      university_name: 'National University of Sciences and Technology (NUST)',
      university_country: 'Pakistan',
      university_region: 'Islamabad Capital Territory',
      university_city: 'Islamabad',
      academic_domain: 'Biological, Biomedical & Life Sciences',
      primary_discipline: 'Biotechnology & Genetic Engineering',
      interdisciplinary_tags: ['Molecular & Cellular Biology', 'Agriculture & Agronomy', 'Pharmacy & Pharmaceutical Sciences'],
      name: 'Dr. Bushra Mirza',
      title: 'Tenured Professor of Molecular Biotechnology',
      position: 'Chair of Functional Genomics Lab',
      email: 'bushra.mirza@asab.nust.edu.pk',
      email_verification_status: 'VERIFIED',
      profile_url: 'https://asab.nust.edu.pk/faculty/dr-bushra-mirza',
      research_interests: ['Plant Molecular Pharming', 'Anticancer Bioactive Compounds', 'CRISPR Gene Editing in Drought Tolerant Crops', 'Functional Genomics'],
      keywords: ['Biotechnology', 'CRISPR', 'Phytomedicine', 'Agricultural Genomics', 'Molecular Assays'],
      recruiting_status: 'VERIFIED_RECRUITING',
      recruiting_notes: 'HEC funded PhD and MPhil positions in agricultural biotechnology and stress resilience.',
      recruiting_evidence: 'ASAB research circular lists HEC Indigenous and International PhD Fellowships in Functional Genomics.',
      confidence_score: 0.98,
      verification_status: 'VERIFIED',
      freshness_status: 'FRESH',
      last_verified_at: new Date().toISOString(),
      publications: [
        {
          id: 'ppub_pk1_1',
          professor_id: 'prof_pk_1',
          title: 'Genome-Wide Identification and Functional Characterization of Drought Stress Regulators',
          year: 2024,
          venue: 'Frontiers in Plant Science',
          citations_count: 145,
          url: 'https://doi.org/10.3389/fpls.2024.13948',
          source_provider: 'Crossref',
          created_at: new Date().toISOString(),
        }
      ],
      sources: [
        {
          id: 'src_pk1_1',
          professor_id: 'prof_pk_1',
          source_type: 'UNIVERSITY_FACULTY_PAGE',
          source_url: 'https://asab.nust.edu.pk/faculty/dr-bushra-mirza',
          snippet: 'Atta-ur-Rahman School of Applied Biosciences, NUST Islamabad.',
          verified_at: new Date().toISOString(),
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // 10. China + Tsinghua Univ + Biotechnology (Beijing)
    {
      id: 'prof_cn_1',
      university_id: 'uni_cn_1',
      university_name: 'Tsinghua University',
      university_country: 'China',
      university_region: 'Beijing (Tsinghua/Peking)',
      university_city: 'Beijing',
      academic_domain: 'Biological, Biomedical & Life Sciences',
      primary_discipline: 'Biotechnology & Genetic Engineering',
      interdisciplinary_tags: ['Molecular & Cellular Biology', 'Biochemistry & Structural Biology', 'Genomics & Bioinformatics'],
      name: 'Dr. Yigong Shi',
      title: 'University Chair Professor & PI',
      position: 'Director of Life Sciences & Structural Biology Laboratory',
      email: 'shi-lab@tsinghua.edu.cn',
      email_verification_status: 'VERIFIED',
      profile_url: 'https://www.life.tsinghua.edu.cn/en/info/1034/1240.htm',
      lab_url: 'https://www.shi-lab.tsinghua.edu.cn/',
      research_interests: ['Structural Biology', 'Cryo-EM Structural Determination', 'Apoptosis Signal Transduction', 'Spliceosome Assembly & Gene Regulation'],
      keywords: ['Biotechnology', 'Cryo-EM', 'Genetic Engineering', 'Spliceosome', 'Apoptosis'],
      recruiting_status: 'ACTIVELY_RECRUITING',
      recruiting_notes: 'Actively recruiting PhD candidates and international postdoctoral fellows in structural biology and genetic engineering.',
      recruiting_evidence: 'Tsinghua School of Life Sciences directory explicitly welcomes international doctoral applicants.',
      confidence_score: 0.99,
      verification_status: 'VERIFIED',
      freshness_status: 'FRESH',
      last_verified_at: new Date().toISOString(),
      publications: [
        {
          id: 'ppub_cn1_1',
          professor_id: 'prof_cn_1',
          title: 'Structure of the Human Spliceosome at Near-Atomic Resolution by Cryo-EM',
          year: 2025,
          venue: 'Science / Cell',
          citations_count: 520,
          url: 'https://doi.org/10.1126/science.aag0291',
          source_provider: 'Crossref',
          created_at: new Date().toISOString(),
        }
      ],
      sources: [
        {
          id: 'src_cn1_1',
          professor_id: 'prof_cn_1',
          source_type: 'UNIVERSITY_FACULTY_PAGE',
          source_url: 'https://www.life.tsinghua.edu.cn/en/info/1034/1240.htm',
          snippet: 'Tsinghua University School of Life Sciences Faculty Directory.',
          verified_at: new Date().toISOString(),
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // 11. China + Peking Univ + Biotechnology (Beijing)
    {
      id: 'prof_cn_2',
      university_id: 'uni_cn_2',
      university_name: 'Peking University',
      university_country: 'China',
      university_region: 'Beijing (Tsinghua/Peking)',
      university_city: 'Beijing',
      academic_domain: 'Biological, Biomedical & Life Sciences',
      primary_discipline: 'Biotechnology & Genetic Engineering',
      interdisciplinary_tags: ['Gene Editing & CRISPR', 'Synthetic Biology', 'Stem Cell & Regenerative Medicine'],
      name: 'Dr. Jing Zhang',
      title: 'Professor of Biotechnology & Functional Genomics',
      position: 'Head of CRISPR & Gene Editing Research Group',
      email: 'jing.zhang@pku.edu.cn',
      email_verification_status: 'VERIFIED',
      profile_url: 'https://bio.pku.edu.cn/en/faculty/zhangjing.html',
      lab_url: 'https://www.bio.pku.edu.cn/labs/crispr',
      research_interests: ['CRISPR-Cas9 Base Editing', 'Synthetic Biology Systems', 'Gene Therapy Delivery', 'Epigenetic Remodeling'],
      keywords: ['Biotechnology', 'CRISPR', 'Gene Editing', 'Peking University', 'Genomics'],
      recruiting_status: 'ACTIVELY_RECRUITING',
      recruiting_notes: 'Open PhD assistantships for research in precision base editing and viral vector delivery.',
      recruiting_evidence: 'PKU School of Life Sciences announcement lists active 2026/2027 PhD research grants.',
      confidence_score: 0.98,
      verification_status: 'VERIFIED',
      freshness_status: 'FRESH',
      last_verified_at: new Date().toISOString(),
      publications: [
        {
          id: 'ppub_cn2_1',
          professor_id: 'prof_cn_2',
          title: 'Precision Base Editing in Mammalian Cells without Double-Stranded DNA Breaks',
          year: 2024,
          venue: 'Nature Biotechnology',
          citations_count: 310,
          url: 'https://doi.org/10.1038/s41587-024-02102-x',
          source_provider: 'Crossref',
          created_at: new Date().toISOString(),
        }
      ],
      sources: [
        {
          id: 'src_cn2_1',
          professor_id: 'prof_cn_2',
          source_type: 'UNIVERSITY_FACULTY_PAGE',
          source_url: 'https://bio.pku.edu.cn/en/faculty/zhangjing.html',
          snippet: 'Peking University College of Life Sciences Faculty Profile.',
          verified_at: new Date().toISOString(),
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // 10. Brazil + Economics (USP)
    {
      id: 'prof_br_1',
      university_id: 'uni_br_1',
      university_name: 'University of São Paulo (USP)',
      university_country: 'Brazil',
      university_region: 'São Paulo',
      university_city: 'São Paulo',
      academic_domain: 'Social, Behavioral & Policy Sciences',
      primary_discipline: 'Economics & Econometrics',
      interdisciplinary_tags: ['Public Policy & Administration', 'Development Studies', 'Finance & Banking'],
      name: 'Dr. Laura Carvalho',
      title: 'Associate Professor of Economics',
      position: 'Director of Policy and Macroeconomic Studies',
      email: 'laura.carvalho@usp.br',
      email_verification_status: 'VERIFIED',
      profile_url: 'https://www.fea.usp.br/economia/docentes/laura-carvalho',
      research_interests: ['Macroeconomic Distribution', 'Fiscal Policy & Public Investment', 'Structuralist Economics', 'Poverty Alleviation'],
      keywords: ['Applied Econometrics', 'Fiscal Multipliers', 'Latin American Development', 'Macroeconomics'],
      recruiting_status: 'VERIFIED_RECRUITING',
      recruiting_notes: 'FAPESP funded scholarships available for doctoral candidates modeling public investment and ecological transition.',
      recruiting_evidence: 'FEA-USP postgraduate program announcement confirms FAPESP doctorate grants in Macroeconomic Policy.',
      confidence_score: 0.97,
      verification_status: 'VERIFIED',
      freshness_status: 'FRESH',
      last_verified_at: new Date().toISOString(),
      publications: [
        {
          id: 'ppub_br1_1',
          professor_id: 'prof_br_1',
          title: 'Public Investment and Inclusive Growth in Developing Economies: Empirical Evidence from Latin America',
          year: 2023,
          venue: 'Cambridge Journal of Economics',
          citations_count: 172,
          url: 'https://doi.org/10.1093/cje/bead022',
          source_provider: 'Crossref',
          created_at: new Date().toISOString(),
        }
      ],
      sources: [
        {
          id: 'src_br1_1',
          professor_id: 'prof_br_1',
          source_type: 'UNIVERSITY_FACULTY_PAGE',
          source_url: 'https://www.fea.usp.br/economia/docentes/laura-carvalho',
          snippet: 'Faculdade de Economia, Administração e Contabilidade da Universidade de São Paulo.',
          verified_at: new Date().toISOString(),
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // 11. Sweden + Sustainable Cities (KTH)
    {
      id: 'prof_se_1',
      university_id: 'uni_se_1',
      university_name: 'KTH Royal Institute of Technology',
      university_country: 'Sweden',
      university_region: 'Stockholm',
      university_city: 'Stockholm',
      academic_domain: 'Architecture, Urban Planning & Design',
      primary_discipline: 'Sustainable Urban Development',
      interdisciplinary_tags: ['Environmental Engineering', 'Urban Planning & Design', 'Renewable Energy & Biofuels'],
      name: 'Dr. Göran Finnveden',
      title: 'Professor of Environmental Strategic Analysis',
      position: 'Director of KTH Sustainability Research Platform',
      email: 'goran.finnveden@abe.kth.se',
      email_verification_status: 'VERIFIED',
      profile_url: 'https://www.kth.se/profile/goranf',
      lab_url: 'https://www.kth.se/seed/forskning/strategiska-hallbarhetsstudier',
      research_interests: ['Sustainable Cities & Communities', 'Life Cycle Assessment (LCA)', 'Circular Economy in Urban Metabolism', 'Climate Neutral Municipalities'],
      keywords: ['Sustainable Cities', 'Urban Metabolism', 'LCA Modeling', 'Circular Cities', 'Smart Urban Systems'],
      recruiting_status: 'VERIFIED_RECRUITING',
      recruiting_notes: 'Recruiting PhD researchers under the Swedish Formas grant for Circular Cities and Climate-Neutral Urban Living.',
      recruiting_evidence: 'KTH Jobs portal confirms: "PhD student in Sustainable Urban Development and Circular Economy, Ref: ABE-2026-0812."',
      confidence_score: 0.99,
      verification_status: 'VERIFIED',
      freshness_status: 'FRESH',
      last_verified_at: new Date().toISOString(),
      publications: [
        {
          id: 'ppub_se1_1',
          professor_id: 'prof_se_1',
          title: 'Life Cycle Assessment of Municipal Urban Regeneration: Pathways to Net-Zero Nordic Cities',
          year: 2024,
          venue: 'Journal of Cleaner Production',
          citations_count: 220,
          url: 'https://doi.org/10.1016/j.jclepro.2024.14120',
          source_provider: 'OpenAlex',
          created_at: new Date().toISOString(),
        }
      ],
      sources: [
        {
          id: 'src_se1_1',
          professor_id: 'prof_se_1',
          source_type: 'UNIVERSITY_FACULTY_PAGE',
          source_url: 'https://www.kth.se/profile/goranf',
          snippet: 'School of Architecture and the Built Environment, KTH Royal Institute of Technology.',
          verified_at: new Date().toISOString(),
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // 12. South Korea + Semiconductor Engineering (KAIST)
    {
      id: 'prof_kr_1',
      university_id: 'uni_kr_1',
      university_name: 'KAIST (Korea Advanced Institute of Science and Technology)',
      university_country: 'South Korea',
      university_region: 'Daejeon (KAIST)',
      university_city: 'Daejeon',
      academic_domain: 'Engineering & Applied Physical Sciences',
      primary_discipline: 'Semiconductor & Microelectronics Engineering',
      interdisciplinary_tags: ['Materials Science & Engineering', 'Electrical & Electronic Engineering', 'Applied Physics'],
      name: 'Dr. Keon Jae Lee',
      title: 'Chair Professor of Materials Science & EE',
      position: 'Director of Advanced Microelectronics & Nanodevices Lab',
      email: 'keonlee@kaist.ac.kr',
      email_verification_status: 'VERIFIED',
      profile_url: 'https://ee.kaist.ac.kr/faculty/keon-jae-lee',
      lab_url: 'https://mnl.kaist.ac.kr',
      research_interests: ['Advanced Semiconductor Packaging', 'Flexible 2D Transistors', 'Neuromorphic Memory Devices', 'GaN Power Semiconductor Systems'],
      keywords: ['Semiconductor Engineering', 'Neuromorphic Chips', 'Lithography', 'MEMS', 'KAIST Nano Fab'],
      recruiting_status: 'VERIFIED_RECRUITING',
      recruiting_notes: 'Multiple government and industry-sponsored PhD positions in next-generation 3D IC semiconductor packaging.',
      recruiting_evidence: 'KAIST Microelectronics lab notice confirms active recruitment for BK21 Four international graduate fellowships.',
      confidence_score: 0.99,
      verification_status: 'VERIFIED',
      freshness_status: 'FRESH',
      last_verified_at: new Date().toISOString(),
      publications: [
        {
          id: 'ppub_kr1_1',
          professor_id: 'prof_kr_1',
          title: 'Monolithic 3D Integration of Ultrathin Transistors for Sub-1nm Equivalent Microelectronics',
          year: 2024,
          venue: 'Nature Electronics',
          citations_count: 410,
          url: 'https://doi.org/10.1038/s41928-024-01145-2',
          source_provider: 'Crossref',
          created_at: new Date().toISOString(),
        }
      ],
      sources: [
        {
          id: 'src_kr1_1',
          professor_id: 'prof_kr_1',
          source_type: 'LAB_PAGE',
          source_url: 'https://mnl.kaist.ac.kr',
          snippet: 'Micro & Nanodevices Lab, Department of Materials Science and Engineering, KAIST.',
          verified_at: new Date().toISOString(),
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // 13. Unknown Field Test Specimen: "Computational Sustainability"
    {
      id: 'prof_unknown_1',
      university_id: 'uni_se_1',
      university_name: 'KTH Royal Institute of Technology',
      university_country: 'Sweden',
      university_region: 'Stockholm',
      university_city: 'Stockholm',
      academic_domain: 'Computing, Artificial Intelligence & Informatics',
      primary_discipline: 'Computer Science',
      interdisciplinary_tags: ['Sustainable Urban Development', 'Data Science', 'Environmental Engineering'],
      name: 'Dr. Henrik Artman',
      title: 'Senior Research Fellow in Computational Sustainability',
      position: 'Co-Director of Digital Eco-Informatics Center',
      email: 'artman@kth.se',
      email_verification_status: 'VERIFIED',
      profile_url: 'https://www.kth.se/profile/artman',
      research_interests: ['Computational Sustainability', 'Algorithmic Resource Allocation', 'AI for Carbon Modeling', 'Digital Climate Governance'],
      keywords: ['Computational Sustainability', 'Green AI', 'Energy Modeling', 'Urban Informatics', 'Optimization'],
      recruiting_status: 'VERIFIED_RECRUITING',
      recruiting_notes: 'Seeking doctoral and post-master researchers for cross-disciplinary Swedish Research Council project on Computational Sustainability.',
      recruiting_evidence: 'KTH Digital Eco-Informatics project portal explicitly outlines Fall 2027 supervision quotas.',
      confidence_score: 0.98,
      verification_status: 'VERIFIED',
      freshness_status: 'FRESH',
      last_verified_at: new Date().toISOString(),
      publications: [
        {
          id: 'ppub_unk1_1',
          professor_id: 'prof_unknown_1',
          title: 'Algorithmic Foundations of Computational Sustainability: Scaling Constraint Optimization for Planetary Boundaries',
          year: 2024,
          venue: 'ACM Transactions on Intelligent Systems and Technology',
          citations_count: 135,
          url: 'https://doi.org/10.1145/3649120',
          source_provider: 'OpenAlex',
          created_at: new Date().toISOString(),
        }
      ],
      sources: [
        {
          id: 'src_unk1_1',
          professor_id: 'prof_unknown_1',
          source_type: 'UNIVERSITY_FACULTY_PAGE',
          source_url: 'https://www.kth.se/profile/artman',
          snippet: 'Faculty profile at the School of Electrical Engineering and Computer Science, KTH.',
          verified_at: new Date().toISOString(),
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ];

  public researchMatches: ResearchMatch[] = [
    {
      id: 'rm_1',
      user_id: 'usr_student_001',
      professor_id: 'prof_1',
      overall_score: 95.5,
      research_score: 98.0,
      project_score: 94.0,
      skills_score: 95.0,
      publication_score: 90.0,
      explanation: 'Exceptional research alignment. Dr. Greg Durrett leads the TAUR NLP lab at UT Austin focusing on factual grounding and hallucination reduction in LLMs. The student undergraduate thesis directly mirrors Dr. Durrett ACL 2024 paper on faithful multi-hop reasoning.',
      breakdown: {
        matched_topics: ['Hallucination Mitigation in LLMs', 'Retrieval-Augmented Generation (RAG)', 'Faithful Reasoning', 'PyTorch Transformers'],
        relevant_student_projects: ['FactGuard: Grounded LLM Verification Engine', 'Undergraduate Thesis on Multi-Hop RAG'],
        relevant_professor_papers: ['Faithful Reasoning with Large Language Models via Explicit Grounding (ACL 2024)'],
        suggested_angle: 'Propose extending Dr. Durrett knowledge graph grounding framework with multi-agent entity verification developed in your FactGuard project.',
        interdisciplinary_alignment: 'Direct synergy between computer science NLP and information extraction.',
      },
      generated_at: new Date().toISOString(),
    },
  ];

  public campaigns: Campaign[] = [
    {
      id: 'cmp_1',
      user_id: 'usr_student_001',
      name: 'Global Verified Faculty Outreach — Fall 2027',
      description: 'Global campaign connecting with verified faculty across USA, Europe, and Asia for funded graduate supervision.',
      target_intake: 'Fall 2027',
      status: 'ACTIVE',
      professors_count: 5,
      emails_sent_count: 1,
      replies_count: 1,
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  public emails: OutreachEmail[] = [
    {
      id: 'em_1',
      campaign_id: 'cmp_1',
      user_id: 'usr_student_001',
      professor_id: 'prof_1',
      subject: 'Prospective PhD Student (Fall 2027) — Grounded LLM Reasoning & FactGuard Connection',
      body_text: `Dear Professor Durrett,\n\nI hope this email finds you well.\n\nI am writing to express my strong interest in joining your research group in the Department of Computer Science at UT Austin as a PhD student for Fall 2027. I have been following your lab's recent work on reliable reasoning in NLP, particularly your ACL 2024 paper on "Faithful Reasoning with Large Language Models via Explicit Grounding."\n\nDuring my undergraduate research, I developed "FactGuard," a multi-agent verification pipeline that enforces knowledge graph constraints during beam search to prevent entity hallucinations in multi-hop question answering. Our benchmark evaluation (presented at ACL 2025 SRW) demonstrated a 23% reduction in factual errors. Your insight on integrating explicit retrieval citations deeply resonated with my findings on attribution bounds.\n\nI would be thrilled to explore how my background in constraint-guided generation and PyTorch transformer architectures could contribute to your ongoing projects in the TAUR Lab. I plan to submit my formal application to UT Austin CS for Fall 2027 and would be immensely grateful for any advice on lab openings.\n\nI have attached my academic CV and thesis summary for your review. Thank you very much for your time and consideration.\n\nSincerely,\nAlex Vance\nB.Tech Computer Science & Engineering\nhttps://github.com/alexvance`,
      personalization_notes: [
        'Referenced Professor Durrett ACL 2024 paper on explicit grounding',
        'Connected with student FactGuard project and ACL SRW publication',
        'Mentioned TAUR lab context and verified Fall 2027 recruiting opening',
      ],
      source_references: [
        {
          type: 'Official Publication',
          title: 'Faithful Reasoning with Large Language Models via Explicit Grounding (ACL 2024)',
          url: 'https://aclanthology.org/2024.acl-long.88/',
          context: 'Used to formulate the core research connection in paragraph 2',
        },
        {
          type: 'University Faculty Directory',
          title: 'UT Austin CS Faculty Profile & TAUR Lab',
          url: 'https://www.cs.utexas.edu/~gdurrett/',
          context: 'Verified active recruiting status and office location',
        }
      ],
      status: 'REPLIED',
      scheduled_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      sent_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  public replies: ReplyRecord[] = [
    {
      id: 'rep_1',
      email_id: 'em_1',
      professor_id: 'prof_1',
      professor_name: 'Dr. Greg Durrett',
      sender_email: 'gdurrett@cs.utexas.edu',
      subject: 'Re: Prospective PhD Student (Fall 2027) — Grounded LLM Reasoning',
      body_text: `Hi Alex,\n\nThanks for reaching out with such a thoughtful note and congratulations on your ACL SRW paper. Your FactGuard project looks quite relevant to what we are building right now on grounding generation steps.\n\nI am indeed taking 1-2 new PhD students for Fall 2027 through the UT Austin CS admissions process. Please make sure to mention my name in your statement of purpose so your file gets routed to me. Also, please send over a 1-page research proposal outlining your proposed thesis direction if you have one ready.\n\nBest,\nGreg`,
      summary: 'Dr. Durrett appreciated the personalized email and confirmed he is recruiting 1-2 PhD students for Fall 2027. He requested the student mention his name on the SOP and send a 1-page research proposal.',
      sentiment: 'POSITIVE',
      suggested_response: `Dear Professor Durrett,\n\nThank you very much for your encouraging reply and guidance! I will certainly mention your name and the TAUR Lab in my Statement of Purpose for the UT Austin CS application.\n\nI have prepared and attached a 1-page research proposal outlining my proposed framework for graph-guided multi-hop reasoning. I welcome any feedback you might have when time permits.\n\nThank you again for your time and consideration.\n\nBest regards,\nAlex Vance`,
      status: 'UNREAD',
      received_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];

  public applications: ApplicationTrackerItem[] = [
    {
      id: 'app_1',
      user_id: 'usr_student_001',
      university_id: 'uni_1',
      university_name: 'University of Texas at Austin',
      professor_id: 'prof_1',
      professor_name: 'Dr. Greg Durrett',
      program_name: 'Ph.D. in Computer Science',
      degree: 'PhD',
      intake: 'Fall 2027',
      deadline: '2026-12-15',
      status: 'Contacted',
      funding_status: 'Pending',
      portal_url: 'https://gradschool.utexas.edu/admissions',
      notes: 'Positive reply received. Need to submit 1-page research proposal and ensure name is on SOP.',
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'app_2',
      user_id: 'usr_student_001',
      university_id: 'uni_se_1',
      university_name: 'KTH Royal Institute of Technology',
      professor_id: 'prof_se_1',
      professor_name: 'Dr. Göran Finnveden',
      program_name: 'Ph.D. in Sustainable Urban Development',
      degree: 'PhD',
      intake: 'Fall 2027',
      deadline: '2027-01-15',
      status: 'Shortlisted',
      funding_status: 'Not Applied',
      portal_url: 'https://www.kth.se/en/studies/phd',
      notes: 'Reviewing Nordic circular cities project. Drafting outreach email.',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  public siteSettings: SiteSettings = {
    siteName: 'ProfMatch AI',
    tagline: 'Global faculty discovery. Deep research verification. High-converting ethical outreach.',
    supportEmail: 'support@profmatch.ai',
    primaryEmail: 'outreach@profmatch.ai',
    defaultCountry: 'Global (All Countries)',
    maintenanceMode: false,
    announcement: {
      enabled: true,
      message: '🌍 Global Academic Expansion Live! Over 190 countries, all academic fields & verified faculty discovery.',
      link: '/search',
    },
    socialLinks: {
      twitter: 'https://twitter.com/profmatchai',
      linkedin: 'https://linkedin.com/company/profmatchai',
      github: 'https://github.com/profmatchai',
    },
  };

  public siteContent: Record<string, SiteContentSection> = {
    hero: {
      section_key: 'hero',
      title: 'Discover & Connect with Research Faculty Across Any Global Institution',
      subtitle: 'Stop sending generic cold emails. ProfMatch AI verifies faculty appointments, recent publications, and public academic emails across any country and any academic discipline.',
      content: {
        badge: 'Global Academic Discovery & Verified Outreach Engine',
        primaryCta: 'Start Global Faculty Discovery',
        primaryCtaLink: '/signup',
        secondaryCta: 'Explore Global Directory',
        secondaryCtaLink: '/search',
        stats: [
          { label: 'Countries Supported', value: '190+' },
          { label: 'Academic Disciplines', value: '80+' },
          { label: 'Verified Global Faculty', value: '50,000+' },
          { label: 'Attributed Publications', value: '1M+' },
        ],
      },
      is_published: true,
      updated_at: new Date().toISOString(),
    },
    features: {
      section_key: 'features',
      title: 'Global, Field-Agnostic, Source-Verified Academic Outreach',
      subtitle: 'Everything you need to discover faculty, evaluate cross-disciplinary lab fit, and send verifiable cold emails.',
      content: {
        items: [
          {
            icon: 'Globe',
            title: 'Worldwide Geographic Coverage',
            description: 'Discover faculty across any country, state, province, or prefecture without artificial country restrictions.',
          },
          {
            icon: 'BookOpen',
            title: 'All Academic Disciplines',
            description: 'From Computational Sustainability and Robotics to Humanities, Law, Architecture, and Public Health.',
          },
          {
            icon: 'Cpu',
            title: 'Interdisciplinary Search',
            description: 'Connect related work across traditional departmental boundaries (e.g. AI in Healthcare spanning CS and Medicine).',
          },
          {
            icon: 'ShieldCheck',
            title: 'Public Email & Source Verification',
            description: 'Every email and profile is cross-verified against official .edu/.ac domains and scholarly metadata. Zero email guessing.',
          },
          {
            icon: 'FileText',
            title: 'Discipline-Tailored Outreach',
            description: 'Crafts cold emails adapted to your actual discipline — wet-lab methods, empirical econometrics, or design studios.',
          },
          {
            icon: 'BarChart3',
            title: 'Global Application Tracking',
            description: 'Track deadlines, replies, and professor interviews across institutions worldwide in one unified dashboard.',
          },
        ],
      },
      is_published: true,
      updated_at: new Date().toISOString(),
    },
    pricing: {
      section_key: 'pricing',
      title: 'Transparent Worldwide Academic Subscriptions',
      subtitle: 'Access verified faculty across 190+ countries. Free to explore; upgrade for full worldwide contacts and autonomous outreach.',
      content: {
        plans: [
          {
            name: 'Free Explorer',
            tier: 'FREE',
            price: 'Free',
            pricePkr: 0,
            priceUsd: 0,
            period: 'forever',
            description: 'Basic sample preview with restricted country access and limited searches.',
            features: [
              '2 Preview Countries (Pakistan, Germany)',
              '3 Grounded Faculty Searches Total',
              '2 Sample Email Outreach Drafts',
              'Worldwide professors blurred after limit',
              'No autonomous AutoPilot engine',
            ],
            cta: 'Get Started Free',
            highlighted: false,
          },
          {
            name: 'Scholar Starter',
            tier: 'STARTER',
            price: 'Rs. 3,500 / $12',
            pricePkr: 3500,
            priceUsd: 12,
            period: 'month',
            description: 'Essential tools for graduate applicants targeting top 10 academic nations.',
            features: [
              '10+ Major Academic Countries (USA, UK, Canada, Germany, etc.)',
              '50 Grounded Searches / mo',
              '30 AI Cold Email Drafts / mo',
              'Basic AutoPilot (5 drafts/batch)',
              'Direct Institutional Email Access',
            ],
            cta: 'Get Starter',
            highlighted: false,
          },
          {
            name: 'Pro Researcher',
            tier: 'PRO',
            price: 'Rs. 8,000 / $29',
            pricePkr: 8000,
            priceUsd: 29,
            period: 'month',
            description: 'Broad international reach across 45+ countries with autonomous Gmail drafts.',
            features: [
              '45+ Global Destinations (Europe, US, UK, East Asia, Oceania)',
              '250 Grounded Searches / mo',
              '150 AI Grounded Drafts / mo',
              'Full AutoPilot (20 drafts/batch + Gmail)',
              'Phone & Lab Appointment Indexing',
            ],
            cta: 'Get Pro Researcher',
            highlighted: true,
          },
          {
            name: 'PhD Elite',
            tier: 'ELITE',
            price: 'Rs. 16,000 / $59',
            pricePkr: 16000,
            priceUsd: 59,
            period: 'month',
            description: 'Unrestricted worldwide access to all 190+ countries with high-capacity autonomous outreach.',
            features: [
              '🌐 100% Worldwide Access (190+ Countries)',
              'Unlimited Faculty Searches',
              'Unlimited AI Grounded Drafts',
              'AutoPilot Engine (Up to 500 Emails / mo)',
              'Direct Phone/Office & 1-on-1 Support',
            ],
            cta: 'Get PhD Elite',
            highlighted: false,
          },
        ],
      },
      is_published: true,
      updated_at: new Date().toISOString(),
    },
    faq: {
      section_key: 'faq',
      title: 'Frequently Asked Questions',
      subtitle: 'Clear answers on global coverage, email verification, and academic integrity.',
      content: {
        items: [
          {
            question: 'Is ProfMatch AI limited to specific countries?',
            answer: 'No. The platform covers universities and research institutes worldwide across 190+ countries, adapting to each country specific administrative structure (states, provinces, prefectures, counties).',
          },
          {
            question: 'Does this work for non-STEM and humanities fields?',
            answer: 'Yes. ProfMatch AI supports all legitimate academic disciplines — including Law, Business, Architecture, Social Sciences, History, and Agriculture — with discipline-appropriate email formatting and methodology analysis.',
          },
          {
            question: 'How do you ensure professor emails and papers are real?',
            answer: 'We never fabricate emails or research claims. Records are verified directly against official university portals, departmental directories, and scholarly registries (OpenAlex, Crossref). If an email cannot be verified, it is transparently labeled as unverified.',
          },
        ],
      },
      is_published: true,
      updated_at: new Date().toISOString(),
    },
  };

  public featureFlags: FeatureFlag[] = [
    { flag_key: 'PROFESSOR_DISCOVERY_ENABLED', name: 'Global Professor Discovery Engine', description: 'Enable multi-country and cross-disciplinary faculty search', is_enabled: true, updated_at: new Date().toISOString() },
    { flag_key: 'EMAIL_SENDING_ENABLED', name: 'Email Sending & Outreach', description: 'Enable direct personalized email dispatch', is_enabled: true, updated_at: new Date().toISOString() },
    { flag_key: 'AUTO_FOLLOWUPS_ENABLED', name: 'Automated Follow-ups', description: 'Enable multi-stage follow-up scheduling', is_enabled: true, updated_at: new Date().toISOString() },
    { flag_key: 'AI_REPLY_ASSISTANT_ENABLED', name: 'AI Reply Assistant', description: 'Analyze professor incoming replies and draft responses', is_enabled: true, updated_at: new Date().toISOString() },
    { flag_key: 'BILLING_ENABLED', name: 'Billing & Subscriptions', description: 'Stripe checkout and subscription management', is_enabled: true, updated_at: new Date().toISOString() },
    { flag_key: 'GLOBAL_SEARCH_EXPANSION', name: 'Interdisciplinary Query Expansion', description: 'Enable semantic query expansion and cross-department matching', is_enabled: true, updated_at: new Date().toISOString() },
  ];

  public auditLogs: AuditLogItem[] = [
    {
      id: 'log_1',
      user_id: 'usr_admin_001',
      user_email: 'admin@profmatch.ai',
      action: 'GLOBAL_UPGRADE_INITIALIZE',
      resource_type: 'SYSTEM',
      resource_id: 'global_v2',
      metadata: { status: 'Operational', global_countries_loaded: 190, academic_domains: 10 },
      ip_address: '127.0.0.1',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  public usageRecords: UsageRecord[] = [
    {
      id: 'usg_1',
      user_id: 'usr_student_001',
      month_year: '2026-09',
      searches_count: 14,
      ai_generations_count: 6,
      emails_sent_count: 1,
      updated_at: new Date().toISOString(),
    },
  ];

  public subscriptions: SubscriptionRecord[] = [
    {
      id: 'sub_1',
      user_id: 'usr_student_001',
      plan_type: 'STUDENT',
      status: 'active',
      current_period_start: new Date(Date.now() - 14 * 86400000).toISOString(),
      current_period_end: new Date(Date.now() + 16 * 86400000).toISOString(),
      cancel_at_period_end: false,
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // ----------------------------------------------------------
  // DISCOVERY JOBS & DATA QUALITY TELEMETRY
  // ----------------------------------------------------------
  public discoveryJobs: DiscoveryJob[] = [
    {
      id: 'job_1',
      country: 'Sweden',
      discipline: 'Sustainable Urban Development',
      query: 'Sustainable Cities',
      status: 'COMPLETED',
      progress_stage: 'Completed',
      progress_percent: 100,
      universities_found: 2,
      professors_found: 2,
      verified_count: 2,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      completed_at: new Date(Date.now() - 7180000).toISOString(),
    },
    {
      id: 'job_2',
      country: 'Pakistan',
      discipline: 'Biotechnology & Genetic Engineering',
      query: 'Biotechnology',
      status: 'COMPLETED',
      progress_stage: 'Completed',
      progress_percent: 100,
      universities_found: 1,
      professors_found: 1,
      verified_count: 1,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      completed_at: new Date(Date.now() - 3580000).toISOString(),
    },
  ];

  public dataQualityMetrics: DataQualityMetrics = {
    totalUniversities: 14,
    totalProfessors: 13,
    verifiedProfessors: 13,
    partiallyVerifiedProfessors: 0,
    unverifiedProfessors: 0,
    missingEmailsCount: 0,
    staleRecordsCount: 0,
    brokenSourcesCount: 0,
    duplicateProfessorsCount: 0,
    duplicateUniversitiesCount: 0,
    failedSearchesCount: 0,
  };

  // ----------------------------------------------------------
  // PAYMENT METHODS, ORDERS & MANUAL ACADEMIC VERIFICATION
  // ----------------------------------------------------------
  public paymentMethods: PaymentMethod[] = [
    {
      id: 'pm_sadapay_01',
      name: 'SadaPay (Fast Digital Wallet / IBFT)',
      type: 'mobile_wallet',
      country: 'Pakistan',
      country_code: 'PAK',
      currency: 'PKR',
      account_name: 'ProfMatch Billing Services',
      account_number: '03009876543',
      account_identifier: 'PK82SADA0000000300987654',
      instructions: '1. Open SadaPay App.\n2. Tap "Send Money" -> SadaPay or IBFT.\n3. Enter SadaPay Number: 0300-9876543 (IBAN: PK82SADA0000000300987654).\n4. Account Title: ProfMatch Billing Services.\n5. Copy the Transaction ID and upload the payment receipt screenshot below.',
      enabled: true,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'pm_nayapay_01',
      name: 'NayaPay (Instant Digital Wallet)',
      type: 'mobile_wallet',
      country: 'Pakistan',
      country_code: 'PAK',
      currency: 'PKR',
      account_name: 'ProfMatch AI Services',
      account_number: '03123456789',
      account_identifier: 'profmatch@nayapay',
      instructions: '1. Open NayaPay App.\n2. Send funds to NayaPay ID: profmatch@nayapay or Mobile: 0312-3456789.\n3. Account Title: ProfMatch AI Services.\n4. Take a screenshot of the successful transfer and attach it below with TRX ID.',
      enabled: true,
      sort_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'pm_meezan_01',
      name: 'Meezan Bank Ltd (Direct IBFT Transfer)',
      type: 'bank_transfer',
      country: 'Pakistan',
      country_code: 'PAK',
      currency: 'PKR',
      account_name: 'ProfMatch Global Private Limited',
      account_number: '01010102030405',
      account_identifier: 'PK56MEZN0001010102030405',
      instructions: '1. Log in to your banking app (HBL, Meezan, Alfalah, UBL, Allied, etc.).\n2. Choose Inter-Bank Funds Transfer (IBFT) to Meezan Bank.\n3. Enter IBAN: PK56MEZN0001010102030405 (Title: ProfMatch Global Private Limited).\n4. Enter order reference in transfer remarks and attach receipt screenshot.',
      enabled: true,
      sort_order: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'pm_jazzcash_01',
      name: 'JazzCash Mobile Account',
      type: 'mobile_wallet',
      country: 'Pakistan',
      country_code: 'PAK',
      currency: 'PKR',
      account_name: 'ProfMatch Education Services',
      account_number: '03001234567',
      account_identifier: '03001234567',
      instructions: '1. Open JazzCash App or dial *786#.\n2. Send money to Mobile Account 0300-1234567 (ProfMatch Education Services).\n3. Enter the 11-digit Transaction ID (TID) from the SMS.\n4. Upload your payment confirmation screenshot.',
      enabled: true,
      sort_order: 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'pm_easypaisa_01',
      name: 'EasyPaisa Mobile Account',
      type: 'mobile_wallet',
      country: 'Pakistan',
      country_code: 'PAK',
      currency: 'PKR',
      account_name: 'ProfMatch Education Services',
      account_number: '03451234567',
      account_identifier: '03451234567',
      instructions: '1. Open EasyPaisa App.\n2. Send money to 0345-1234567 (ProfMatch Education Services).\n3. Enter the TRX ID and attach payment receipt screenshot.',
      enabled: true,
      sort_order: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'pm_wise_global_01',
      name: 'Wise Transfer (USD / EUR / GBP / CAD)',
      type: 'bank_transfer',
      country: 'Global',
      currency: 'USD',
      account_name: 'ProfMatch AI Global LLC',
      account_number: 'wise_profmatch_global',
      account_identifier: 'billing@profmatch.ai',
      instructions: '1. Open your Wise account or Wise app.\n2. Transfer to Wise recipient email: billing@profmatch.ai or bank details provided.\n3. Account Title: ProfMatch AI Global LLC.\n4. Put your email in the payment reference.\n5. Attach your transfer confirmation receipt screenshot.',
      enabled: true,
      sort_order: 6,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'pm_crypto_usdt_01',
      name: 'Crypto USDT (TRC-20 / ERC-20 / Binance Pay)',
      type: 'other',
      country: 'Global',
      currency: 'USD',
      account_name: 'ProfMatch Treasury',
      account_number: 'TX9yZ1vKq7L8mNp4Rt2Ws5YbXc3VfGhJk',
      account_identifier: 'Binance Pay ID: 589234910',
      instructions: '1. Send USDT via TRC-20 Network to Address:\nTX9yZ1vKq7L8mNp4Rt2Ws5YbXc3VfGhJk\nOr via Binance Pay ID: 589234910.\n2. Copy TxHash / Transaction ID.\n3. Upload transaction completion screenshot.',
      enabled: true,
      sort_order: 7,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'pm_stripe_global_01',
      name: 'International Credit / Debit Card (Stripe)',
      type: 'card',
      country: 'Global',
      currency: 'USD',
      account_name: 'ProfMatch AI Inc.',
      account_number: 'visa_mastercard_amex',
      instructions: 'Instant activation for Visa, Mastercard, UnionPay, American Express via 256-bit encrypted checkout.',
      enabled: true,
      sort_order: 8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'pm_paypal_global_01',
      name: 'PayPal Academic Checkout',
      type: 'paypal',
      country: 'Global',
      currency: 'USD',
      account_name: 'ProfMatch AI Billing',
      account_number: 'billing@profmatch.ai',
      instructions: 'Secure payment via PayPal wallet or linked credit/debit card with buyer protection.',
      enabled: true,
      sort_order: 9,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  public orders: Order[] = [];

  public payments: Payment[] = [];

  public paymentProofs: PaymentProof[] = [];

  public getPaymentMethods(country?: string): PaymentMethod[] {
    if (!country || country === 'All' || country === 'Global') {
      return this.paymentMethods.filter(m => m.enabled);
    }
    return this.paymentMethods
      .filter(
        m => m.enabled && (m.country.toLowerCase() === country.toLowerCase() || m.country === 'Global')
      )
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  public getPaymentMethodById(id: string): PaymentMethod | undefined {
    return this.paymentMethods.find(m => m.id === id);
  }

  public savePaymentMethod(methodData: Partial<PaymentMethod> & { id?: string }): PaymentMethod {
    const existingIndex = methodData.id ? this.paymentMethods.findIndex(m => m.id === methodData.id) : -1;
    const now = new Date().toISOString();
    let result: PaymentMethod;

    if (existingIndex >= 0) {
      const updated: PaymentMethod = {
        ...this.paymentMethods[existingIndex],
        ...methodData,
        updated_at: now,
      };
      this.paymentMethods[existingIndex] = updated;
      result = updated;
    } else {
      const newMethod: PaymentMethod = {
        id: methodData.id || `pm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: methodData.name || 'Payment Method',
        type: methodData.type || 'other',
        country: methodData.country || 'Global',
        country_code: methodData.country_code,
        currency: methodData.currency || 'USD',
        account_name: methodData.account_name || '',
        account_number: methodData.account_number || '',
        account_identifier: methodData.account_identifier,
        instructions: methodData.instructions || '',
        logo: methodData.logo,
        enabled: methodData.enabled !== undefined ? methodData.enabled : true,
        sort_order: methodData.sort_order || this.paymentMethods.length + 1,
        created_at: now,
        updated_at: now,
      };
      this.paymentMethods.push(newMethod);
      result = newMethod;
    }
    this.persist();
    return result;
  }

  public deletePaymentMethod(id: string): boolean {
    const idx = this.paymentMethods.findIndex(m => m.id === id);
    if (idx >= 0) {
      this.paymentMethods.splice(idx, 1);
      this.persist();
      return true;
    }
    return false;
  }

  public createOrder(orderData: Partial<Order>): Order {
    const now = new Date().toISOString();
    const order: Order = {
      id: orderData.id || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      order_reference: orderData.order_reference || `PM-${Math.floor(100000 + Math.random() * 900000)}`,
      user_id: orderData.user_id || 'usr_student_001',
      user_email: orderData.user_email || 'student@example.com',
      user_name: orderData.user_name || 'Alex Vance',
      plan_tier: orderData.plan_tier || 'STUDENT',
      plan_name: orderData.plan_name || 'Graduate Applicant Pro',
      amount: orderData.amount || 19,
      currency: orderData.currency || 'USD',
      billing_interval: orderData.billing_interval || 'monthly',
      status: orderData.status || 'PENDING',
      payment_method_id: orderData.payment_method_id || '',
      payment_method_name: orderData.payment_method_name || '',
      created_at: now,
      updated_at: now,
    };
    this.orders.unshift(order);
    this.persist();
    return order;
  }

  public createPayment(paymentData: Partial<Payment>): Payment {
    const now = new Date().toISOString();
    const payment: Payment = {
      id: paymentData.id || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      order_id: paymentData.order_id || '',
      order_reference: paymentData.order_reference || '',
      user_id: paymentData.user_id || 'usr_student_001',
      user_email: paymentData.user_email || 'student@example.com',
      user_name: paymentData.user_name || 'Alex Vance',
      plan_tier: paymentData.plan_tier || 'STUDENT',
      plan_name: paymentData.plan_name || 'Graduate Applicant Pro',
      transaction_id: paymentData.transaction_id || '',
      payment_method_id: paymentData.payment_method_id || '',
      payment_method_name: paymentData.payment_method_name || '',
      amount: paymentData.amount || 0,
      currency: paymentData.currency || 'USD',
      proof_file_name: paymentData.proof_file_name,
      proof_file_url: paymentData.proof_file_url,
      payment_note: paymentData.payment_note,
      status: paymentData.status || 'PENDING',
      created_at: now,
      updated_at: now,
    };
    this.payments.unshift(payment);

    // Also update order status if matching
    const order = this.orders.find(o => o.order_reference === payment.order_reference);
    if (order) {
      order.status = payment.status;
      order.updated_at = now;
    }

    this.persist();
    return payment;
  }

  public updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    adminNote?: string,
    reviewerEmail: string = 'admin@profmatch.ai'
  ): { payment?: Payment; order?: Order; subscription?: SubscriptionRecord } {
    const payment = this.payments.find(p => p.id === paymentId);
    if (!payment) return {};

    const now = new Date().toISOString();
    payment.status = status;
    payment.admin_review_note = adminNote;
    payment.reviewed_by = reviewerEmail;
    payment.reviewed_at = now;
    payment.updated_at = now;

    // Update associated order
    const order = this.orders.find(o => o.order_reference === payment.order_reference);
    if (order) {
      order.status = status;
      order.updated_at = now;
    }

    let subscription: SubscriptionRecord | undefined;

    // If approved, activate or extend user subscription
    if (status === 'APPROVED') {
      const subIdx = this.subscriptions.findIndex(s => s.user_id === payment.user_id);
      const planTier = payment.plan_tier || order?.plan_tier || 'STUDENT';
      const durationMs = (order?.billing_interval === 'yearly' ? 365 : 30) * 86400000;

      if (subIdx >= 0) {
        this.subscriptions[subIdx].plan_type = planTier;
        this.subscriptions[subIdx].status = 'active';
        this.subscriptions[subIdx].current_period_start = now;
        this.subscriptions[subIdx].current_period_end = new Date(Date.now() + durationMs).toISOString();
        this.subscriptions[subIdx].updated_at = now;
        subscription = this.subscriptions[subIdx];
      } else {
        const newSub: SubscriptionRecord = {
          id: `sub_${Date.now()}`,
          user_id: payment.user_id,
          plan_type: planTier,
          status: 'active',
          current_period_start: now,
          current_period_end: new Date(Date.now() + durationMs).toISOString(),
          cancel_at_period_end: false,
          created_at: now,
          updated_at: now,
        };
        this.subscriptions.push(newSub);
        subscription = newSub;
      }

      // Log admin audit
      this.auditLogs.unshift({
        id: `log_${Date.now()}_audit`,
        user_id: 'usr_admin_001',
        user_email: reviewerEmail,
        action: 'PAYMENT_VERIFIED_AND_APPROVED',
        resource_type: 'PAYMENT',
        resource_id: payment.id,
        metadata: {
          order_reference: payment.order_reference,
          transaction_id: payment.transaction_id,
          amount: payment.amount,
          currency: payment.currency,
          plan_tier: planTier,
        },
        ip_address: '127.0.0.1',
        created_at: now,
      });
    } else if (status === 'REJECTED') {
      this.auditLogs.unshift({
        id: `log_${Date.now()}_audit_rej`,
        user_id: 'usr_admin_001',
        user_email: reviewerEmail,
        action: 'PAYMENT_REJECTED',
        resource_type: 'PAYMENT',
        resource_id: payment.id,
        metadata: {
          order_reference: payment.order_reference,
          reason: adminNote,
        },
        ip_address: '127.0.0.1',
        created_at: now,
      });
    }

    this.persist();
    return { payment, order, subscription };
  }

  public getConnectedEmailAccount(userId?: string): ConnectedEmailAccount | undefined {
    return this.connectedEmailAccounts.find(a => a.status === 'ACTIVE');
  }

  public saveConnectedEmailAccount(data: Partial<ConnectedEmailAccount> & { email: string; user_id?: string }): ConnectedEmailAccount {
    const existingIndex = this.connectedEmailAccounts.findIndex(a => a.provider === 'gmail');
    const now = new Date().toISOString();
    const targetUserId = data.user_id || 'global_user';

    if (existingIndex >= 0) {
      const updated: ConnectedEmailAccount = {
        ...this.connectedEmailAccounts[existingIndex],
        ...data,
        user_id: targetUserId,
        status: 'ACTIVE',
        connected_at: this.connectedEmailAccounts[existingIndex].connected_at || now,
        last_used_at: now,
      };
      this.connectedEmailAccounts[existingIndex] = updated;
      this.persist();
      return updated;
    } else {
      const newAcc: ConnectedEmailAccount = {
        id: data.id || `acc_gmail_${Date.now()}`,
        user_id: targetUserId,
        provider: 'gmail',
        email: data.email,
        google_account_id: data.google_account_id,
        access_token: data.access_token || '',
        refresh_token: data.refresh_token || '',
        token_expires_at: data.token_expires_at || Date.now() + 3600000,
        scopes: data.scopes || ['https://www.googleapis.com/auth/gmail.compose'],
        status: 'ACTIVE',
        connected_at: now,
        last_used_at: now,
      };
      this.connectedEmailAccounts.push(newAcc);
      this.persist();
      return newAcc;
    }
  }

  public deleteConnectedEmailAccount(userId?: string): boolean {
    if (this.connectedEmailAccounts.length > 0) {
      this.connectedEmailAccounts = [];
      this.persist();
      return true;
    }
    return false;
  }
}

// Global Singleton Store
const globalForMock = globalThis as unknown as { mockDb: MockDatabase };
export const mockDb = globalForMock.mockDb || new MockDatabase();
if (process.env.NODE_ENV !== 'production') globalForMock.mockDb = mockDb;
