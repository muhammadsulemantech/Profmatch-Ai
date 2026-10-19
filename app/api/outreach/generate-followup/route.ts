import { NextRequest, NextResponse } from 'next/server';
import { generateSmartFollowUp } from '@/lib/services/followup-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { professorName, originalSubject, researchFocus, studentName, studentDegree, daysPassed } = body;

    if (!professorName || !studentName) {
      return NextResponse.json(
        { error: 'Professor name and student name are required' },
        { status: 400 }
      );
    }

    const followUp = await generateSmartFollowUp({
      professorName,
      originalSubject,
      researchFocus,
      studentName,
      studentDegree,
      daysPassed: daysPassed || 6,
    });

    return NextResponse.json({
      success: true,
      data: followUp,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate follow-up' },
      { status: 500 }
    );
  }
}
