'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { UserAvatar } from '@/components/UserAvatar';
import { formatDate, formatTime, getAreaLabel, cn } from '@/lib/utils';
import { ArrowLeft, Star, Calendar, MapPin, MessageSquare, Ban, ArrowUpDown } from 'lucide-react';
import type { ReviewWithRelations } from './page';
import type { User } from '@/types/database';

interface AdminReviewsClientProps {
  initialReviews: ReviewWithRelations[];
}

type SortField = 'created_at' | 'rating' | 'event_date';
type SortOrder = 'asc' | 'desc';

export function AdminReviewsClient({ initialReviews }: AdminReviewsClientProps) {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [filterBlockFlag, setFilterBlockFlag] = useState<boolean | 'all'>('all');

  const sortedReviews = useMemo(() => {
    let filtered = [...initialReviews];

    // Apply filters
    if (filterRating !== 'all') {
      filtered = filtered.filter(r => r.rating === filterRating);
    }
    if (filterBlockFlag !== 'all') {
      filtered = filtered.filter(r => r.block_flag === filterBlockFlag);
    }

    // Sort
    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'event_date':
          comparison = new Date(a.matches.events.event_date).getTime() -
                       new Date(b.matches.events.event_date).getTime();
          break;
        case 'created_at':
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [initialReviews, sortField, sortOrder, filterRating, filterBlockFlag]);

  // Statistics
  const stats = useMemo(() => {
    const total = initialReviews.length;
    const avgRating = total > 0
      ? (initialReviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
      : '0';
    const blockCount = initialReviews.filter(r => r.block_flag).length;
    const ratingDistribution = [1, 2, 3, 4, 5].map(
      rating => initialReviews.filter(r => r.rating === rating).length
    );

    return { total, avgRating, blockCount, ratingDistribution };
  }, [initialReviews]);

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={cn(
            'w-4 h-4',
            star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
          )}
        />
      ))}
    </div>
  );

  const renderAvatar = (user: Pick<User, 'display_name' | 'avatar_url' | 'gender'>, size: 'sm' | 'md' = 'sm') => {
    return (
      <UserAvatar
        displayName={user.display_name}
        avatarUrl={user.avatar_url}
        gender={user.gender}
        size={size}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-900" data-testid="admin-reviews-page">
      {/* Header */}
      <header className="glass border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xl font-bold text-white">
              unplanned
            </Link>
            <span className="text-sm text-slate-400 bg-slate-800 px-2 py-1 rounded" data-testid="admin-badge">
              Admin
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4"
          data-testid="back-to-admin"
        >
          <ArrowLeft className="w-4 h-4" />
          管理画面へ戻る
        </Link>

        <h1 className="text-2xl font-bold mb-6 text-white" data-testid="page-title">レビュー管理</h1>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" data-testid="stats-section">
          <Card className="glass-card border-slate-700" data-testid="total-reviews-stat">
            <CardContent className="p-4">
              <div className="text-sm text-slate-400">総レビュー数</div>
              <div className="text-2xl font-bold text-white" data-testid="total-reviews-value">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-slate-700" data-testid="avg-rating-stat">
            <CardContent className="p-4">
              <div className="text-sm text-slate-400">平均評価</div>
              <div className="text-2xl font-bold text-white flex items-center gap-2" data-testid="avg-rating-value">
                {stats.avgRating}
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-slate-700" data-testid="block-count-stat">
            <CardContent className="p-4">
              <div className="text-sm text-slate-400">ブロック報告</div>
              <div className="text-2xl font-bold text-error" data-testid="block-count-value">{stats.blockCount}</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-slate-700" data-testid="rating-distribution">
            <CardContent className="p-4">
              <div className="text-sm text-slate-400">評価分布</div>
              <div className="flex gap-1 mt-1">
                {stats.ratingDistribution.map((count, idx) => (
                  <div key={idx} className="text-xs text-center flex-1" data-testid={`rating-dist-${idx + 1}`}>
                    <div className="font-medium text-white">{count}</div>
                    <div className="text-slate-500">{idx + 1}★</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Sorting */}
        <Card className="mb-6 glass-card border-slate-700" data-testid="filters-section">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
                <Select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  options={[
                    { value: 'created_at', label: 'レビュー日時' },
                    { value: 'rating', label: '評価' },
                    { value: 'event_date', label: 'イベント日' },
                  ]}
                  data-testid="sort-select"
                />
                <Button
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  data-testid="sort-order-btn"
                >
                  {sortOrder === 'desc' ? '降順' : '昇順'}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">評価:</span>
                <Select
                  value={String(filterRating)}
                  onChange={(e) => setFilterRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  options={[
                    { value: 'all', label: 'すべて' },
                    { value: '5', label: '5★' },
                    { value: '4', label: '4★' },
                    { value: '3', label: '3★' },
                    { value: '2', label: '2★' },
                    { value: '1', label: '1★' },
                  ]}
                  data-testid="rating-filter-select"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">ブロック:</span>
                <Select
                  value={String(filterBlockFlag)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilterBlockFlag(val === 'all' ? 'all' : val === 'true');
                  }}
                  options={[
                    { value: 'all', label: 'すべて' },
                    { value: 'true', label: 'ブロックあり' },
                    { value: 'false', label: 'ブロックなし' },
                  ]}
                  data-testid="block-filter-select"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="space-y-4" data-testid="reviews-list">
          {sortedReviews.length === 0 ? (
            <Card className="glass-card border-slate-700" data-testid="no-reviews-message">
              <CardContent className="p-8 text-center text-slate-400">
                レビューがありません
              </CardContent>
            </Card>
          ) : (
            sortedReviews.map((review) => (
              <Card
                key={review.id}
                data-testid={`review-card-${review.id}`}
                className={cn('glass-card border-slate-700', review.block_flag && 'border-error/30 bg-error/10')}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Reviewer -> Target */}
                    <div className="flex items-center gap-2 min-w-[240px]">
                      {renderAvatar(review.reviewer)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate text-white">
                          {review.reviewer.display_name}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {review.reviewer.job || '-'}
                        </div>
                      </div>
                      <span className="text-slate-500 mx-1">→</span>
                      {renderAvatar(review.target)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate text-white">
                          {review.target.display_name}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {review.target.job || '-'}
                        </div>
                      </div>
                    </div>

                    {/* Rating and Comment */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {renderStars(review.rating)}
                        <span className="text-sm font-medium text-white">{review.rating}/5</span>
                        {review.block_flag && (
                          <span className="flex items-center gap-1 text-xs text-error bg-error/20 px-2 py-0.5 rounded" data-testid="block-badge">
                            <Ban className="w-3 h-3" />
                            ブロック希望
                          </span>
                        )}
                      </div>

                      {review.comment && (
                        <div className="flex items-start gap-2 text-sm text-slate-300 bg-slate-800 p-2 rounded">
                          <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-500" />
                          <p>{review.comment}</p>
                        </div>
                      )}
                    </div>

                    {/* Event Info */}
                    <div className="text-right text-sm text-slate-400 min-w-[140px]">
                      <div className="flex items-center justify-end gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(review.matches.events.event_date, { year: undefined })}
                      </div>
                      <div className="flex items-center justify-end gap-1">
                        <MapPin className="w-3 h-3" />
                        {getAreaLabel(review.matches.events.area)}
                      </div>
                      <div className="text-xs mt-1 text-slate-300">
                        {review.matches.restaurant_name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {formatDate(review.created_at, { year: undefined })} {formatTime(review.created_at)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
