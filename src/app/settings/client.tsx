'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  CreditCard,
  FileText,
  Shield,
  Scale,
  LogOut,
  Trash2,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import {
  MagicCard,
  AnimatedGradientText,
  BlurFade,
  Particles,
} from '@/components/ui/magicui';
import type { User as UserType } from '@/types/database';

interface SettingsClientProps {
  user: UserType;
}

const menuItems = [
  {
    section: 'アカウント',
    items: [
      { label: 'プロフィール', href: '/profile', icon: User },
      { label: 'サブスクリプション管理', href: '/settings/subscription', icon: CreditCard },
    ],
  },
  {
    section: '法的情報',
    items: [
      { label: '利用規約', href: '/terms', icon: FileText },
      { label: 'プライバシーポリシー', href: '/privacy', icon: Shield },
      { label: '特定商取引法に基づく表記', href: '/legal', icon: Scale },
    ],
  },
];

export function SettingsClient({ user }: SettingsClientProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'アカウント削除に失敗しました');
      }

      // Clear cookies and redirect
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/?deleted=true';
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'アカウント削除に失敗しました');
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      <Particles className="absolute inset-0 pointer-events-none" quantity={15} color="#f59e0b" staticity={60} />

      {/* Header */}
      <motion.header
        className="glass border-b border-slate-700 sticky top-0 z-50"
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
            <AnimatedGradientText>設定</AnimatedGradientText>
          </h1>
          <div className="w-16" />
        </div>
      </motion.header>

      <main className="max-w-2xl mx-auto px-4 py-8 relative">
        {/* User Info */}
        <BlurFade>
          <div className="mb-8 text-center">
            <motion.div
              className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </motion.div>
            <h2 className="text-xl font-bold text-white">{user.display_name}</h2>
            <p className="text-slate-400 text-sm">{user.email}</p>
          </div>
        </BlurFade>

        {/* Menu Sections */}
        {menuItems.map((section, sectionIndex) => (
          <BlurFade key={section.section} delay={sectionIndex * 0.1}>
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-400 mb-3 px-1">
                {section.section}
              </h3>
              <MagicCard gradientColor="#f59e0b" gradientOpacity={0.1}>
                <div className="divide-y divide-slate-700">
                  {section.items.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <motion.div
                        className="flex items-center justify-between p-4 hover:bg-slate-800 transition-colors"
                        whileHover={{ x: 4 }}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 text-slate-400" />
                          <span className="font-medium text-white">{item.label}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </MagicCard>
            </div>
          </BlurFade>
        ))}

        {/* Logout */}
        <BlurFade delay={0.3}>
          <div className="mb-6">
            <MagicCard gradientColor="#f59e0b" gradientOpacity={0.1}>
              <motion.button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-800 transition-colors"
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-slate-400" />
                  <span className="font-medium text-white">ログアウト</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </motion.button>
            </MagicCard>
          </div>
        </BlurFade>

        {/* Danger Zone */}
        <BlurFade delay={0.4}>
          <div className="mb-6">
            <h3 className="text-sm font-medium text-error mb-3 px-1">
              危険な操作
            </h3>
            <MagicCard className="border-error/30" gradientColor="#ef4444" gradientOpacity={0.15}>
              <motion.button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-error/10 transition-colors text-error"
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5" />
                  <span className="font-medium">アカウントを削除</span>
                </div>
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </MagicCard>
          </div>
        </BlurFade>

        {/* Version */}
        <BlurFade delay={0.5}>
          <p className="text-center text-sm text-slate-500 mt-8">
            Dine Tokyo(ダイントーキョー) v1.0.0
          </p>
        </BlurFade>
      </main>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <motion.div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => !isDeleting && setShowDeleteModal(false)}
        >
          <motion.div
            className="bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-700"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">アカウント削除</h3>
              <p className="text-slate-300">
                本当にアカウントを削除しますか？この操作は取り消せません。
              </p>
              <p className="text-sm text-slate-400 mt-2">
                サブスクリプションも自動的に解約されます。
              </p>
            </div>

            {deleteError && (
              <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <motion.button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-slate-700 text-slate-200 rounded-lg font-medium hover:bg-slate-600 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                キャンセル
              </motion.button>
              <motion.button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-error text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isDeleting ? '削除中...' : '削除する'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
