import { Professor, VerificationStatus, EmailVerificationStatus } from '@/types/database';

export interface SearchFilters {
  country?: string;
  region?: string;
  state?: string; // backwards compatibility
  city?: string;
  academicDomain?: string;
  discipline?: string;
  field?: string; // backwards compatibility
  customField?: string;
  interests?: string[];
  interdisciplinary?: boolean;
  recruitingOnly?: boolean;
  verifiedOnly?: boolean;
  emailVerifiedOnly?: boolean;
  roleTitles?: string[];
  minConfidenceScore?: number;
}

export interface SearchDiscoveryProgress {
  stage: string;
  percent: number;
  details?: string;
}

export interface SearchProvider {
  name: string;
  searchProfessors(query: string, filters: SearchFilters): Promise<Professor[]>;
  verifyFacultyProfile(profileUrl: string): Promise<{
    isVerified: boolean;
    sourceUrl: string;
    sourceType: string;
    snippet?: string;
    confidenceScore: number;
    emailStatus?: EmailVerificationStatus;
  }>;
}
