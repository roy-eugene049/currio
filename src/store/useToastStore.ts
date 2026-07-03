import { create } from 'zustand';

export type ToastType = 'error' | 'success';

interface ToastState {
  message: string | null;
  type: ToastType;
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: 'error',
  show: (message, type = 'error') => set({ message, type }),
  hide: () => set({ message: null }),
}));
