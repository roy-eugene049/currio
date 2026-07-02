import type { User } from '@supabase/supabase-js';

export function getUserDisplayName(user: User | null): string {
  if (!user) return 'Learner';

  const metadata = user.user_metadata as Record<string, string | undefined>;
  const fullName = metadata.full_name ?? metadata.name;
  if (fullName?.trim()) {
    return fullName.trim().split(' ')[0] ?? fullName;
  }

  const email = user.email;
  if (email) {
    const local = email.split('@')[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }

  return 'Learner';
}

export function getUserInitials(user: User | null): string {
  if (!user) return 'C';

  const metadata = user.user_metadata as Record<string, string | undefined>;
  const fullName = metadata.full_name ?? metadata.name;
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }

  const email = user.email;
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return 'C';
}

export function getMemberSince(user: User | null): string {
  if (!user?.created_at) return 'Recently joined';
  return new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}
