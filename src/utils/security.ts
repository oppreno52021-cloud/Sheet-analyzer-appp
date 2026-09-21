/**
 * Security & Encryption utilities for IndexedDB hardware vault.
 * Uses Web Crypto API (AES-GCM) with Base64 JSON fallback.
 */

const LOCAL_KEY_STORAGE_NAME = 'tsa_vault_key_v1';

async function getVaultKey(): Promise<CryptoKey | null> {
  try {
    if (typeof window === 'undefined' || !window.crypto?.subtle) return null;

    let rawKey = localStorage.getItem(LOCAL_KEY_STORAGE_NAME);
    if (!rawKey) {
      const arr = new Uint8Array(32);
      window.crypto.getRandomValues(arr);
      rawKey = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(LOCAL_KEY_STORAGE_NAME, rawKey);
    }

    const keyBytes = new Uint8Array(rawKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    return await window.crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  } catch {
    return null;
  }
}

/**
 * Encrypt arbitrary data before committing to disk / IndexedDB.
 */
export async function encryptData<T>(data: T): Promise<string> {
  const jsonStr = JSON.stringify(data);
  try {
    const key = await getVaultKey();
    if (!key || !window.crypto?.subtle) {
      // Safe encoded fallback
      return 'B64:' + btoa(unescape(encodeURIComponent(jsonStr)));
    }

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(jsonStr);
    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    const ivB64 = btoa(String.fromCharCode(...iv));
    const cipherB64 = btoa(String.fromCharCode(...new Uint8Array(cipherBuffer)));
    return `AES:${ivB64}:${cipherB64}`;
  } catch (err) {
    console.warn('Crypto encryption fallback used:', err);
    return 'B64:' + btoa(unescape(encodeURIComponent(jsonStr)));
  }
}

/**
 * Decrypt payload retrieved from local storage / IndexedDB.
 */
export async function decryptData<T>(payload: string): Promise<T> {
  if (!payload) return null as unknown as T;

  try {
    if (payload.startsWith('B64:')) {
      const raw = decodeURIComponent(escape(atob(payload.slice(4))));
      return JSON.parse(raw) as T;
    }

    if (payload.startsWith('AES:')) {
      const parts = payload.split(':');
      if (parts.length === 3) {
        const ivB64 = parts[1];
        const cipherB64 = parts[2];
        const key = await getVaultKey();

        if (key && window.crypto?.subtle) {
          const iv = new Uint8Array(
            atob(ivB64)
              .split('')
              .map(c => c.charCodeAt(0))
          );
          const cipherBytes = new Uint8Array(
            atob(cipherB64)
              .split('')
              .map(c => c.charCodeAt(0))
          );

          const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            cipherBytes
          );

          const decodedStr = new TextDecoder().decode(decryptedBuffer);
          return JSON.parse(decodedStr) as T;
        }
      }
    }

    // Direct JSON attempt
    return JSON.parse(payload) as T;
  } catch (err) {
    console.warn('Failed to decrypt payload, attempting direct parse:', err);
    try {
      return JSON.parse(payload) as T;
    } catch {
      return null as unknown as T;
    }
  }
}
