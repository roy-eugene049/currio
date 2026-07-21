export function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatDisplayDate(date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/** ISO-like week key for streak freeze accounting, e.g. "2026-W30". */
export function getWeekKey(date = new Date()): string {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function isSameDay(dateA: string, dateB: string): boolean {
  return dateA === dateB;
}

export function isConsecutiveDay(previousDate: string, currentDate: string): boolean {
  const prev = new Date(previousDate);
  const curr = new Date(currentDate);
  const diffMs = curr.getTime() - prev.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}
