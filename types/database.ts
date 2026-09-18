// ==========================================================
// PROFMATCH AI — CORE DATABASE & DOMAIN TYPES
// ==========================================================

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'SUPPORT';
export type VerificationStatus = 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'UNVERIFIED' | 'SOURCE_UNAVAILABLE' | 'STALE' | 'PENDING' | 'FLAGGED';
export type EmailVerificationStatus = 'VERIFIED' | 'LIKELY' | 'UNVERIFIED' | 'NOT_FOUND';
export type RecruitingStatus = 'VERIFIED_RECRUITING' | 'POSSIBLY_RECRUITING' | 'NO_PUBLIC_INFORMATION' | 'NOT_RECRUITING' | 'UNKNOWN' | 'ACTIVELY_RECRUITING' | 'POTENTIALLY_RECRUITING';
export type OutreachStatus = 'NOT_CONTACTED' | 'DRAFT' | 'APPROVED' | 'SENT' | 'DELIVERED' | 'OPENED' | 'REPLIED' | 'POSITIVE' | 'NEGATIVE' | 'FOLLOW_UP_DUE' | 'CLOSED';
export type PlanTier = 'FREE' | 'STUDENT' | 'PRO';
export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type FreshnessStatus = 'FRESH' | 'STALE' | 'NEEDS_REVERIFY';

export type AcademicRole =
  | 'Professor'
  | 'Associate Professor'
  | 'Assistant Professor'
  | 'Lecturer'
  | 'Senior Lecturer'
  | 'Research Professor'
  | 'Research Scientist'
  | 'Research Fellow'
  | 'Principal Investigator'
  | 'Faculty Member'
  | 'Academic Staff';

export type AcademicUnitType =
  | 'Department'
  | 'Faculty'
  | 'School'
  | 'College'
  | 'Institute'
  | 'Research Center'
  | 'Research Lab'
  | 'Research Group';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_suspended: boolean;
  suspension_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  country: string | null;
  target_degree: string | null;
  target_country: string;
  target_state: string | null;
  target_region?: string | null;
  target_city?: string | null;
  target_intake: string | null;
  funding_preference: string;
  desired_field: string | null;
  desired_domain?: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface AcademicProfile {
  id: string;
  student_id: string;
  current_degree: string;
  major: string;
  university: string;
  graduation_year: number;
  cgpa: number;
  grading_scale: string;
  achievements?: string;
  created_at: string;
  updated_at: string;
}

export interface ResearchProfile {
  id: string;
  student_id: string;
  research_interests: string[];
  thesis_title?: string;
  thesis_abstract?: string;
  experience_summary?: string;
  academic_domain?: string;
  primary_discipline?: string;
  secondary_disciplines?: string[];
  created_at: string;
  updated_at: string;
}

export interface StudentSkill {
  id: string;
  student_id: string;
  skill_name: string;
  category: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  created_at: string;
}

export interface StudentProject {
  id: string;
  student_id: string;
  title: string;
  description: string;
  technologies: string[];
  link?: string;
  role?: string;
  created_at: string;
}

export interface StudentPublication {
  id: string;
  student_id: string;
  title: string;
  journal_conference: string;
  year: number;
  doi?: string;
  url?: string;
  abstract?: string;
  created_at: string;
}

export interface StudentDocument {
  id: string;
  student_id: string;
  document_type: 'CV' | 'Resume' | 'Research Proposal' | 'SOP';
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

// ----------------------------------------------------------
// GLOBAL GEOGRAPHY & UNIVERSITY ENTITIES
// ----------------------------------------------------------

export interface Country {
  code: string; // ISO 2 or 3
  name: string;
  region_label: string; // e.g., 'State', 'Province', 'Prefecture', 'Canton', 'County', 'Region'
  continent: string;
  top_universities_count?: number;
}

export interface University {
  id: string;
  name: string;
  country: string;
  country_code?: string;
  state?: string; // backwards compatibility
  region?: string;
  region_type?: string; // State, Province, Prefecture, County, etc.
  city?: string;
  website_url?: string;
  domain?: string;
  ranking?: number;
  acceptance_rate?: number;
  is_verified: boolean;
  academic_units_count?: number;
  verified_at?: string;
  source_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AcademicUnit {
  id: string;
  university_id: string;
  university_name?: string;
  name: string;
  unit_type: AcademicUnitType;
  parent_unit_id?: string;
  discipline: string;
  domain: string;
  website_url?: string;
  faculty_count?: number;
  created_at: string;
}

export interface Department {
  id: string;
  university_id: string;
  name: string;
  field: string;
  website_url?: string;
  created_at: string;
}

export interface ProfessorPublication {
  id: string;
  professor_id: string;
  title: string;
  year: number;
  venue: string;
  citations_count: number;
  doi?: string;
  abstract?: string;
  url?: string;
  source_provider?: string; // OpenAlex, Crossref, Semantic Scholar, University
  created_at: string;
}

export interface ProfessorSource {
  id: string;
  professor_id: string;
  source_type: 'UNIVERSITY_FACULTY_PAGE' | 'LAB_PAGE' | 'PUB_METADATA' | 'SCHOLAR_PAGE' | 'DEPARTMENT_DIRECTORY';
  source_url: string;
  snippet?: string;
  verified_at: string;
  confidence_score?: number;
}

export interface Professor {
  id: string;
  university_id: string;
  university_name?: string;
  university_country?: string;
  university_state?: string;
  university_region?: string;
  university_city?: string;
  department_id?: string;
  department_name?: string;
  academic_unit_id?: string;
  academic_unit_name?: string;
  academic_unit_type?: AcademicUnitType;
  academic_domain?: string;
  primary_discipline?: string;
  interdisciplinary_tags?: string[];
  name: string;
  title: string; // Real official title e.g. "Associate Professor", "Research Scientist", "Lecturer"
  real_title?: string;
  university?: University | string;
  position: string;
  email: string | null;
  email_verification_status?: EmailVerificationStatus;
  phone?: string;
  office?: string;
  profile_url: string;
  lab_url?: string;
  google_scholar_url?: string;
  orcid?: string;
  research_interests: string[];
  keywords: string[];
  recruiting_status: RecruitingStatus;
  recruiting_notes?: string;
  recruiting_evidence?: string;
  confidence_score: number;
  verification_status: VerificationStatus;
  freshness_status?: FreshnessStatus;
  last_verified_at?: string;
  last_checked_at?: string;
  publications?: ProfessorPublication[];
  sources?: ProfessorSource[];
  created_at: string;
  updated_at: string;
}

export interface ResearchMatch {
  id: string;
  user_id: string;
  professor_id: string;
  overall_score: number;
  research_score: number;
  project_score: number;
  skills_score: number;
  publication_score: number;
  explanation: string;
  breakdown: {
    matched_topics: string[];
    relevant_student_projects: string[];
    relevant_professor_papers: string[];
    suggested_angle: string;
    interdisciplinary_alignment?: string;
  };
  generated_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  target_intake: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  professors_count?: number;
  emails_sent_count?: number;
  replies_count?: number;
  created_at: string;
  updated_at: string;
}

export interface OutreachEmail {
  id: string;
  campaign_id?: string;
  user_id: string;
  professor_id: string;
  professor?: Professor;
  subject: string;
  body_html?: string;
  body_text: string;
  personalization_notes: string[];
  source_references: {
    type: string;
    title: string;
    url: string;
    context: string;
  }[];
  status: OutreachStatus;
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReplyRecord {
  id: string;
  email_id: string;
  professor_id: string;
  professor_name?: string;
  sender_email: string;
  subject: string;
  body_text: string;
  summary: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'MEETING_REQUESTED';
  suggested_response?: string;
  status: 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED';
  received_at: string;
}

export interface ApplicationTrackerItem {
  id: string;
  user_id: string;
  university_id: string;
  university_name?: string;
  professor_id?: string;
  professor_name?: string;
  program_name: string;
  degree: string;
  intake: string;
  deadline?: string;
  status: 'Shortlisted' | 'Contacted' | 'Applied' | 'Interview' | 'Offer' | 'Rejected';
  funding_status: 'Not Applied' | 'Pending' | 'Secured' | 'Denied';
  portal_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SiteContentSection {
  id?: string;
  section_key: string;
  title: string;
  subtitle?: string;
  content: Record<string, any>;
  is_published: boolean;
  updated_at?: string;
  updated_by?: string;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  supportEmail: string;
  primaryEmail: string;
  defaultCountry: string;
  maintenanceMode: boolean;
  announcement?: {
    enabled: boolean;
    message: string;
    link: string;
  };
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

export interface ConnectedEmailAccount {
  id: string;
  user_id: string;
  provider: 'gmail';
  email: string;
  google_account_id?: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: number;
  scopes: string[];
  status: 'ACTIVE' | 'EXPIRED' | 'DISCONNECTED';
  connected_at: string;
  last_used_at?: string;
}

export interface FeatureFlag {
  id?: string;
  flag_key: string;
  name: string;
  description: string;
  is_enabled: boolean;
  updated_at?: string;
}

export interface AuditLogItem {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface UsageRecord {
  id: string;
  user_id: string;
  month_year: string;
  searches_count: number;
  ai_generations_count: number;
  emails_sent_count: number;
  updated_at: string;
}

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  plan_type: PlanTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------
// DISCOVERY JOBS & DATA QUALITY TELEMETRY
// ----------------------------------------------------------

export interface DiscoveryJob {
  id: string;
  country: string;
  region?: string;
  discipline: string;
  query?: string;
  status: JobStatus;
  progress_stage: string;
  progress_percent: number;
  universities_found: number;
  professors_found: number;
  verified_count: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface DataQualityMetrics {
  totalUniversities: number;
  totalProfessors: number;
  verifiedProfessors: number;
  partiallyVerifiedProfessors: number;
  unverifiedProfessors: number;
  missingEmailsCount: number;
  staleRecordsCount: number;
  brokenSourcesCount: number;
  duplicateProfessorsCount: number;
  duplicateUniversitiesCount: number;
  failedSearchesCount: number;
}

// ----------------------------------------------------------
// PAYMENT METHODS, ORDERS & MANUAL VERIFICATION ENTITIES
// ----------------------------------------------------------

export type PaymentMethodType =
  | 'mobile_wallet'
  | 'bank_transfer'
  | 'card'
  | 'paypal'
  | 'stripe'
  | 'crypto'
  | 'other';

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  country: string; // 'Pakistan', 'United States', 'Global', etc.
  country_code?: string;
  currency: string; // 'PKR', 'USD', 'GBP', 'EUR', etc.
  account_name: string;
  account_number: string;
  account_identifier?: string; // IBAN, routing number, wallet address, email
  instructions: string;
  logo?: string;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export type PaymentStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface Order {
  id: string;
  order_reference: string; // e.g. PM-742910
  user_id: string;
  user_email: string;
  user_name?: string;
  plan_tier: PlanTier;
  plan_name: string;
  amount: number;
  currency: string;
  billing_interval: 'monthly' | 'yearly';
  status: PaymentStatus;
  payment_method_id: string;
  payment_method_name: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  order_reference: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  plan_tier?: PlanTier;
  plan_name?: string;
  transaction_id: string;
  payment_method_id: string;
  payment_method_name: string;
  amount: number;
  currency: string;
  proof_file_name?: string;
  proof_file_url?: string;
  payment_note?: string;
  status: PaymentStatus;
  admin_review_note?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentProof {
  id: string;
  payment_id: string;
  order_reference: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string; // Private or base64 data url for preview
  uploaded_at: string;
}

