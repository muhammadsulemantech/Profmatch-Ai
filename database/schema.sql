-- ==========================================================
-- PROFMATCH AI — PRODUCTION POSTGRESQL SCHEMA WITH RLS
-- ==========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum Types
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN', 'SUPPORT');
CREATE TYPE verification_status AS ENUM ('VERIFIED', 'PARTIALLY_VERIFIED', 'UNVERIFIED', 'SOURCE_UNAVAILABLE', 'STALE', 'PENDING', 'FLAGGED');
CREATE TYPE recruiting_status AS ENUM ('ACTIVELY_RECRUITING', 'POTENTIALLY_RECRUITING', 'VERIFIED_RECRUITING', 'POSSIBLY_RECRUITING', 'NO_PUBLIC_INFORMATION', 'NOT_RECRUITING', 'UNKNOWN');
CREATE TYPE outreach_status AS ENUM ('NOT_CONTACTED', 'DRAFT', 'APPROVED', 'SENT', 'DELIVERED', 'OPENED', 'REPLIED', 'POSITIVE', 'NEGATIVE', 'FOLLOW_UP_DUE', 'CLOSED');
CREATE TYPE plan_tier AS ENUM ('FREE', 'STARTER', 'PRO', 'ELITE', 'STUDENT');
CREATE TYPE job_status AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- 1. Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'USER'::user_role NOT NULL,
    is_suspended BOOLEAN DEFAULT FALSE NOT NULL,
    suspension_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Student Profiles
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    country TEXT,
    target_degree TEXT,
    target_country TEXT DEFAULT 'USA',
    target_state TEXT,
    target_intake TEXT,
    funding_preference TEXT DEFAULT 'Fully Funded',
    desired_field TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Academic Profiles
CREATE TABLE IF NOT EXISTS public.academic_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE UNIQUE,
    current_degree TEXT,
    major TEXT,
    university TEXT,
    graduation_year INTEGER,
    cgpa NUMERIC(4,2),
    grading_scale TEXT DEFAULT '4.0',
    achievements TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Research Profiles
CREATE TABLE IF NOT EXISTS public.research_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE UNIQUE,
    research_interests JSONB DEFAULT '[]'::jsonb,
    thesis_title TEXT,
    thesis_abstract TEXT,
    experience_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Student Skills
CREATE TABLE IF NOT EXISTS public.student_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    category TEXT DEFAULT 'Technical',
    proficiency TEXT DEFAULT 'Advanced',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Student Projects
CREATE TABLE IF NOT EXISTS public.student_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    technologies JSONB DEFAULT '[]'::jsonb,
    link TEXT,
    role TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Student Publications
CREATE TABLE IF NOT EXISTS public.student_publications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    journal_conference TEXT,
    year INTEGER,
    doi TEXT,
    url TEXT,
    abstract TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Student Documents
CREATE TABLE IF NOT EXISTS public.student_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- 'CV', 'Resume', 'Research Proposal', 'SOP'
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Universities
CREATE TABLE IF NOT EXISTS public.universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    state TEXT,
    city TEXT,
    website_url TEXT,
    domain TEXT,
    ranking INTEGER,
    acceptance_rate NUMERIC(4,2),
    is_verified BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Departments / Academic Units
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    field TEXT NOT NULL,
    academic_unit_type TEXT DEFAULT 'DEPARTMENT', -- 'FACULTY', 'DEPARTMENT', 'SCHOOL', 'INSTITUTE', 'CHAIR', 'RESEARCH_CENTER'
    parent_unit_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    website_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Professors
CREATE TABLE IF NOT EXISTS public.professors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    title TEXT,
    real_title TEXT, -- Official title: 'Full Professor', 'Associate Professor', 'Senior Lecturer', 'Research Scientist', etc.
    position TEXT,
    email TEXT,
    email_verification_status TEXT DEFAULT 'UNVERIFIED', -- 'VERIFIED', 'LIKELY', 'UNVERIFIED', 'NOT_FOUND'
    phone TEXT,
    office TEXT,
    profile_url TEXT NOT NULL,
    lab_url TEXT,
    google_scholar_url TEXT,
    research_interests JSONB DEFAULT '[]'::jsonb NOT NULL,
    interdisciplinary_tags JSONB DEFAULT '[]'::jsonb NOT NULL,
    keywords JSONB DEFAULT '[]'::jsonb NOT NULL,
    recruiting_status recruiting_status DEFAULT 'UNKNOWN'::recruiting_status NOT NULL,
    recruiting_notes TEXT,
    recruiting_evidence JSONB DEFAULT '{}'::jsonb,
    freshness_status TEXT DEFAULT 'FRESH', -- 'FRESH', 'VERIFIED_RECENTLY', 'STALE'
    confidence_score NUMERIC(5,2) DEFAULT 0.95,
    verification_status verification_status DEFAULT 'UNVERIFIED'::verification_status NOT NULL,
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11b. Discovery Jobs
CREATE TABLE IF NOT EXISTS public.discovery_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    country TEXT NOT NULL,
    region TEXT,
    academic_field TEXT NOT NULL,
    interdisciplinary BOOLEAN DEFAULT FALSE,
    target_universities JSONB DEFAULT '[]'::jsonb,
    stage_index INTEGER DEFAULT 0,
    status TEXT DEFAULT 'QUEUED', -- 'QUEUED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'
    candidates_found INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMPTZ
);

-- 12. Professor Publications
CREATE TABLE IF NOT EXISTS public.professor_publications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professor_id UUID NOT NULL REFERENCES public.professors(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    year INTEGER,
    venue TEXT,
    citations_count INTEGER DEFAULT 0,
    doi TEXT,
    abstract TEXT,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Professor Sources
CREATE TABLE IF NOT EXISTS public.professor_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professor_id UUID NOT NULL REFERENCES public.professors(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL, -- 'UNIVERSITY_FACULTY_PAGE', 'LAB_PAGE', 'PUB_METADATA'
    source_url TEXT NOT NULL,
    snippet TEXT,
    verified_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. Searches
CREATE TABLE IF NOT EXISTS public.searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    query_text TEXT,
    filters JSONB DEFAULT '{}'::jsonb NOT NULL,
    results_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. Saved Professors
CREATE TABLE IF NOT EXISTS public.saved_professors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    professor_id UUID NOT NULL REFERENCES public.professors(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, professor_id)
);

-- 16. Research Matches
CREATE TABLE IF NOT EXISTS public.research_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    professor_id UUID NOT NULL REFERENCES public.professors(id) ON DELETE CASCADE,
    overall_score NUMERIC(5,2) NOT NULL,
    research_score NUMERIC(5,2) NOT NULL,
    project_score NUMERIC(5,2) NOT NULL,
    skills_score NUMERIC(5,2) NOT NULL,
    publication_score NUMERIC(5,2) NOT NULL,
    explanation TEXT NOT NULL,
    breakdown JSONB DEFAULT '{}'::jsonb NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, professor_id)
);

-- 17. Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    target_intake TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 18. Campaign Professors
CREATE TABLE IF NOT EXISTS public.campaign_professors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    professor_id UUID NOT NULL REFERENCES public.professors(id) ON DELETE CASCADE,
    status outreach_status DEFAULT 'NOT_CONTACTED'::outreach_status NOT NULL,
    priority TEXT DEFAULT 'HIGH',
    stage TEXT DEFAULT 'Discovery',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(campaign_id, professor_id)
);

-- 19. Emails
CREATE TABLE IF NOT EXISTS public.emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    professor_id UUID NOT NULL REFERENCES public.professors(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    body_html TEXT,
    body_text TEXT NOT NULL,
    personalization_notes JSONB DEFAULT '[]'::jsonb,
    source_references JSONB DEFAULT '[]'::jsonb,
    status outreach_status DEFAULT 'DRAFT'::outreach_status NOT NULL,
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 20. Email Events
CREATE TABLE IF NOT EXISTS public.email_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'REPLIED'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 21. Follow-ups
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
    sequence_number INTEGER DEFAULT 1 NOT NULL,
    scheduled_date TIMESTAMPTZ NOT NULL,
    subject TEXT NOT NULL,
    body_text TEXT NOT NULL,
    status TEXT DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'SENT', 'CANCELLED'
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 22. Replies
CREATE TABLE IF NOT EXISTS public.replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
    professor_id UUID NOT NULL REFERENCES public.professors(id) ON DELETE CASCADE,
    sender_email TEXT NOT NULL,
    subject TEXT,
    body_text TEXT NOT NULL,
    summary TEXT,
    sentiment TEXT DEFAULT 'POSITIVE', -- 'POSITIVE', 'NEUTRAL', 'NEGATIVE', 'MEETING_REQUESTED'
    suggested_response TEXT,
    status TEXT DEFAULT 'UNREAD',
    received_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 23. Applications Tracker
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    professor_id UUID REFERENCES public.professors(id) ON DELETE SET NULL,
    program_name TEXT NOT NULL,
    degree TEXT NOT NULL,
    intake TEXT NOT NULL,
    deadline DATE,
    status TEXT DEFAULT 'Shortlisted', -- 'Shortlisted', 'Contacted', 'Applied', 'Interview', 'Offer', 'Rejected'
    funding_status TEXT DEFAULT 'Pending',
    portal_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 24. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 25. Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan_type plan_tier DEFAULT 'FREE'::plan_tier NOT NULL,
    status TEXT DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 26. Usage Records
CREATE TABLE IF NOT EXISTS public.usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL, -- '2026-09'
    searches_count INTEGER DEFAULT 0 NOT NULL,
    ai_generations_count INTEGER DEFAULT 0 NOT NULL,
    emails_sent_count INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, month_year)
);

-- 27. Site Settings (Admin Editable)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 28. Site Content CMS (Admin Editable Landing & Public Pages)
CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    content JSONB NOT NULL,
    is_published BOOLEAN DEFAULT TRUE NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 29. Feature Flags (Admin Controllable)
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 30. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 31. Background Jobs
CREATE TABLE IF NOT EXISTS public.background_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status job_status DEFAULT 'QUEUED'::job_status NOT NULL,
    attempts INTEGER DEFAULT 0 NOT NULL,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 32. Payment Methods (Admin Controlled)
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'mobile_wallet', 'bank_transfer', 'card', 'paypal', 'stripe', 'crypto', 'other'
    country TEXT NOT NULL,
    country_code TEXT,
    currency TEXT NOT NULL DEFAULT 'USD',
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_identifier TEXT,
    instructions TEXT NOT NULL,
    logo TEXT,
    enabled BOOLEAN DEFAULT TRUE NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 33. Orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_reference TEXT UNIQUE NOT NULL, -- e.g. PM-742910
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_tier plan_tier NOT NULL,
    plan_name TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL,
    billing_interval TEXT DEFAULT 'monthly' NOT NULL,
    status TEXT DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'
    payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    payment_method_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 34. Payments & Proofs
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    order_reference TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    transaction_id TEXT NOT NULL,
    payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    payment_method_name TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL,
    proof_file_name TEXT,
    proof_file_url TEXT,
    payment_note TEXT,
    status TEXT DEFAULT 'PENDING' NOT NULL,
    admin_review_note TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payment_proofs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    order_reference TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 35. Connected Email Accounts (Gmail OAuth Multi-Tenancy)
CREATE TABLE IF NOT EXISTS public.connected_email_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    provider TEXT DEFAULT 'gmail' NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at BIGINT,
    status TEXT DEFAULT 'ACTIVE' NOT NULL,
    connected_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_used_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, provider)
);

-- ==========================================================
-- INDEXES FOR PERFORMANCE
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_professors_university ON public.professors(university_id);
CREATE INDEX IF NOT EXISTS idx_professors_department ON public.professors(department_id);
CREATE INDEX IF NOT EXISTS idx_professors_verification ON public.professors(verification_status);
CREATE INDEX IF NOT EXISTS idx_research_matches_user ON public.research_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_user ON public.emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_campaign ON public.emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON public.payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_professor ON public.emails(professor_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled ON public.follow_ups(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_replies_email ON public.replies(email_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_student ON public.student_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_prof_publications_prof ON public.professor_publications(professor_id);
CREATE INDEX IF NOT EXISTS idx_prof_sources_prof ON public.professor_sources(professor_id);
CREATE INDEX IF NOT EXISTS idx_connected_email_user ON public.connected_email_accounts(user_id);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professor_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professor_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_email_accounts ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin (secured with empty search_path)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'ADMIN'::public.user_role OR role = 'SUPER_ADMIN'::public.user_role)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Profiles: Users can view & edit own profile; Admins can view all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- Student profiles & related: owner only or admin
CREATE POLICY "Owner access student_profiles" ON public.student_profiles FOR ALL USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Owner access academic_profiles" ON public.academic_profiles FOR ALL USING (
  student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "Owner access research_profiles" ON public.research_profiles FOR ALL USING (
  student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "Owner access student_skills" ON public.student_skills FOR ALL USING (
  student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "Owner access student_projects" ON public.student_projects FOR ALL USING (
  student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "Owner access student_publications" ON public.student_publications FOR ALL USING (
  student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "Owner access student_documents" ON public.student_documents FOR ALL USING (
  student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()) OR public.is_admin()
);

-- Universities, Departments, Professors, Pubs: Read for authenticated users; write for admins
CREATE POLICY "Public read universities" ON public.universities FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admin write universities" ON public.universities FOR ALL USING (public.is_admin());

CREATE POLICY "Public read departments" ON public.departments FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admin write departments" ON public.departments FOR ALL USING (public.is_admin());

CREATE POLICY "Public read professors" ON public.professors FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admin write professors" ON public.professors FOR ALL USING (public.is_admin());

CREATE POLICY "Public read prof_publications" ON public.professor_publications FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admin write prof_publications" ON public.professor_publications FOR ALL USING (public.is_admin());

CREATE POLICY "Public read prof_sources" ON public.professor_sources FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admin write prof_sources" ON public.professor_sources FOR ALL USING (public.is_admin());

-- Searches & Saved: User only
CREATE POLICY "User access searches" ON public.searches FOR ALL USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "User access saved_professors" ON public.saved_professors FOR ALL USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "User access research_matches" ON public.research_matches FOR ALL USING (user_id = auth.uid() OR public.is_admin());

-- Campaigns & Emails: User only
CREATE POLICY "User access campaigns" ON public.campaigns FOR ALL USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "User access campaign_professors" ON public.campaign_professors FOR ALL USING (
  campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "User access emails" ON public.emails FOR ALL USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "User access email_events" ON public.email_events FOR ALL USING (
  email_id IN (SELECT id FROM public.emails WHERE user_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "User access follow_ups" ON public.follow_ups FOR ALL USING (
  email_id IN (SELECT id FROM public.emails WHERE user_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "User access replies" ON public.replies FOR ALL USING (
  email_id IN (SELECT id FROM public.emails WHERE user_id = auth.uid()) OR public.is_admin()
);

-- Applications, Notifications, Subscriptions, Usage: User only
CREATE POLICY "User access applications" ON public.applications FOR ALL USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "User access notifications" ON public.notifications FOR ALL USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "User access subscriptions" ON public.subscriptions FOR ALL USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "User access usage_records" ON public.usage_records FOR ALL USING (user_id = auth.uid() OR public.is_admin());

-- Payment Methods: Public read enabled; Admin full write
CREATE POLICY "Public read payment_methods" ON public.payment_methods FOR SELECT USING (enabled = true OR public.is_admin());
CREATE POLICY "Admin write payment_methods" ON public.payment_methods FOR ALL USING (public.is_admin());

-- Orders, Payments, Proofs: User can view & insert own; Admin can review & update
CREATE POLICY "User access orders" ON public.orders FOR ALL USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "User access payments" ON public.payments FOR ALL USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "User access payment_proofs" ON public.payment_proofs FOR ALL USING (
  payment_id IN (SELECT id FROM public.payments WHERE user_id = auth.uid()) OR public.is_admin()
);

-- Site settings, Content CMS, Feature flags: Public read; Admin write
CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admin write site_settings" ON public.site_settings FOR ALL USING (public.is_admin());

CREATE POLICY "Public read site_content" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Admin write site_content" ON public.site_content FOR ALL USING (public.is_admin());

CREATE POLICY "Public read feature_flags" ON public.feature_flags FOR SELECT USING (true);
CREATE POLICY "Admin write feature_flags" ON public.feature_flags FOR ALL USING (public.is_admin());

-- Audit logs: Admin only
CREATE POLICY "Admin access audit_logs" ON public.audit_logs FOR ALL USING (public.is_admin());

-- Connected Email Accounts: User access own; Admin access all
CREATE POLICY "User access connected_email_accounts" ON public.connected_email_accounts FOR ALL USING (user_id = auth.uid() OR public.is_admin());

-- ==========================================================
-- PERFORMANCE INDEXES
-- ==========================================================

CREATE INDEX IF NOT EXISTS idx_payments_user_status ON public.payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_connected_email_accounts_user ON public.connected_email_accounts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_professors_university ON public.professors(university_id);
CREATE INDEX IF NOT EXISTS idx_professors_department ON public.professors(department_id);
CREATE INDEX IF NOT EXISTS idx_emails_user_status ON public.emails(user_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_user ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);

-- ==========================================================
-- AUTOMATION TRIGGERS
-- ==========================================================

-- 1. Automatic Profile Creation on Supabase Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    'USER'::public.user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Generic updated_at timestamp refresher
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach updated_at trigger to tables maintaining it
CREATE OR REPLACE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON public.student_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_academic_profiles_updated_at BEFORE UPDATE ON public.academic_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_research_profiles_updated_at BEFORE UPDATE ON public.research_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_universities_updated_at BEFORE UPDATE ON public.universities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_professors_updated_at BEFORE UPDATE ON public.professors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_emails_updated_at BEFORE UPDATE ON public.emails FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_usage_records_updated_at BEFORE UPDATE ON public.usage_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_connected_emails_updated_at BEFORE UPDATE ON public.connected_email_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


