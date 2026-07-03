import type { Category } from '@/types/curio';

export const CATEGORIES: Category[] = [
  'Technology',
  'Space',
  'AI',
  'History',
  'Psychology',
  'Philosophy',
  'Science',
  'Nature',
  'Business',
  'Finance',
  'Design',
  'Mathematics',
  'Art',
  'Music',
  'Medicine',
  'Wildlife',
  'Geography',
];

export const CATEGORY_ICONS: Record<Category, string> = {
  Technology: 'hardware-chip-outline',
  Space: 'planet-outline',
  AI: 'sparkles-outline',
  History: 'time-outline',
  Psychology: 'happy-outline',
  Philosophy: 'book-outline',
  Science: 'flask-outline',
  Nature: 'leaf-outline',
  Business: 'briefcase-outline',
  Finance: 'trending-up-outline',
  Design: 'color-palette-outline',
  Mathematics: 'calculator-outline',
  Art: 'brush-outline',
  Music: 'musical-notes-outline',
  Medicine: 'medkit-outline',
  Wildlife: 'paw-outline',
  Geography: 'globe-outline',
};

export const COLORS = {
  primary: '#4F46E5',
  secondary: '#8B5CF6',
  accent: '#06B6D4',
  background: '#F8FAFC',
  dark: '#0F172A',
  card: '#FFFFFF',
  cardDark: '#1E293B',
  muted: '#64748B',
  border: '#E2E8F0',
  borderDark: '#334155',
} as const;

export const APP_VERSION = '1.0.0';

export const STORAGE_KEYS = {
  APP_STATE: 'currio_app_state',
  LAST_AUTH_USER_ID: 'currio_last_auth_user_id',
  LOCAL_STATE_UPDATED_AT: 'currio_local_state_updated_at',
} as const;
