import * as ExpoCrypto from 'expo-crypto';
import { Platform } from 'react-native';

/** PKCE OAuth requires Web Crypto on native — polyfill before Supabase client init. */
export function ensureCryptoPolyfill(): void {
  if (Platform.OS === 'web') return;

  const global = globalThis as typeof globalThis & {
    crypto?: Crypto;
  };

  if (!global.crypto) {
    global.crypto = {} as Crypto;
  }

  const cryptoRef = global.crypto;

  if (!cryptoRef.getRandomValues) {
    cryptoRef.getRandomValues = ((array: ArrayBufferView) =>
      ExpoCrypto.getRandomValues(
        array as Parameters<typeof ExpoCrypto.getRandomValues>[0],
      )) as Crypto['getRandomValues'];
  }

  if (!cryptoRef.subtle) {
    Object.defineProperty(cryptoRef, 'subtle', {
      value: {
        async digest(
          algorithm: AlgorithmIdentifier,
          data: ArrayBuffer,
        ): Promise<ArrayBuffer> {
          const name =
            typeof algorithm === 'string' ? algorithm : algorithm.name;

          if (name.toUpperCase().replace('-', '') === 'SHA256') {
            return ExpoCrypto.digest(
              ExpoCrypto.CryptoDigestAlgorithm.SHA256,
              data,
            );
          }

          throw new Error(`Unsupported digest algorithm: ${name}`);
        },
      } as SubtleCrypto,
      writable: true,
      configurable: true,
    });
  }
}

ensureCryptoPolyfill();
