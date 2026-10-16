import { NextRequest, NextResponse } from 'next/server';
import { ACADEMIC_DOMAINS } from '@/lib/taxonomy/academic-taxonomy';
import { checkRateLimit, getClientIp, RATE_LIMIT_PRESETS } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Comprehensive vocabulary of scholarly disciplines and academic keywords
const SCHOLARLY_DICTIONARY = [
  // AI, Data & Computing
  'Artificial Intelligence',
  'Machine Learning',
  'Deep Learning',
  'Natural Language Processing',
  'Large Language Models (LLMs)',
  'Generative AI & RAG Systems',
  'Computer Vision',
  'Robotics & Autonomous Systems',
  'Reinforcement Learning',
  'Data Science & Big Data Engineering',
  'Software Engineering & Architecture',
  'Cybersecurity & Cryptography',
  'Cloud & Distributed Systems',
  'Knowledge Graphs & Semantic Web',
  'Bioinformatics & Computational Biology',
  'Human-Computer Interaction (HCI)',
  'Quantum Computing & Algorithms',
  'Internet of Things (IoT) & Embedded Systems',
  'Information Retrieval & Search Engines',
  'Neural Networks & Transformers',
  'Speech Recognition & Audio Processing',

  // Life & Health Sciences
  'CRISPR Assays & Genome Editing',
  'Molecular & Cellular Biology',
  'Biochemistry & Biophysics',
  'Neuroscience & Neurobiology',
  'Immunology & Vaccine Development',
  'Oncology & Cancer Therapeutics',
  'Epidemiology & Public Health',
  'Pharmacology & Drug Discovery',
  'Genetics & Genomics',
  'Stem Cell & Regenerative Medicine',

  // Engineering & Applied Physical Sciences
  'Electrical & Electronic Engineering',
  'Mechanical & Thermal Engineering',
  'Civil & Structural Engineering',
  'Chemical Engineering & Catalysis',
  'Aerospace & Aeronautical Engineering',
  'Materials Science & Nanotechnology',
  'Microelectronics & VLSI Design',
  'Mechatronics & Control Systems',
  'Renewable Energy & Photovoltaics',
  'Biomedical Engineering & Devices',

  // Physics, Math & Chemistry
  'Applied Physics & Condensed Matter',
  'Astrophysics & Cosmology',
  'Pure & Applied Mathematics',
  'Probability & Mathematical Statistics',
  'Organic Chemistry & Synthesis',
  'Analytical & Physical Chemistry',

  // Economics, Management & Social Sciences
  'Applied Econometrics & Quantitative Economics',
  'Corporate Finance & FinTech',
  'Behavioral Economics & Decision Sciences',
  'Cognitive Psychology & Cognitive Science',
  'International Relations & Public Policy',
  'Sustainable Urban Planning & GIS',
];

interface ParsedCvData {
  candidateName: string | null;
  currentDegree: string | null;
  targetDegree: string | null;
  major: string | null;
  academicDomain: string | null;
  desiredField: string | null;
  university: string | null;
  cgpa: string | null;
  gradYear: number | null;
  thesisTitle: string | null;
  thesisAbstract: string | null;
  keywords: string[];
  bio: string | null;
  rawTextLength: number;
}

function cleanExtractedText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function extractTextFallback(buffer: Buffer): string {
  const latin1 = buffer.toString('latin1');
  // Match printable text segments from PDF streams
  const chunks = latin1.match(/[\x20-\x7E\t\n]{4,}/g) || [];
  return chunks.join(' ').replace(/(\/Filter|\/Length|\/Type|\/Catalog|\/Pages|\/Font)[\w\d]*/g, ' ');
}

function analyzeCvText(text: string, fileName: string): ParsedCvData {
  const lower = text.toLowerCase();
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Candidate Name (from first few lines or filename)
  let candidateName: string | null = null;
  const fileNameClean = fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/([_-]?(?:cv|resume|academic|curriculum|vitae|202\d|v\d+))+/gi, '')
    .replace(/[-_]/g, ' ')
    .trim();

  if (fileNameClean.length >= 3 && !/^\d+$/.test(fileNameClean)) {
    candidateName = fileNameClean
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  } else {
    for (const line of lines.slice(0, 5)) {
      if (
        line.length > 2 &&
        line.length < 40 &&
        !line.includes('@') &&
        !line.includes('http') &&
        !line.toLowerCase().includes('curriculum') &&
        !line.toLowerCase().includes('resume') &&
        !line.toLowerCase().includes('page')
      ) {
        candidateName = line;
        break;
      }
    }
  }

  // 2. Degree and Target Degree
  let currentDegree: string | null = null;
  let targetDegree: string | null = 'PhD';

  if (
    lower.includes('doctor of philosophy') ||
    lower.includes('ph.d') ||
    lower.includes('phd candidate')
  ) {
    currentDegree = 'PhD';
    targetDegree = 'Postdoctoral Fellowship';
  } else if (
    lower.includes('master of science') ||
    lower.includes('m.sc') ||
    lower.includes('ms computer') ||
    lower.includes('ms software') ||
    lower.includes('m.phil') ||
    lower.includes('master of engineering') ||
    lower.includes("master's degree")
  ) {
    currentDegree = 'Master of Science (M.Sc.)';
    targetDegree = 'PhD';
  } else if (
    lower.includes('bachelor of science') ||
    lower.includes('b.sc') ||
    lower.includes('bs computer') ||
    lower.includes('bs in') ||
    lower.includes('bsc') ||
    lower.includes('bachelor of engineering') ||
    lower.includes('b.e.') ||
    lower.includes('b.tech') ||
    lower.includes("bachelor's")
  ) {
    currentDegree = 'Bachelor of Science (B.Sc.)';
    targetDegree = lower.includes('seeking ms') || lower.includes('masters application') ? 'MS' : 'PhD';
  }

  // 3. Major / Field of Study
  let major: string | null = null;
  if (lower.includes('computer science')) {
    major = 'Computer Science';
  } else if (lower.includes('artificial intelligence')) {
    major = 'Artificial Intelligence';
  } else if (lower.includes('data science')) {
    major = 'Data Science';
  } else if (lower.includes('software engineering')) {
    major = 'Software Engineering';
  } else if (lower.includes('electrical engineering')) {
    major = 'Electrical Engineering';
  } else if (lower.includes('mechanical engineering')) {
    major = 'Mechanical Engineering';
  } else if (lower.includes('biotechnology') || lower.includes('bioinformatics')) {
    major = 'Bioinformatics & Biotechnology';
  } else if (lower.includes('biomedical engineering')) {
    major = 'Biomedical Engineering';
  } else if (lower.includes('civil engineering')) {
    major = 'Civil Engineering';
  } else if (lower.includes('economics') || lower.includes('finance')) {
    major = 'Economics & Finance';
  }

  // 4. University
  let university: string | null = null;
  const uniPatterns = [
    /National University of Sciences and Technology(?:\s*\(NUST\))?/i,
    /NUST/i,
    /FAST(?:\s*[-–]\s*NUCES)?/i,
    /COMSATS(?:\s*University)?/i,
    /LUMS|Lahore University of Management Sciences/i,
    /Quaid-i-Azam University/i,
    /University of Engineering and Technology|UET\s+[A-Za-z]+/i,
    /GIKI|Ghulam Ishaq Khan Institute/i,
    /Massachusetts Institute of Technology|MIT/i,
    /Stanford University/i,
    /Harvard University/i,
    /Carnegie Mellon University|CMU/i,
    /University of [A-Za-z\s]+(?:Campus)?/i,
    /[A-Za-z\s]+ University/i,
    /[A-Za-z\s]+ Institute of Technology/i,
  ];

  for (const pat of uniPatterns) {
    const match = text.match(pat);
    if (match) {
      university = match[0].trim();
      if (university.toUpperCase() === 'NUST') {
        university = 'National University of Sciences and Technology (NUST)';
      }
      break;
    }
  }

  // 5. CGPA / GPA
  let cgpa: string | null = null;
  const cgpaMatch = text.match(/(?:cgpa|gpa)[\s:=]*([0-3]\.\d{1,2}|4\.00?|4\.0)(?:\s*\/\s*4(?:\.00?)?)?/i);
  if (cgpaMatch && cgpaMatch[1]) {
    cgpa = cgpaMatch[1];
  }

  // 6. Graduation Year
  let gradYear: number | null = null;
  const yearMatch = text.match(/\b(201[8-9]|202[0-9]|2030)\b/);
  if (yearMatch) {
    gradYear = parseInt(yearMatch[1], 10);
  }

  // 7. Thesis / Capstone / Major Project Title
  let thesisTitle: string | null = null;
  let thesisAbstract: string | null = null;

  const projectPatterns = [
    /(?:Final Year Project|FYP|Capstone Project|Undergraduate Thesis|Master'?s? Thesis|Bachelor'?s? Thesis|Major Research Project)[\s:\-]+([^\n\r.]+)/i,
    /(?:Research Project|Key Project|Featured Project)[\s:\-]+([^\n\r.]+)/i,
  ];

  for (const pat of projectPatterns) {
    const m = text.match(pat);
    if (m && m[1]) {
      const candidate = m[1].trim();
      if (candidate.length > 5 && candidate.length < 120) {
        thesisTitle = candidate.replace(/^[:\-–\s]+/, '').trim();
        break;
      }
    }
  }

  // Contextual abstract extraction
  if (thesisTitle) {
    const titleIdx = text.indexOf(thesisTitle);
    if (titleIdx !== -1) {
      const restOfSection = text.slice(titleIdx + thesisTitle.length, titleIdx + thesisTitle.length + 350);
      const cleanDesc = restOfSection
        .replace(/^[•\-\*:\s]+/, '')
        .split('\n')
        .map((l) => l.trim().replace(/^[•\-\*]\s*/, ''))
        .filter((l) => l.length > 15)
        .slice(0, 2)
        .join(' ');
      if (cleanDesc.length > 20) {
        thesisAbstract = cleanDesc;
      }
    }
  }

  // 8. Research Keywords (Matched directly against the text content)
  const matchedKeywords: string[] = [];

  for (const dictWord of SCHOLARLY_DICTIONARY) {
    const dictLower = dictWord.toLowerCase();
    const tokenClean = dictLower.replace(/[\(\)&,\-]/g, ' ').replace(/\s+/g, ' ').trim();

    // Check direct substring
    if (lower.includes(dictLower) || lower.includes(tokenClean)) {
      matchedKeywords.push(dictWord);
      continue;
    }

    // Check specific acronyms
    if (dictWord.includes('LLMs') && (lower.includes('llm') || lower.includes('large language model'))) {
      matchedKeywords.push(dictWord);
      continue;
    }
    if (dictWord.includes('NLP') && (lower.includes('nlp') || lower.includes('natural language processing'))) {
      matchedKeywords.push(dictWord);
      continue;
    }
    if (dictWord.includes('RAG') && (lower.includes('rag') || lower.includes('retrieval-augmented'))) {
      matchedKeywords.push(dictWord);
      continue;
    }
    if (dictWord.includes('HCI') && (lower.includes('hci') || lower.includes('human computer interaction'))) {
      matchedKeywords.push(dictWord);
      continue;
    }
    if (dictWord.includes('IoT') && (lower.includes('iot') || lower.includes('internet of things'))) {
      matchedKeywords.push(dictWord);
      continue;
    }
  }

  // Deduplicate and cap top scholarly keywords (5 to 8 keywords max)
  const finalKeywords = Array.from(new Set(matchedKeywords)).slice(0, 8);

  // 9. Academic Domain & Desired Field Mapping
  let academicDomain = 'Computing, Artificial Intelligence & Informatics';
  let desiredField = 'Artificial Intelligence & Machine Learning';

  for (const dom of ACADEMIC_DOMAINS) {
    for (const disc of dom.disciplines) {
      if (lower.includes(disc.toLowerCase()) || (major && disc.toLowerCase().includes(major.toLowerCase()))) {
        academicDomain = dom.name;
        desiredField = disc;
        break;
      }
    }
  }

  // 10. Generate Academic Bio Summary
  const nameLabel = candidateName || 'Candidate';
  const majorLabel = major || 'Academic Studies';
  const focusKeywords = finalKeywords.slice(0, 3).join(', ');
  const bio = focusKeywords
    ? `${nameLabel} is an ambitious scholar in ${majorLabel} with research concentration in ${focusKeywords}.${university ? ` Affiliated with ${university}.` : ''} Seeking funded graduate research positions and faculty mentorship.`
    : `${nameLabel} is a dedicated scholar in ${majorLabel} preparing for funded graduate research and international academic collaboration.`;

  return {
    candidateName,
    currentDegree,
    targetDegree,
    major,
    academicDomain,
    desiredField,
    university,
    cgpa,
    gradYear,
    thesisTitle,
    thesisAbstract,
    keywords: finalKeywords,
    bio,
    rawTextLength: text.length,
  };
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`parse_cv:${ip}`, RATE_LIMIT_PRESETS.CV_PARSE);
    if (!rl.success) {
      const retryAfter = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: 'Too many CV upload requests. Please wait a moment before trying again.' },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': RATE_LIMIT_PRESETS.CV_PARSE.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(rl.reset / 1000).toString(),
          },
        }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No CV document attached' }, { status: 400 });
    }

    const fileName = file.name || 'Academic_CV.pdf';
    const fileSize = file.size;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = '';

    const isPdf = fileName.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

    if (isPdf) {
      try {
        const { PDFParse } = await import('pdf-parse');
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        extractedText = result.text || '';
      } catch (pdfErr) {
        console.warn('[CV PARSER] PDFParse error, falling back to stream extraction:', pdfErr);
        extractedText = extractTextFallback(buffer);
      }
    } else {
      // Plain text or markdown CV
      extractedText = buffer.toString('utf-8');
    }

    extractedText = cleanExtractedText(extractedText);

    // If PDF text is very small (scanned or image-only), use fallback extraction
    if (extractedText.length < 20) {
      extractedText = cleanExtractedText(extractTextFallback(buffer));
    }

    const parsedData = analyzeCvText(extractedText, fileName);

    return NextResponse.json({
      success: true,
      fileName,
      fileSize,
      uploadedAt: new Date().toISOString(),
      parsed: parsedData,
    });
  } catch (error: any) {
    console.error('[CV PARSER API ERROR]', error);
    return NextResponse.json(
      {
        error: 'Failed to parse CV document',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
