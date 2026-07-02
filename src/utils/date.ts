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
