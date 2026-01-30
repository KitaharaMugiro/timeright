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

export function getAreaLabel(area: string): string {
  const areaLabels: Record<string, string> = {
    shibuya: '渋谷',
    shinjuku: '新宿',
    ginza: '銀座',
    roppongi: '六本木',
    ebisu: '恵比寿',
    meguro: '目黒',
    ikebukuro: '池袋',
    takadanobaba: '高田馬場',
  };
  return areaLabels[area] || area;
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

export function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded I, O, 0, 1 to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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
