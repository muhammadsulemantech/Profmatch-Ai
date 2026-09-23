import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAllSiteContent, updateSiteContent } from '@/lib/cms/content-service';
import { logAuditEvent } from '@/lib/security/audit';
import { assertAdmin } from '@/lib/auth/server-auth';
import { apiSuccess, apiError } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const content = await getAllSiteContent();
    return apiSuccess({ content });
  } catch (error: any) {
    return apiError(error.message || 'Failed to fetch content', 500);
  }
}

const UpdateContentSchema = z.object({
  sectionKey: z.string().min(1, 'sectionKey is required'),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  content: z.any().optional(),
  isPublished: z.boolean().optional(),
  data: z
    .object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      content: z.any().optional(),
    })
    .optional(),
});

export async function PUT(request: NextRequest) {
  const auth = await assertAdmin(request);
  if (!auth.authorized) return auth.errorResponse;

  try {
    const body = await request.json();
    const parsed = UpdateContentSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Invalid content payload', 400);
    }

    const { sectionKey, title, subtitle, content, isPublished, data } = parsed.data;

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
      userId: auth.session.user.id,
      userEmail: auth.session.user.email,
    });

    return apiSuccess({ section: updated, message: 'Content section updated successfully.' });
  } catch (err: any) {
    return apiError(err.message || 'Failed to update content', 500);
  }
}
