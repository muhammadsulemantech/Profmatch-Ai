import { z } from 'zod';

export const StudentOnboardingSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  country: z.string().min(2, 'Country is required'),
  targetDegree: z.enum(['MS', 'PhD', 'Postdoc', 'Research Internship']),
  targetCountry: z.string().default('USA'),
  targetState: z.string().optional(),
  targetIntake: z.string().min(3, 'Target intake is required (e.g. Fall 2027)'),
  fundingPreference: z.string().default('Fully Funded'),
  desiredField: z.string().min(2, 'Desired field is required'),
  bio: z.string().max(1000).optional(),
  
  // Academic Profile
  currentDegree: z.string().min(2, 'Current degree is required'),
  major: z.string().min(2, 'Major is required'),
  university: z.string().min(2, 'University name is required'),
  graduationYear: z.number().int().min(2000).max(2035),
  cgpa: z.number().min(0).max(10),
  gradingScale: z.string().default('4.0'),
  achievements: z.string().max(2000).optional(),

  // Research Profile
  researchInterests: z.array(z.string()).min(1, 'Add at least 1 research interest'),
  thesisTitle: z.string().max(300).optional(),
  thesisAbstract: z.string().max(3000).optional(),
  experienceSummary: z.string().max(2000).optional(),

  // Skills & Projects
  skills: z.array(z.object({
    name: z.string(),
    proficiency: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  })).optional(),
  projects: z.array(z.object({
    title: z.string(),
    description: z.string(),
    technologies: z.array(z.string()),
    link: z.string().url().optional().or(z.literal('')),
  })).optional(),
});

export const ProfessorSearchSchema = z.object({
  query: z.string().optional(),
  country: z.string().default('USA'),
  state: z.string().optional(),
  field: z.string().optional(),
  degree: z.string().optional(),
  interests: z.array(z.string()).optional(),
  verifiedOnly: z.boolean().default(true),
  recruitingOnly: z.boolean().default(false),
});

export const EmailGenerationSchema = z.object({
  professorId: z.string().min(1, 'Professor ID is required'),
  campaignId: z.string().optional(),
  tone: z.enum(['academic', 'formal', 'direct', 'concise']).default('academic'),
  includeCvReference: z.boolean().default(true),
  includeThesis: z.boolean().default(true),
  customNote: z.string().max(500).optional(),
});

export const EmailSendSchema = z.object({
  emailId: z.string().min(1, 'Email ID is required'),
  recipientEmail: z.string().email('Invalid professor email address'),
  subject: z.string().min(5, 'Subject is required').max(200),
  bodyText: z.string().min(50, 'Email body must be at least 50 characters'),
  confirmedGrounded: z.boolean().refine(val => val === true, {
    message: 'You must confirm that you have reviewed and verified research personalization claims before sending.',
  }),
});

export const CampaignCreateSchema = z.object({
  name: z.string().min(3, 'Campaign name must be at least 3 characters').max(100),
  description: z.string().max(500).optional(),
  targetIntake: z.string().min(3, 'Target intake is required'),
  professorIds: z.array(z.string()).min(1, 'Add at least 1 professor to the campaign'),
});

export const AdminUserUpdateSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN', 'SUPPORT']).optional(),
  isSuspended: z.boolean().optional(),
  suspensionReason: z.string().max(500).optional(),
});

export const AdminCmsUpdateSchema = z.object({
  sectionKey: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  content: z.record(z.any()),
  isPublished: z.boolean().default(true),
});

export const AdminSiteSettingsUpdateSchema = z.object({
  siteName: z.string().min(1),
  tagline: z.string().min(1),
  supportEmail: z.string().email(),
  primaryEmail: z.string().email(),
  defaultCountry: z.string(),
  maintenanceMode: z.boolean().default(false),
  announcement: z.object({
    enabled: z.boolean(),
    message: z.string(),
    link: z.string(),
  }).optional(),
  socialLinks: z.record(z.string()).optional(),
});
