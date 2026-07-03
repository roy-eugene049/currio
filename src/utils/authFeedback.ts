import { useToastStore } from '@/store/useToastStore';
import { useAuthStore } from '@/store/useAuthStore';

/** Show a toast from the latest auth store error, then clear it. */
export function showAuthErrorToast(fallback?: string) {
  const { error, clearError } = useAuthStore.getState();
  const message = error ?? fallback;
  if (message) {
    useToastStore.getState().show(message, { variant: 'error', type: 'error' });
  }
  clearError();
}

export function showToast(message: string, type: 'error' | 'success' = 'error') {
  useToastStore.getState().show(message, { variant: type, type });
}
