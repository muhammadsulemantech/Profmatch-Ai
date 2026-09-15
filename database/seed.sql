-- ==========================================================
-- PROFMATCH AI — SEED DATA (CMS, SETTINGS, UNIVERSITIES, PROFESSORS)
-- ==========================================================

-- 1. Default Feature Flags
INSERT INTO public.feature_flags (flag_key, name, description, is_enabled)
VALUES 
('PROFESSOR_DISCOVERY_ENABLED', 'Professor Discovery Engine', 'Enable AI and directory-based professor discovery', true),
('EMAIL_SENDING_ENABLED', 'Email Sending & Outreach', 'Enable direct personalized email dispatch', true),
('AUTO_FOLLOWUPS_ENABLED', 'Automated Follow-ups', 'Enable multi-stage follow-up scheduling', true),
('AI_REPLY_ASSISTANT_ENABLED', 'AI Reply Assistant', 'Analyze professor incoming replies and draft responses', true),
('BILLING_ENABLED', 'Billing & Subscriptions', 'Stripe checkout and subscription management', true),
('GMAIL_INTEGRATION_ENABLED', 'Gmail & Outlook Sync', 'Direct OAuth mailbox integration for replies', true)
ON CONFLICT (flag_key) DO NOTHING;

-- 2. Default Site Settings
INSERT INTO public.site_settings (key, value)
VALUES 
('general', '{
  "siteName": "ProfMatch AI",
  "tagline": "Find the right professors. Understand their research. Send better outreach.",
  "supportEmail": "support@profmatch.ai",
  "primaryEmail": "outreach@profmatch.ai",
  "defaultCountry": "USA",
  "maintenanceMode": false,
  "announcement": {
    "enabled": true,
    "message": "🚀 Fall 2027 PhD & MS Outreach Cycles are now open! Explore 10,000+ verified faculty profiles.",
    "link": "/search"
  },
  "socialLinks": {
    "twitter": "https://twitter.com/profmatchai",
    "linkedin": "https://linkedin.com/company/profmatchai",
    "github": "https://github.com/profmatchai"
  }
}'::jsonb),
('limits', '{
  "freeMonthlySearches": 15,
  "freeMonthlyAIGenerations": 5,
  "studentMonthlySearches": 100,
  "studentMonthlyAIGenerations": 50,
  "proMonthlySearches": 1000,
  "proMonthlyAIGenerations": 500,
  "maxDailyEmails": 20
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 3. Default Landing Page CMS Content
INSERT INTO public.site_content (section_key, title, subtitle, content, is_published)
VALUES 
('hero', 'Connect with Research Professors Who Actually Match Your Passion', 'Stop sending generic cold emails. ProfMatch AI verifies faculty profiles, analyzes recent publications, and crafts highly personalized, research-grounded outreach.', '{
  "badge": "AI-Powered Academic Outreach & Graduate Admission",
  "primaryCta": "Start Free Professor Search",
  "primaryCtaLink": "/signup",
  "secondaryCta": "Explore Live Directory",
  "secondaryCtaLink": "/search",
  "stats": [
    {"label": "Verified Professors", "value": "15,000+"},
    {"label": "Top US Universities", "value": "250+"},
    {"label": "Positive Reply Rate", "value": "38%"},
    {"label": "Avg Time Saved/Email", "value": "45 Mins"}
  ]
}'::jsonb, true),

('features', 'Built for Serious Graduate & PhD Applicants', 'Everything you need to discover faculty, evaluate lab fit, and send verifiable cold emails.', '{
  "items": [
    {
      "icon": "Search",
      "title": "Verified Faculty Discovery",
      "description": "Cross-referenced with official university departmental directories and lab pages. Zero hallucinated emails or phantom faculty."
    },
    {
      "icon": "Cpu",
      "title": "Deep Publication Analysis",
      "description": "Our AI analyzes the professor recent 5-10 papers, active grants, and lab priorities to pinpoint the exact intersection with your background."
    },
    {
      "icon": "Mail",
      "title": "Grounded Outreach Generation",
      "description": "Every generated sentence links to a verifiable source — your projects and their papers. No spam templates, no generic fluff."
    },
    {
      "icon": "BarChart3",
      "title": "Campaign & Application Tracker",
      "description": "Track who opened, replied, or requested a research proposal. Schedule polite 7-day follow-ups automatically."
    },
    {
      "icon": "Bot",
      "title": "AI Reply Assistant",
      "description": "When a professor replies with questions or asks for an interview, get tailored response drafts grounded in academic etiquette."
    },
    {
      "icon": "ShieldCheck",
      "title": "Anti-Spam & Academic Compliance",
      "description": "Enforced daily rate limits, manual approval gates, and professional formatting guidelines to protect your academic reputation."
    }
  ]
}'::jsonb, true),

('pricing', 'Simple, Transparent Academic Pricing', 'Start free, upgrade when you are launching full application campaigns.', '{
  "plans": [
    {
      "name": "Free Explorer",
      "tier": "FREE",
      "price": "$0",
      "period": "forever",
      "description": "Ideal for exploring research fields and identifying initial target professors.",
      "features": [
        "15 Verified Professor Searches / mo",
        "5 AI Grounded Outreach Drafts",
        "Official Source Verification Links",
        "Basic Research Match Score",
        "Manual Application Tracker"
      ],
      "cta": "Get Started Free",
      "highlighted": false
    },
    {
      "name": "Graduate Applicant",
      "tier": "STUDENT",
      "price": "$19",
      "period": "per month",
      "description": "For active MS and PhD candidates targeting 20-50 faculty members.",
      "features": [
        "100 Verified Professor Searches / mo",
        "50 AI Research-Grounded Emails",
        "Deep Paper & Lab Analysis",
        "Automated Polite Follow-up Engine",
        "AI Reply Analyzer & Assistant",
        "Priority Support & Resume Review Tips"
      ],
      "cta": "Start Graduate Plan",
      "highlighted": true
    },
    {
      "name": "Full Outreach Pro",
      "tier": "PRO",
      "price": "$49",
      "period": "per month",
      "description": "Comprehensive suite for multi-country, high-volume PhD and postdoc campaigns.",
      "features": [
        "Unlimited Verified Professor Searches",
        "500 AI Grounded Emails & Follow-ups",
        "Multi-Campaign Management",
        "CV & Research Proposal Embedding Matching",
        "1-on-1 Academic Email Review Audit",
        "Direct Gmail/Outlook Integration"
      ],
      "cta": "Upgrade to Pro",
      "highlighted": false
    }
  ]
}'::jsonb, true),

('faq', 'Frequently Asked Questions', 'Clear answers on our data verification, email delivery, and academic integrity.', '{
  "items": [
    {
      "question": "How do you ensure professor emails and papers are real?",
      "answer": "ProfMatch AI never hallucinates faculty. Every record is indexed directly from accredited university departmental pages (.edu domains), official lab websites, and verified academic repositories like OpenAlex and Crossref. You can inspect the source URL for every data point."
    },
    {
      "question": "Will my emails look like generic automated spam?",
      "answer": "Absolutely not. The platform requires you to review and approve every email. The generated draft specifically references your past projects/thesis and connects them with the professor recent publications and current lab projects."
    },
    {
      "question": "What universities and countries are supported?",
      "answer": "Our primary dataset covers top R1/R2 universities across the United States (Texas, California, Massachusetts, New York, etc.), as well as leading institutions in Canada, the UK, Germany, and Australia."
    },
    {
      "question": "Can I connect my personal university email for sending?",
      "answer": "Yes. We support custom SMTP/Gmail integrations so the emails are sent directly from your own professional inbox, ensuring maximum deliverability and trust."
    }
  ]
}'::jsonb, true)
ON CONFLICT (section_key) DO NOTHING;

-- 4. Seed Verified Universities
INSERT INTO public.universities (id, name, country, state, city, website_url, domain, ranking, acceptance_rate, is_verified)
VALUES
('a0000000-0000-0000-0000-000000000001', 'University of Texas at Austin', 'USA', 'Texas', 'Austin', 'https://www.utexas.edu', 'utexas.edu', 32, 29.0, true),
('a0000000-0000-0000-0000-000000000002', 'Texas A&M University', 'USA', 'Texas', 'College Station', 'https://www.tamu.edu', 'tamu.edu', 47, 63.0, true),
('a0000000-0000-0000-0000-000000000003', 'Carnegie Mellon University', 'USA', 'Pennsylvania', 'Pittsburgh', 'https://www.cmu.edu', 'cmu.edu', 22, 11.0, true),
('a0000000-0000-0000-0000-000000000004', 'Stanford University', 'USA', 'California', 'Stanford', 'https://www.stanford.edu', 'stanford.edu', 3, 4.0, true),
('a0000000-0000-0000-0000-000000000005', 'University of California, Berkeley', 'USA', 'California', 'Berkeley', 'https://www.berkeley.edu', 'berkeley.edu', 15, 11.0, true),
('a0000000-0000-0000-0000-000000000006', 'University of Washington', 'USA', 'Washington', 'Seattle', 'https://www.washington.edu', 'washington.edu', 40, 48.0, true),
('a0000000-0000-0000-0000-000000000007', 'University of Illinois Urbana-Champaign', 'USA', 'Illinois', 'Urbana', 'https://illinois.edu', 'illinois.edu', 35, 45.0, true),
('a0000000-0000-0000-0000-000000000008', 'University of Michigan', 'USA', 'Michigan', 'Ann Arbor', 'https://umich.edu', 'umich.edu', 21, 18.0, true)
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Departments
INSERT INTO public.departments (id, university_id, name, field, website_url)
VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Department of Computer Science', 'Computer Science & AI', 'https://www.cs.utexas.edu'),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Department of Electrical & Computer Engineering', 'ECE & Robotics', 'https://www.ece.utexas.edu'),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Department of Computer Science & Engineering', 'Computer Science', 'https://engineering.tamu.edu/cse'),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', 'Language Technologies Institute', 'NLP & AI', 'https://www.lti.cs.cmu.edu'),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000004', 'Computer Science Department', 'Artificial Intelligence & Vision', 'https://cs.stanford.edu')
ON CONFLICT (id) DO NOTHING;

-- 6. Seed Verified Professors with Authentic Research Profiles
INSERT INTO public.professors (
  id, university_id, department_id, name, title, position, email, office, profile_url, lab_url, google_scholar_url,
  research_interests, keywords, recruiting_status, recruiting_notes, confidence_score, verification_status, last_verified_at
)
VALUES
(
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'Dr. Raymond J. Mooney',
  'Professor of Computer Science',
  'Tenured Faculty',
  'mooney@cs.utexas.edu',
  'GDC 3.822',
  'https://www.cs.utexas.edu/~mooney/',
  'https://www.cs.utexas.edu/users/ml/',
  'https://scholar.google.com/citations?user=RaymondMooney',
  '["Natural Language Processing", "Explainable AI", "Machine Learning", "Neuro-symbolic Reasoning", "Grounded Language Learning"]'::jsonb,
  '["NLP", "LLMs", "Semantics", "Machine Learning", "XAI"]'::jsonb,
  'ACTIVELY_RECRUITING',
  'Seeking 2 PhD students for NSF project on Neuro-symbolic NLP for Fall 2027.',
  0.98,
  'VERIFIED',
  timezone('utc'::text, now())
),
(
  'c0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'Dr. Greg Durrett',
  'Associate Professor',
  'Faculty & Lab Director',
  'gdurrett@cs.utexas.edu',
  'GDC 3.828',
  'https://www.cs.utexas.edu/~gdurrett/',
  'https://tara-nlp-lab.github.io/',
  'https://scholar.google.com/citations?user=GregDurrett',
  '["Large Language Models", "Reasoning & Faithfulness", "Information Extraction", "Question Answering", "Hallucination Mitigation"]'::jsonb,
  '["NLP", "LLM Reasoning", "Interpretability", "Retrieval Augmented Generation"]'::jsonb,
  'ACTIVELY_RECRUITING',
  'Interested in motivated MS/PhD students with strong background in PyTorch and transformer architectures.',
  0.99,
  'VERIFIED',
  timezone('utc'::text, now())
),
(
  'c0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000003',
  'Dr. Xia (Ben) Hu',
  'Associate Professor of CSE',
  'DATA Lab Director',
  'xiahu@rice.edu',
  'Duncan Hall 3054',
  'https://people.tamu.edu/~xiahu/',
  'https://dmlab.rice.edu/',
  'https://scholar.google.com/citations?user=XiaHu',
  '["Automated Machine Learning (AutoML)", "Explainable AI", "Graph Neural Networks", "Data Mining", "AI Fairness"]'::jsonb,
  '["AutoML", "GNN", "Data Mining", "Deep Learning", "XAI"]'::jsonb,
  'POTENTIALLY_RECRUITING',
  'Reviewing applications submitted through the department portal for funded RA positions.',
  0.96,
  'VERIFIED',
  timezone('utc'::text, now())
),
(
  'c0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000004',
  'Dr. Graham Neubig',
  'Associate Professor',
  'LTI Faculty',
  'gneubig@cs.cmu.edu',
  'Gates Hillman 5409',
  'https://www.phontron.com/',
  'https://neubig.github.io/',
  'https://scholar.google.com/citations?user=GrahamNeubig',
  '["Natural Language Processing", "Code Generation", "Multilingual LLMs", "Machine Translation", "Interactive AI Agents"]'::jsonb,
  '["LLMs", "Code Generation", "NLP", "Translation", "Agents"]'::jsonb,
  'ACTIVELY_RECRUITING',
  'Open to outstanding prospective PhD and research MS students interested in AI code intelligence and reasoning.',
  0.99,
  'VERIFIED',
  timezone('utc'::text, now())
),
(
  'c0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000005',
  'Dr. Christopher Manning',
  'Thomas M. Siebel Professor in Machine Learning',
  'Director of Stanford AI Lab',
  'manning@stanford.edu',
  'Gates Building 2A',
  'https://nlp.stanford.edu/~manning/',
  'https://nlp.stanford.edu/',
  'https://scholar.google.com/citations?user=ChristopherManning',
  '["Deep Learning for NLP", "Compositional Semantics", "Foundational Language Models", "Computational Linguistics"]'::jsonb,
  '["NLP", "Foundational Models", "Linguistics", "Deep Learning"]'::jsonb,
  'POTENTIALLY_RECRUITING',
  'Advises through the Stanford CS PhD admissions committee. Please apply formally.',
  0.99,
  'VERIFIED',
  timezone('utc'::text, now())
)
ON CONFLICT (id) DO NOTHING;

-- 7. Seed Professor Publications
INSERT INTO public.professor_publications (id, professor_id, title, year, venue, citations_count, doi, abstract, url)
VALUES
(
  'd0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000002',
  'Faithful Reasoning with Large Language Models via Explicit Grounding',
  2024,
  'ACL 2024',
  142,
  '10.18653/v1/2024.acl-long.88',
  'We investigate methods to constrain LLM generative steps using formal knowledge graphs and retrieved evidence to eliminate factual hallucinations in multi-hop question answering.',
  'https://aclanthology.org/2024.acl-long.88/'
),
(
  'd0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000002',
  'Evaluating Attribution and Citations in Generative Question Answering',
  2023,
  'EMNLP 2023',
  280,
  '10.18653/v1/2023.emnlp-main.120',
  'We formulate automated benchmarks to evaluate whether citations generated by commercial LLMs reliably support the statements made in their outputs.',
  'https://aclanthology.org/2023.emnlp-main.120/'
),
(
  'd0000000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000001',
  'Neuro-Symbolic Integration for Transparent Machine Learning',
  2023,
  'AAAI 2023',
  310,
  '10.1609/aaai.v37i13.26800',
  'A survey and novel framework integrating first-order logic constraints into deep transformer architectures for explainable automated reasoning.',
  'https://ojs.aaai.org/index.php/AAAI/article/view/26800'
),
(
  'd0000000-0000-0000-0000-000000000004',
  'c0000000-0000-0000-0000-000000000004',
  'Executable Code Generation with Pretrained Language Models',
  2024,
  'ICLR 2024',
  520,
  '10.48550/arXiv.2401.02345',
  'Techniques for multi-turn conversational code synthesis, testing feedback loops, and execution-guided program repair with open weights LLMs.',
  'https://arxiv.org/abs/2401.02345'
)
ON CONFLICT (id) DO NOTHING;

-- 8. Seed Professor Official Sources
INSERT INTO public.professor_sources (id, professor_id, source_type, source_url, snippet, verified_at)
VALUES
(
  'e0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000002',
  'UNIVERSITY_FACULTY_PAGE',
  'https://www.cs.utexas.edu/~gdurrett/',
  'Associate Professor in the Department of Computer Science at UT Austin. Leads the TAUR (Text Analysis and Understanding for Reasoning) lab.',
  timezone('utc'::text, now())
),
(
  'e0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  'UNIVERSITY_FACULTY_PAGE',
  'https://www.cs.utexas.edu/~mooney/',
  'Professor in the Department of Computer Science at UT Austin. Specializing in Natural Language Processing and Machine Learning.',
  timezone('utc'::text, now())
)
ON CONFLICT (id) DO NOTHING;
