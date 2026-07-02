import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export async function getSecureItem(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  try {
    const available = await SecureStore.isAvailableAsync();
    if (!available) return null;
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // localStorage may be unavailable in private browsing
    }
    return;
  }

  try {
    const available = await SecureStore.isAvailableAsync();
    if (!available) return;
    await SecureStore.setItemAsync(key, value);
  } catch {
    // SecureStore may be unavailable
  }
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (isWeb) {
    try {
      localStorage.removeItem(key);
    } catch {
      // noop
    }
    return;
  }

  try {
    const available = await SecureStore.isAvailableAsync();
    if (!available) return;
    await SecureStore.deleteItemAsync(key);
  } catch {
    // noop
  }
}
