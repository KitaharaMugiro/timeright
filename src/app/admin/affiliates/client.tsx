'use client';

import { useState, useEffect } from 'react';
import { Plus, Copy, Eye, EyeOff, ChevronDown, ChevronRight, Users, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AffiliateCode {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  use_count: number;
  created_at: string;
}

interface AffiliateUse {
  id: string;
  created_at: string;
  users: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    created_at: string;
  };
}

export function AffiliatesAdminClient() {
  const [codes, setCodes] = useState<AffiliateCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedUses, setExpandedUses] = useState<AffiliateUse[]>([]);
  const [expandLoading, setExpandLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const response = await fetch('/api/admin/affiliates');
      const data = await response.json();
      if (response.ok) {
        setCodes(data.codes);
      }
    } catch (err) {
      console.error('Failed to fetch codes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setCreateError('名前を入力してください');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      const response = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          code: newCode.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '作成に失敗しました');
      }

      setCodes((prev) => [{ ...data.code, use_count: 0 }, ...prev]);
      setNewName('');
      setNewCode('');
      setShowCreateForm(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : '作成に失敗しました');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/affiliates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive }),
      });

      if (response.ok) {
        setCodes((prev) =>
          prev.map((c) => (c.id === id ? { ...c, is_active: !currentActive } : c))
        );
      }
    } catch (err) {
      console.error('Failed to toggle active:', err);
    }
  };

  const handleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);
    setExpandLoading(true);

    try {
      const response = await fetch(`/api/admin/affiliates/${id}`);
      const data = await response.json();
      if (response.ok) {
        setExpandedUses(data.uses);
      }
    } catch (err) {
      console.error('Failed to fetch uses:', err);
    } finally {
      setExpandLoading(false);
    }
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">アフィリエイトコード管理</h1>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-rose-600 hover:bg-rose-700"
        >
          {showCreateForm ? (
            <>
              <X className="w-4 h-4 mr-2" />
              閉じる
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              新規作成
            </>
          )}
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">新規アフィリエイトコード</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">名前 *</label>
              <Input
                placeholder="例: Instagram Campaign 2026"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setCreateError(null);
                }}
                className="bg-slate-900 border-slate-600 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                コード（空欄で自動生成）
              </label>
              <Input
                placeholder="例: ABCD2345"
                value={newCode}
                onChange={(e) => {
                  setNewCode(e.target.value.toUpperCase());
                  setCreateError(null);
                }}
                maxLength={8}
                className="bg-slate-900 border-slate-600 text-white font-mono tracking-wider uppercase"
              />
              <p className="text-xs text-slate-500 mt-1">8文字の英数字（空欄の場合は自動生成されます）</p>
            </div>

            {createError && (
              <p className="text-red-400 text-sm">{createError}</p>
            )}

            <Button type="submit" disabled={createLoading} className="bg-rose-600 hover:bg-rose-700">
              {createLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  作成中...
                </>
              ) : (
                '作成'
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Codes List */}
      {codes.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p>アフィリエイトコードがありません</p>
          <p className="text-sm mt-1">「新規作成」ボタンからコードを作成してください</p>
        </div>
      ) : (
        <div className="space-y-3">
          {codes.map((code) => (
            <div
              key={code.id}
              className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden"
            >
              {/* Code Row */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-750"
                onClick={() => handleExpand(code.id)}
              >
                <div className="shrink-0">
                  {expandedId === code.id ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-white text-lg tracking-wider">
                      {code.code}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(code.code, code.id);
                      }}
                      className="text-slate-400 hover:text-white transition-colors"
                      title="コピー"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {copiedId === code.id && (
                      <span className="text-xs text-green-400">コピーしました</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 truncate">{code.name}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1 text-sm text-slate-400">
                    <Users className="w-4 h-4" />
                    <span>{code.use_count}</span>
                  </div>

                  <span className="text-xs text-slate-500">
                    {formatDate(code.created_at)}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(code.id, code.is_active);
                    }}
                    className={`p-2 rounded transition-colors ${
                      code.is_active
                        ? 'text-green-400 hover:text-green-300 hover:bg-green-900/20'
                        : 'text-slate-500 hover:text-slate-400 hover:bg-slate-700'
                    }`}
                    title={code.is_active ? '有効（クリックで無効化）' : '無効（クリックで有効化）'}
                  >
                    {code.is_active ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Detail */}
              {expandedId === code.id && (
                <div className="border-t border-slate-700 bg-slate-850 p-4">
                  {expandLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    </div>
                  ) : expandedUses.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">
                      まだ使用されていません
                    </p>
                  ) : (
                    <div>
                      <h3 className="text-sm font-medium text-slate-400 mb-3">
                        使用ユーザー（{expandedUses.length}人）
                      </h3>
                      <div className="space-y-2">
                        {expandedUses.map((use) => (
                          <div
                            key={use.id}
                            className="flex items-center gap-3 p-2 rounded bg-slate-800"
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-600 overflow-hidden shrink-0">
                              {use.users?.avatar_url ? (
                                <img
                                  src={use.users.avatar_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-amber-500 to-amber-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">
                                {use.users?.display_name || '不明'}
                              </p>
                            </div>
                            <span className="text-xs text-slate-500 shrink-0">
                              {formatDate(use.created_at)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
