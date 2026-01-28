'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from '@/components/UserAvatar';
import { cn } from '@/lib/utils';
import { ArrowLeft, Star, Check } from 'lucide-react';
import type { Match, Event, User } from '@/types/database';

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
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [blockFlag, setBlockFlag] = useState(false);
  const [loading, setLoading] = useState(false);

  const unreviewedMembers = members.filter((m) => !reviewedUserIds.includes(m.id));

  const handleSelectMember = (member: typeof members[0]) => {
    setCurrentMember(member);
    setRating(0);
    setComment('');
    setBlockFlag(false);
  };

  const handleSubmitReview = async () => {
    if (!currentMember || rating === 0) return;

    setLoading(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: match.id,
          target_user_id: currentMember.id,
          rating,
          comment: comment || null,
          block_flag: blockFlag,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      setReviewedUserIds([...reviewedUserIds, currentMember.id]);
      setCurrentMember(null);
      setRating(0);
      setComment('');
      setBlockFlag(false);
    } catch (error) {
      console.error('Review error:', error);
      alert('レビューの送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const allReviewed = unreviewedMembers.length === 0;

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4" data-testid="review-page">
      <div className="max-w-md mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
          data-testid="back-to-dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
          ダッシュボードへ
        </Link>

        <h1 className="text-2xl font-bold mb-2" data-testid="review-title">レビュー</h1>
        <p className="text-neutral-600 mb-6" data-testid="review-description">
          {match.restaurant_name} でのディナーはいかがでしたか？
        </p>

        {allReviewed ? (
          <Card data-testid="review-completion-card">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4" data-testid="completion-icon">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-semibold mb-2" data-testid="completion-title">
                レビュー完了
              </h2>
              <p className="text-neutral-600 mb-6" data-testid="completion-message">
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
          <Card data-testid="review-form-card">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-3" data-testid="review-target-name">
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
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  評価
                </label>
                <div className="flex gap-2" data-testid="star-buttons">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => setRating(value)}
                      data-testid={`star-button-${value}`}
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                        value <= rating
                          ? 'bg-yellow-400 text-white'
                          : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                      )}
                    >
                      <Star className="w-5 h-5" fill={value <= rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="mb-6" data-testid="comment-section">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  コメント（任意）
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full h-24 px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-500 resize-none"
                  placeholder="良かった点など..."
                  data-testid="comment-textarea"
                />
              </div>

              {/* Block flag */}
              <div className="mb-6" data-testid="block-flag-section">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={blockFlag}
                    onChange={(e) => setBlockFlag(e.target.checked)}
                    className="w-5 h-5 rounded border-neutral-300 text-red-600 focus:ring-red-500"
                    data-testid="block-checkbox"
                  />
                  <span className="text-sm text-neutral-600">
                    この方とは今後マッチングしたくない
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitReview}
                  loading={loading}
                  disabled={rating === 0}
                  className="flex-1"
                  data-testid="submit-review-btn"
                >
                  送信
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentMember(null)}
                  data-testid="back-to-list-btn"
                >
                  戻る
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4" data-testid="participant-list">
            <p className="text-sm text-neutral-600 mb-4" data-testid="participant-instructions">
              レビューするメンバーを選んでください
            </p>

            {members.map((member) => {
              const isReviewed = reviewedUserIds.includes(member.id);

              return (
                <Card
                  key={member.id}
                  data-testid={`participant-card-${member.id}`}
                  className={cn(
                    'transition-colors',
                    isReviewed
                      ? 'opacity-50'
                      : 'cursor-pointer hover:border-neutral-400'
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
                          <div className="font-medium text-base">{member.display_name}</div>
                          <div className="text-sm text-neutral-600">
                            {member.job || '-'}
                          </div>
                          {member.personality_type && (
                            <div className="text-xs text-neutral-500">
                              {member.personality_type}
                            </div>
                          )}
                        </div>
                      </div>
                      {isReviewed && (
                        <span className="text-xs text-green-600 flex items-center gap-1" data-testid={`reviewed-badge-${member.id}`}>
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
