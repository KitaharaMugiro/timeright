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
              className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </motion.div>
            <h2 className="text-xl font-bold">{user.display_name}</h2>
            <p className="text-neutral-500 text-sm">{user.email}</p>
          </div>
        </BlurFade>

        {/* Menu Sections */}
        {menuItems.map((section, sectionIndex) => (
          <BlurFade key={section.section} delay={sectionIndex * 0.1}>
            <div className="mb-6">
              <h3 className="text-sm font-medium text-neutral-500 mb-3 px-1">
                {section.section}
              </h3>
              <MagicCard gradientColor="#FF6B6B" gradientOpacity={0.1}>
                <div className="divide-y divide-neutral-100">
                  {section.items.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <motion.div
                        className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                        whileHover={{ x: 4 }}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 text-neutral-500" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-neutral-400" />
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
            <MagicCard gradientColor="#FF6B6B" gradientOpacity={0.1}>
              <motion.button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-neutral-500" />
                  <span className="font-medium">ログアウト</span>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </motion.button>
            </MagicCard>
          </div>
        </BlurFade>

        {/* Danger Zone */}
        <BlurFade delay={0.4}>
          <div className="mb-6">
            <h3 className="text-sm font-medium text-red-500 mb-3 px-1">
              危険な操作
            </h3>
            <MagicCard className="border-red-200" gradientColor="#FF6B6B" gradientOpacity={0.15}>
              <motion.button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors text-red-600"
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
          <p className="text-center text-sm text-neutral-400 mt-8">
            unplanned v1.0.0
          </p>
        </BlurFade>
      </main>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => !isDeleting && setShowDeleteModal(false)}
        >
          <motion.div
            className="bg-white rounded-2xl max-w-md w-full p-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">アカウント削除</h3>
              <p className="text-neutral-600">
                本当にアカウントを削除しますか？この操作は取り消せません。
              </p>
              <p className="text-sm text-neutral-500 mt-2">
                サブスクリプションも自動的に解約されます。
              </p>
            </div>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <motion.button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                キャンセル
              </motion.button>
              <motion.button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
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
