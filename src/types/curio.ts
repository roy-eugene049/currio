export type Category =
  | 'Technology'
  | 'Space'
  | 'AI'
  | 'History'
  | 'Psychology'
  | 'Philosophy'
  | 'Science'
  | 'Nature'
  | 'Business'
  | 'Finance'
  | 'Design'
  | 'Mathematics'
  | 'Art'
  | 'Music'
  | 'Medicine'
  | 'Wildlife'
  | 'Geography';

export interface Curio {
  id: string;
  title: string;
  content: string;
  category: Category;
  readingTime: string;
  image?: string | null;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface CurioCollection {
  id: string;
  name: string;
  curioIds: string[];
  updatedAt: string;
}

export interface AppState {
  hasCompletedOnboarding: boolean;
  hasSeenWelcome: boolean;
  interests: Category[];
  bookmarks: string[];
  collections: CurioCollection[];
  seenCurioIds: string[];
  streak: number;
  lastOpenDate: string | null;
  themeMode: ThemeMode;
  todaysCurioId: string | null;
  todaysCurioDate: string | null;
  weeklyDigestEnabled: boolean;
}
