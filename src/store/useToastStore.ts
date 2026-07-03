import { create } from 'zustand';

export type ToastType = 'error' | 'success';
export type FeedbackVariant = 'error' | 'success' | 'bookmark' | 'topics';

interface ToastState {
  message: string | null;
  type: ToastType;
  variant: FeedbackVariant;
  show: (
    message: string,
    options?: { type?: ToastType; variant?: FeedbackVariant },
  ) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: 'error',
  variant: 'error',
  show: (message, options) =>
    set({
      message,
      type: options?.type ?? (options?.variant === 'error' ? 'error' : 'success'),
      variant: options?.variant ?? options?.type ?? 'success',
    }),
  hide: () => set({ message: null }),
}));
