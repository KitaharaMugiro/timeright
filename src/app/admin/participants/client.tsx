'use client';

import { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import type { Event, User, Participation, Gender } from '@/types/database';

interface ReviewData {
  receivedReviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    is_no_show: boolean;
    block_flag: boolean;
  }>;
  givenReviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    is_no_show: boolean;
    block_flag: boolean;
  }>;
  noShowCount: number;
  avgRating: number | null;
  blockCount: number;
}

interface ParticipantWithData extends Participation {
  user: Pick<User, 'id' | 'display_name' | 'avatar_url' | 'gender' | 'birth_date' | 'job' | 'line_user_id' | 'member_stage' | 'is_identity_verified' | 'created_at'>;
  reviewData: ReviewData | null;
  totalNoShows: number;
}

interface EventWithParticipants {
  event: Event;
  participants: ParticipantWithData[];
  match: {
    id: string;
    restaurant_name: string;
  } | null;
}

export function AdminParticipantsClient() {
  const [events, setEvents] = useState<EventWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNoShow, setFilterNoShow] = useState<'all' | 'suspected' | 'confirmed'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'matched' | 'canceled'>('all');

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      const res = await fetch('/api/admin/participants');
      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
        // Auto-expand recent events
        const recentEventIds = data.events
          .slice(0, 3)
          .map((e: EventWithParticipants) => e.event.id);
        setExpandedEvents(new Set(recentEventIds));
      }
    } catch (error) {
      console.error('Failed to fetch participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEventExpand = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const toggleUserSelect = (lineUserId: string | null, userId: string) => {
    if (!lineUserId) return;
    setSelectedUsers(prev => {
      const next = new Set(prev);
      const key = `${userId}:${lineUserId}`;
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAllInEvent = (eventId: string) => {
    const event = events.find(e => e.event.id === eventId);
    if (!event) return;

    setSelectedUsers(prev => {
      const next = new Set(prev);
      event.participants.forEach(p => {
        if (p.user.line_user_id) {
          next.add(`${p.user.id}:${p.user.line_user_id}`);
        }
      });
      return next;
    });
  };

  const deselectAllInEvent = (eventId: string) => {
    const event = events.find(e => e.event.id === eventId);
    if (!event) return;

    setSelectedUsers(prev => {
      const next = new Set(prev);
      event.participants.forEach(p => {
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

  const filteredEvents = useMemo(() => {
    return events.map(e => ({
      ...e,
      participants: e.participants.filter(p => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesName = p.user.display_name.toLowerCase().includes(query);
          const matchesJob = p.user.job?.toLowerCase().includes(query);
          if (!matchesName && !matchesJob) return false;
        }

        // No-show filter
        if (filterNoShow === 'suspected' && p.totalNoShows === 0) return false;
        if (filterNoShow === 'confirmed' && p.totalNoShows < 2) return false;

        // Status filter
        if (filterStatus !== 'all' && p.status !== filterStatus) return false;

        return true;
      }),
    })).filter(e => e.participants.length > 0 || !searchQuery);
  }, [events, searchQuery, filterNoShow, filterStatus]);

  const stats = useMemo(() => {
    let totalParticipants = 0;
    let totalNoShowSuspects = 0;
    let totalBlocked = 0;

    events.forEach(e => {
      e.participants.forEach(p => {
        totalParticipants++;
        if (p.totalNoShows > 0) totalNoShowSuspects++;
        if (p.reviewData?.blockCount && p.reviewData.blockCount > 0) totalBlocked++;
      });
    });

    return { totalParticipants, totalNoShowSuspects, totalBlocked };
  }, [events]);

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

  if (loading) {
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

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="glass-card border-slate-700">
            <CardContent className="p-4">
              <div className="text-sm text-slate-400">総参加者数</div>
              <div className="text-2xl font-bold text-white">{stats.totalParticipants}</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-slate-700">
            <CardContent className="p-4">
              <div className="text-sm text-slate-400">No Show疑い</div>
              <div className="text-2xl font-bold text-warning">{stats.totalNoShowSuspects}</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-slate-700">
            <CardContent className="p-4">
              <div className="text-sm text-slate-400">ブロック報告</div>
              <div className="text-2xl font-bold text-error">{stats.totalBlocked}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
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

        {/* Event List */}
        <div className="space-y-4">
          {filteredEvents.map(({ event, participants, match }) => {
            const isExpanded = expandedEvents.has(event.id);
            const selectedInEvent = participants.filter(p =>
              p.user.line_user_id && selectedUsers.has(`${p.user.id}:${p.user.line_user_id}`)
            ).length;
            const noShowCount = participants.filter(p => p.totalNoShows > 0).length;

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
                        {match && (
                          <div className="text-sm text-slate-400 mt-1">
                            {match.restaurant_name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {noShowCount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-warning bg-warning/20 px-2 py-1 rounded">
                          <UserX className="w-3 h-3" />
                          {noShowCount}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-sm text-slate-400">
                        <Users className="w-4 h-4" />
                        {participants.length}人
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
                        {selectedInEvent > 0 && `${selectedInEvent}人選択中`}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectAllInEvent(event.id);
                          }}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          全選択
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deselectAllInEvent(event.id);
                          }}
                        >
                          <X className="w-3 h-3 mr-1" />
                          選択解除
                        </Button>
                      </div>
                    </div>

                    {/* Participants list */}
                    {participants.length === 0 ? (
                      <div className="text-center text-slate-400 py-4">
                        参加者がいません
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {participants.map(participant => {
                          const isSelected = participant.user.line_user_id &&
                            selectedUsers.has(`${participant.user.id}:${participant.user.line_user_id}`);
                          const hasNoShowReports = participant.totalNoShows > 0;
                          const hasBlockReports = participant.reviewData?.blockCount && participant.reviewData.blockCount > 0;

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
                                {participant.reviewData?.avgRating !== null && participant.reviewData?.avgRating !== undefined ? (
                                  <div className="flex items-center justify-end gap-2">
                                    {renderStars(Math.round(participant.reviewData.avgRating))}
                                    <span className="text-sm text-slate-400">
                                      ({participant.reviewData.avgRating.toFixed(1)})
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
                                      title={`No Show報告: ${participant.totalNoShows}件`}
                                    >
                                      <UserX className="w-3 h-3" />
                                      {participant.totalNoShows}
                                    </span>
                                  )}
                                  {hasBlockReports && participant.reviewData && (
                                    <span
                                      className="flex items-center gap-1 text-xs text-error"
                                      title={`ブロック報告: ${participant.reviewData.blockCount}件`}
                                    >
                                      <Ban className="w-3 h-3" />
                                      {participant.reviewData.blockCount}
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
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

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
