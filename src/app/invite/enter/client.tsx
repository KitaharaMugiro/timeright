'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDate, formatTime, getAreaLabel } from '@/lib/utils';
import { Calendar, MapPin, UserPlus, MessageSquare, ArrowLeft, Gift, Users, Link2, Loader2 } from 'lucide-react';
import type { ParticipationMood, BudgetLevel } from '@/types/database';

interface InviteEnterClientProps {
  isLoggedIn: boolean;
  hasActiveSubscription: boolean;
  pendingInviteToken: string | null;
}

type ViewMode = 'enter' | 'invite' | 'mood' | 'budget';

interface InviteInfo {
  token: string;
  inviterName: string;
  eventDate: string;
  area: string;
  groupMemberCount: number;
  maxGroupSize: number;
  isEligibleForCoupon: boolean;
}

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

export function InviteEnterClient({
  isLoggedIn,
  hasActiveSubscription,
  pendingInviteToken,
}: InviteEnterClientProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('enter');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [mood, setMood] = useState<ParticipationMood>('lively');
  const [moodText, setMoodText] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);

  // Auto-resolve pending invite token if available
  const resolveInvite = useCallback(async (input: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/invite/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '招待コードが見つかりません');
      }

      setInviteInfo(data);
      setViewMode('invite');
    } catch (err) {
      setError(err instanceof Error ? err.message : '招待コードの確認に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pendingInviteToken && !inviteInfo) {
      resolveInvite(pendingInviteToken);
    }
  }, [pendingInviteToken, inviteInfo, resolveInvite]);

  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setError('招待コードまたはリンクを入力してください');
      return;
    }
    await resolveInvite(inputValue.trim());
  };

  const handleProceedToMood = () => {
    if (!isLoggedIn) {
      // Store invite token and redirect to login
      if (inviteInfo) {
        document.cookie = `pending_invite=${inviteInfo.token}; path=/; max-age=3600`;
      }
      window.location.href = '/api/auth/line';
      return;
    }
    setViewMode('mood');
  };

  const handleSelectMood = (selectedMood: ParticipationMood) => {
    if (selectedMood === 'other') {
      setShowOtherInput(true);
      return;
    }
    setMood(selectedMood);
    setMoodText('');
    setViewMode('budget');
  };

  const handleOtherMoodConfirm = () => {
    if (!moodText.trim()) {
      alert('気分を入力してください');
      return;
    }
    setMood('other');
    setShowOtherInput(false);
    setViewMode('budget');
  };

  const handleSelectBudget = async (budgetLevel: BudgetLevel) => {
    await submitInvite(budgetLevel);
  };

  const submitInvite = async (budgetLevel: BudgetLevel) => {
    if (!inviteInfo) return;

    setLoading(true);
    try {
      if (hasActiveSubscription) {
        // User has subscription - directly accept the invite
        const response = await fetch('/api/invite/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: inviteInfo.token,
            mood,
            mood_text: mood === 'other' ? moodText : null,
            budget_level: budgetLevel,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to accept invite');
        }

        router.push('/dashboard');
      } else {
        // User needs subscription - redirect to checkout with invite info
        const response = await fetch('/api/stripe/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invite_token: inviteInfo.token,
            mood,
            mood_text: mood === 'other' ? moodText : null,
            budget_level: budgetLevel,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout');
        }

        // Redirect to Stripe checkout
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Submit invite error:', error);
      alert('エラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-md mx-auto">
        {viewMode === 'enter' && (
          <div className="space-y-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              ダッシュボードに戻る
            </button>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-6">
                  <Link2 className="w-8 h-8" />
                </div>

                <h1 className="text-2xl font-bold mb-2 text-white text-center">
                  招待コードを入力
                </h1>
              <p className="text-slate-400 text-center mb-6">
                友達から受け取った招待コードまたはリンクを入力してください
              </p>

              <form onSubmit={handleSubmitCode} className="space-y-4">
                <Input
                  placeholder="例: ABC123 または https://..."
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setError(null);
                  }}
                  className="bg-white/5 border-white/20 text-white placeholder:text-slate-500"
                  disabled={loading}
                />

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      確認中...
                    </>
                  ) : (
                    '招待を確認'
                  )}
                </Button>
              </form>

              <p className="text-xs text-slate-500 mt-4 text-center">
                招待コード（6文字）または招待リンクを貼り付けてください
              </p>
            </CardContent>
          </Card>
          </div>
        )}

        {viewMode === 'invite' && inviteInfo && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-6">
                <UserPlus className="w-8 h-8" />
              </div>

              <h1 className="text-2xl font-bold mb-2 text-white">
                {inviteInfo.inviterName}さんからの招待
              </h1>
              <p className="text-slate-400 mb-4">
                一緒にディナーに参加しませんか？
              </p>

              {/* First month free banner */}
              {!isLoggedIn && inviteInfo.isEligibleForCoupon && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-6">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Gift className="w-5 h-5" />
                    <span className="font-semibold">初月無料</span>
                  </div>
                  <p className="text-sm text-amber-400/80 mt-1">
                    招待からの登録で、初月の会費が無料になります
                  </p>
                </div>
              )}

              <div className="bg-white/5 rounded-lg p-4 mb-6 text-left">
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(inviteInfo.eventDate)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {getAreaLabel(inviteInfo.area)}
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  {formatTime(inviteInfo.eventDate)}〜
                </p>
              </div>

              {/* Group member count */}
              <div className="bg-white/5 rounded-lg p-3 mb-6 flex items-center justify-center gap-2 text-sm text-slate-400">
                <Users className="w-4 h-4" />
                <span>
                  現在{inviteInfo.groupMemberCount}人参加中（残り{inviteInfo.maxGroupSize - inviteInfo.groupMemberCount}枠）
                </span>
              </div>

              <Button onClick={handleProceedToMood} className="w-full" size="lg">
                {isLoggedIn ? '招待を受ける' : 'LINEでログインして参加'}
              </Button>

              {!isLoggedIn && (
                <p className="text-xs text-slate-500 mt-4">
                  {inviteInfo.isEligibleForCoupon
                    ? 'Dine Tokyo(ダイントーキョー) メンバーへの登録が必要です（初月無料）'
                    : 'Dine Tokyo(ダイントーキョー) メンバーへの登録が必要です'}
                </p>
              )}

              <button
                onClick={() => {
                  setViewMode('enter');
                  setInviteInfo(null);
                  setInputValue('');
                }}
                className="mt-4 inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                別のコードを入力
              </button>
            </CardContent>
          </Card>
        )}

        {viewMode === 'mood' && (
          <div className="space-y-4">
            <button
              onClick={() => {
                setViewMode('invite');
                setShowOtherInput(false);
                setMoodText('');
              }}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              戻る
            </button>

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
                    onClick={() => !loading && handleSelectMood(option.value)}
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
                  onClick={() => !loading && handleSelectMood('other')}
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

                {loading && (
                  <p className="text-sm text-slate-500 text-center">処理中...</p>
                )}
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
                    <Button onClick={handleOtherMoodConfirm} disabled={loading} className="flex-1">
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

        {viewMode === 'budget' && (
          <div className="space-y-4">
            <button
              onClick={() => {
                setViewMode('mood');
                setShowOtherInput(false);
              }}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              戻る
            </button>

            <h2 className="text-lg font-semibold text-white">お店の価格帯は？</h2>
            <p className="text-sm text-slate-400">
              希望の価格帯を教えてください。同じ価格帯を希望する人とマッチングしやすくなります。
            </p>

            {budgetOptions.map((option) => (
              <Card
                key={option.value}
                className="cursor-pointer bg-white/5 border-white/10 hover:border-white/20 transition-colors"
                onClick={() => !loading && handleSelectBudget(option.value)}
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

            {loading && (
              <p className="text-sm text-slate-500 text-center">処理中...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
