'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Edit2, Check, X, MapPin, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from '@/components/UserAvatar';
import { cn, formatDate, getAreaLabel } from '@/lib/utils';
import { getRatingDefinition } from '@/lib/review-ratings';
import { Particles } from '@/components/ui/magicui';
import type { ConnectionWithDetails } from './page';

interface ConnectionsClientProps {
  connections: ConnectionWithDetails[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export function ConnectionsClient({ connections: initialConnections, pagination }: ConnectionsClientProps) {
  const router = useRouter();
  const [connections, setConnections] = useState(initialConnections);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMemo, setEditMemo] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setConnections(initialConnections);
    setEditingId(null);
    setEditMemo('');
  }, [initialConnections]);

  const handlePageChange = (page: number) => {
    const nextPage = Math.max(1, Math.min(page, pagination.totalPages));
    router.push(`/connections?page=${nextPage}`);
  };

  const handleStartEdit = (connection: ConnectionWithDetails) => {
    setEditingId(connection.review.id);
    setEditMemo(connection.review.memo || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditMemo('');
  };

  const handleSaveMemo = async (reviewId: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memo: editMemo || null }),
      });

      if (!response.ok) {
        throw new Error('Failed to save memo');
      }

      // Update local state
      setConnections((prev) =>
        prev.map((c) =>
          c.review.id === reviewId
            ? { ...c, review: { ...c.review, memo: editMemo || null } }
            : c
        )
      );
      setEditingId(null);
      setEditMemo('');
    } catch (error) {
      console.error('Save memo error:', error);
      alert('メモの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      <Particles className="absolute inset-0 pointer-events-none" quantity={20} color="#f59e0b" staticity={70} />

      <div className="relative z-10 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            ダッシュボードへ
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl font-bold mb-2 text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-amber-400" />
              出会った人たち
            </h1>
            <p className="text-slate-400 mb-6">
              {pagination.totalCount}人の方と出会いました
            </p>
          </motion.div>

          {connections.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">
                  まだ出会いの記録がありません。
                  <br />
                  イベントに参加してレビューを残すと、ここに表示されます。
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {connections.map((connection, index) => {
                const ratingDef = getRatingDefinition(connection.review.rating);
                const isEditing = editingId === connection.review.id;

                return (
                  <motion.div
                    key={connection.review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="bg-white/5 border-white/10 overflow-hidden">
                      <CardContent className="p-4">
                        {/* Header: Person info */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              displayName={connection.person.display_name}
                              avatarUrl={connection.person.avatar_url}
                              gender={connection.person.gender}
                              size="lg"
                            />
                            <div>
                              <div className="font-medium text-white">
                                {connection.person.display_name}
                              </div>
                              <div className="text-sm text-slate-400">
                                {connection.person.job || '-'}
                              </div>
                              {connection.person.personality_type && (
                                <div className="text-xs text-slate-500">
                                  {connection.person.personality_type}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Rating stars */}
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  'w-4 h-4',
                                  star <= connection.review.rating
                                    ? ratingDef?.isBlock
                                      ? 'text-orange-400 fill-orange-400'
                                      : 'text-yellow-400 fill-yellow-400'
                                    : 'text-slate-600'
                                )}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Event info */}
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(connection.event.event_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {getAreaLabel(connection.event.area)}
                          </span>
                          <span className="text-slate-600">
                            @ {connection.match.restaurant_name}
                          </span>
                        </div>

                        {/* Memo section */}
                        <div className="border-t border-white/10 pt-3">
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                value={editMemo}
                                onChange={(e) => setEditMemo(e.target.value)}
                                className="w-full h-24 px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none text-sm"
                                placeholder="どんな話をしたか、どんな人だったかなど..."
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  disabled={saving}
                                  className="text-slate-400 hover:text-white"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  キャンセル
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveMemo(connection.review.id)}
                                  loading={saving}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  保存
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                {connection.review.memo ? (
                                  <p className="text-sm text-slate-300 whitespace-pre-wrap">
                                    {connection.review.memo}
                                  </p>
                                ) : (
                                  <p className="text-sm text-slate-500 italic">
                                    メモなし
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => handleStartEdit(connection)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                                title="メモを編集"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                前へ
              </Button>
              <span className="text-sm text-slate-400">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                次へ
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
