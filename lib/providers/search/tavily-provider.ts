import { Professor, VerificationStatus, EmailVerificationStatus, RecruitingStatus } from '@/types/database';
import { SearchProvider, SearchFilters } from './search-provider.interface';
import { formatCleanProfessorEmail } from '@/lib/utils/email-resolver';

function extractAcademicRank(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('distinguished professor') || lower.includes('chair professor')) {
    return 'Distinguished Professor';
  }
  if (lower.includes('associate professor')) {
    return 'Associate Professor';
  }
  if (lower.includes('assistant professor')) {
    return 'Assistant Professor';
  }
  if (lower.includes('full professor') || lower.includes('professor')) {
    return 'Professor';
  }
  if (lower.includes('postdoctoral') || lower.includes('postdoc')) {
    return 'Postdoctoral Researcher';
  }
  if (lower.includes('lecturer') || lower.includes('instructor')) {
    return 'Lecturer';
  }
  return 'Faculty Researcher';
}

function detectRecruitingStatus(snippet: string): { status: RecruitingStatus; notes: string; evidence?: string } {
  const match = snippet.match(/(?:accepting|seeking|recruiting|hiring|looking for)\s+(?:phd|graduate|postdoc|doctoral|research)\s+(?:students?|fellows?|candidates?)/i);
  if (match) {
    return {
      status: 'ACTIVELY_RECRUITING',
      notes: `Active recruiting notice found in web snippet: "${match[0]}".`,
      evidence: match[0],
    };
  }
  return {
    status: 'UNKNOWN',
    notes: 'No explicit recruitment notice indexed for this faculty member.',
  };
}

export class TavilySearchProvider implements SearchProvider {
  name = 'Tavily Live Web & Academic Search Provider';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TAVILY_API_KEY || process.env.SEARCH_API_KEY || '';
  }

  async searchProfessors(query: string, filters: SearchFilters): Promise<Professor[]> {
    if (!this.apiKey || this.apiKey.includes('your-search-api-key')) {
      return [];
    }

    try {
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 30, 30);

      let searchTerm = `professor research lab faculty ${query || filters.discipline || filters.academicDomain || 'computer science'}`;
      if (page === 2) {
        searchTerm = `associate professor assistant professor academic researcher ${query || filters.discipline || filters.academicDomain || 'computer science'} directory`;
      } else if (page > 2) {
        searchTerm = `scholarly publications department faculty directory ${query || filters.discipline || filters.academicDomain || 'computer science'}`;
      }

      if (filters.country && filters.country !== 'Global (All Countries)') {
        searchTerm += ` ${filters.country}`;
      }

      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: this.apiKey,
          query: searchTerm,
          search_depth: 'basic',
          max_results: limit,
        }),
      });

      if (!response.ok) return [];

      const data = await response.json();
      const results = data.results || [];

      const professors: Professor[] = [];

      for (let index = 0; index < results.length; index++) {
        const item = results[index];
        const title = item.title || '';
        const url = item.url || '';
        const snippet = item.content || '';

        // Extract university name from domain if possible
        let detectedUniversity = filters.country ? `${filters.country} Academic Institute` : 'Global Research University';
        let isEduDomain = false;
        try {
          const parsedUrl = new URL(url);
          const host = parsedUrl.hostname.replace(/^www\./, '');
          const domainParts = host.split('.');
          if (domainParts.length >= 2) {
            const rootDomain = domainParts.slice(-2).join('.');
            const knownUnis: Record<string, string> = {
              'mit.edu': 'MIT (Massachusetts Institute of Technology)',
              'stanford.edu': 'Stanford University',
              'berkeley.edu': 'University of California, Berkeley',
              'ox.ac.uk': 'University of Oxford',
              'cam.ac.uk': 'University of Cambridge',
              'tum.de': 'Technical University of Munich (TUM)',
              'ethz.ch': 'ETH Zurich',
              'utoronto.ca': 'University of Toronto',
              'cmu.edu': 'Carnegie Mellon University',
              'washington.edu': 'University of Washington',
              'buffalo.edu': 'University at Buffalo',
              'stevens.edu': 'Stevens Institute of Technology',
              'harvard.edu': 'Harvard University',
              'princeton.edu': 'Princeton University',
              'cornell.edu': 'Cornell University',
              'columbia.edu': 'Columbia University',
              'ucla.edu': 'UCLA',
              'umich.edu': 'University of Michigan',
              'utexas.edu': 'University of Texas at Austin',
              'uiuc.edu': 'UIUC',
              'imperial.ac.uk': 'Imperial College London',
              'ucl.ac.uk': 'University College London',
              'ed.ac.uk': 'University of Edinburgh',
              'kth.se': 'KTH Royal Institute of Technology',
              'polimi.it': 'Politecnico di Milano',
              'u-tokyo.ac.jp': 'The University of Tokyo',
              'kyoto-u.ac.jp': 'Kyoto University',
              'nus.edu.sg': 'National University of Singapore',
              'unimelb.edu.au': 'University of Melbourne',
              'sydney.edu.au': 'University of Sydney',
            };
            if (knownUnis[rootDomain]) {
              detectedUniversity = knownUnis[rootDomain];
              isEduDomain = true;
            } else if (domainParts.some(p => p === 'edu' || p === 'ac')) {
              const mainName = domainParts[domainParts.length - 2];
              detectedUniversity = mainName.charAt(0).toUpperCase() + mainName.slice(1) + ' University';
              isEduDomain = true;
            }
          }
        } catch {}

        // Extract faculty name from page title or snippet
        const rawTitleSegment = title.split('|')[0].split('-')[0].split(':')[0].trim();
        const genericKeywords = [
          'faculty', 'staff', 'department', 'directory', 'home', 'profile',
          'welcome', 'jobs', 'experts', 'role', 'people', 'overview',
          'search', 'index', 'admissions', 'academics', 'research lab'
        ];
        const isGenericTitle = !rawTitleSegment ||
          genericKeywords.some(kw => rawTitleSegment.toLowerCase() === kw || rawTitleSegment.toLowerCase().includes(kw)) ||
          rawTitleSegment.split(/\s+/).length < 2 ||
          rawTitleSegment.length > 50;

        let cleanName = '';
        if (!isGenericTitle) {
          cleanName = rawTitleSegment.startsWith('Dr.') || rawTitleSegment.startsWith('Prof.')
            ? rawTitleSegment
            : `Prof. ${rawTitleSegment}`;
        } else {
          // Attempt extraction of a person name from the snippet
          const namePattern = /(?:Prof\.|Professor|Dr\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/;
          const match = snippet.match(namePattern);
          if (match && match[1]) {
            cleanName = `Prof. ${match[1]}`;
          } else {
            // Cannot identify a specific faculty member — do NOT invent a persona, skip this item
            continue;
          }
        }

        // Determine academic rank from content/title without round-robin fabrication
        const academicRank = extractAcademicRank(`${title} ${snippet}`);

        // Check if an email is present in the snippet
        const emailMatch = snippet.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const resolvedEmail = emailMatch
          ? emailMatch[0].toLowerCase()
          : formatCleanProfessorEmail({ name: cleanName, university_name: detectedUniversity });

        const emailVerificationStatus: EmailVerificationStatus = emailMatch ? 'LIKELY' : 'UNVERIFIED';
        const recruiting = detectRecruitingStatus(snippet);
        const discipline = filters.discipline || 'Computer Science';
        const uniqueId = `tavily-p${page}-${index}-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

        // Realistic confidence score: edu domain match gives 60%, unverified web gives 40%
        const confidenceScore = isEduDomain ? 60 : 40;

        professors.push({
          id: uniqueId,
          university_id: `univ-${index}`,
          name: cleanName,
          title: academicRank,
          position: academicRank,
          university_name: detectedUniversity,
          university_country: filters.country || 'International',
          department_name: filters.discipline ? `${filters.discipline} Department` : 'Academic Faculty',
          email: resolvedEmail,
          email_verification_status: emailVerificationStatus,
          verification_status: 'UNVERIFIED' as VerificationStatus,
          confidence_score: confidenceScore,
          recruiting_status: recruiting.status,
          recruiting_notes: recruiting.notes,
          recruiting_evidence: recruiting.evidence,
          academic_domain: filters.academicDomain || 'STEM & Technology',
          primary_discipline: discipline,
          research_interests: [discipline, 'Academic Research'],
          keywords: [discipline, academicRank],
          profile_url: url,
          lab_url: url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      return professors;
    } catch {
      return [];
    }
  }

  async verifyFacultyProfile(profileUrl: string): Promise<{
    isVerified: boolean;
    sourceUrl: string;
    sourceType: string;
    snippet?: string;
    confidenceScore: number;
    emailStatus?: EmailVerificationStatus;
  }> {
    // Return unverified unless genuine third-party verification is performed
    return {
      isVerified: false,
      sourceUrl: profileUrl,
      sourceType: 'TAVILY_LIVE_WEB_SEARCH',
      snippet: 'Web search reference — profile requires institutional email confirmation.',
      confidenceScore: 0.3,
      emailStatus: 'UNVERIFIED',
    };
  }
}
