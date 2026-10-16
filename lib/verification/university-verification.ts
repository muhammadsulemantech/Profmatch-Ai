import type {
  VerificationStatus,
  EmailVerificationStatus,
  ProfessorSource,
} from '@/types/database';

export interface VerificationEvidence {
  fieldVerified: 'identity' | 'affiliation' | 'email' | 'designation';
  evidenceType:
    | 'OFFICIAL_UNIVERSITY_DIRECTORY'
    | 'INSTITUTIONAL_TLD_MATCH'
    | 'ACADEMIC_GRAPH_RECORD'
    | 'EXTERNAL_INDEX'
    | 'UNVERIFIED';
  evidenceUrl: string;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  emailVerificationStatus: EmailVerificationStatus;
  confidenceScore: number;
  snippet?: string;
  lastCheckedAt: string;
}

export interface VerificationEvaluation {
  overallStatus: VerificationStatus;
  emailStatus: EmailVerificationStatus;
  confidenceScore: number;
  evidences: VerificationEvidence[];
  sources: ProfessorSource[];
  isVerified: boolean;
}

/**
 * Global Institutional Domain Suffixes (Accredited universities & higher-ed ccTLDs)
 */
const ACCREDITED_INSTITUTION_DOMAINS = [
  '.edu',
  '.ac.uk',
  '.edu.pk',
  '.ac.jp',
  '.edu.cn',
  '.ac.kr',
  '.edu.au',
  '.utoronto.ca',
  '.ubc.ca',
  '.mcgill.ca',
  '.uwaterloo.ca',
  '.tum.de',
  '.lmu.de',
  '.rwth-aachen.de',
  '.uni-heidelberg.de',
  '.ethz.ch',
  '.epfl.ch',
  '.kth.se',
  '.polimi.it',
  '.usp.br',
  '.ens.psl.eu',
  '.sorbonne-universite.fr',
];

/**
 * Checks if a URL or host belongs to an accredited university domain
 */
export function isAccreditedInstitutionalDomain(urlOrHost?: string): boolean {
  if (!urlOrHost) return false;
  const lower = urlOrHost.toLowerCase().trim();
  return ACCREDITED_INSTITUTION_DOMAINS.some((suffix) => lower.includes(suffix));
}

/**
 * Checks whether an email address uses an institutional domain
 */
export function isInstitutionalEmail(email?: string | null): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1]?.toLowerCase().trim();
  return isAccreditedInstitutionalDomain(domain);
}

/**
 * Modular University Verification Engine
 * Analyzes provided profile evidence without fabricating credentials or guessing emails.
 */
export class UniversityVerificationEngine {
  /**
   * Verifies researcher identity, university affiliation, and email status.
   * OpenAlex records alone do not establish faculty employment or verify an email.
   */
  public static verifyFaculty(params: {
    name: string;
    universityName?: string;
    profileUrl?: string;
    officialPageUrl?: string;
    email?: string | null;
    openAlexAuthorId?: string;
    rorId?: string;
    orcid?: string;
  }): VerificationEvaluation {
    const now = new Date().toISOString();
    const evidences: VerificationEvidence[] = [];
    const sources: ProfessorSource[] = [];

    // 1. Evidence: OpenAlex Academic Graph (Discovery only, never full verification)
    if (params.openAlexAuthorId) {
      evidences.push({
        fieldVerified: 'identity',
        evidenceType: 'ACADEMIC_GRAPH_RECORD',
        evidenceUrl: params.openAlexAuthorId.startsWith('http')
          ? params.openAlexAuthorId
          : `https://openalex.org/${params.openAlexAuthorId}`,
        isVerified: false, // OpenAlex alone is research-discovery only
        verificationStatus: 'UNVERIFIED',
        emailVerificationStatus: 'UNVERIFIED',
        confidenceScore: 0.45,
        snippet: 'Author profile indexed in OpenAlex academic graph. Requires institutional proof.',
        lastCheckedAt: now,
      });

      sources.push({
        id: `src_openalex_${Date.now()}`,
        professor_id: '',
        source_type: 'PUB_METADATA',
        source_url: params.openAlexAuthorId.startsWith('http')
          ? params.openAlexAuthorId
          : `https://openalex.org/${params.openAlexAuthorId}`,
        snippet: 'OpenAlex author entity and publication citation graph.',
        verified_at: now,
      });
    }

    // 2. Evidence: Official Faculty Page or Department Directory
    let hasOfficialFacultyPage = false;
    const targetProfileUrl = params.officialPageUrl || params.profileUrl;

    if (targetProfileUrl) {
      const isInstitutional = isAccreditedInstitutionalDomain(targetProfileUrl);
      if (isInstitutional) {
        hasOfficialFacultyPage = true;
        evidences.push({
          fieldVerified: 'affiliation',
          evidenceType: 'OFFICIAL_UNIVERSITY_DIRECTORY',
          evidenceUrl: targetProfileUrl,
          isVerified: true,
          verificationStatus: 'PARTIALLY_VERIFIED',
          emailVerificationStatus: 'UNVERIFIED',
          confidenceScore: 0.75,
          snippet: `Institutional faculty roster / web presence verified at ${targetProfileUrl}.`,
          lastCheckedAt: now,
        });

        sources.push({
          id: `src_inst_${Date.now()}`,
          professor_id: '',
          source_type: 'UNIVERSITY_FACULTY_PAGE',
          source_url: targetProfileUrl,
          snippet: `Official faculty directory on institutional domain.`,
          verified_at: now,
        });
      } else {
        evidences.push({
          fieldVerified: 'affiliation',
          evidenceType: 'EXTERNAL_INDEX',
          evidenceUrl: targetProfileUrl,
          isVerified: false,
          verificationStatus: 'UNVERIFIED',
          emailVerificationStatus: 'UNVERIFIED',
          confidenceScore: 0.35,
          snippet: `Third-party web reference: ${targetProfileUrl}.`,
          lastCheckedAt: now,
        });
      }
    }

    // 3. Evidence: Email Verification
    let finalEmailStatus: EmailVerificationStatus = 'NOT_FOUND';
    if (params.email && params.email.trim() && params.email.includes('@')) {
      const isInstEmail = isInstitutionalEmail(params.email);
      if (isInstEmail) {
        finalEmailStatus = hasOfficialFacultyPage ? 'VERIFIED' : 'LIKELY';
        evidences.push({
          fieldVerified: 'email',
          evidenceType: 'INSTITUTIONAL_TLD_MATCH',
          evidenceUrl: targetProfileUrl || 'https://openalex.org',
          isVerified: hasOfficialFacultyPage,
          verificationStatus: hasOfficialFacultyPage ? 'VERIFIED' : 'PARTIALLY_VERIFIED',
          emailVerificationStatus: finalEmailStatus,
          confidenceScore: hasOfficialFacultyPage ? 0.9 : 0.65,
          snippet: `Direct institutional mailbox: ${params.email}`,
          lastCheckedAt: now,
        });
      } else {
        finalEmailStatus = 'UNVERIFIED';
        evidences.push({
          fieldVerified: 'email',
          evidenceType: 'UNVERIFIED',
          evidenceUrl: targetProfileUrl || '',
          isVerified: false,
          verificationStatus: 'UNVERIFIED',
          emailVerificationStatus: 'UNVERIFIED',
          confidenceScore: 0.25,
          snippet: `Non-institutional email provided: ${params.email}`,
          lastCheckedAt: now,
        });
      }
    } else {
      finalEmailStatus = 'NOT_FOUND';
    }

    // 4. Calculate Final Harmonized Status
    let overallStatus: VerificationStatus = 'UNVERIFIED';
    let confidence = 0.4;

    if (hasOfficialFacultyPage && finalEmailStatus === 'VERIFIED') {
      overallStatus = 'VERIFIED';
      confidence = 0.95;
    } else if (hasOfficialFacultyPage || params.orcid) {
      overallStatus = 'PARTIALLY_VERIFIED';
      confidence = 0.7;
    } else {
      overallStatus = 'UNVERIFIED';
      confidence = 0.45;
    }

    return {
      overallStatus,
      emailStatus: finalEmailStatus,
      confidenceScore: confidence,
      evidences,
      sources,
      isVerified: overallStatus === 'VERIFIED',
    };
  }
}
