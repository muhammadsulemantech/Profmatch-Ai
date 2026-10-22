import { NextRequest, NextResponse } from 'next/server';
import { getProfessorById } from '@/lib/services/professor-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rawId = params.id;
    if (!rawId) {
      return NextResponse.json(
        { success: false, error: 'Professor identifier is required.' },
        { status: 400 }
      );
    }

    const profId = decodeURIComponent(rawId);
    const professor = await getProfessorById(profId);

    if (!professor) {
      return NextResponse.json(
        {
          success: false,
          error: `Faculty member profile with ID "${profId}" could not be located in academic databases.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      professor,
    });
  } catch (error: any) {
    console.error('[API PROFESSOR BY ID ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error while retrieving faculty profile.',
      },
      { status: 500 }
    );
  }
}
