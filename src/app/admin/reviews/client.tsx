'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
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
            star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-200'
          )}
        />
      ))}
    </div>
  );

  const renderAvatar = (user: Pick<User, 'display_name' | 'avatar_url' | 'gender'>, size: 'sm' | 'md' = 'sm') => {
    const sizeClasses = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base';

    return (
      <div className={cn(
        'rounded-full flex items-center justify-center overflow-hidden flex-shrink-0',
        sizeClasses,
        user.avatar_url
          ? ''
          : user.gender === 'male'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-pink-100 text-pink-700'
      )}>
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="font-medium">{user.display_name.charAt(0)}</span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50" data-testid="admin-reviews-page">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xl font-bold">
              unplanned
            </Link>
            <span className="text-sm text-neutral-500 bg-neutral-100 px-2 py-1 rounded" data-testid="admin-badge">
              Admin
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
          data-testid="back-to-admin"
        >
          <ArrowLeft className="w-4 h-4" />
          管理画面へ戻る
        </Link>

        <h1 className="text-2xl font-bold mb-6" data-testid="page-title">レビュー管理</h1>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" data-testid="stats-section">
          <Card data-testid="total-reviews-stat">
            <CardContent className="p-4">
              <div className="text-sm text-neutral-500">総レビュー数</div>
              <div className="text-2xl font-bold" data-testid="total-reviews-value">{stats.total}</div>
            </CardContent>
          </Card>
          <Card data-testid="avg-rating-stat">
            <CardContent className="p-4">
              <div className="text-sm text-neutral-500">平均評価</div>
              <div className="text-2xl font-bold flex items-center gap-2" data-testid="avg-rating-value">
                {stats.avgRating}
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card data-testid="block-count-stat">
            <CardContent className="p-4">
              <div className="text-sm text-neutral-500">ブロック報告</div>
              <div className="text-2xl font-bold text-red-600" data-testid="block-count-value">{stats.blockCount}</div>
            </CardContent>
          </Card>
          <Card data-testid="rating-distribution">
            <CardContent className="p-4">
              <div className="text-sm text-neutral-500">評価分布</div>
              <div className="flex gap-1 mt-1">
                {stats.ratingDistribution.map((count, idx) => (
                  <div key={idx} className="text-xs text-center flex-1" data-testid={`rating-dist-${idx + 1}`}>
                    <div className="font-medium">{count}</div>
                    <div className="text-neutral-400">{idx + 1}★</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Sorting */}
        <Card className="mb-6" data-testid="filters-section">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-neutral-500" />
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
                <span className="text-sm text-neutral-500">評価:</span>
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
                <span className="text-sm text-neutral-500">ブロック:</span>
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
            <Card data-testid="no-reviews-message">
              <CardContent className="p-8 text-center text-neutral-500">
                レビューがありません
              </CardContent>
            </Card>
          ) : (
            sortedReviews.map((review) => (
              <Card
                key={review.id}
                data-testid={`review-card-${review.id}`}
                className={cn(review.block_flag && 'border-red-200 bg-red-50')}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Reviewer -> Target */}
                    <div className="flex items-center gap-2 min-w-[240px]">
                      {renderAvatar(review.reviewer)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {review.reviewer.display_name}
                        </div>
                        <div className="text-xs text-neutral-500 truncate">
                          {review.reviewer.job || '-'}
                        </div>
                      </div>
                      <span className="text-neutral-400 mx-1">→</span>
                      {renderAvatar(review.target)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {review.target.display_name}
                        </div>
                        <div className="text-xs text-neutral-500 truncate">
                          {review.target.job || '-'}
                        </div>
                      </div>
                    </div>

                    {/* Rating and Comment */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {renderStars(review.rating)}
                        <span className="text-sm font-medium">{review.rating}/5</span>
                        {review.block_flag && (
                          <span className="flex items-center gap-1 text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded" data-testid="block-badge">
                            <Ban className="w-3 h-3" />
                            ブロック希望
                          </span>
                        )}
                      </div>

                      {review.comment && (
                        <div className="flex items-start gap-2 text-sm text-neutral-600 bg-neutral-100 p-2 rounded">
                          <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <p>{review.comment}</p>
                        </div>
                      )}
                    </div>

                    {/* Event Info */}
                    <div className="text-right text-sm text-neutral-500 min-w-[140px]">
                      <div className="flex items-center justify-end gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(review.matches.events.event_date, { year: undefined })}
                      </div>
                      <div className="flex items-center justify-end gap-1">
                        <MapPin className="w-3 h-3" />
                        {getAreaLabel(review.matches.events.area)}
                      </div>
                      <div className="text-xs mt-1">
                        {review.matches.restaurant_name}
                      </div>
                      <div className="text-xs text-neutral-400 mt-1">
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
