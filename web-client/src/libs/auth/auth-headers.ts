import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

const toHex = (buffer: ArrayBuffer) => {
  const byteArray = new Uint8Array(buffer);
  return Array.from(byteArray)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

export const hashPasswordMd5 = async (password: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  try {
    if (globalThis.crypto?.subtle) {
      const digest = await globalThis.crypto.subtle.digest('MD5', data);
      return toHex(digest);
    }
  } catch (error) {
    console.warn('Web Crypto での MD5 ハッシュ化に失敗しました。CryptoJS を利用します。', error);
  }

  return CryptoJS.MD5(password).toString(CryptoJS.enc.Hex);
};

export const createClientUuid = (seed?: string) => {
  if (seed) {
    return seed;
  }

  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return uuidv4();
};

export type AuthHeaders = Record<string, string>;

export const createAuthHeaders = (credentials?: {
  facilityId: string;
  userId: string;
  passwordMd5: string;
  clientUuid: string;
}): AuthHeaders | null => {
  if (!credentials) {
    return null;
  }

  return {
    userName: `${credentials.facilityId}:${credentials.userId}`,
    password: credentials.passwordMd5,
    clientUUID: credentials.clientUuid,
  };
};
