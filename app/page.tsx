import { getAllSiteContent } from '@/lib/cms/content-service';
import { getSiteSettings } from '@/lib/cms/settings-service';
import Link from 'next/link';
import {
  Search,
  CheckCircle2,
  ExternalLink,
  Mail,
  ShieldCheck,
  Cpu,
  BarChart3,
  ArrowRight,
  BookOpen,
  School,
  FileText,
  Lock,
  Layers,
  Award,
  Globe,
  Check,
  ChevronRight,
  Database,
  GraduationCap
} from 'lucide-react';
import { mockDb } from '@/lib/supabase/mock-db';
import InteractivePlatformShowcase from '@/components/home/interactive-platform-showcase';

export default async function HomePage() {
  const content = await getAllSiteContent();
  const settings = await getSiteSettings();

  const hero = content.hero || mockDb.siteContent.hero;
  const features = content.features || mockDb.siteContent.features;
  const pricing = content.pricing || mockDb.siteContent.pricing;
  const faq = content.faq || mockDb.siteContent.faq;

  return (
    <div className="flex flex-col min-h-screen bg-[#080B11] text-slate-100 selection:bg-emerald-500/25 selection:text-emerald-300">
      {/* 1. HERO SECTION WITH GLOW */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-slate-800/80 overflow-hidden">
        {/* Glowing Background Radial */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] pointer-events-none opacity-40 radial-glow" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Small Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-sm">
              <span>ACADEMIC RESEARCH OUTREACH &bull; VERIFIED DIRECTORY</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-heading text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.12]">
              Find the right professor for your{' '}
              <span className="gradient-text">research.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Discover relevant faculty across accredited universities, analyze their published research papers, and initiate verified academic correspondence without spam.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
              <Link
                href="/search"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all"
              >
                Find Professors
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm bg-slate-900/80 text-slate-200 border border-slate-800 hover:bg-slate-800 hover:text-white transition-colors"
              >
                See How It Works
              </Link>
            </div>

            {/* Metric Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 mt-12 border-t border-slate-800/80">
              <div className="p-4 text-center rounded-xl bg-slate-900/40 border border-slate-800/60">
                <p className="font-heading text-3xl font-bold text-white tracking-tight">190+</p>
                <p className="text-xs text-slate-400 mt-1 font-medium">Countries Indexed</p>
              </div>
              <div className="p-4 text-center rounded-xl bg-slate-900/40 border border-slate-800/60">
                <p className="font-heading text-3xl font-bold text-emerald-400 tracking-tight">50,000+</p>
                <p className="text-xs text-slate-400 mt-1 font-medium">Verified Faculty Profiles</p>
              </div>
              <div className="p-4 text-center rounded-xl bg-slate-900/40 border border-slate-800/60">
                <p className="font-heading text-3xl font-bold text-cyan-400 tracking-tight">1M+</p>
                <p className="text-xs text-slate-400 mt-1 font-medium">Attributed Publications</p>
              </div>
              <div className="p-4 text-center rounded-xl bg-slate-900/40 border border-slate-800/60">
                <p className="font-heading text-3xl font-bold text-white tracking-tight">100%</p>
                <p className="text-xs text-slate-400 mt-1 font-medium">Verifiable .edu / .ac Sources</p>
              </div>
            </div>
          </div>

          {/* 2. REPLACED SECTION: INTERACTIVE RESEARCH INTELLIGENCE SHOWCASE */}
          <InteractivePlatformShowcase />
        </div>
      </section>

      {/* 3. METHODOLOGY / WORKFLOW */}
      <section id="how-it-works" className="py-24 bg-slate-950/60 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16 space-y-3">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              Methodology
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white">
              From research thesis to verified outreach in five structured steps.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Engineered to replace hours of unstructured departmental directory parsing with factually verified research alignment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
            {[
              {
                step: '01',
                title: 'Target Criteria',
                desc: 'Specify graduate degree, country or territory, and your specific research thesis topics.'
              },
              {
                step: '02',
                title: 'Faculty Discovery',
                desc: 'Systematically scan verified departmental registries and accredited institutional research labs.'
              },
              {
                step: '03',
                title: 'Paper Analysis',
                desc: 'Analyze recent publications to extract current methodologies, grants, and open lab openings.'
              },
              {
                step: '04',
                title: 'Grounded Match',
                desc: 'Calculate genuine research overlap and interdisciplinary fit without artificial buzzwords.'
              },
              {
                step: '05',
                title: 'Thoughtful Outreach',
                desc: 'Review verified citation references, customize academic tone, approve, and track responses.'
              },
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-emerald-500/30 transition-all space-y-3 group">
                <span className="font-heading text-3xl font-bold text-emerald-500/40 group-hover:text-emerald-400 transition-colors">
                  {item.step}
                </span>
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CORE CAPABILITIES */}
      <section id="features" className="py-24 bg-[#080B11] border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16 space-y-3">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> Core Capabilities
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white">
              A serious research platform built for graduate candidates.
            </h2>
            <p className="text-sm text-slate-400">
              Designed with academic precision and verifiable institutional sources at every stage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Worldwide Institutional Coverage',
                desc: 'Index accredited faculty appointments across 190+ countries and territories, without regional restrictions.',
                icon: Globe,
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10 border-emerald-500/20'
              },
              {
                title: 'All Academic Fields & Subfields',
                desc: 'From computational sustainability and robotics to public health, history, applied economics, and architecture.',
                icon: BookOpen,
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/10 border-cyan-500/20'
              },
              {
                title: 'Verified .edu & .ac Emails Only',
                desc: 'Every email address is confirmed against official university directories and academic publication registries.',
                icon: ShieldCheck,
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10 border-emerald-500/20'
              },
              {
                title: 'Interdisciplinary Lab Pairing',
                desc: 'Bridge traditional departmental boundaries by matching research methods across computer science, engineering, and life sciences.',
                icon: Layers,
                color: 'text-purple-400',
                bg: 'bg-purple-500/10 border-purple-500/20'
              },
              {
                title: 'Fact-Grounded Outreach Drafts',
                desc: 'Draft thoughtful correspondence citing specific recent papers and datasets, completely avoiding generic AI templates.',
                icon: FileText,
                color: 'text-amber-400',
                bg: 'bg-amber-500/10 border-amber-500/20'
              },
              {
                title: 'Unified Application Tracker',
                desc: 'Track faculty replies, prospective advisor interviews, and graduate school deadlines in one organized workspace.',
                icon: BarChart3,
                color: 'text-teal-400',
                bg: 'bg-teal-500/10 border-teal-500/20'
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all space-y-4 group">
                  <div className={`w-11 h-11 rounded-xl ${feature.bg} border flex items-center justify-center ${feature.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. ACADEMIC PRICING */}
      <section id="pricing" className="py-24 bg-slate-950/60 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
              Transparent Pricing
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white">
              Simple, accessible academic plans.
            </h2>
            <p className="text-sm text-slate-400">
              Start exploring global faculty for free; subscribe when initiating active outreach campaigns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricing.content.plans?.map((plan: any, idx: number) => (
              <div
                key={idx}
                className={`rounded-2xl p-8 flex flex-col justify-between border transition-all ${
                  plan.highlighted
                    ? 'border-emerald-500/50 bg-slate-900/90 shadow-2xl shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                <div>
                  {plan.highlighted && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-5">
                      Recommended for Candidates
                    </span>
                  )}
                  <h3 className="font-heading text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1.5 min-h-[36px]">{plan.description}</p>
                  
                  <div className="mt-5 mb-7">
                    <span className="font-heading text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-xs text-slate-400 ml-1">/ {plan.period}</span>
                  </div>

                  <ul className="space-y-3 text-xs text-slate-300 mb-8">
                    {plan.features.map((feat: string, fIdx: number) => (
                      <li key={fIdx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={plan.tier === 'FREE' || plan.price === '$0' ? '/signup' : '/signup?plan=pro'}
                  className={`w-full py-3 rounded-xl text-center text-xs font-semibold transition-all ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ */}
      <section className="py-24 bg-[#080B11] border-b border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
              Integrity &amp; FAQs
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white">
              Frequently asked questions.
            </h2>
            <p className="text-sm text-slate-400">
              Everything you need to know about our verification standards and academic policies.
            </p>
          </div>

          <div className="space-y-4">
            {faq.content.items?.map((item: any, idx: number) => (
              <div key={idx} className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                  {item.question}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed pl-6.5">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CLOSING INVITATION CTA */}
      <section className="py-20 bg-gradient-to-b from-slate-950 to-[#080B11] text-center border-b border-slate-800/80 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-20" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white">
            Begin finding prospective advisors today.
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Join candidates worldwide who conduct their graduate outreach with factual precision, verified sources, and academic dignity.
          </p>
          <div className="pt-3">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/25 transition-all"
            >
              Start Faculty Search
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
