-- ==========================================================
-- PROFMATCH AI — MIGRATION: OPENALEX CANONICAL REPOSITORY & VERIFICATION
-- Date: 2026-10-16
-- Non-destructive, backward-compatible schema expansion
-- ==========================================================

-- 1. Add OpenAlex identifiers and citation metrics to professors table
ALTER TABLE IF EXISTS public.professors
    ADD COLUMN IF NOT EXISTS openalex_id TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS orcid TEXT,
    ADD COLUMN IF NOT EXISTS works_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS citations_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2. Make university_id nullable so independent researchers / external institutions can be safely persisted
ALTER TABLE IF EXISTS public.professors
    ALTER COLUMN university_id DROP NOT NULL;

-- 3. Add source_provider column to professor_publications
ALTER TABLE IF EXISTS public.professor_publications
    ADD COLUMN IF NOT EXISTS source_provider TEXT DEFAULT 'OpenAlex';

-- 4. Create performance indexes for OpenAlex lookups and deduplication
CREATE INDEX IF NOT EXISTS idx_professors_openalex_id ON public.professors(openalex_id);
CREATE INDEX IF NOT EXISTS idx_professors_orcid ON public.professors(orcid);
CREATE INDEX IF NOT EXISTS idx_professors_verification_status ON public.professors(verification_status);
CREATE INDEX IF NOT EXISTS idx_prof_publications_doi ON public.professor_publications(doi);
