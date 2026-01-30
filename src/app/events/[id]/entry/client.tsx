'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDate, formatTime, getAreaLabel } from '@/lib/utils';
import { Calendar, MapPin, UserPlus, User, Copy, Check, ArrowLeft, MessageSquare, Link2 } from 'lucide-react';
import type { Event, ParticipationMood, BudgetLevel } from '@/types/database';

interface EntryClientProps {
  event: Event;
  canInvite: boolean;
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'none';
}

type EntryMode = 'select' | 'pair-type' | 'mood' | 'budget' | 'confirm' | 'invite';
type EntryType = 'solo' | 'pair';

const moodOptions: { value: ParticipationMood; label: string; description: string; emoji: string }[] = [
  {
    value: 'lively',
    label: 'ワイワイ飲み',
    description: 'とにかく楽しく盛り上がりたい！',
    emoji: '🎉',
  },
  {
    value: 'relaxed',
    label: 'まったりトーク',
    description: '落ち着いたお店でゆっくり話したい',
    emoji: '☕',
  },
  {
    value: 'inspire',
    label: 'インスパイア',
    description: '新しい価値観や刺激に出会いたい',
    emoji: '💡',
  },
];

const budgetOptions: { value: BudgetLevel; label: string; description: string; stars: string }[] = [
  {
    value: 1,
    label: 'リーズナブル',
    description: '気軽に楽しめるお店',
    stars: '⭐',
  },
  {
    value: 2,
    label: 'スタンダード',
    description: 'バランスの良いお店',
    stars: '⭐⭐',
  },
  {
    value: 3,
    label: 'プレミアム',
    description: '特別な雰囲気のお店',
    stars: '⭐⭐⭐',
  },
];

export function EntryClient({ event, canInvite, subscriptionStatus }: EntryClientProps) {
  const router = useRouter();
  const [mode, setMode] = useState<EntryMode>('select');
  const [entryType, setEntryType] = useState<EntryType>('solo');
  const [mood, setMood] = useState<ParticipationMood>('lively');
  const [moodText, setMoodText] = useState<string>('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>(2);
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSelectType = (type: EntryType) => {
    if (type === 'pair' && !canInvite) {
      alert('開催2日前を過ぎているため、ペア参加はできません。');
      return;
    }
    setEntryType(type);
    if (type === 'pair') {
      setMode('pair-type');
    } else {
      setMode('mood');
    }
  };

  const handlePairTypeSelect = (isInviter: boolean) => {
    if (isInviter) {
      // 自分が招待する → 気分選択へ
      setMode('mood');
    } else {
      // 招待を受ける → 招待コード入力ページへ
      router.push('/invite/enter');
    }
  };

  const handleSelectMood = (selectedMood: ParticipationMood) => {
    if (selectedMood === 'other') {
      setShowOtherInput(true);
    } else {
      setMood(selectedMood);
      setMoodText('');
      setShowOtherInput(false);
      setMode('budget');
    }
  };

  const handleOtherMoodConfirm = () => {
    if (!moodText.trim()) {
      alert('気分を入力してください');
      return;
    }
    setMood('other');
    setShowOtherInput(false);
    setMode('budget');
  };

  const handleSelectBudget = (level: BudgetLevel) => {
    setBudgetLevel(level);
    setMode('confirm');
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // 未契約の場合、Stripe Checkoutへリダイレクト
      if (subscriptionStatus !== 'active') {
        const response = await fetch('/api/stripe/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_id: event.id,
            entry_type: entryType,
            mood,
            mood_text: mood === 'other' ? moodText : null,
            budget_level: budgetLevel,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout');
        }

        if (data.url) {
          window.location.href = data.url;
        }
        return;
      }

      // 契約済みの場合は通常の申込処理
      const response = await fetch('/api/events/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          entry_type: entryType,
          mood,
          mood_text: mood === 'other' ? moodText : null,
          budget_level: budgetLevel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enter');
      }

      if (entryType === 'pair' && data.invite_token) {
        setInviteLink(`${window.location.origin}/invite/${data.invite_token}`);
        setMode('invite');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Entry error:', error);
      alert('エラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-md mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          戻る
        </Link>

        {/* Event info */}
        <Card className="mb-6 bg-white/5 border-white/10">
          <CardContent className="p-6">
            <h1 className="text-xl font-bold mb-4 text-white">イベントに参加</h1>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(event.event_date)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {getAreaLabel(event.area)}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {formatTime(event.event_date)}〜
            </p>
          </CardContent>
        </Card>

        {/* Mode select */}
        {mode === 'select' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">参加方法を選択</h2>

            <Card
              className="cursor-pointer bg-white/5 border-white/10 hover:border-white/20 transition-colors"
              onClick={() => handleSelectType('solo')}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-white">1人で参加</h3>
                    <p className="text-sm text-slate-400">
                      相性の良いメンバーとマッチングします
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer bg-white/5 border-white/10 transition-colors ${
                canInvite
                  ? 'hover:border-white/20'
                  : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={() => canInvite && handleSelectType('pair')}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-white">友達と参加（ペア）</h3>
                    <p className="text-sm text-slate-400">
                      友達を招待して一緒に参加します
                    </p>
                    {!canInvite && (
                      <p className="text-sm text-amber-400 mt-1">
                        ※ 開催2日前を過ぎたため選択できません
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pair type select */}
        {mode === 'pair-type' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">友達との参加方法</h2>
            <p className="text-sm text-slate-400">
              自分が招待する側ですか？それとも招待を受ける側ですか？
            </p>

            <Card
              className="cursor-pointer bg-white/5 border-white/10 hover:border-white/20 transition-colors"
              onClick={() => handlePairTypeSelect(true)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-white">自分が招待する</h3>
                    <p className="text-sm text-slate-400">
                      招待リンクを作成して友達に送る
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer bg-white/5 border-white/10 hover:border-white/20 transition-colors"
              onClick={() => handlePairTypeSelect(false)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-white">招待を受ける</h3>
                    <p className="text-sm text-slate-400">
                      友達からの招待コードを入力する
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              variant="ghost"
              onClick={() => setMode('select')}
              className="w-full text-slate-400 hover:text-white"
            >
              戻る
            </Button>
          </div>
        )}

        {/* Mood select */}
        {mode === 'mood' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">今日はどんな気分？</h2>
            <p className="text-sm text-slate-400">
              当日の雰囲気を教えてください。同じ気分の人とマッチングしやすくなります。
            </p>

            {!showOtherInput ? (
              <>
                {moodOptions.map((option) => (
                  <Card
                    key={option.value}
                    className="cursor-pointer bg-white/5 border-white/10 hover:border-white/20 transition-colors"
                    onClick={() => handleSelectMood(option.value)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl">
                          {option.emoji}
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1 text-white">{option.label}</h3>
                          <p className="text-sm text-slate-400">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Other option */}
                <Card
                  className="cursor-pointer bg-white/5 border-white/10 hover:border-white/20 transition-colors"
                  onClick={() => handleSelectMood('other')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl">
                        <MessageSquare className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1 text-white">その他</h3>
                        <p className="text-sm text-slate-400">
                          自由に気分を入力してください
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  variant="ghost"
                  onClick={() => setMode('select')}
                  className="w-full text-slate-400 hover:text-white"
                >
                  戻る
                </Button>
              </>
            ) : (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-white">今日の気分を教えてください</h3>
                  <Input
                    placeholder="例: 仕事の話をしたい、趣味の合う人と話したい..."
                    value={moodText}
                    onChange={(e) => setMoodText(e.target.value)}
                    maxLength={100}
                    className="bg-white/5 border-white/20 text-white placeholder:text-slate-500"
                  />
                  <p className="text-xs text-slate-500">
                    {moodText.length}/100文字
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handleOtherMoodConfirm} className="flex-1">
                      決定
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowOtherInput(false);
                        setMoodText('');
                      }}
                      className="flex-1 text-slate-400 hover:text-white"
                    >
                      戻る
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Budget select */}
        {mode === 'budget' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">お店の価格帯は？</h2>
            <p className="text-sm text-slate-400">
              希望の価格帯を教えてください。同じ価格帯を希望する人とマッチングしやすくなります。
            </p>

            {budgetOptions.map((option) => (
              <Card
                key={option.value}
                className="cursor-pointer bg-white/5 border-white/10 hover:border-white/20 transition-colors"
                onClick={() => handleSelectBudget(option.value)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl">
                      {option.stars}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-white">{option.label}</h3>
                      <p className="text-sm text-slate-400">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              variant="ghost"
              onClick={() => setMode('mood')}
              className="w-full text-slate-400 hover:text-white"
            >
              戻る
            </Button>
          </div>
        )}

        {/* Confirm */}
        {mode === 'confirm' && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-white">参加確認</h2>

              <div className="bg-white/5 rounded-lg p-4 mb-6 space-y-2">
                <p className="text-sm text-slate-300">
                  <span className="font-medium text-white">参加方法：</span>
                  {entryType === 'solo' ? '1人で参加' : '友達と参加（ペア）'}
                </p>
                <p className="text-sm text-slate-300">
                  <span className="font-medium text-white">気分：</span>
                  {mood === 'other' ? (
                    <>✏️ {moodText}</>
                  ) : (
                    <>
                      {moodOptions.find(m => m.value === mood)?.emoji}{' '}
                      {moodOptions.find(m => m.value === mood)?.label}
                    </>
                  )}
                </p>
                <p className="text-sm text-slate-300">
                  <span className="font-medium text-white">価格帯：</span>
                  {budgetOptions.find(b => b.value === budgetLevel)?.stars}{' '}
                  {budgetOptions.find(b => b.value === budgetLevel)?.label}
                </p>
              </div>

              {subscriptionStatus !== 'active' && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
                  <p className="text-sm text-amber-400">
                    イベントに参加するには月額プラン（¥1,980/月）への登録が必要です。
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={handleConfirm}
                  loading={loading}
                  className="w-full"
                >
                  {subscriptionStatus !== 'active' ? '決済して参加する' : '参加を確定する'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setMode('budget')}
                  className="w-full text-slate-400 hover:text-white"
                >
                  戻る
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invite */}
        {mode === 'invite' && inviteLink && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8" />
              </div>

              <h2 className="text-lg font-semibold mb-2 text-white">エントリー完了！</h2>
              <p className="text-slate-400 mb-6">
                友達に下記のリンクを共有してください
              </p>

              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-400 break-all">{inviteLink}</p>
              </div>

              <Button onClick={handleCopy} variant="outline" className="w-full mb-4 border-white/20 text-white hover:bg-white/10">
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

              <p className="text-xs text-slate-500 mb-6">
                ※ 開催2日前までに友達が登録を完了してください
              </p>

              <Link href="/dashboard">
                <Button className="w-full">ダッシュボードへ</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
