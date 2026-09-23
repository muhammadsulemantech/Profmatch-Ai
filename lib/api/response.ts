import { NextResponse } from 'next/server';

export interface ApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  hasMore?: boolean;
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string | null;
  message?: string;
  code?: string;
  meta?: ApiMeta;
  [key: string]: any;
}

/**
 * Creates a standardized JSON success response envelope.
 */
export function apiSuccess<T>(
  data: T,
  meta?: ApiMeta,
  status: number = 200,
  headers?: HeadersInit
): NextResponse<ApiResponse<T>> {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    error: null,
  };

  if (meta) {
    payload.meta = meta;
  }

  return NextResponse.json(payload, { status, headers });
}

/**
 * Creates a standardized JSON error response envelope.
 */
export function apiError(
  error: string,
  status: number = 400,
  code?: string,
  extra?: Record<string, any>,
  headers?: HeadersInit
): NextResponse<ApiResponse<null>> {
  const defaultCode =
    status === 401
      ? 'UNAUTHORIZED'
      : status === 403
      ? 'FORBIDDEN'
      : status === 404
      ? 'NOT_FOUND'
      : status === 429
      ? 'RATE_LIMITED'
      : 'BAD_REQUEST';

  const payload: ApiResponse<null> = {
    success: false,
    data: null,
    error,
    code: code || defaultCode,
    ...(extra || {}),
  };

  return NextResponse.json(payload, { status, headers });
}

/**
 * Helper to paginate an in-memory array.
 */
export function paginateArray<T>(
  items: T[],
  page: number = 1,
  pageSize: number = 20
): { items: T[]; meta: ApiMeta } {
  const currentPage = Math.max(1, page);
  const size = Math.max(1, Math.min(100, pageSize));
  const total = items.length;
  const totalPages = Math.ceil(total / size) || 1;
  const start = (currentPage - 1) * size;
  const end = start + size;
  const paginated = items.slice(start, end);

  return {
    items: paginated,
    meta: {
      page: currentPage,
      pageSize: size,
      total,
      totalPages,
      hasMore: currentPage < totalPages,
    },
  };
}
