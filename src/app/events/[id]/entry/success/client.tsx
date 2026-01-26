'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime, getAreaLabel } from '@/lib/utils';
import { Calendar, MapPin, Check, Copy, PartyPopper } from 'lucide-react';
import type { Event, Participation } from '@/types/database';

interface SuccessClientProps {
  event: Event;
  participation: Participation;
}

const moodLabels: Record<string, { label: string; emoji: string }> = {
  lively: { label: 'ワイワイ飲み', emoji: '🎉' },
  relaxed: { label: 'まったりトーク', emoji: '☕' },
  inspire: { label: 'インスパイア', emoji: '💡' },
  other: { label: 'その他', emoji: '✏️' },
};

export function SuccessClient({ event, participation }: SuccessClientProps) {
  const [copied, setCopied] = useState(false);

  const inviteLink = participation.entry_type === 'pair' && participation.invite_token
    ? `${window.location.origin}/invite/${participation.invite_token}`
    : null;

  const handleCopy = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('コピーに失敗しました');
    }
  };

  const moodInfo = moodLabels[participation.mood] || moodLabels.other;

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-6">
              <PartyPopper className="w-10 h-10" />
            </div>

            <h1 className="text-2xl font-bold mb-2">参加登録完了!</h1>
            <p className="text-neutral-600 mb-6">
              イベントへの参加登録が完了しました
            </p>

            {/* Event info */}
            <div className="bg-neutral-50 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-center gap-4 text-sm text-neutral-600 mb-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(event.event_date)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {getAreaLabel(event.area)}
                </span>
              </div>
              <p className="text-sm text-neutral-600 mb-3">
                {formatTime(event.event_date)}〜
              </p>
              <div className="border-t pt-3 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">参加方法：</span>
                  {participation.entry_type === 'solo' ? '1人で参加' : '友達と参加（ペア）'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">気分：</span>
                  {participation.mood === 'other' ? (
                    <>✏️ {participation.mood_text}</>
                  ) : (
                    <>
                      {moodInfo.emoji} {moodInfo.label}
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Invite link for pair entries */}
            {inviteLink && (
              <div className="mb-6">
                <p className="text-sm text-neutral-600 mb-3">
                  友達に下記のリンクを共有してください
                </p>
                <div className="bg-neutral-100 rounded-lg p-3 mb-3">
                  <p className="text-sm text-neutral-600 break-all">{inviteLink}</p>
                </div>
                <Button onClick={handleCopy} variant="outline" className="w-full">
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      コピーしました
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      リンクをコピー
                    </>
                  )}
                </Button>
                <p className="text-xs text-neutral-500 mt-2">
                  ※ 開催2日前までに友達が登録を完了してください
                </p>
              </div>
            )}

            <Link href="/dashboard">
              <Button className="w-full">
                ダッシュボードへ
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
