export const GENERIC_AUTH_ERROR =
  'Something went wrong. Please try again.';

/** Maps Supabase / network errors to short, user-safe copy. */
export function mapAuthErrorMessage(message: string): string {
  const trimmed = message.trim();
  const normalized = trimmed.toLowerCase();

  if (!normalized || normalized === '{}') {
    return GENERIC_AUTH_ERROR;
  }

  if (normalized.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  if (
    normalized.includes('user already registered') ||
    normalized.includes('already been registered')
  ) {
    return 'An account with this email already exists.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Please confirm your email, then sign in.';
  }
  if (normalized.includes('password') && normalized.includes('least')) {
    return 'Password must be at least 6 characters.';
  }
  if (normalized.includes('rate limit') || normalized.includes('too many')) {
    return 'Too many attempts. Wait a moment and try again.';
  }
  if (normalized.includes('cancel')) {
    return 'Sign in cancelled';
  }
  if (normalized.includes('backend not configured')) {
    return 'App is not connected yet. Try again later.';
  }

  if (
    normalized.includes('database error') ||
    normalized.includes('unexpected_failure') ||
    normalized.includes('unexpected error') ||
    normalized.includes('error_code') ||
    normalized.includes('internal server') ||
    /^\{[\s\S]*\}$/.test(trimmed)
  ) {
    return GENERIC_AUTH_ERROR;
  }

  if (trimmed.length < 80 && !trimmed.includes('{') && !trimmed.includes('http')) {
    return trimmed;
  }

  return GENERIC_AUTH_ERROR;
}

export function getFriendlyAuthError(error: unknown): string {
  if (error instanceof Error) {
    return mapAuthErrorMessage(error.message);
  }
  return GENERIC_AUTH_ERROR;
}
