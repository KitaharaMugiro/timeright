'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Edit2,
  X,
} from 'lucide-react';
import type { IcebreakerGameCategory, IcebreakerGame } from '@/types/database';

interface GamesAdminClientProps {
  initialCategories: IcebreakerGameCategory[];
  initialGames: IcebreakerGame[];
}

export function GamesAdminClient({ initialCategories, initialGames }: GamesAdminClientProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [games, setGames] = useState(initialGames);
  const [activeTab, setActiveTab] = useState<'categories' | 'games'>('games');
  const [saving, setSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState<IcebreakerGameCategory | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(categories.map(c => c.id)));

  // ゲームの表示/非表示を切り替え
  const toggleGameActive = async (gameId: string, isActive: boolean) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/icebreaker/games', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: gameId, is_active: isActive }),
      });

      if (res.ok) {
        setGames(games.map(g => g.id === gameId ? { ...g, is_active: isActive } : g));
      }
    } catch (error) {
      console.error('Failed to toggle game:', error);
    }
    setSaving(false);
  };

  // ゲームのカテゴリを変更
  const updateGameCategory = async (gameId: string, categoryId: string | null) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/icebreaker/games', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: gameId, category_id: categoryId }),
      });

      if (res.ok) {
        setGames(games.map(g => g.id === gameId ? { ...g, category_id: categoryId } : g));
      }
    } catch (error) {
      console.error('Failed to update game category:', error);
    }
    setSaving(false);
  };

  // カテゴリの表示/非表示を切り替え
  const toggleCategoryActive = async (categoryId: string, isActive: boolean) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/icebreaker/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: categoryId, is_active: isActive }),
      });

      if (res.ok) {
        setCategories(categories.map(c => c.id === categoryId ? { ...c, is_active: isActive } : c));
      }
    } catch (error) {
      console.error('Failed to toggle category:', error);
    }
    setSaving(false);
  };

  // カテゴリを更新
  const updateCategory = async (category: IcebreakerGameCategory) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/icebreaker/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: category.id,
          name: category.name,
          description: category.description,
          emoji: category.emoji,
        }),
      });

      if (res.ok) {
        setCategories(categories.map(c => c.id === category.id ? category : c));
        setEditingCategory(null);
      }
    } catch (error) {
      console.error('Failed to update category:', error);
    }
    setSaving(false);
  };

  // カテゴリを削除
  const deleteCategory = async (categoryId: string) => {
    if (!confirm('このカテゴリを削除しますか？所属するゲームは「未分類」に移動します。')) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/icebreaker/categories?id=${categoryId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCategories(categories.filter(c => c.id !== categoryId));
        setGames(games.map(g => g.category_id === categoryId ? { ...g, category_id: null } : g));
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
    setSaving(false);
  };

  // カテゴリごとにゲームをグループ化
  const gamesByCategory = categories.map(category => ({
    category,
    games: games.filter(g => g.category_id === category.id).sort((a, b) => a.sort_order - b.sort_order),
  }));
  const uncategorizedGames = games.filter(g => !g.category_id).sort((a, b) => a.sort_order - b.sort_order);

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold">ゲーム管理</h1>
            </div>
            {saving && <span className="text-amber-400 text-sm">保存中...</span>}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('games')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'games'
                ? 'bg-amber-500 text-slate-900'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ゲーム一覧
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'categories'
                ? 'bg-amber-500 text-slate-900'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            カテゴリ管理
          </button>
        </div>

        {/* Games Tab */}
        {activeTab === 'games' && (
          <div className="space-y-6">
            <p className="text-slate-400 text-sm">
              ゲームの表示/非表示やカテゴリの割り当てを管理できます
            </p>

            {/* カテゴリごとのゲーム */}
            {gamesByCategory.map(({ category, games: categoryGames }) => (
              <div key={category.id} className="bg-slate-800/50 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleExpanded(category.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.emoji}</span>
                    <div className="text-left">
                      <h3 className="font-bold">{category.name}</h3>
                      <p className="text-sm text-slate-400">
                        {categoryGames.length}個のゲーム
                        {!category.is_active && (
                          <span className="ml-2 text-red-400">(非表示カテゴリ)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {expandedCategories.has(category.id) ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {expandedCategories.has(category.id) && (
                  <div className="border-t border-slate-700">
                    {categoryGames.length === 0 ? (
                      <p className="p-4 text-slate-500 text-sm">ゲームがありません</p>
                    ) : (
                      categoryGames.map(game => (
                        <GameRow
                          key={game.id}
                          game={game}
                          categories={categories}
                          onToggleActive={toggleGameActive}
                          onUpdateCategory={updateGameCategory}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* 未分類のゲーム */}
            {uncategorizedGames.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-700">
                  <h3 className="font-bold text-slate-400">未分類</h3>
                  <p className="text-sm text-slate-500">
                    {uncategorizedGames.length}個のゲーム
                  </p>
                </div>
                {uncategorizedGames.map(game => (
                  <GameRow
                    key={game.id}
                    game={game}
                    categories={categories}
                    onToggleActive={toggleGameActive}
                    onUpdateCategory={updateGameCategory}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm mb-4">
              カテゴリの編集や表示/非表示を管理できます
            </p>

            {categories.map(category => (
              <div
                key={category.id}
                className={`bg-slate-800/50 rounded-xl p-4 ${
                  !category.is_active ? 'opacity-60' : ''
                }`}
              >
                {editingCategory?.id === category.id ? (
                  <CategoryEditForm
                    category={editingCategory}
                    onSave={updateCategory}
                    onCancel={() => setEditingCategory(null)}
                    onChange={setEditingCategory}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.emoji}</span>
                      <div>
                        <h3 className="font-bold">{category.name}</h3>
                        <p className="text-sm text-slate-400">{category.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingCategory(category)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        title="編集"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleCategoryActive(category.id, !category.is_active)}
                        className={`p-2 rounded-lg transition-colors ${
                          category.is_active
                            ? 'hover:bg-slate-700 text-green-400'
                            : 'hover:bg-slate-700 text-slate-500'
                        }`}
                        title={category.is_active ? '非表示にする' : '表示する'}
                      >
                        {category.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteCategory(category.id)}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface GameRowProps {
  game: IcebreakerGame;
  categories: IcebreakerGameCategory[];
  onToggleActive: (gameId: string, isActive: boolean) => void;
  onUpdateCategory: (gameId: string, categoryId: string | null) => void;
}

function GameRow({ game, categories, onToggleActive, onUpdateCategory }: GameRowProps) {
  return (
    <div
      className={`flex items-center justify-between p-4 border-b border-slate-700 last:border-b-0 ${
        !game.is_active ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{game.emoji}</span>
        <div>
          <h4 className="font-medium">{game.name}</h4>
          <p className="text-sm text-slate-400">{game.description}</p>
          <p className="text-xs text-slate-500 mt-1">
            {game.min_players}-{game.max_players}人
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <select
          value={game.category_id || ''}
          onChange={(e) => onUpdateCategory(game.id, e.target.value || null)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">未分類</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => onToggleActive(game.id, !game.is_active)}
          className={`p-2 rounded-lg transition-colors ${
            game.is_active
              ? 'hover:bg-slate-700 text-green-400'
              : 'hover:bg-slate-700 text-slate-500'
          }`}
          title={game.is_active ? '非表示にする' : '表示する'}
        >
          {game.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

interface CategoryEditFormProps {
  category: IcebreakerGameCategory;
  onSave: (category: IcebreakerGameCategory) => void;
  onCancel: () => void;
  onChange: (category: IcebreakerGameCategory) => void;
}

function CategoryEditForm({ category, onSave, onCancel, onChange }: CategoryEditFormProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <input
          type="text"
          value={category.emoji || ''}
          onChange={(e) => onChange({ ...category, emoji: e.target.value })}
          placeholder="絵文字"
          className="w-16 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-center text-xl"
        />
        <input
          type="text"
          value={category.name}
          onChange={(e) => onChange({ ...category, name: e.target.value })}
          placeholder="カテゴリ名"
          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
        />
      </div>
      <input
        type="text"
        value={category.description || ''}
        onChange={(e) => onChange({ ...category, description: e.target.value })}
        placeholder="説明"
        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onSave(category)}
          className="px-4 py-2 bg-amber-500 text-slate-900 rounded-lg font-medium flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          保存
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-700 rounded-lg flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          キャンセル
        </button>
      </div>
    </div>
  );
}
