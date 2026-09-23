-- ==========================================================
-- PROFMATCH AI — MIGRATION: SCHEMA RECONCILIATION & TRIGGERS
-- Date: 2026-09-23
-- ==========================================================

-- 1. Reconcile plan_tier enum
ALTER TYPE public.plan_tier ADD VALUE IF NOT EXISTS 'STARTER';
ALTER TYPE public.plan_tier ADD VALUE IF NOT EXISTS 'ELITE';

-- 2. Reconcile verification_status enum
ALTER TYPE public.verification_status ADD VALUE IF NOT EXISTS 'PARTIALLY_VERIFIED';
ALTER TYPE public.verification_status ADD VALUE IF NOT EXISTS 'SOURCE_UNAVAILABLE';
ALTER TYPE public.verification_status ADD VALUE IF NOT EXISTS 'STALE';

-- 3. Reconcile recruiting_status enum
ALTER TYPE public.recruiting_status ADD VALUE IF NOT EXISTS 'VERIFIED_RECRUITING';
ALTER TYPE public.recruiting_status ADD VALUE IF NOT EXISTS 'POSSIBLY_RECRUITING';
ALTER TYPE public.recruiting_status ADD VALUE IF NOT EXISTS 'NO_PUBLIC_INFORMATION';

-- 4. Harmonize confidence_score column precision
ALTER TABLE IF EXISTS public.professors ALTER COLUMN confidence_score TYPE NUMERIC(5,2);

-- 5. Create Connected Email Accounts table if not exists
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

ALTER TABLE public.connected_email_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User access connected_email_accounts" ON public.connected_email_accounts;
CREATE POLICY "User access connected_email_accounts" ON public.connected_email_accounts FOR ALL USING (user_id = auth.uid() OR public.is_admin());

-- 6. Missing Indexes for high-frequency query patterns
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON public.payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_connected_email_accounts_user ON public.connected_email_accounts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_emails_professor ON public.emails(professor_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled ON public.follow_ups(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_replies_email ON public.replies(email_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_student ON public.student_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_prof_publications_prof ON public.professor_publications(professor_id);
CREATE INDEX IF NOT EXISTS idx_prof_sources_prof ON public.professor_sources(professor_id);
CREATE INDEX IF NOT EXISTS idx_connected_email_user ON public.connected_email_accounts(user_id);

-- 7. Secure is_admin function with empty search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'ADMIN'::public.user_role OR role = 'SUPER_ADMIN'::public.user_role)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 8. Auto-create profile trigger on auth.users signup
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

-- 9. Generic updated_at trigger refresher
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers
CREATE OR REPLACE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_usage_records_updated_at BEFORE UPDATE ON public.usage_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_connected_emails_updated_at BEFORE UPDATE ON public.connected_email_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
