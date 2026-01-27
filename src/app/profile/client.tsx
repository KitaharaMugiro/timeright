'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User as UserIcon, ArrowLeft, Edit3, Save, X, Briefcase, Calendar, Sparkles, Check, ArrowRight } from 'lucide-react';
import {
  GlassCard,
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
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      <Particles className="absolute inset-0 pointer-events-none" quantity={20} color="#f59e0b" staticity={70} />

      {/* Header */}
      <motion.header
        className="glass sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
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
              className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-amber-500/20 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <UserIcon className="w-12 h-12 text-amber-500" />
              )}
            </motion.div>
            <h2 className="text-2xl font-serif text-white">{user.display_name}</h2>
            <p className="text-slate-400">{genderLabels[user.gender]} · {calculateAge(user.birth_date)}歳</p>
          </div>
        </BlurFade>

        {/* Success Message */}
        {saveSuccess && (
          <motion.div
            className="mb-4 p-4 glass rounded-xl flex items-center gap-2 text-emerald-400"
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
            className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {/* Profile Info */}
        <BlurFade delay={0.1}>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">基本情報</h3>
              {!isEditing ? (
                <motion.button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
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
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-4 h-4" />
                    キャンセル
                  </motion.button>
                  <motion.button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-900 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors disabled:opacity-50"
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
                <label className="block text-sm text-slate-500 mb-1">表示名</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  />
                ) : (
                  <p className="text-lg font-medium text-white flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-amber-500/70" />
                    {user.display_name}
                  </p>
                )}
              </div>

              {/* Job */}
              <div>
                <label className="block text-sm text-slate-500 mb-1">職業</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.job}
                    onChange={(e) => setFormData({ ...formData, job: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  />
                ) : (
                  <p className="text-lg font-medium text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-amber-500/70" />
                    {user.job}
                  </p>
                )}
              </div>

              {/* Gender (Read-only) */}
              <div>
                <label className="block text-sm text-slate-500 mb-1">性別</label>
                <p className="text-lg font-medium text-white">{genderLabels[user.gender]}</p>
              </div>

              {/* Birth Date (Read-only) */}
              <div>
                <label className="block text-sm text-slate-500 mb-1">生年月日</label>
                <p className="text-lg font-medium text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500/70" />
                  {new Date(user.birth_date).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </GlassCard>
        </BlurFade>

        {/* Personality Type */}
        {personality && (
          <BlurFade delay={0.2}>
            <GlassCard className="mt-6 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                パーソナリティタイプ
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <span className="text-3xl">{personality.emoji}</span>
                </div>
                <div>
                  <p className="text-xl font-serif text-white">{personality.label}</p>
                  <p className="text-slate-400">{personality.description}</p>
                </div>
              </div>
            </GlassCard>
          </BlurFade>
        )}

        {/* Quick Links */}
        <BlurFade delay={0.3}>
          <div className="mt-6 space-y-3">
            <Link href="/settings">
              <GlassCard className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                <span className="font-medium text-white">アカウント設定</span>
                <ArrowRight className="w-5 h-5 text-slate-500" />
              </GlassCard>
            </Link>
            <Link href="/settings/subscription">
              <GlassCard className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                <span className="font-medium text-white">サブスクリプション管理</span>
                <ArrowRight className="w-5 h-5 text-slate-500" />
              </GlassCard>
            </Link>
          </div>
        </BlurFade>
      </main>
    </div>
  );
}
