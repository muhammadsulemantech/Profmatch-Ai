import type {
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
} from '../../types/database.ts';
import {
  DEMO_STUDENT_PROFILES,
  DEMO_ACADEMIC_PROFILES,
  DEMO_RESEARCH_PROFILES,
  DEMO_STUDENT_DOCUMENTS,
  DEMO_PROFESSORS,
  DEMO_RESEARCH_MATCHES,
  DEMO_EMAILS,
  DEMO_REPLIES,
  DEMO_APPLICATIONS,
} from '../data/demo-seed.ts';
function safeEncryptToken(plainText: string): string {
  if (!plainText || typeof window !== 'undefined') return plainText || '';
  try {
    const crypto = getNodeModule('crypto');
    if (!crypto) return plainText;
    const secret =
      process.env.ENCRYPTION_SECRET ||
      process.env.ADMIN_SECRET_PASSPHRASE ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      'profmatch-default-dev-secret-key-min-32-chars!!';
    const key = crypto.createHash('sha256').update(secret).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let enc = cipher.update(plainText, 'utf8', 'hex');
    enc += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${enc}`;
  } catch {
    return plainText;
  }
}

function safeDecryptToken(cipherText: string): string {
  if (!cipherText || !cipherText.startsWith('enc:') || typeof window !== 'undefined') return cipherText || '';
  try {
    const crypto = getNodeModule('crypto');
    if (!crypto) return '';
    const parts = cipherText.split(':');
    if (parts.length !== 4) return '';
    const secret =
      process.env.ENCRYPTION_SECRET ||
      process.env.ADMIN_SECRET_PASSPHRASE ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      'profmatch-default-dev-secret-key-min-32-chars!!';
    const key = crypto.createHash('sha256').update(secret).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(parts[1], 'hex'));
    decipher.setAuthTag(Buffer.from(parts[2], 'hex'));
    let dec = decipher.update(parts[3], 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  } catch {
    return '';
  }
}

declare const __non_webpack_require__: any;

function getNodeModule(name: string): any {
  if (typeof window !== 'undefined') return null;
  try {
    if (typeof process !== 'undefined' && typeof (process as any).getBuiltinModule === 'function') {
      return (process as any).getBuiltinModule(name);
    }
    if (typeof __non_webpack_require__ !== 'undefined') {
      return __non_webpack_require__(name);
    }
    // Avoid Webpack static analyzer by accessing through global context in pure Node environments
    const nodeReq = typeof globalThis !== 'undefined' ? (globalThis as any).require : undefined;
    if (typeof nodeReq === 'function') {
      return nodeReq(name);
    }
  } catch {
    return null;
  }
  return null;
}

function mergeRecordsByKey<T extends Record<string, any>>(inMemory: T[], fromDisk: T[], key: keyof T): T[] {
  if (!Array.isArray(fromDisk) || fromDisk.length === 0) return inMemory;
  if (!Array.isArray(inMemory) || inMemory.length === 0) return fromDisk;
  const map = new Map<any, T>();
  for (const item of fromDisk) {
    if (item && item[key] !== undefined) map.set(item[key], item);
  }
  for (const item of inMemory) {
    if (item && item[key] !== undefined) {
      const existing = map.get(item[key]);
      if (!existing) {
        map.set(item[key], item);
      } else {
        const memTime = item.updated_at ? new Date(item.updated_at).getTime() : 0;
        const diskTime = existing.updated_at ? new Date(existing.updated_at).getTime() : 0;
        if (memTime >= diskTime) {
          map.set(item[key], item);
        }
      }
    }
  }
  return Array.from(map.values());
}

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
      const fs = getNodeModule('fs');
      const path = getNodeModule('path');
      if (!fs || typeof fs.existsSync !== 'function' || !path) return;
      const dbPath = path.join(process.cwd(), 'database', 'persistent_store.json');
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, 'utf-8');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.siteSettings) this.siteSettings = { ...this.siteSettings, ...parsed.siteSettings };
          if (parsed.siteContent) this.siteContent = { ...this.siteContent, ...parsed.siteContent };
          if (parsed.paymentMethods) {
            const diskMethods = parsed.paymentMethods;
            const defaults = this.paymentMethods;
            const merged = [...diskMethods];
            for (const def of defaults) {
              if (!merged.some((m: any) => m.id === def.id || m.name.toLowerCase() === def.name.toLowerCase())) {
                merged.push(def);
              }
            }
            this.paymentMethods = merged;
          }
          if (parsed.orders) this.orders = mergeRecordsByKey(this.orders, parsed.orders, 'id');
          if (parsed.payments) this.payments = mergeRecordsByKey(this.payments, parsed.payments, 'id');
          if (parsed.featureFlags) this.featureFlags = parsed.featureFlags;
          if (parsed.profiles) this.profiles = mergeRecordsByKey(this.profiles, parsed.profiles, 'id');
          if (parsed.studentProfiles) this.studentProfiles = mergeRecordsByKey(this.studentProfiles, parsed.studentProfiles, 'user_id');
          if (parsed.auditLogs) this.auditLogs = parsed.auditLogs;
          if (parsed.subscriptions) this.subscriptions = mergeRecordsByKey(this.subscriptions, parsed.subscriptions, 'user_id');
          if (parsed.universities) this.universities = parsed.universities;
          if (parsed.professors) this.professors = parsed.professors;
          if (parsed.connectedEmailAccounts) this.connectedEmailAccounts = mergeRecordsByKey(this.connectedEmailAccounts, parsed.connectedEmailAccounts, 'user_id');
          if (parsed.usageRecords) {
            const mergedUsage = new Map<string, UsageRecord>();
            for (const u of parsed.usageRecords) {
              if (u?.user_id) mergedUsage.set(`${u.user_id}:${u.month_year || ''}`, u);
            }
            for (const u of this.usageRecords) {
              if (u?.user_id) {
                const k = `${u.user_id}:${u.month_year || ''}`;
                const diskU = mergedUsage.get(k);
                if (!diskU) {
                  mergedUsage.set(k, u);
                } else {
                  mergedUsage.set(k, {
                    ...diskU,
                    ...u,
                    searches_count: Math.max(u.searches_count || 0, diskU.searches_count || 0),
                    ai_generations_count: Math.max(u.ai_generations_count || 0, diskU.ai_generations_count || 0),
                    emails_sent_count: Math.max(u.emails_sent_count || 0, diskU.emails_sent_count || 0),
                    autopilot_count: Math.max(u.autopilot_count || 0, diskU.autopilot_count || 0),
                  });
                }
              }
            }
            this.usageRecords = Array.from(mergedUsage.values());
          }
          if (parsed.emails) this.emails = parsed.emails;
          if (parsed.userActivities) this.userActivities = parsed.userActivities;
        }
      } else {
        this.saveToDisk();
      }
    } catch {
      // Ignore transient concurrent file read/write race in test workers
    }
  }

  public saveToDisk() {
    if (typeof window !== 'undefined') return;
    try {
      const fs = getNodeModule('fs');
      const path = getNodeModule('path');
      if (!fs || typeof fs.existsSync !== 'function' || !path) return;
      const dbPath = path.join(process.cwd(), 'database', 'persistent_store.json');
      const dataToSave = {
        siteSettings: this.siteSettings,
        siteContent: this.siteContent,
        paymentMethods: this.paymentMethods,
        orders: this.orders,
        payments: this.payments,
        featureFlags: this.featureFlags,
        profiles: this.profiles,
        studentProfiles: this.studentProfiles,
        auditLogs: this.auditLogs,
        subscriptions: this.subscriptions,
        universities: this.universities,
        professors: this.professors,
        connectedEmailAccounts: this.connectedEmailAccounts,
        usageRecords: this.usageRecords,
        emails: this.emails,
        userActivities: this.userActivities,
      };
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const serialized = JSON.stringify(dataToSave, null, 2);
      const tmpPath = `${dbPath}.${process.pid}.${Date.now()}.tmp`;
      try {
        fs.writeFileSync(tmpPath, serialized, 'utf-8');
        fs.renameSync(tmpPath, dbPath);
      } catch {
        try {
          if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        } catch { }
        fs.writeFileSync(dbPath, serialized, 'utf-8');
      }
    } catch {
      // Non-blocking fallback persistence
    }
  }

  /**
   * Automatically saves any newly signed-up or logged-in user permanently to disk and database
   */
  public autoSaveUser(userData: {
    id?: string;
    email: string;
    full_name?: string | null;
    avatar_url?: string | null;
    role?: string;
    target_degree?: string;
  }): UserProfile {
    this.loadFromDisk();

    const email = (userData.email || '').toLowerCase().trim();
    if (!email) {
      throw new Error('Email is required to auto-save user.');
    }

    const isAdmin = email === 'sulemanmunir6752@gmail.com' || email === 'admin@profmatch.ai';
    const now = new Date().toISOString();

    const existing = this.profiles.find(
      p => p.email.toLowerCase() === email || (userData.id && p.id === userData.id)
    );

    if (existing) {
      if (userData.full_name && userData.full_name !== existing.full_name) {
        existing.full_name = userData.full_name;
      }
      if (userData.avatar_url && !existing.avatar_url) {
        existing.avatar_url = userData.avatar_url;
      }
      if (isAdmin) {
        existing.role = 'ADMIN';
      }
      existing.updated_at = now;

      // Ensure subscription exists
      const hasSub = this.subscriptions.some(s => s.user_id === existing.id);
      if (!hasSub) {
        this.subscriptions.push({
          id: `sub_${existing.id}`,
          user_id: existing.id,
          plan_type: 'FREE',
          status: 'active',
          current_period_start: now,
          current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
          cancel_at_period_end: false,
          created_at: now,
          updated_at: now,
        });
      }

      this.persist();
      return existing;
    }

    const newUserId = userData.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newUser: UserProfile = {
      id: newUserId,
      email,
      full_name: userData.full_name || email.split('@')[0],
      avatar_url: userData.avatar_url || null,
      role: isAdmin ? 'ADMIN' : ((userData.role as any) || 'USER'),
      is_suspended: false,
      created_at: now,
      updated_at: now,
    };

    this.profiles.push(newUser);

    // Auto-create default student profile
    this.studentProfiles.push({
      id: `std_${newUserId}`,
      user_id: newUserId,
      country: 'Global',
      target_degree: userData.target_degree || 'PhD',
      target_country: 'Global',
      target_state: null,
      target_intake: 'Fall 2027',
      funding_preference: 'Fully Funded',
      desired_field: 'Academic Research',
      bio: `Registered applicant (${newUser.full_name})`,
      created_at: now,
      updated_at: now,
    });

    // Auto-create default subscription
    this.subscriptions.push({
      id: `sub_${newUserId}`,
      user_id: newUserId,
      plan_type: 'FREE',
      status: 'active',
      current_period_start: now,
      current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
      cancel_at_period_end: false,
      created_at: now,
      updated_at: now,
    });

    this.persist();

    return newUser;
  }

  public connectedEmailAccounts: ConnectedEmailAccount[] = [];
  public userActivities: Record<string, any> = {};

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

  public studentProfiles: StudentProfile[] = DEMO_STUDENT_PROFILES.map((item) => ({ ...item }));

  public academicProfiles: AcademicProfile[] = DEMO_ACADEMIC_PROFILES.map((item) => ({ ...item }));

  public researchProfiles: ResearchProfile[] = DEMO_RESEARCH_PROFILES.map((item) => ({ ...item }));

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

  public studentDocuments: StudentDocument[] = DEMO_STUDENT_DOCUMENTS.map((item) => ({ ...item }));

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
  public professors: Professor[] = DEMO_PROFESSORS.map((item) => ({ ...item }));

  public researchMatches: ResearchMatch[] = DEMO_RESEARCH_MATCHES.map((item) => ({ ...item }));

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

  public emails: OutreachEmail[] = DEMO_EMAILS.map((item) => ({ ...item }));

  public replies: ReplyRecord[] = DEMO_REPLIES.map((item) => ({ ...item }));

  public applications: ApplicationTrackerItem[] = DEMO_APPLICATIONS.map((item) => ({ ...item }));

  public siteSettings: SiteSettings = {
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
            searchesLimit: 3,
            draftsLimit: 2,
            autopilotLimit: 0,
            autopilotBatchLimit: 0,
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
            searchesLimit: 50,
            draftsLimit: 30,
            autopilotLimit: 5,
            autopilotBatchLimit: 5,
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
            highlighted: true,
          },
          {
            name: 'Pro Researcher',
            tier: 'PRO',
            price: 'Rs. 8,000 / $29',
            pricePkr: 8000,
            priceUsd: 29,
            searchesLimit: 250,
            draftsLimit: 150,
            autopilotLimit: 20,
            autopilotBatchLimit: 20,
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
            searchesLimit: 999999,
            draftsLimit: 999999,
            autopilotLimit: 500,
            autopilotBatchLimit: 500,
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

  public isTransactionIdUsed(transactionId: string): boolean {
    if (!transactionId) return false;
    const clean = transactionId.trim().toLowerCase();
    return this.payments.some(p => p.transaction_id && p.transaction_id.trim().toLowerCase() === clean);
  }

  public getOrderByReference(orderReference: string): Order | undefined {
    return this.orders.find(o => o.order_reference === orderReference);
  }

  public getUserSubscription(userId: string): SubscriptionRecord | undefined {
    return this.subscriptions.find(s => s.user_id === userId && s.status === 'active');
  }

  public getUserPlanTier(userId: string): PlanTier {
    const sub = this.getUserSubscription(userId);
    if (sub && sub.plan_type) {
      if (sub.current_period_end && new Date(sub.current_period_end).getTime() < Date.now()) {
        return 'FREE';
      }
      return sub.plan_type;
    }
    return 'FREE';
  }

  public getCurrentMonthYear(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  public getUsageRecord(userId: string, monthYear?: string): UsageRecord {
    const ym = monthYear || this.getCurrentMonthYear();
    let record = this.usageRecords.find(u => u.user_id === userId && u.month_year === ym);
    if (!record) {
      const suffix = Math.random().toString(36).substring(2, 8);
      record = {
        id: `usg_${Date.now()}_${suffix}`,
        user_id: userId,
        month_year: ym,
        searches_count: 0,
        ai_generations_count: 0,
        emails_sent_count: 0,
        autopilot_count: 0,
        updated_at: new Date().toISOString(),
      };
      this.usageRecords.push(record);
      this.persist();
    }
    return record;
  }

  public incrementUsage(
    userId: string,
    field: 'searches_count' | 'ai_generations_count' | 'emails_sent_count' | 'autopilot_count',
    delta: number = 1
  ): UsageRecord {
    const record = this.getUsageRecord(userId);
    record[field] = (record[field] || 0) + delta;
    record.updated_at = new Date().toISOString();
    this.persist();
    return record;
  }

  public createOrder(orderData: Partial<Order>): Order {
    const now = new Date().toISOString();
    const hex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const order: Order = {
      id: orderData.id || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      order_reference: orderData.order_reference || `PM-${Date.now()}-${hex}`,
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
    if (!userId) return undefined;
    const acc = this.connectedEmailAccounts.find(a => a.user_id === userId && a.status === 'ACTIVE');
    if (!acc) return undefined;

    return {
      ...acc,
      access_token: safeDecryptToken(acc.access_token),
      refresh_token: safeDecryptToken(acc.refresh_token),
    };
  }

  public saveConnectedEmailAccount(data: Partial<ConnectedEmailAccount> & { email: string; user_id?: string }): ConnectedEmailAccount {
    const targetUserId = data.user_id;
    if (!targetUserId) {
      throw new Error('user_id is required to connect email account');
    }

    const existingIndex = this.connectedEmailAccounts.findIndex(
      a => a.user_id === targetUserId && a.provider === 'gmail'
    );
    const now = new Date().toISOString();

    const encryptedAccessToken = data.access_token ? safeEncryptToken(data.access_token) : undefined;
    const encryptedRefreshToken = data.refresh_token ? safeEncryptToken(data.refresh_token) : undefined;

    if (existingIndex >= 0) {
      const existing = this.connectedEmailAccounts[existingIndex];
      const updated: ConnectedEmailAccount = {
        ...existing,
        ...data,
        user_id: targetUserId,
        status: 'ACTIVE',
        access_token: encryptedAccessToken !== undefined ? encryptedAccessToken : existing.access_token,
        refresh_token: encryptedRefreshToken !== undefined ? encryptedRefreshToken : existing.refresh_token,
        connected_at: existing.connected_at || now,
        last_used_at: now,
      };
      this.connectedEmailAccounts[existingIndex] = updated;
      this.persist();
      return {
        ...updated,
        access_token: data.access_token || safeDecryptToken(updated.access_token),
        refresh_token: data.refresh_token || safeDecryptToken(updated.refresh_token),
      };
    } else {
      const newAcc: ConnectedEmailAccount = {
        id: data.id || `acc_gmail_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        user_id: targetUserId,
        provider: 'gmail',
        email: data.email,
        google_account_id: data.google_account_id,
        access_token: encryptedAccessToken || '',
        refresh_token: encryptedRefreshToken || '',
        token_expires_at: data.token_expires_at || Date.now() + 3600000,
        scopes: data.scopes || ['https://www.googleapis.com/auth/gmail.compose'],
        status: 'ACTIVE',
        connected_at: now,
        last_used_at: now,
      };
      this.connectedEmailAccounts.push(newAcc);
      this.persist();
      return {
        ...newAcc,
        access_token: data.access_token || '',
        refresh_token: data.refresh_token || '',
      };
    }
  }

  public deleteConnectedEmailAccount(userId?: string): boolean {
    if (!userId) return false;
    const initialLen = this.connectedEmailAccounts.length;
    this.connectedEmailAccounts = this.connectedEmailAccounts.filter(a => a.user_id !== userId);
    if (this.connectedEmailAccounts.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }
}

// Global Singleton Store
const globalForMock = globalThis as unknown as { mockDb: MockDatabase };
if (!globalForMock.mockDb) {
  globalForMock.mockDb = new MockDatabase();
} else {
  Object.setPrototypeOf(globalForMock.mockDb, MockDatabase.prototype);
}
export const mockDb = globalForMock.mockDb;

