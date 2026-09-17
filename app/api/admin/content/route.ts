import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';
import { updateSiteContent } from '@/lib/cms/content-service';
import { logAuditEvent } from '@/lib/security/audit';

export async function GET() {
  return NextResponse.json({ content: mockDb.siteContent });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sectionKey, title, subtitle, content, isPublished, data } = body;

    if (!sectionKey) {
      return NextResponse.json({ error: 'sectionKey is required.' }, { status: 400 });
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

    await logAuditEvent({
      action: 'CMS_CONTENT_UPDATED',
      resourceType: 'SITE_CONTENT',
      resourceId: sectionKey,
      metadata: { title: finalTitle, isPublished },
    });

    return NextResponse.json({ success: true, section: updated });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update content.' }, { status: 500 });
  }
}
