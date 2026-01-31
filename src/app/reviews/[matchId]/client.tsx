'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from '@/components/UserAvatar';
import { cn } from '@/lib/utils';
import { ArrowLeft, Star, Check, AlertTriangle } from 'lucide-react';
import type { Match, Event, User } from '@/types/database';
import { RATING_DEFINITIONS, getRatingDefinition, isBlockRating, isNoShowRating } from '@/lib/review-ratings';

interface ReviewClientProps {
  match: Match & { events: Event };
  members: Pick<User, 'id' | 'display_name' | 'personality_type' | 'job' | 'avatar_url' | 'gender'>[];
  reviewedUserIds: string[];
}

export function ReviewClient({
  match,
  members,
  reviewedUserIds: initialReviewedIds,
}: ReviewClientProps) {
  const [reviewedUserIds, setReviewedUserIds] = useState(initialReviewedIds);
  const [currentMember, setCurrentMember] = useState<typeof members[0] | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedRatingDef = rating !== null ? getRatingDefinition(rating) : undefined;

  const unreviewedMembers = members.filter((m) => !reviewedUserIds.includes(m.id));

  const handleSelectMember = (member: typeof members[0]) => {
    setCurrentMember(member);
    setRating(null);
    setMemo('');
  };

  const handleSubmitReview = async () => {
    if (!currentMember || rating === null) return;

    setLoading(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: match.id,
          target_user_id: currentMember.id,
          rating,
          memo: memo || null,
          block_flag: isBlockRating(rating),
          is_no_show: isNoShowRating(rating),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      setReviewedUserIds([...reviewedUserIds, currentMember.id]);
      setCurrentMember(null);
      setRating(null);
      setMemo('');
    } catch (error) {
      console.error('Review error:', error);
      alert('レビューの送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const allReviewed = unreviewedMembers.length === 0;

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4" data-testid="review-page">
      <div className="max-w-md mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6"
          data-testid="back-to-dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
          ダッシュボードへ
        </Link>

        <h1 className="text-2xl font-bold mb-2 text-white" data-testid="review-title">レビュー</h1>
        <p className="text-slate-400 mb-6" data-testid="review-description">
          {match.restaurant_name} でのディナーはいかがでしたか？
        </p>

        {members.length === 0 ? (
          <Card data-testid="review-no-members-card" className="bg-white/5 border-white/10">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-500/20 text-slate-400 flex items-center justify-center mx-auto mb-4" data-testid="no-members-icon">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-white" data-testid="no-members-title">
                レビュー対象者なし
              </h2>
              <p className="text-slate-400 mb-6" data-testid="no-members-message">
                このグループには登録ユーザーがいないため、
                <br />
                レビュー対象者がいません。
              </p>
              <Link href="/dashboard">
                <Button className="w-full" data-testid="no-members-dashboard-btn">ダッシュボードへ</Button>
              </Link>
            </CardContent>
          </Card>
        ) : allReviewed ? (
          <Card data-testid="review-completion-card" className="bg-white/5 border-white/10">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-4" data-testid="completion-icon">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-white" data-testid="completion-title">
                レビュー完了
              </h2>
              <p className="text-slate-400 mb-6" data-testid="completion-message">
                全員へのレビューが完了しました。
                <br />
                ご参加ありがとうございました！
              </p>
              <Link href="/dashboard">
                <Button className="w-full" data-testid="completion-dashboard-btn">ダッシュボードへ</Button>
              </Link>
            </CardContent>
          </Card>
        ) : currentMember ? (
          <Card data-testid="review-form-card" className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-3 text-white" data-testid="review-target-name">
                <UserAvatar
                  displayName={currentMember.display_name}
                  avatarUrl={currentMember.avatar_url}
                  gender={currentMember.gender}
                  size="md"
                />
                <span>{currentMember.display_name}さんへのレビュー</span>
              </h2>

              {/* Rating */}
              <div className="mb-6" data-testid="rating-section">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  評価
                </label>
                <div className="flex flex-wrap gap-2 mb-3" data-testid="star-buttons">
                  {RATING_DEFINITIONS.map((def) => {
                    const isSelected = rating === def.value;
                    const isNoShow = def.isNoShow;

                    return (
                      <button
                        key={def.value}
                        onClick={() => setRating(def.value)}
                        data-testid={`star-button-${def.value}`}
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                          isSelected
                            ? isNoShow
                              ? 'bg-red-500 text-white'
                              : def.isBlock
                                ? 'bg-orange-500 text-white'
                                : 'bg-yellow-400 text-white'
                            : 'bg-white/10 text-slate-500 hover:bg-white/20'
                        )}
                        title={def.label}
                      >
                        {isNoShow ? (
                          <span className="text-sm font-bold">NS</span>
                        ) : (
                          <Star className="w-5 h-5" fill={isSelected ? 'currentColor' : 'none'} />
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedRatingDef && (
                  <div
                    data-testid="rating-description"
                    className={cn(
                      'p-3 rounded-lg text-sm',
                      selectedRatingDef.isNoShow
                        ? 'bg-red-500/10 border border-red-500/30'
                        : selectedRatingDef.isBlock
                          ? 'bg-orange-500/10 border border-orange-500/30'
                          : 'bg-green-500/10 border border-green-500/30'
                    )}
                  >
                    <div className="font-medium mb-1 flex items-center gap-2">
                      {(selectedRatingDef.isBlock || selectedRatingDef.isNoShow) && (
                        <AlertTriangle className={cn(
                          'w-4 h-4',
                          selectedRatingDef.isNoShow ? 'text-red-400' : 'text-orange-400'
                        )} />
                      )}
                      <span className={cn(
                        selectedRatingDef.isNoShow
                          ? 'text-red-400'
                          : selectedRatingDef.isBlock
                            ? 'text-orange-400'
                            : 'text-green-400'
                      )}>
                        {selectedRatingDef.label}
                      </span>
                    </div>
                    <div className="text-slate-400">
                      {selectedRatingDef.description}
                    </div>
                    {selectedRatingDef.isNoShow && (
                      <div className="text-red-400/80 text-xs mt-2">
                        ※ No-Show報告は相手に-100ptのペナルティが課されます
                      </div>
                    )}
                    {selectedRatingDef.isBlock && !selectedRatingDef.isNoShow && (
                      <div className="text-orange-400/80 text-xs mt-2">
                        ※ この評価を選ぶと、今後この方とマッチングしません
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Memo */}
              <div className="mb-6" data-testid="memo-section">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  メモ（任意）
                </label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full h-24 px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  placeholder="どんな話をしたか、どんな人だったかなど..."
                  data-testid="memo-textarea"
                />
                <p className="text-xs text-slate-500 mt-1">
                  あなただけが見れる個人メモです。後から編集できます。
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitReview}
                  loading={loading}
                  disabled={rating === null}
                  className="flex-1"
                  data-testid="submit-review-btn"
                >
                  送信
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentMember(null)}
                  data-testid="back-to-list-btn"
                  className="text-slate-400 hover:text-white"
                >
                  戻る
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4" data-testid="participant-list">
            <p className="text-sm text-slate-400 mb-4" data-testid="participant-instructions">
              レビューするメンバーを選んでください
            </p>

            {members.map((member) => {
              const isReviewed = reviewedUserIds.includes(member.id);

              return (
                <Card
                  key={member.id}
                  data-testid={`participant-card-${member.id}`}
                  className={cn(
                    'transition-colors bg-white/5 border-white/10',
                    isReviewed
                      ? 'opacity-50'
                      : 'cursor-pointer hover:border-white/20'
                  )}
                  onClick={() => !isReviewed && handleSelectMember(member)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          displayName={member.display_name}
                          avatarUrl={member.avatar_url}
                          gender={member.gender}
                          size="lg"
                        />
                        <div>
                          <div className="font-medium text-base text-white">{member.display_name}</div>
                          <div className="text-sm text-slate-400">
                            {member.job || '-'}
                          </div>
                          {member.personality_type && (
                            <div className="text-xs text-slate-500">
                              {member.personality_type}
                            </div>
                          )}
                        </div>
                      </div>
                      {isReviewed && (
                        <span className="text-xs text-green-400 flex items-center gap-1" data-testid={`reviewed-badge-${member.id}`}>
                          <Check className="w-4 h-4" />
                          完了
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
