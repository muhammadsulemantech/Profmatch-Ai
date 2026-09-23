export {
  verifyAuthSession,
  verifyAdminSession,
  requireUser,
  requireAdmin,
  assertAdmin,
  isAdminEmail,
  AuthError,
  type AuthSession,
  type AuthResult,
} from '@/lib/auth/server-auth';
