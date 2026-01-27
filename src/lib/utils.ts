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

export function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
