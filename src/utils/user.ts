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
  if (!user?.created_at) return 'New to Currio';

  const joined = new Date(user.created_at);
  if (Number.isNaN(joined.getTime())) return 'New to Currio';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfJoined = new Date(
    joined.getFullYear(),
    joined.getMonth(),
    joined.getDate(),
  );
  const daysAgo = Math.floor(
    (startOfToday.getTime() - startOfJoined.getTime()) / 86_400_000,
  );

  if (daysAgo <= 0) return 'Joined today';
  if (daysAgo === 1) return 'Joined yesterday';
  if (daysAgo < 7) return `Joined ${daysAgo} days ago`;

  if (joined.getFullYear() === now.getFullYear()) {
    return `Joined ${joined.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}`;
  }

  return `Joined ${joined.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })}`;
}
