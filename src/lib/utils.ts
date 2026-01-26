import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function formatTime(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateInviteToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function isWithin48Hours(eventDate: string | Date): boolean {
  const event = typeof eventDate === 'string' ? new Date(eventDate) : eventDate;
  const now = new Date();
  const diffMs = event.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours <= 48;
}

export function getAreaLabel(area: string): string {
  const areaLabels: Record<string, string> = {
    shibuya: '渋谷',
    ebisu: '恵比寿',
    roppongi: '六本木',
    ginza: '銀座',
    shinjuku: '新宿',
  };
  return areaLabels[area] || area;
}

export function isReviewAccessible(eventDate: string | Date): boolean {
  const event = typeof eventDate === 'string' ? new Date(eventDate) : eventDate;
  const now = new Date();
  const reviewAccessTime = new Date(event.getTime() + 2 * 60 * 60 * 1000); // 2 hours after event
  return now >= reviewAccessTime;
}
