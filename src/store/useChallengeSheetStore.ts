import { create } from 'zustand';

import type { ChallengeQuiz } from '@/utils/challengeQuiz';

interface ChallengeSheetStore {
  quiz: ChallengeQuiz | null;
  openChallenge: (quiz: ChallengeQuiz) => void;
  closeChallenge: () => void;
}

export const useChallengeSheetStore = create<ChallengeSheetStore>((set) => ({
  quiz: null,
  openChallenge: (quiz) => set({ quiz }),
  closeChallenge: () => set({ quiz: null }),
}));
