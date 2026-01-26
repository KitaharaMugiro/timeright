'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User as UserIcon, ArrowLeft, Edit3, Save, X, Briefcase, Calendar, Sparkles, Check } from 'lucide-react';
import {
  MagicCard,
  AnimatedGradientText,
  BlurFade,
  Particles,
} from '@/components/ui/magicui';
import type { User, Gender, PersonalityType } from '@/types/database';

interface ProfileClientProps {
  user: User;
}

const personalityLabels: Record<PersonalityType, { label: string; emoji: string; description: string }> = {
  Leader: { label: 'リーダー', emoji: '👑', description: '場をリードし、グループを引っ張る存在' },
  Supporter: { label: 'サポーター', emoji: '🤝', description: '周りをサポートし、居心地の良い雰囲気を作る' },
  Analyst: { label: 'アナリスト', emoji: '🔍', description: '深い会話を好み、論理的に考える' },
  Entertainer: { label: 'エンターテイナー', emoji: '🎉', description: '場を盛り上げ、楽しい雰囲気を作る' },
};

const genderLabels: Record<Gender, string> = {
  male: '男性',
  female: '女性',
};

export function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    display_name: user.display_name,
    job: user.job,
  });

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '保存に失敗しました');
      }

      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 2000);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      display_name: user.display_name,
      job: user.job,
    });
    setIsEditing(false);
    setError(null);
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const personality = user.personality_type ? personalityLabels[user.personality_type] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 relative overflow-hidden">
      <Particles className="absolute inset-0 pointer-events-none" quantity={15} color="#FF6B6B" staticity={60} />

      {/* Header */}
      <motion.header
        className="bg-white/80 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>戻る</span>
          </Link>
          <h1 className="text-lg font-semibold">
            <AnimatedGradientText>プロフィール</AnimatedGradientText>
          </h1>
          <div className="w-16" />
        </div>
      </motion.header>

      <main className="max-w-2xl mx-auto px-4 py-8 relative">
        {/* Profile Header */}
        <BlurFade>
          <div className="text-center mb-8">
            <motion.div
              className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <UserIcon className="w-12 h-12 text-white" />
              )}
            </motion.div>
            <h2 className="text-2xl font-bold">{user.display_name}</h2>
            <p className="text-neutral-600">{genderLabels[user.gender]} · {calculateAge(user.birth_date)}歳</p>
          </div>
        </BlurFade>

        {/* Success Message */}
        {saveSuccess && (
          <motion.div
            className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Check className="w-5 h-5" />
            保存しました
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {/* Profile Info */}
        <BlurFade delay={0.1}>
          <MagicCard gradientColor="#FF6B6B" gradientOpacity={0.1}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">基本情報</h3>
                {!isEditing ? (
                  <motion.button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#FF6B6B] hover:bg-[#FF6B6B]/5 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Edit3 className="w-4 h-4" />
                    編集
                  </motion.button>
                ) : (
                  <div className="flex gap-2">
                    <motion.button
                      onClick={handleCancel}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X className="w-4 h-4" />
                      キャンセル
                    </motion.button>
                    <motion.button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-[#FF6B6B] hover:bg-[#FF5252] rounded-lg transition-colors disabled:opacity-50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? '保存中...' : '保存'}
                    </motion.button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Display Name */}
                <div>
                  <label className="block text-sm text-neutral-500 mb-1">表示名</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/50"
                    />
                  ) : (
                    <p className="text-lg font-medium flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-neutral-400" />
                      {user.display_name}
                    </p>
                  )}
                </div>

                {/* Job */}
                <div>
                  <label className="block text-sm text-neutral-500 mb-1">職業</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.job}
                      onChange={(e) => setFormData({ ...formData, job: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/50"
                    />
                  ) : (
                    <p className="text-lg font-medium flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-neutral-400" />
                      {user.job}
                    </p>
                  )}
                </div>

                {/* Gender (Read-only) */}
                <div>
                  <label className="block text-sm text-neutral-500 mb-1">性別</label>
                  <p className="text-lg font-medium">{genderLabels[user.gender]}</p>
                </div>

                {/* Birth Date (Read-only) */}
                <div>
                  <label className="block text-sm text-neutral-500 mb-1">生年月日</label>
                  <p className="text-lg font-medium flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-neutral-400" />
                    {new Date(user.birth_date).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </MagicCard>
        </BlurFade>

        {/* Personality Type */}
        {personality && (
          <BlurFade delay={0.2}>
            <MagicCard className="mt-6" gradientColor="#FF8E53" gradientOpacity={0.15}>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#FF6B6B]" />
                  パーソナリティタイプ
                </h3>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{personality.emoji}</span>
                  <div>
                    <p className="text-xl font-bold">{personality.label}</p>
                    <p className="text-neutral-600">{personality.description}</p>
                  </div>
                </div>
              </div>
            </MagicCard>
          </BlurFade>
        )}

        {/* Quick Links */}
        <BlurFade delay={0.3}>
          <div className="mt-6 grid gap-3">
            <Link href="/settings">
              <MagicCard className="hover:scale-[1.02] transition-transform" gradientColor="#FF6B6B" gradientOpacity={0.1}>
                <div className="p-4 flex items-center justify-between">
                  <span className="font-medium">アカウント設定</span>
                  <ArrowLeft className="w-5 h-5 rotate-180 text-neutral-400" />
                </div>
              </MagicCard>
            </Link>
            <Link href="/settings/subscription">
              <MagicCard className="hover:scale-[1.02] transition-transform" gradientColor="#FF6B6B" gradientOpacity={0.1}>
                <div className="p-4 flex items-center justify-between">
                  <span className="font-medium">サブスクリプション管理</span>
                  <ArrowLeft className="w-5 h-5 rotate-180 text-neutral-400" />
                </div>
              </MagicCard>
            </Link>
          </div>
        </BlurFade>
      </main>
    </div>
  );
}
