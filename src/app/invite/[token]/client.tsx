'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, formatTime, getAreaLabel } from '@/lib/utils';
import { Calendar, MapPin, UserPlus, Gift, Users, Copy, Check } from 'lucide-react';
import type { Participation, Event } from '@/types/database';

interface InviteClientProps {
  token: string;
  shortCode: string;
  participation: Participation & { events: Event };
  inviterName: string;
  groupMemberCount: number;
  maxGroupSize: number;
  lineOfficialUrl: string;
}

export function InviteClient({
  token,
  shortCode,
  participation,
  inviterName,
  groupMemberCount,
  maxGroupSize,
  lineOfficialUrl,
}: InviteClientProps) {
  const [copied, setCopied] = useState(false);

  const handleProceedToLine = () => {
    // Redirect to LINE official account
    window.location.href = lineOfficialUrl;
  };

  const handleCopyCode = async () => {
    const codeToShow = shortCode || token;
    await navigator.clipboard.writeText(codeToShow);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-6">
              <UserPlus className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold mb-2 text-white">
              {inviterName}さんからの招待
            </h1>
            <p className="text-slate-400 mb-4">
              一緒にディナーに参加しませんか？
            </p>

            {/* First month free banner */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-6">
              <div className="flex items-center gap-2 text-amber-400">
                <Gift className="w-5 h-5" />
                <span className="font-semibold">初月無料</span>
              </div>
              <p className="text-sm text-amber-400/80 mt-1">
                招待からの登録で、初月の会費が無料になります
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(participation.events.event_date)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {getAreaLabel(participation.events.area)}
                </span>
              </div>
              <p className="text-sm text-slate-400">
                {formatTime(participation.events.event_date)}〜
              </p>
            </div>

            {/* Group member count */}
            <div className="bg-white/5 rounded-lg p-3 mb-6 flex items-center justify-center gap-2 text-sm text-slate-400">
              <Users className="w-4 h-4" />
              <span>
                現在{groupMemberCount}人参加中（残り{maxGroupSize - groupMemberCount}枠）
              </span>
            </div>

            {/* Invite code display */}
            {shortCode && (
              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <p className="text-xs text-slate-500 mb-2">招待コード</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-mono font-bold text-white tracking-wider">
                    {shortCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    aria-label="コードをコピー"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  このコードを控えておいてください
                </p>
              </div>
            )}

            <Button onClick={handleProceedToLine} className="w-full" size="lg">
              LINE公式アカウントを開く
            </Button>

            <div className="mt-6 text-left bg-white/5 rounded-lg p-4">
              <p className="text-sm font-medium text-white mb-2">参加手順</p>
              <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside">
                <li>LINE公式アカウントを友だち追加</li>
                <li>「アプリを開く」をタップ</li>
                <li>「招待を受ける」から上記のコードを入力</li>
              </ol>
            </div>

            <p className="text-xs text-slate-500 mt-4">
              Dine Tokyo メンバーへの登録が必要です（初月無料・翌月から月額1,980円）
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
