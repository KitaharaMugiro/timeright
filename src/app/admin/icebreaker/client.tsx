'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { AdminLayout } from '@/components/admin/AdminLayout';
import type {
  IcebreakerQuestion,
  IcebreakerWouldYouRather,
  IcebreakerWordWolf,
  IcebreakerCommonThings,
  IcebreakerQuestionCategory,
  IcebreakerWordWolfCategory,
  IcebreakerCommonThingsCategory,
} from '@/types/database';

type TabType = 'questions' | 'would-you-rather' | 'word-wolf' | 'common-things';

const TABS: { id: TabType; label: string }[] = [
  { id: 'questions', label: '質問タイム' },
  { id: 'would-you-rather', label: 'どっちがいい？' },
  { id: 'word-wolf', label: 'ワードウルフ' },
  { id: 'common-things', label: '10の共通点' },
];

const QUESTION_CATEGORIES: { value: IcebreakerQuestionCategory; label: string }[] = [
  { value: 'casual', label: 'カジュアル' },
  { value: 'fun', label: '楽しい' },
  { value: 'deep', label: '深い' },
];

const WORD_WOLF_CATEGORIES: { value: IcebreakerWordWolfCategory; label: string }[] = [
  { value: 'food', label: '食べ物' },
  { value: 'place', label: '場所' },
  { value: 'animal', label: '動物' },
  { value: 'season', label: '季節' },
  { value: 'entertainment', label: 'エンタメ' },
  { value: 'sports', label: 'スポーツ' },
  { value: 'other', label: 'その他' },
];

const COMMON_THINGS_CATEGORIES: { value: IcebreakerCommonThingsCategory; label: string }[] = [
  { value: 'food', label: '食べ物' },
  { value: 'hobby', label: '趣味' },
  { value: 'travel', label: '旅行' },
  { value: 'lifestyle', label: 'ライフスタイル' },
  { value: 'personality', label: '性格・考え方' },
  { value: 'experience', label: '経験' },
  { value: 'other', label: 'その他' },
];

interface Props {
  questions: IcebreakerQuestion[];
  wouldYouRather: IcebreakerWouldYouRather[];
  wordWolf: IcebreakerWordWolf[];
  commonThings: IcebreakerCommonThings[];
}

export function IcebreakerAdminClient({
  questions: initialQuestions,
  wouldYouRather: initialWouldYouRather,
  wordWolf: initialWordWolf,
  commonThings: initialCommonThings,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('questions');
  const [questions, setQuestions] = useState(initialQuestions);
  const [wouldYouRather, setWouldYouRather] = useState(initialWouldYouRather);
  const [wordWolf, setWordWolf] = useState(initialWordWolf);
  const [commonThings, setCommonThings] = useState(initialCommonThings);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 新規追加フォーム
  const [newQuestion, setNewQuestion] = useState({ question: '', category: 'casual' as IcebreakerQuestionCategory });
  const [newWYR, setNewWYR] = useState({ option_a: '', option_b: '' });
  const [newWordWolf, setNewWordWolf] = useState({ majority_word: '', minority_word: '', category: 'food' as IcebreakerWordWolfCategory });
  const [newCommonThings, setNewCommonThings] = useState({ prompt: '', category: 'food' as IcebreakerCommonThingsCategory });

  // フィルター
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const handleToggleActive = async (type: TabType, id: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/admin/icebreaker/${type}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentValue }),
      });

      if (!response.ok) throw new Error('Failed to update');

      const { data } = await response.json();

      switch (type) {
        case 'questions':
          setQuestions(questions.map((q) => (q.id === id ? data : q)));
          break;
        case 'would-you-rather':
          setWouldYouRather(wouldYouRather.map((w) => (w.id === id ? data : w)));
          break;
        case 'word-wolf':
          setWordWolf(wordWolf.map((w) => (w.id === id ? data : w)));
          break;
        case 'common-things':
          setCommonThings(commonThings.map((c) => (c.id === id ? data : c)));
          break;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('更新に失敗しました');
    }
  };

  const handleDelete = async (type: TabType, id: string) => {
    if (!confirm('本当に削除しますか？')) return;

    try {
      const response = await fetch(`/api/admin/icebreaker/${type}?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      switch (type) {
        case 'questions':
          setQuestions(questions.filter((q) => q.id !== id));
          break;
        case 'would-you-rather':
          setWouldYouRather(wouldYouRather.filter((w) => w.id !== id));
          break;
        case 'word-wolf':
          setWordWolf(wordWolf.filter((w) => w.id !== id));
          break;
        case 'common-things':
          setCommonThings(commonThings.filter((c) => c.id !== id));
          break;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('削除に失敗しました');
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      let payload: any;
      switch (activeTab) {
        case 'questions':
          payload = newQuestion;
          break;
        case 'would-you-rather':
          payload = newWYR;
          break;
        case 'word-wolf':
          payload = newWordWolf;
          break;
        case 'common-things':
          payload = newCommonThings;
          break;
      }

      const response = await fetch(`/api/admin/icebreaker/${activeTab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to create');
      }

      const { data } = await response.json();

      switch (activeTab) {
        case 'questions':
          setQuestions([data, ...questions]);
          setNewQuestion({ question: '', category: 'casual' });
          break;
        case 'would-you-rather':
          setWouldYouRather([data, ...wouldYouRather]);
          setNewWYR({ option_a: '', option_b: '' });
          break;
        case 'word-wolf':
          setWordWolf([data, ...wordWolf]);
          setNewWordWolf({ majority_word: '', minority_word: '', category: 'food' });
          break;
        case 'common-things':
          setCommonThings([data, ...commonThings]);
          setNewCommonThings({ prompt: '', category: 'food' });
          break;
      }

      setShowModal(false);
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : '作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/icebreaker/${activeTab}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      });

      if (!response.ok) throw new Error('Failed to update');

      const { data } = await response.json();

      switch (activeTab) {
        case 'questions':
          setQuestions(questions.map((q) => (q.id === data.id ? data : q)));
          break;
        case 'would-you-rather':
          setWouldYouRather(wouldYouRather.map((w) => (w.id === data.id ? data : w)));
          break;
        case 'word-wolf':
          setWordWolf(wordWolf.map((w) => (w.id === data.id ? data : w)));
          break;
        case 'common-things':
          setCommonThings(commonThings.map((c) => (c.id === data.id ? data : c)));
          break;
      }

      setEditingItem(null);
      setShowModal(false);
    } catch (error) {
      console.error('Error:', error);
      alert('更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem({ ...item });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const getFilteredData = () => {
    switch (activeTab) {
      case 'questions':
        return filterCategory === 'all'
          ? questions
          : questions.filter((q) => q.category === filterCategory);
      case 'would-you-rather':
        return wouldYouRather;
      case 'word-wolf':
        return filterCategory === 'all'
          ? wordWolf
          : wordWolf.filter((w) => w.category === filterCategory);
      case 'common-things':
        return filterCategory === 'all'
          ? commonThings
          : commonThings.filter((c) => c.category === filterCategory);
    }
  };

  const getCategoryLabel = (type: TabType, category: string) => {
    switch (type) {
      case 'questions':
        return QUESTION_CATEGORIES.find((c) => c.value === category)?.label || category;
      case 'word-wolf':
        return WORD_WOLF_CATEGORIES.find((c) => c.value === category)?.label || category;
      case 'common-things':
        return COMMON_THINGS_CATEGORIES.find((c) => c.value === category)?.label || category;
      default:
        return category;
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-white mb-6">アイスブレイク お題管理</h1>

        {/* タブ */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setFilterCategory('all');
              }}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* フィルターと追加ボタン */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            {(activeTab === 'questions' ||
              activeTab === 'word-wolf' ||
              activeTab === 'common-things') && (
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                options={[
                  { value: 'all', label: 'すべて' },
                  ...(activeTab === 'questions'
                    ? QUESTION_CATEGORIES
                    : activeTab === 'word-wolf'
                    ? WORD_WOLF_CATEGORIES
                    : COMMON_THINGS_CATEGORIES),
                ]}
              />
            )}
            <span className="text-slate-400">
              {getFilteredData().length}件
            </span>
          </div>
          <Button onClick={openCreateModal}>追加</Button>
        </div>

        {/* 一覧 */}
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">内容</th>
                {(activeTab === 'questions' ||
                  activeTab === 'word-wolf' ||
                  activeTab === 'common-things') && (
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">カテゴリー</th>
                )}
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-300 w-24">有効</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-300 w-32">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {getFilteredData().map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-750">
                  <td className="px-4 py-3 text-white">
                    {activeTab === 'questions' && item.question}
                    {activeTab === 'would-you-rather' && (
                      <span>
                        {item.option_a} <span className="text-slate-400">vs</span> {item.option_b}
                      </span>
                    )}
                    {activeTab === 'word-wolf' && (
                      <span>
                        {item.majority_word} <span className="text-slate-400">/</span>{' '}
                        {item.minority_word}
                      </span>
                    )}
                    {activeTab === 'common-things' && item.prompt}
                  </td>
                  {(activeTab === 'questions' ||
                    activeTab === 'word-wolf' ||
                    activeTab === 'common-things') && (
                    <td className="px-4 py-3 text-slate-300">
                      <span className="bg-slate-700 px-2 py-1 rounded text-sm">
                        {getCategoryLabel(activeTab, item.category)}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(activeTab, item.id, item.is_active)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        item.is_active ? 'bg-green-500' : 'bg-slate-600'
                      }`}
                    >
                      <span
                        className={`block w-5 h-5 bg-white rounded-full transform transition-transform ${
                          item.is_active ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(activeTab, item.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* モーダル */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-white mb-4">
                {editingItem ? '編集' : '新規追加'}
              </h2>

              {activeTab === 'questions' && (
                <div className="space-y-4">
                  <Input
                    label="質問文"
                    value={editingItem ? editingItem.question : newQuestion.question}
                    onChange={(e) =>
                      editingItem
                        ? setEditingItem({ ...editingItem, question: e.target.value })
                        : setNewQuestion({ ...newQuestion, question: e.target.value })
                    }
                    required
                  />
                  <Select
                    label="カテゴリー"
                    value={editingItem ? editingItem.category : newQuestion.category}
                    onChange={(e) =>
                      editingItem
                        ? setEditingItem({ ...editingItem, category: e.target.value })
                        : setNewQuestion({
                            ...newQuestion,
                            category: e.target.value as IcebreakerQuestionCategory,
                          })
                    }
                    options={QUESTION_CATEGORIES}
                  />
                </div>
              )}

              {activeTab === 'would-you-rather' && (
                <div className="space-y-4">
                  <Input
                    label="選択肢A"
                    value={editingItem ? editingItem.option_a : newWYR.option_a}
                    onChange={(e) =>
                      editingItem
                        ? setEditingItem({ ...editingItem, option_a: e.target.value })
                        : setNewWYR({ ...newWYR, option_a: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="選択肢B"
                    value={editingItem ? editingItem.option_b : newWYR.option_b}
                    onChange={(e) =>
                      editingItem
                        ? setEditingItem({ ...editingItem, option_b: e.target.value })
                        : setNewWYR({ ...newWYR, option_b: e.target.value })
                    }
                    required
                  />
                </div>
              )}

              {activeTab === 'word-wolf' && (
                <div className="space-y-4">
                  <Input
                    label="多数派ワード"
                    value={editingItem ? editingItem.majority_word : newWordWolf.majority_word}
                    onChange={(e) =>
                      editingItem
                        ? setEditingItem({ ...editingItem, majority_word: e.target.value })
                        : setNewWordWolf({ ...newWordWolf, majority_word: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="少数派ワード"
                    value={editingItem ? editingItem.minority_word : newWordWolf.minority_word}
                    onChange={(e) =>
                      editingItem
                        ? setEditingItem({ ...editingItem, minority_word: e.target.value })
                        : setNewWordWolf({ ...newWordWolf, minority_word: e.target.value })
                    }
                    required
                  />
                  <Select
                    label="カテゴリー"
                    value={editingItem ? editingItem.category : newWordWolf.category}
                    onChange={(e) =>
                      editingItem
                        ? setEditingItem({ ...editingItem, category: e.target.value })
                        : setNewWordWolf({
                            ...newWordWolf,
                            category: e.target.value as IcebreakerWordWolfCategory,
                          })
                    }
                    options={WORD_WOLF_CATEGORIES}
                  />
                </div>
              )}

              {activeTab === 'common-things' && (
                <div className="space-y-4">
                  <Input
                    label="プロンプト"
                    value={editingItem ? editingItem.prompt : newCommonThings.prompt}
                    onChange={(e) =>
                      editingItem
                        ? setEditingItem({ ...editingItem, prompt: e.target.value })
                        : setNewCommonThings({ ...newCommonThings, prompt: e.target.value })
                    }
                    required
                  />
                  <Select
                    label="カテゴリー"
                    value={editingItem ? editingItem.category : newCommonThings.category}
                    onChange={(e) =>
                      editingItem
                        ? setEditingItem({ ...editingItem, category: e.target.value })
                        : setNewCommonThings({
                            ...newCommonThings,
                            category: e.target.value as IcebreakerCommonThingsCategory,
                          })
                    }
                    options={COMMON_THINGS_CATEGORIES}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                  }}
                >
                  キャンセル
                </Button>
                <Button onClick={editingItem ? handleUpdate : handleCreate} loading={loading}>
                  {editingItem ? '更新' : '追加'}
                </Button>
              </div>
            </div>
          </div>
        )}
    </AdminLayout>
  );
}
