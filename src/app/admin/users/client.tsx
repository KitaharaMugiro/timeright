'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/UserAvatar';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { formatDate, getAreaLabel, cn } from '@/lib/utils';
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  X,
  Calendar,
  Star,
  UserPlus,
  XCircle,
  MessageSquare,
  ArrowLeft,
  Clock,
  Ban,
  UserX,
  Briefcase,
} from 'lucide-react';
import type { Gender } from '@/types/database';

interface UserWithActivity {
  id: string;
  display_name: string;
  avatar_url: string | null;
  gender: Gender;
  birth_date: string;
  job: string;
  subscription_status: string;
  member_stage: string | null;
  is_identity_verified: boolean;
  line_user_id: string | null;
  created_at: string;
  last_activity_at: string;
  participation_count: number;
  cancel_count: number;
}

interface ActivityItem {
  id: string;
  type: 'participation' | 'cancel' | 'review_sent' | 'review_received' | 'signup';
  date: string;
  detail: string;
  meta?: Record<string, unknown>;
}

interface UserDetail {
  id: string;
  display_name: string;
  avatar_url: string | null;
  gender: Gender;
  birth_date: string;
  job: string;
  subscription_status: string;
  subscription_period_end: string | null;
  member_stage: string | null;
  stage_points: number | null;
  is_identity_verified: boolean;
  line_user_id: string | null;
  created_at: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

const ACTIVITY_ICONS: Record<string, typeof Calendar> = {
  participation: Calendar,
  cancel: XCircle,
  review_sent: Star,
  review_received: MessageSquare,
  signup: UserPlus,
};

const ACTIVITY_COLORS: Record<string, string> = {
  participation: 'text-success',
  cancel: 'text-error',
  review_sent: 'text-amber-400',
  review_received: 'text-info',
  signup: 'text-rose-400',
};

function getAge(birthDate: string) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'たった今';
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay < 7) return `${diffDay}日前`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}週間前`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}ヶ月前`;
  return `${Math.floor(diffDay / 365)}年前`;
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminUsersClient() {
  const [users, setUsers] = useState<UserWithActivity[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Detail view
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchUsers = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '30',
      });
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
        setPagination(data.pagination);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const fetchUserActivity = async (userId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/activity`);
      const data = await res.json();
      if (data.user) {
        setSelectedUser(data.user);
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Failed to fetch user activity:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUserClick = (userId: string) => {
    fetchUserActivity(userId);
  };

  const handleBack = () => {
    setSelectedUser(null);
    setActivities([]);
  };

  // Detail view
  if (selectedUser) {
    return (
      <AdminLayout>
        <div>
          {/* Back button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">ユーザ一覧に戻る</span>
          </button>

          {/* User profile header */}
          <Card className="glass-card border-slate-700 mb-6">
            <CardContent className="p-6">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="flex items-start gap-5">
                  <UserAvatar
                    displayName={selectedUser.display_name}
                    avatarUrl={selectedUser.avatar_url}
                    gender={selectedUser.gender}
                    size="xl"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-xl font-bold text-white">
                        {selectedUser.display_name}
                      </h1>
                      {selectedUser.is_identity_verified && (
                        <span title="本人確認済み">
                          <Shield className="w-4 h-4 text-success" />
                        </span>
                      )}
                      {selectedUser.member_stage && (
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded',
                          selectedUser.member_stage === 'platinum' && 'bg-slate-300 text-slate-900',
                          selectedUser.member_stage === 'gold' && 'bg-amber-500/20 text-amber-400',
                          selectedUser.member_stage === 'silver' && 'bg-slate-400/20 text-slate-300',
                          selectedUser.member_stage === 'bronze' && 'bg-orange-700/20 text-orange-400'
                        )}>
                          {selectedUser.member_stage}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                      <span>{getAge(selectedUser.birth_date)}歳 / {selectedUser.gender === 'male' ? '男性' : '女性'}</span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {selectedUser.job || '-'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm">
                      <span className={cn(
                        'px-2 py-0.5 rounded',
                        selectedUser.subscription_status === 'active' && 'bg-success/10 text-success',
                        selectedUser.subscription_status === 'canceled' && 'bg-warning/10 text-warning',
                        selectedUser.subscription_status === 'none' && 'bg-slate-700 text-slate-400',
                        selectedUser.subscription_status === 'past_due' && 'bg-error/10 text-error'
                      )}>
                        {selectedUser.subscription_status === 'active' ? 'サブスク有効' :
                          selectedUser.subscription_status === 'canceled' ? 'サブスク解約済' :
                          selectedUser.subscription_status === 'past_due' ? '支払い遅延' : 'サブスクなし'}
                      </span>
                      {selectedUser.subscription_period_end && selectedUser.subscription_status === 'canceled' && (
                        <span className="text-slate-500">
                          有効期限: {formatDate(selectedUser.subscription_period_end)}
                        </span>
                      )}
                      {selectedUser.stage_points !== null && (
                        <span className="text-slate-500">
                          ステージポイント: {selectedUser.stage_points}pt
                        </span>
                      )}
                      <span className="text-slate-500">
                        登録: {formatDate(selectedUser.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity timeline */}
          <h2 className="text-lg font-semibold text-white mb-4">行動ログ</h2>
          <div className="space-y-1">
            {activities.length === 0 && !loadingDetail ? (
              <p className="text-center text-slate-400 py-8">行動ログがありません</p>
            ) : (
              activities.map((activity) => {
                const Icon = ACTIVITY_ICONS[activity.type] || Calendar;
                const color = ACTIVITY_COLORS[activity.type] || 'text-slate-400';

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/60 transition-colors"
                  >
                    <div className={cn('mt-0.5 flex-shrink-0', color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-white">
                          {activity.detail}
                        </span>
                        <span className="text-xs text-slate-500 flex-shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(activity.date)}
                        </span>
                      </div>
                      {/* Meta info for certain types */}
                      {activity.type === 'cancel' && activity.meta?.cancel_reason ? (
                        <p className="text-xs text-slate-500 mt-1">
                          理由: {String(activity.meta.cancel_reason)}
                        </p>
                      ) : null}
                      {activity.type === 'participation' && activity.meta?.event_date ? (
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDate(String(activity.meta.event_date))} {getAreaLabel(String(activity.meta.area))}
                          {activity.meta.attendance_status === 'canceled' ? ' (当日キャンセル)' : ''}
                          {activity.meta.attendance_status === 'late' ? ' (遅刻)' : ''}
                        </p>
                      ) : null}
                      {(activity.type === 'review_sent' || activity.type === 'review_received') && activity.meta?.comment ? (
                        <p className="text-xs text-slate-500 mt-1 truncate">
                          &quot;{String(activity.meta.comment)}&quot;
                        </p>
                      ) : null}
                      {(activity.type === 'review_sent' || activity.type === 'review_received') ? (
                        <div className="flex gap-2 mt-1">
                          {activity.meta?.block_flag ? (
                            <span className="flex items-center gap-0.5 text-xs text-error">
                              <Ban className="w-3 h-3" />
                              ブロック
                            </span>
                          ) : null}
                          {activity.meta?.is_no_show ? (
                            <span className="flex items-center gap-0.5 text-xs text-warning">
                              <UserX className="w-3 h-3" />
                              No Show
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </AdminLayout>
    );
  }

  // User list view
  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">ユーザ一覧</h1>

        {/* Search bar */}
        <Card className="mb-6 glass-card border-slate-700">
          <CardContent className="p-4">
            <div className="flex gap-3 items-center">
              <div className="flex items-center gap-2 flex-1">
                <Search className="w-4 h-4 text-slate-400" />
                <Input
                  placeholder="名前・職業で検索..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
              </div>
              <Button onClick={handleSearch} size="sm">
                検索
              </Button>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchInput('');
                    setSearchQuery('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              {pagination && (
                <span className="text-sm text-slate-400 ml-2">
                  {pagination.totalCount}人
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User list */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-rose-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            ユーザが見つかりません
          </div>
        ) : (
          <div className="space-y-2">
            {users.map(user => (
              <Card
                key={user.id}
                className="glass-card border-slate-700 cursor-pointer hover:border-slate-500 transition-colors"
                onClick={() => handleUserClick(user.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      displayName={user.display_name}
                      avatarUrl={user.avatar_url}
                      gender={user.gender}
                      size="md"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white truncate">
                          {user.display_name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {getAge(user.birth_date)}歳 / {user.gender === 'male' ? '男性' : '女性'}
                        </span>
                        {user.is_identity_verified && (
                          <Shield className="w-3 h-3 text-success" />
                        )}
                        {user.member_stage && (
                          <span className={cn(
                            'text-xs px-1.5 py-0.5 rounded',
                            user.member_stage === 'platinum' && 'bg-slate-300 text-slate-900',
                            user.member_stage === 'gold' && 'bg-amber-500/20 text-amber-400',
                            user.member_stage === 'silver' && 'bg-slate-400/20 text-slate-300',
                            user.member_stage === 'bronze' && 'bg-orange-700/20 text-orange-400'
                          )}>
                            {user.member_stage}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-400 truncate">
                        {user.job || '-'}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center min-w-[60px]">
                        <div className="text-white font-medium">{user.participation_count}</div>
                        <div className="text-xs text-slate-500">参加</div>
                      </div>
                      {user.cancel_count > 0 && (
                        <div className="text-center min-w-[60px]">
                          <div className="text-error font-medium">{user.cancel_count}</div>
                          <div className="text-xs text-slate-500">キャンセル</div>
                        </div>
                      )}
                      <div className={cn(
                        'text-xs px-2 py-1 rounded min-w-[70px] text-center',
                        user.subscription_status === 'active' && 'bg-success/10 text-success',
                        user.subscription_status === 'canceled' && 'bg-warning/10 text-warning',
                        user.subscription_status === 'none' && 'bg-slate-800 text-slate-500',
                        user.subscription_status === 'past_due' && 'bg-error/10 text-error'
                      )}>
                        {user.subscription_status === 'active' ? '有効' :
                          user.subscription_status === 'canceled' ? '解約済' :
                          user.subscription_status === 'past_due' ? '遅延' : 'なし'}
                      </div>
                    </div>

                    {/* Last activity */}
                    <div className="text-right min-w-[80px]">
                      <div className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(user.last_activity_at)}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1 || loading}
              onClick={() => fetchUsers(currentPage - 1)}
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
              onClick={() => fetchUsers(currentPage + 1)}
            >
              次へ
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
