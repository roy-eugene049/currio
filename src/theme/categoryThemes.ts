import type { Category } from '@/types/curio';

export interface CategoryTheme {
  /** Radial gradient — center of magnifier lens */
  lensCenter: string;
  lensMid: string;
  lensEdge: string;
  /** UI accent for category label & icons */
  accent: string;
  /** Frosted glass controls on this backdrop */
  glassBg: string;
  glassBorder: string;
  /** Floating text */
  textPrimary: string;
  textSecondary: string;
  textShadow: string;
  /** Optional subtle texture */
  image: string;
}

export const CATEGORY_THEMES: Record<Category, CategoryTheme> = {
  Technology: {
    lensCenter: 'rgba(59,130,246,0.18)',
    lensMid: 'rgba(30,58,138,0.72)',
    lensEdge: 'rgba(15,23,42,0.96)',
    accent: '#93C5FD',
    glassBg: 'rgba(255,255,255,0.12)',
    glassBorder: 'rgba(147,197,253,0.25)',
    textPrimary: '#F0F9FF',
    textSecondary: 'rgba(224,242,254,0.82)',
    textShadow: 'rgba(15,23,42,0.9)',
    image:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80',
  },
  Space: {
    lensCenter: 'rgba(129,140,248,0.2)',
    lensMid: 'rgba(49,46,129,0.75)',
    lensEdge: 'rgba(15,15,45,0.97)',
    accent: '#A5B4FC',
    glassBg: 'rgba(255,255,255,0.11)',
    glassBorder: 'rgba(165,180,252,0.28)',
    textPrimary: '#EEF2FF',
    textSecondary: 'rgba(224,231,255,0.8)',
    textShadow: 'rgba(15,15,45,0.92)',
    image:
      'https://images.unsplash.com/photo-1446776811953-b20d1bf99cfd?auto=format&fit=crop&w=1400&q=80',
  },
  AI: {
    lensCenter: 'rgba(167,139,250,0.22)',
    lensMid: 'rgba(76,29,149,0.74)',
    lensEdge: 'rgba(20,10,40,0.97)',
    accent: '#C4B5FD',
    glassBg: 'rgba(255,255,255,0.11)',
    glassBorder: 'rgba(196,181,253,0.28)',
    textPrimary: '#F5F3FF',
    textSecondary: 'rgba(237,233,254,0.82)',
    textShadow: 'rgba(20,10,40,0.92)',
    image:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  },
  History: {
    lensCenter: 'rgba(217,119,6,0.16)',
    lensMid: 'rgba(120,53,15,0.76)',
    lensEdge: 'rgba(30,15,5,0.97)',
    accent: '#FCD34D',
    glassBg: 'rgba(255,255,255,0.11)',
    glassBorder: 'rgba(252,211,77,0.25)',
    textPrimary: '#FFFBEB',
    textSecondary: 'rgba(254,243,199,0.82)',
    textShadow: 'rgba(30,15,5,0.9)',
    image:
      'https://images.unsplash.com/photo-1461360228754-6e81c2623bac?auto=format&fit=crop&w=1400&q=80',
  },
  Psychology: {
    lensCenter: 'rgba(244,114,182,0.18)',
    lensMid: 'rgba(131,24,67,0.74)',
    lensEdge: 'rgba(30,5,20,0.97)',
    accent: '#F9A8D4',
    glassBg: 'rgba(255,255,255,0.11)',
    glassBorder: 'rgba(249,168,212,0.28)',
    textPrimary: '#FDF2F8',
    textSecondary: 'rgba(252,231,243,0.82)',
    textShadow: 'rgba(30,5,20,0.9)',
    image:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1400&q=80',
  },
  Philosophy: {
    lensCenter: 'rgba(148,163,184,0.2)',
    lensMid: 'rgba(51,65,85,0.76)',
    lensEdge: 'rgba(15,20,30,0.97)',
    accent: '#CBD5E1',
    glassBg: 'rgba(255,255,255,0.11)',
    glassBorder: 'rgba(203,213,225,0.25)',
    textPrimary: '#F8FAFC',
    textSecondary: 'rgba(226,232,240,0.82)',
    textShadow: 'rgba(15,20,30,0.9)',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1400&q=80',
  },
  Science: {
    lensCenter: 'rgba(45,212,191,0.18)',
    lensMid: 'rgba(15,118,110,0.74)',
    lensEdge: 'rgba(5,25,25,0.97)',
    accent: '#5EEAD4',
    glassBg: 'rgba(255,255,255,0.11)',
    glassBorder: 'rgba(94,234,212,0.28)',
    textPrimary: '#F0FDFA',
    textSecondary: 'rgba(204,251,241,0.82)',
    textShadow: 'rgba(5,25,25,0.9)',
    image:
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1400&q=80',
  },
  Nature: {
    lensCenter: 'rgba(74,222,128,0.18)',
    lensMid: 'rgba(21,128,61,0.74)',
    lensEdge: 'rgba(5,30,15,0.97)',
    accent: '#86EFAC',
    glassBg: 'rgba(255,255,255,0.11)',
    glassBorder: 'rgba(134,239,172,0.28)',
    textPrimary: '#F0FDF4',
    textSecondary: 'rgba(220,252,231,0.82)',
    textShadow: 'rgba(5,30,15,0.9)',
    image:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80',
  },
  Business: {
    lensCenter: 'rgba(96,165,250,0.16)',
    lensMid: 'rgba(30,64,175,0.74)',
    lensEdge: 'rgba(10,20,40,0.97)',
    accent: '#93C5FD',
    glassBg: 'rgba(255,255,255,0.11)',
    glassBorder: 'rgba(147,197,253,0.25)',
    textPrimary: '#EFF6FF',
    textSecondary: 'rgba(219,234,254,0.82)',
    textShadow: 'rgba(10,20,40,0.9)',
    image:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80',
  },
  Finance: {
    lensCenter: 'rgba(52,211,153,0.16)',
    lensMid: 'rgba(6,95,70,0.74)',
    lensEdge: 'rgba(5,25,20,0.97)',
    accent: '#6EE7B7',
    glassBg: 'rgba(255,255,255,0.11)',
    glassBorder: 'rgba(110,231,183,0.28)',
    textPrimary: '#ECFDF5',
    textSecondary: 'rgba(209,250,229,0.82)',
    textShadow: 'rgba(5,25,20,0.9)',
    image:
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1400&q=80',
  },
  Design: {
    lensCenter: 'rgba(251,113,133,0.18)',
    lensMid: 'rgba(159,18,57,0.74)',
    lensEdge: 'rgba(30,5,15,0.97)',
    accent: '#FDA4AF',
    glassBg: 'rgba(255,255,255,0.11)',
    glassBorder: 'rgba(253,164,175,0.28)',
    textPrimary: '#FFF1F2',
    textSecondary: 'rgba(255,228,230,0.82)',
    textShadow: 'rgba(30,5,15,0.9)',
    image:
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1400&q=80',
  },
  Mathematics: {
    lensCenter: 'rgba(56,189,248,0.18)',
    lensMid: 'rgba(7,89,133,0.74)',
    lensEdge: 'rgba(5,20,35,0.97)',
    accent: '#7DD3FC',
    glassBg: 'rgba(255,255,255,0.11)',
    glassBorder: 'rgba(125,211,252,0.28)',
    textPrimary: '#F0F9FF',
    textSecondary: 'rgba(224,242,254,0.82)',
    textShadow: 'rgba(5,20,35,0.9)',
    image:
      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1400&q=80',
  },
  Art: {
    lensCenter: 'rgba(251,146,60,0.2)',
    lensMid: 'rgba(154,52,18,0.74)',
    lensEdge: 'rgba(30,10,5,0.97)',
    accent: '#FDBA74',
    glassBg: 'rgba(255,255,255,0.11)',
    glassBorder: 'rgba(253,186,116,0.28)',
    textPrimary: '#FFF7ED',
    textSecondary: 'rgba(255,237,213,0.82)',
    textShadow: 'rgba(30,10,5,0.9)',
    image:
      'https://images.unsplash.com/photo-1460661419345-fba4d4eff662?auto=format&fit=crop&w=1400&q=80',
  },
  Music: {
    lensCenter: 'rgba(192,132,252,0.2)',
    lensMid: 'rgba(88,28,135,0.74)',
    lensEdge: 'rgba(20,5,35,0.97)',
    accent: '#D8B4FE',
    glassBg: 'rgba(255,255,255,0.11)',
    glassBorder: 'rgba(216,180,254,0.28)',
    textPrimary: '#FAF5FF',
    textSecondary: 'rgba(243,232,255,0.82)',
    textShadow: 'rgba(20,5,35,0.9)',
    image:
      'https://images.unsplash.com/photo-1511379938542-c1f69419868d?auto=format&fit=crop&w=1400&q=80',
  },
  Medicine: {
    lensCenter: 'rgba(248,113,113,0.16)',
    lensMid: 'rgba(153,27,27,0.74)',
    lensEdge: 'rgba(30,5,5,0.97)',
    accent: '#FCA5A5',
    glassBg: 'rgba(255,255,255,0.11)',
    glassBorder: 'rgba(252,165,165,0.28)',
    textPrimary: '#FEF2F2',
    textSecondary: 'rgba(254,226,226,0.82)',
    textShadow: 'rgba(30,5,5,0.9)',
    image:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1400&q=80',
  },
  Wildlife: {
    lensCenter: 'rgba(163,230,53,0.16)',
    lensMid: 'rgba(77,124,15,0.74)',
    lensEdge: 'rgba(15,25,5,0.97)',
    accent: '#BEF264',
    glassBg: 'rgba(255,255,255,0.11)',
    glassBorder: 'rgba(190,242,100,0.28)',
    textPrimary: '#F7FEE7',
    textSecondary: 'rgba(236,252,203,0.82)',
    textShadow: 'rgba(15,25,5,0.9)',
    image:
      'https://images.unsplash.com/photo-1437622368342-7a3d73a58685?auto=format&fit=crop&w=1400&q=80',
  },
  Geography: {
    lensCenter: 'rgba(34,211,238,0.18)',
    lensMid: 'rgba(14,116,144,0.74)',
    lensEdge: 'rgba(5,25,35,0.97)',
    accent: '#67E8F9',
    glassBg: 'rgba(255,255,255,0.11)',
    glassBorder: 'rgba(103,232,249,0.28)',
    textPrimary: '#ECFEFF',
    textSecondary: 'rgba(207,250,254,0.82)',
    textShadow: 'rgba(5,25,35,0.9)',
    image:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80',
  },
};

const DEFAULT_THEME = CATEGORY_THEMES.Technology;

export function getCategoryTheme(category: Category | string): CategoryTheme {
  return CATEGORY_THEMES[category as Category] ?? DEFAULT_THEME;
}
