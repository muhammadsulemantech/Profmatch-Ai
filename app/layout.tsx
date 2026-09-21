import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { getSiteSettings } from '@/lib/cms/settings-service';
import Link from 'next/link';
import { GraduationCap, Search, ShieldCheck, Lock, BookOpen, Rocket } from 'lucide-react';
import { AuthProvider } from '@/lib/auth/auth-context';
import AuthModal from '@/components/auth/auth-modal';
import NavbarAuthControls from '@/components/navigation/navbar-auth-controls';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: `${settings.siteName} — Academic Research Outreach & Faculty Discovery`,
    description: settings.tagline || 'Discover relevant faculty, understand their research, and send thoughtful outreach backed by verified academic sources.',
    keywords: ['Professor Outreach', 'Graduate Research', 'PhD Outreach', 'Faculty Directory', 'Academic Verification'],
    openGraph: {
      title: `${settings.siteName} — Academic Research Outreach Platform`,
      description: settings.tagline,
      type: 'website',
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://profmatch.ai',
    },
    icons: {
      icon: [
        { url: '/icon.svg', type: 'image/svg+xml' },
      ],
      shortcut: '/icon.svg',
      apple: '/icon.svg',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();

  return (
    <html lang="en" className="scroll-smooth dark">
      <body className={`${inter.variable} ${plusJakartaSans.variable} ${inter.className} min-h-screen flex flex-col bg-[#080B11] text-slate-100 antialiased selection:bg-emerald-500/25 selection:text-emerald-300`}>
        <AuthProvider>
          <AuthModal />

          {/* Top Announcement Banner (CMS Controlled) */}
          {settings.announcement?.enabled && (
            <div className="bg-emerald-950/40 border-b border-emerald-800/30 px-4 py-2 text-center text-xs font-medium text-emerald-300 flex items-center justify-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{settings.announcement.message}</span>
              {settings.announcement.link && (
                <Link href={settings.announcement.link} className="underline text-emerald-400 font-semibold hover:text-emerald-300 transition-colors ml-1">
                  Explore &rarr;
                </Link>
              )}
            </div>
          )}

          {/* Global Navigation Bar */}
          <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#080B11]/85 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-105">
                  <GraduationCap className="w-5 h-5 text-slate-950" />
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-bold text-lg tracking-tight text-white leading-none">
                    {settings.siteName}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase mt-0.5">
                    Academic Research Platform
                  </span>
                </div>
              </Link>

              {/* Nav Links */}
              <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
                <Link href="/search" className="hover:text-emerald-400 flex items-center gap-1.5 transition-colors">
                  <Search className="w-4 h-4 text-emerald-400" />
                  Find Professors
                </Link>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Workspace
                </Link>
                <Link href="/campaigns" className="hover:text-white transition-colors">
                  Campaigns
                </Link>
                <Link href="/autopilot" className="hover:text-emerald-400 flex items-center gap-1 transition-colors text-emerald-300">
                  <Rocket className="w-3.5 h-3.5 text-emerald-400" />
                  AutoPilot
                </Link>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Pricing
                </Link>
                <Link href="/tracker" className="hover:text-emerald-400 font-semibold transition-colors flex items-center gap-1 text-emerald-300">
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  Tracker
                </Link>
                <Link href="/responsible-outreach" className="hover:text-white flex items-center gap-1 transition-colors">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Ethical Outreach
                </Link>
              </nav>

              {/* Dynamic Auth Action Buttons */}
              <NavbarAuthControls />
            </div>
          </header>

          {/* Main Body */}
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </AuthProvider>

        {/* Global Footer */}
        <footer className="border-t border-slate-800/80 bg-[#05070D] text-slate-400 text-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
              <div className="space-y-3.5 md:col-span-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center font-bold">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="font-heading font-bold text-base text-white">{settings.siteName}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {settings.tagline || 'Direct official faculty indexing & anti-spam grounded research outreach.'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Grounded in official faculty directories, institutional repositories, and peer-reviewed scholarly literature.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider mb-3.5">Research Platform</h4>
                <ul className="space-y-2 text-xs">
                  <li><Link href="/search" className="hover:text-emerald-400 transition-colors">Professor Search</Link></li>
                  <li><Link href="/dashboard" className="hover:text-emerald-400 transition-colors">Student Workspace</Link></li>
                  <li><Link href="/campaigns" className="hover:text-emerald-400 transition-colors">Outreach Tracking</Link></li>
                  <li><Link href="/applications" className="hover:text-emerald-400 transition-colors">Application Tracker</Link></li>
                  <li><Link href="/pricing" className="hover:text-emerald-400 transition-colors">Academic Plans</Link></li>
                  <li><Link href="/billing" className="hover:text-emerald-400 transition-colors">Billing &amp; Invoices</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider mb-3.5">Academic Integrity</h4>
                <ul className="space-y-2 text-xs">
                  <li><Link href="/responsible-outreach" className="hover:text-emerald-400 transition-colors">Ethical Outreach Standards</Link></li>
                  <li><Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
                  <li><Link href="/faq" className="hover:text-emerald-400 transition-colors">Verification FAQs</Link></li>
                  <li><Link href="/admin" className="text-amber-400 hover:underline transition-colors">Admin Console</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider mb-3.5">Institutional Support</h4>
                <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                  Questions regarding university source verification or faculty indexing?
                </p>
                <a href={`mailto:${settings.supportEmail || 'profmatchsupport@gmail.com'}`} className="text-xs text-emerald-400 font-medium hover:underline block mb-3">
                  {settings.supportEmail || 'profmatchsupport@gmail.com'}
                </a>
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <span>US</span> &bull; <span>Canada</span> &bull; <span>UK</span> &bull; <span>EU</span> &bull; <span>Australia</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/80 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
              <div className="flex flex-col gap-2 text-center sm:text-left">
                <p>&copy; {new Date().getFullYear()} {settings.siteName}. Designed for serious academic research.</p>
                <p className="text-sm font-semibold text-slate-200 tracking-wide">
                  Powered by <span className="text-emerald-400 font-bold">Tonovox technologies</span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Verifiable Academic Sources
                </span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
