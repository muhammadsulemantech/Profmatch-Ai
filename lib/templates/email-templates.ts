/**
 * Email templates and academic salutation utilities.
 */

export interface SalutationResult {
  salutation: string;
  cleanName: string;
}

export function cleanProfessorSalutation(rawName?: string | null): SalutationResult {
  if (!rawName) return { salutation: 'Dear Professor,', cleanName: 'Professor' };

  let clean = rawName.trim();
  clean = clean
    .replace(
      /^(Full\s+Professor|Associate\s+Professor|Assistant\s+Professor|Distinguished\s+Professor|Chair\s+Professor|Prof\.\s*Dr\.|Professor\s+Dr\.|Prof\.|Dr\.|Professor)\s*/i,
      ''
    )
    .trim();
  clean = clean.replace(/^(&\s*Chair|Chair\s*of|Head\s*of)\s*/i, '').trim();

  const isDepartmentString =
    clean.toLowerCase().includes('intelligence') ||
    clean.toLowerCase().includes('department') ||
    clean.toLowerCase().includes('foundations') ||
    clean.toLowerCase().includes('chair') ||
    clean.toLowerCase().includes('machine learning') ||
    clean.length > 35;

  if (isDepartmentString) {
    return { salutation: 'Dear Professor,', cleanName: 'Professor' };
  }

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { salutation: `Dear Professor ${parts[0]},`, cleanName: parts[0] };
  }
  if (parts.length >= 2) {
    const lastName = parts[parts.length - 1];
    return { salutation: `Dear Professor ${lastName},`, cleanName: `${parts[0]} ${lastName}` };
  }

  return { salutation: 'Dear Professor,', cleanName: 'Professor' };
}

export interface GroundedTemplateParams {
  studentName: string;
  salutation: string;
  profUni: string;
  profDept: string;
  profPaper: string;
  profInterests: string;
  targetDegree: string;
  focusKeyword: string;
  secondaryKeyword: string;
  studentUni: string;
}

export function renderGroundedEmailTemplate(
  variant: number,
  params: GroundedTemplateParams
): { subject: string; bodyText: string } {
  const {
    studentName,
    salutation,
    profUni,
    profDept,
    profPaper,
    profInterests,
    targetDegree,
    focusKeyword,
    secondaryKeyword,
    studentUni,
  } = params;

  switch (variant % 4) {
    case 0:
      return {
        subject: `Prospective ${targetDegree} Inquiry: ${focusKeyword} — ${studentName}`,
        bodyText: `${salutation}\n\nI hope this email finds you well amid your teaching and research responsibilities at ${profUni}.\n\nI am writing to express my strong interest in joining your group as a prospective ${targetDegree} student for the Fall 2027 admissions cycle. Having closely followed your contributions in ${profDept}—specifically your work on "${profPaper}"—I am eager to contribute to your lab's ongoing initiatives.\n\nMy academic background at ${studentUni} focused on ${focusKeyword} and ${secondaryKeyword}. In my recent projects, I explored how computational frameworks in ${focusKeyword} can improve empirical reliability. Your laboratory's focus on ${profInterests} provides the ideal environment to deepen this investigation.\n\nI have attached my academic CV and summary of research projects for your review. Would you have 10-15 minutes in the coming weeks for a brief conversation to discuss prospective student openings in your group?\n\nThank you very much for your time and consideration.\n\nSincerely,\n${studentName}\n${studentUni}`,
      };
    case 1:
      return {
        subject: `Research Inquiry regarding ${profDept} (${targetDegree} Applicant, ${studentName})`,
        bodyText: `${salutation}\n\nI hope semester proceedings are going well.\n\nMy name is ${studentName}, and I am preparing my application for the ${targetDegree} program at ${profUni} for Fall 2027. Your published investigations on "${profPaper}" in ${profDept} caught my attention, as they address critical challenges in ${profInterests}.\n\nDuring my studies at ${studentUni}, my research concentrated on ${secondaryKeyword} with applications in ${focusKeyword}. I developed a deep appreciation for the analytical methodologies you employ, and I am very motivated to explore how my technical background can support your current projects.\n\nI have attached my CV and transcripts. Could you kindly let me know if you anticipate accepting new ${targetDegree} research students for the upcoming cycle?\n\nThank you for your time, consideration, and scholarship.\n\nWarm regards,\n${studentName}`,
      };
    case 2:
      return {
        subject: `Prospective ${targetDegree} Student — Alignment with your work in ${profInterests.split(',')[0]}`,
        bodyText: `${salutation}\n\nI hope you are having a productive week.\n\nI am reaching out to inquire whether you will be advising new ${targetDegree} researchers at ${profUni} for the upcoming Fall 2027 intake. I have been studying your lab's focus on ${profInterests}, with particular interest in your findings concerning "${profPaper}."\n\nAt ${studentUni}, I completed research exploring ${focusKeyword}. Specifically, I worked on implementing scalable models for ${secondaryKeyword}, which directly parallels the research questions pursued by your group in ${profDept}.\n\nI have attached my curriculum vitae for your review. If your schedule permits, I would be deeply grateful for any insights on prospective openings in your lab.\n\nThank you very much for your guidance.\n\nBest regards,\n${studentName}`,
      };
    default:
      return {
        subject: `Inquiry on Doctoral Supervision in ${profDept} — ${studentName}`,
        bodyText: `${salutation}\n\nI hope this note finds you well.\n\nI am writing to inquire about potential research supervision as a prospective ${targetDegree} candidate at ${profUni}. I have long admired your laboratory's scholarship in ${profInterests}, and was inspired by your work on "${profPaper}."\n\nHaving conducted research in ${focusKeyword} at ${studentUni}, I am keen to direct my doctoral studies toward the intersection of ${focusKeyword} and ${profDept}. Your team's innovative approach represents the exact scholarly direction I hope to pursue.\n\nMy complete academic CV and project portfolio are attached. I would appreciate the opportunity to learn if you will be considering new graduate advisees for the upcoming cycle.\n\nThank you for your valuable time and consideration.\n\nRespectfully,\n${studentName}`,
      };
  }
}
