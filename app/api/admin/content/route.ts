import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';
import { getAllSiteContent, updateSiteContent } from '@/lib/cms/content-service';
import { logAuditEvent } from '@/lib/security/audit';
import { verifyAdminSession } from '@/lib/auth/server-auth';

export async function GET() {
  const content = await getAllSiteContent();
  return NextResponse.json({ success: true, content });
}

export async function PUT(request: NextRequest) {
  return handleContentUpdate(request);
}

export async function POST(request: NextRequest) {
  return handleContentUpdate(request);
}

async function handleContentUpdate(request: NextRequest) {
  try {
    const adminSession = await verifyAdminSession(request);
    if (!adminSession) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Administrative access required.' }, { status: 401 });
    }

    const body = await request.json();
    const { sectionKey, title, subtitle, content, isPublished, data } = body;

    if (!sectionKey) {
      return NextResponse.json({ success: false, error: 'sectionKey is required.' }, { status: 400 });
    }

    const finalTitle = title !== undefined ? title : data?.title;
    const finalSubtitle = subtitle !== undefined ? subtitle : data?.subtitle;
    const finalContent = content !== undefined ? content : data?.content;

    const updated = await updateSiteContent(sectionKey, {
      title: finalTitle,
      subtitle: finalSubtitle,
      content: finalContent,
      is_published: isPublished,
    });

    try {
      await logAuditEvent({
        action: 'CMS_CONTENT_UPDATED',
        resourceType: 'SITE_CONTENT',
        resourceId: sectionKey,
        metadata: { title: finalTitle, isPublished },
      });
    } catch {
      // safe audit catch
    }

    return NextResponse.json({ success: true, section: updated });
  } catch (err: any) {
    console.error('[CONTENT API ERROR]', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to update content.' }, { status: 500 });
  }
}
