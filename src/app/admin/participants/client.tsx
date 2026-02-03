'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { UserAvatar } from '@/components/UserAvatar';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { formatDate, formatTime, getAreaLabel, cn } from '@/lib/utils';
import {
  Calendar,
  MapPin,
  Users,
  Star,
  MessageCircle,
  Send,
  ChevronDown,
  ChevronRight,
  Ban,
  UserX,
  Check,
  X,
  Shield,
  Search,
  Loader2,
  ChevronLeft,
} from 'lucide-react';
import type { Event, User, Participation, Gender, EventStatus } from '@/types/database';

interface ReviewStats {
  totalNoShows: number;
  eventNoShows: number;
  avgRating: number | null;
  blockCount: number;
  reviewCount: number;
}

interface ParticipantWithData extends Participation {
  user: Pick<User, 'id' | 'display_name' | 'avatar_url' | 'gender' | 'birth_date' | 'job' | 'line_user_id' | 'member_stage' | 'is_identity_verified' | 'created_at'>;
  reviewStats: ReviewStats | null;
}

interface EventSummary {
  event: Event;
  participantCount: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface MatchInfo {
  id: string;
  restaurant_name: string;
  restaurant_url?: string | null;
}

// Cache for loaded participants
const participantsCache = new Map<string, { participants: ParticipantWithData[]; match: MatchInfo | null; pagination: Pagination | null }>();
const PARTICIPANTS_PAGE_SIZE = 50;

export function AdminParticipantsClient() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [eventParticipants, setEventParticipants] = useState<ParticipantWithData[]>([]);
  const [eventMatch, setEventMatch] = useState<MatchInfo | null>(null);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantsPagination, setParticipantsPagination] = useState<Pagination | null>(null);
  const [participantsPage, setParticipantsPage] = useState(1);

  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNoShow, setFilterNoShow] = useState<'all' | 'suspected' | 'confirmed'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'matched' | 'canceled'>('all');
  const [filterEventStatus, setFilterEventStatus] = useState<'all' | EventStatus>('all');
  const [filterMonths, setFilterMonths] = useState(3);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchEvents = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '20',
        months: String(filterMonths),
      });
      if (filterEventStatus !== 'all') {
        params.set('status', filterEventStatus);
      }

      const res = await fetch(`/api/admin/participants?${params}`);
      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
        setPagination(data.pagination);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  }, [filterEventStatus, filterMonths]);

  useEffect(() => {
    fetchEvents(1);
  }, [fetchEvents]);

  const fetchParticipants = useCallback(async (eventId: string, page: number = 1) => {
    // Check cache first
    const cacheKey = `${eventId}-${searchQuery}-${filterNoShow}-${filterStatus}-${page}`;
    const cached = participantsCache.get(cacheKey);
    if (cached) {
      setEventParticipants(cached.participants);
      setEventMatch(cached.match);
      setParticipantsPagination(cached.pagination);
      setParticipantsPage(page);
      return;
    }

    setLoadingParticipants(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PARTICIPANTS_PAGE_SIZE),
      });
      if (searchQuery) params.set('search', searchQuery);
      if (filterNoShow !== 'all') params.set('noShow', filterNoShow);
      if (filterStatus !== 'all') params.set('status', filterStatus);

      const res = await fetch(`/api/admin/participants/${eventId}?${params}`);
      const data = await res.json();

      setEventParticipants(data.participants || []);
      setEventMatch(data.match || null);
      setParticipantsPagination(data.pagination || null);
      setParticipantsPage(page);

      // Cache result
      participantsCache.set(cacheKey, {
        participants: data.participants || [],
        match: data.match || null,
        pagination: data.pagination || null,
      });
    } catch (error) {
      console.error('Failed to fetch participants:', error);
      setEventParticipants([]);
      setParticipantsPagination(null);
    } finally {
      setLoadingParticipants(false);
    }
  }, [searchQuery, filterNoShow, filterStatus]);

  const toggleEventExpand = async (eventId: string) => {
    if (expandedEvent === eventId) {
      setExpandedEvent(null);
      setEventParticipants([]);
      setEventMatch(null);
      setParticipantsPagination(null);
    } else {
      setExpandedEvent(eventId);
      setEventParticipants([]);
      setEventMatch(null);
      setParticipantsPagination(null);
      setParticipantsPage(1);
    }
  };

  // Refetch participants when filters change (if event is expanded)
  useEffect(() => {
    participantsCache.clear();
    if (expandedEvent) {
      setParticipantsPage(1);
      fetchParticipants(expandedEvent, 1);
    }
  }, [expandedEvent, fetchParticipants, searchQuery, filterNoShow, filterStatus]);

  const toggleUserSelect = (lineUserId: string | null, odm: string) => {
    if (!lineUserId) return;
    setSelectedUsers(prev => {
      const next = new Set(prev);
      const key = `${odm}:${lineUserId}`;
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      eventParticipants.forEach(p => {
        if (p.user.line_user_id) {
          next.add(`${p.user.id}:${p.user.line_user_id}`);
        }
      });
      return next;
    });
  };

  const deselectAllVisible = () => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      eventParticipants.forEach(p => {
        if (p.user.line_user_id) {
          next.delete(`${p.user.id}:${p.user.line_user_id}`);
        }
      });
      return next;
    });
  };

  const sendMessage = async () => {
    if (!message.trim() || selectedUsers.size === 0) return;

    setSending(true);
    try {
      const lineUserIds = Array.from(selectedUsers).map(key => key.split(':')[1]);
      const res = await fetch('/api/admin/participants/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineUserIds, message }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`送信完了: ${data.results.sent}件成功, ${data.results.failed}件失敗, ${data.results.skipped}件スキップ`);
        setShowMessageModal(false);
        setMessage('');
        setSelectedUsers(new Set());
      } else {
        alert('送信に失敗しました: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  const getAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={cn(
            'w-3 h-3',
            star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
          )}
        />
      ))}
    </div>
  );

  if (loading && events.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-rose-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">参加者一覧</h1>
          {selectedUsers.size > 0 && (
            <Button onClick={() => setShowMessageModal(true)}>
              <MessageCircle className="w-4 h-4 mr-2" />
              選択した{selectedUsers.size}人にメッセージ
            </Button>
          )}
        </div>

        {/* Event Filters */}
        <Card className="mb-6 glass-card border-slate-700">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">期間:</span>
                <Select
                  value={String(filterMonths)}
                  onChange={(e) => {
                    setFilterMonths(Number(e.target.value));
                    participantsCache.clear();
                  }}
                  options={[
                    { value: '1', label: '1ヶ月' },
                    { value: '3', label: '3ヶ月' },
                    { value: '6', label: '6ヶ月' },
                    { value: '12', label: '1年' },
                  ]}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">イベント状態:</span>
                <Select
                  value={filterEventStatus}
                  onChange={(e) => {
                    setFilterEventStatus(e.target.value as typeof filterEventStatus);
                    participantsCache.clear();
                  }}
                  options={[
                    { value: 'all', label: 'すべて' },
                    { value: 'open', label: '受付中' },
                    { value: 'matched', label: 'マッチ済' },
                    { value: 'closed', label: '終了' },
                  ]}
                />
              </div>
              {pagination && (
                <div className="ml-auto text-sm text-slate-400">
                  {pagination.totalCount}件のイベント
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Participant Filters (shown when event is expanded) */}
        {expandedEvent && (
          <Card className="mb-6 glass-card border-slate-700">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="名前・職業で検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">No Show:</span>
                  <Select
                    value={filterNoShow}
                    onChange={(e) => setFilterNoShow(e.target.value as typeof filterNoShow)}
                    options={[
                      { value: 'all', label: 'すべて' },
                      { value: 'suspected', label: '疑いあり' },
                      { value: 'confirmed', label: '複数報告' },
                    ]}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">ステータス:</span>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                    options={[
                      { value: 'all', label: 'すべて' },
                      { value: 'pending', label: '参加待ち' },
                      { value: 'matched', label: 'マッチ済' },
                      { value: 'canceled', label: 'キャンセル' },
                    ]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Event List */}
        <div className="space-y-4">
          {events.map(({ event, participantCount }) => {
            const isExpanded = expandedEvent === event.id;
            const selectedInEvent = isExpanded
              ? eventParticipants.filter(p =>
                  p.user.line_user_id && selectedUsers.has(`${p.user.id}:${p.user.line_user_id}`)
                ).length
              : 0;

            return (
              <Card key={event.id} className="glass-card border-slate-700">
                <CardHeader
                  className="cursor-pointer hover:bg-slate-800/50 transition-colors"
                  onClick={() => toggleEventExpand(event.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                      <div>
                        <div className="flex items-center gap-3 text-white font-medium">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {formatDate(event.event_date)} {formatTime(event.event_date)}
                          <MapPin className="w-4 h-4 text-slate-400 ml-2" />
                          {getAreaLabel(event.area)}
                        </div>
                        {isExpanded && eventMatch && (
                          <div className="text-sm text-slate-400 mt-1">
                            {eventMatch.restaurant_name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-sm text-slate-400">
                        <Users className="w-4 h-4" />
                        {participantCount}人
                      </span>
                      <span className={cn(
                        'text-xs px-2 py-1 rounded',
                        event.status === 'open' && 'bg-success/10 text-success',
                        event.status === 'matched' && 'bg-info/10 text-info',
                        event.status === 'closed' && 'bg-slate-800 text-slate-400'
                      )}>
                        {event.status === 'open' ? '受付中' : event.status === 'matched' ? 'マッチ済' : '終了'}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    {/* Event actions */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700">
                      <div className="text-sm text-slate-400">
                        {loadingParticipants ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            読み込み中...
                          </span>
                        ) : (
                          <>
                            {eventParticipants.length}人表示
                            {participantsPagination && ` / ${participantsPagination.totalCount}人`}
                            {selectedInEvent > 0 && ` / ${selectedInEvent}人選択中`}
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectAllVisible();
                          }}
                          disabled={loadingParticipants}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          全選択
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deselectAllVisible();
                          }}
                          disabled={loadingParticipants}
                        >
                          <X className="w-3 h-3 mr-1" />
                          選択解除
                        </Button>
                      </div>
                    </div>

                    {/* Participants list */}
                    {loadingParticipants ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                      </div>
                    ) : eventParticipants.length === 0 ? (
                      <div className="text-center text-slate-400 py-4">
                        参加者がいません
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {eventParticipants.map(participant => {
                          const isSelected = participant.user.line_user_id &&
                            selectedUsers.has(`${participant.user.id}:${participant.user.line_user_id}`);
                          const hasNoShowReports = (participant.reviewStats?.totalNoShows || 0) > 0;
                          const hasBlockReports = (participant.reviewStats?.blockCount || 0) > 0;

                          return (
                            <div
                              key={participant.id}
                              className={cn(
                                'flex items-center gap-4 p-3 rounded-lg transition-colors',
                                isSelected ? 'bg-rose-500/20 border border-rose-500/50' : 'bg-slate-800/50',
                                hasNoShowReports && 'border-l-4 border-l-warning',
                                hasBlockReports && !hasNoShowReports && 'border-l-4 border-l-error'
                              )}
                            >
                              {/* Selection checkbox */}
                              <button
                                onClick={() => toggleUserSelect(participant.user.line_user_id, participant.user.id)}
                                className={cn(
                                  'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                                  !participant.user.line_user_id && 'opacity-30 cursor-not-allowed',
                                  isSelected ? 'bg-rose-500 border-rose-500' : 'border-slate-600 hover:border-slate-400'
                                )}
                                disabled={!participant.user.line_user_id}
                              >
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </button>

                              {/* User info */}
                              <UserAvatar
                                displayName={participant.user.display_name}
                                avatarUrl={participant.user.avatar_url}
                                gender={participant.user.gender as Gender}
                                size="md"
                              />

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-white truncate">
                                    {participant.user.display_name}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {getAge(participant.user.birth_date)}歳 / {participant.user.gender === 'male' ? '男性' : '女性'}
                                  </span>
                                  {participant.user.is_identity_verified && (
                                    <span title="本人確認済み">
                                      <Shield className="w-3 h-3 text-success" />
                                    </span>
                                  )}
                                  {participant.user.member_stage && (
                                    <span className={cn(
                                      'text-xs px-1.5 py-0.5 rounded',
                                      participant.user.member_stage === 'platinum' && 'bg-slate-300 text-slate-900',
                                      participant.user.member_stage === 'gold' && 'bg-amber-500/20 text-amber-400',
                                      participant.user.member_stage === 'silver' && 'bg-slate-400/20 text-slate-300',
                                      participant.user.member_stage === 'bronze' && 'bg-orange-700/20 text-orange-400'
                                    )}>
                                      {participant.user.member_stage}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-slate-400 truncate">
                                  {participant.user.job || '-'}
                                </div>
                              </div>

                              {/* Participation status */}
                              <div className="text-center min-w-[80px]">
                                <span className={cn(
                                  'text-xs px-2 py-1 rounded',
                                  participant.status === 'pending' && 'bg-slate-700 text-slate-300',
                                  participant.status === 'matched' && 'bg-success/10 text-success',
                                  participant.status === 'canceled' && 'bg-error/10 text-error'
                                )}>
                                  {participant.status === 'pending' ? '参加待ち' :
                                    participant.status === 'matched' ? 'マッチ済' : 'キャンセル'}
                                </span>
                              </div>

                              {/* Reviews info */}
                              <div className="text-right min-w-[120px]">
                                {participant.reviewStats?.avgRating !== null && participant.reviewStats?.avgRating !== undefined ? (
                                  <div className="flex items-center justify-end gap-2">
                                    {renderStars(Math.round(participant.reviewStats.avgRating))}
                                    <span className="text-sm text-slate-400">
                                      ({participant.reviewStats.avgRating.toFixed(1)})
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-500">レビューなし</span>
                                )}

                                {/* Warnings */}
                                <div className="flex items-center justify-end gap-2 mt-1">
                                  {hasNoShowReports && (
                                    <span
                                      className="flex items-center gap-1 text-xs text-warning"
                                      title={`No Show報告: ${participant.reviewStats?.totalNoShows}件`}
                                    >
                                      <UserX className="w-3 h-3" />
                                      {participant.reviewStats?.totalNoShows}
                                    </span>
                                  )}
                                  {hasBlockReports && (
                                    <span
                                      className="flex items-center gap-1 text-xs text-error"
                                      title={`ブロック報告: ${participant.reviewStats?.blockCount}件`}
                                    >
                                      <Ban className="w-3 h-3" />
                                      {participant.reviewStats?.blockCount}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* LINE status */}
                              <div className="min-w-[60px] text-center">
                                {participant.user.line_user_id ? (
                                  <span className="text-xs text-success">LINE連携済</span>
                                ) : (
                                  <span className="text-xs text-slate-500">LINE未連携</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {participantsPagination && participantsPagination.totalPages > 1 && (
                      <div className="flex items-center justify-center gap-4 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={participantsPage === 1 || loadingParticipants}
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchParticipants(event.id, participantsPage - 1);
                          }}
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          前へ
                        </Button>
                        <span className="text-sm text-slate-400">
                          {participantsPage} / {participantsPagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={participantsPage === participantsPagination.totalPages || loadingParticipants}
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchParticipants(event.id, participantsPage + 1);
                          }}
                        >
                          次へ
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1 || loading}
              onClick={() => fetchEvents(currentPage - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              前へ
            </Button>
            <span className="text-sm text-slate-400">
              {currentPage} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === pagination.totalPages || loading}
              onClick={() => fetchEvents(currentPage + 1)}
            >
              次へ
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Message Modal */}
        {showMessageModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg glass-card border-slate-700">
              <CardHeader>
                <h2 className="text-lg font-semibold text-white">
                  LINEメッセージ送信
                </h2>
                <p className="text-sm text-slate-400">
                  選択した{selectedUsers.size}人にメッセージを送信します
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  className="w-full h-40 p-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="メッセージを入力..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowMessageModal(false)}
                    disabled={sending}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={sendMessage}
                    disabled={!message.trim() || sending}
                    loading={sending}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    送信
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
