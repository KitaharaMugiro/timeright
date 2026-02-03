'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { UserAvatar } from '@/components/UserAvatar';
import { formatDate, formatTime } from '@/lib/utils';
import { Shield, Check, X, User, Calendar, Loader2, ImageIcon } from 'lucide-react';
import type { VerificationRequestWithUser } from './page';

interface AdminVerificationClientProps {
  initialRequests: VerificationRequestWithUser[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export function AdminVerificationClient({ initialRequests, pagination }: AdminVerificationClientProps) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setRequests(initialRequests);
    setLoadingId(null);
  }, [initialRequests]);

  const handlePageChange = (page: number) => {
    const nextPage = Math.max(1, Math.min(page, pagination.totalPages));
    router.push(`/admin/verification?page=${nextPage}`);
  };

  const handleApprove = async (id: string) => {
    if (loadingId) return;
    setLoadingId(id);

    try {
      const response = await fetch(`/api/admin/verification/${id}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert('承認に失敗しました');
      }
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('エラーが発生しました');
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (loadingId) return;
    setLoadingId(id);

    try {
      const response = await fetch(`/api/admin/verification/${id}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert('却下に失敗しました');
      }
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('エラーが発生しました');
    } finally {
      setLoadingId(null);
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <AdminLayout>
      <div data-testid="admin-verification-page">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-6 h-6 text-emerald-500" />
          <h1 className="text-2xl font-bold text-white">本人確認</h1>
          <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-sm rounded">
            {pagination.totalCount}件待ち
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="glass-card border border-slate-700 rounded-lg p-8 text-center text-slate-400">
            <Shield className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <p>確認待ちの申請はありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="glass-card border border-slate-700 rounded-lg p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* User Info */}
                  <div className="flex items-start gap-3 min-w-[200px]">
                    <UserAvatar
                      displayName={request.user.display_name}
                      avatarUrl={request.user.avatar_url}
                      gender={request.user.gender}
                      size="lg"
                    />
                    <div>
                      <p className="font-medium text-white">{request.user.display_name}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <User className="w-3 h-3" />
                        {request.user.gender === 'male' ? '男性' : '女性'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {formatDate(request.user.birth_date)} ({calculateAge(request.user.birth_date)}歳)
                      </div>
                      <p className="text-xs text-slate-500 mt-1">ID: {request.user.id.slice(0, 8)}...</p>
                    </div>
                  </div>

                  {/* ID Image */}
                  <div className="flex-1">
                    <div className="relative w-full max-w-md h-48 bg-slate-800 rounded-lg overflow-hidden">
                      {imageErrors[request.id] ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                          <ImageIcon className="w-8 h-8 mb-2" />
                          <p className="text-sm">画像を取得できませんでした</p>
                          <p className="text-xs mt-1">有効期限切れの可能性があります</p>
                        </div>
                      ) : (
                        <img
                          src={`/api/admin/verification/image/${request.line_message_id}`}
                          alt="ID Document"
                          className="w-full h-full object-contain"
                          onError={() => setImageErrors((prev) => ({ ...prev, [request.id]: true }))}
                        />
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Message ID: {request.line_message_id}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-[120px]">
                    <p className="text-xs text-slate-500 mb-2">
                      受信: {formatDate(request.created_at)} {formatTime(request.created_at)}
                    </p>
                    <button
                      onClick={() => handleApprove(request.id)}
                      disabled={loadingId === request.id}
                      className="flex items-center justify-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loadingId === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          OK
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={loadingId === request.id}
                      className="flex items-center justify-center gap-1 px-4 py-2 border border-red-600 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loadingId === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          NG
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              前へ
            </button>
            <span className="text-sm text-slate-400">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              次へ
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
