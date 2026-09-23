import { NextRequest, NextResponse } from 'next/server';
import { getAllSiteContent, updateSiteContent } from '@/lib/cms/content-service';
import { logAuditEvent } from '@/lib/security/audit';
import { assertAdmin } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

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
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
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
        userId: auth.session.user.id,
        userEmail: auth.session.user.email,
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
