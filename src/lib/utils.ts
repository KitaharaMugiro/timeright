import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string, options?: { year?: 'numeric' | '2-digit' }): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: options?.year,
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// エリア定義（一元管理）
export const AREAS = {
  shibuya: '渋谷',
  shinjuku: '新宿',
  ginza: '銀座',
  roppongi: '六本木',
  ebisu: '恵比寿',
  meguro: '目黒',
  ikebukuro: '池袋',
  takadanobaba: '高田馬場',
} as const;

export type AreaKey = keyof typeof AREAS;

export const AREA_OPTIONS = Object.entries(AREAS).map(([value, label]) => ({
  value,
  label,
}));

export function getAreaLabel(area: string): string {
  return AREAS[area as AreaKey] || area;
}

export function isWithin48Hours(dateString: string): boolean {
  const eventDate = new Date(dateString);
  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours >= 0 && diffHours <= 48;
}

export function isReviewAccessible(dateString: string): boolean {
  const eventDate = new Date(dateString);
  const now = new Date();
  return now > eventDate;
}

export function isWithinEventWindow(dateString: string, windowHours: number = 3): boolean {
  const eventDate = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - eventDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  // イベント開始後、指定時間以内
  return diffHours >= 0 && diffHours <= windowHours;
}

export function isToday(dateString: string): boolean {
  const eventDate = new Date(dateString);
  const now = new Date();
  return (
    eventDate.getFullYear() === now.getFullYear() &&
    eventDate.getMonth() === now.getMonth() &&
    eventDate.getDate() === now.getDate()
  );
}

function getSecureRandomInt(maxExclusive: number): number {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.getRandomValues) {
    throw new Error('Secure random generator is not available');
  }

  const uint32 = new Uint32Array(1);
  const maxUint = 0xffffffff;
  const limit = Math.floor(maxUint / maxExclusive) * maxExclusive;

  let value = 0;
  do {
    cryptoObj.getRandomValues(uint32);
    value = uint32[0];
  } while (value >= limit);

  return value % maxExclusive;
}

function generateRandomString(chars: string, length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[getSecureRandomInt(chars.length)];
  }
  return result;
}

export function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return generateRandomString(chars, 32);
}

export function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded I, O, 0, 1 to avoid confusion
  return generateRandomString(chars, 6);
}

export function generateAffiliateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 8 chars to distinguish from 6-char invite codes
  return generateRandomString(chars, 8);
}

export function extractInviteToken(input: string): string | null {
  // If input looks like a URL, extract the token
  const urlMatch = input.match(/\/invite\/([A-Za-z0-9]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }
  // If input is 6 characters (short code), return as-is (uppercase)
  if (/^[A-Za-z0-9]{6}$/.test(input.trim())) {
    return input.trim().toUpperCase();
  }
  // If input is 32 characters (full token), return as-is
  if (/^[A-Za-z0-9]{32}$/.test(input.trim())) {
    return input.trim();
  }
  return null;
}

export function sanitizeInternalRedirectPath(
  redirectPath: string | null | undefined,
  fallback: string = '/dashboard'
): string {
  if (!redirectPath) {
    return fallback;
  }

  const trimmed = redirectPath.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }

  // Normalize the path while keeping query/hash, and reject protocol-based redirects.
  try {
    const normalized = new URL(trimmed, 'http://localhost');
    if (normalized.origin !== 'http://localhost') {
      return fallback;
    }
    return `${normalized.pathname}${normalized.search}${normalized.hash}`;
  } catch {
    return fallback;
  }
}
