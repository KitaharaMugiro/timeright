'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CreditCard,
  Check,
  AlertCircle,
  ExternalLink,
  Clock,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import {
  MagicCard,
  AnimatedGradientText,
  BlurFade,
  Particles,
  ShimmerButton,
} from '@/components/ui/magicui';
import type { User, SubscriptionStatus } from '@/types/database';

interface SubscriptionClientProps {
  user: User;
}

const statusConfig: Record<SubscriptionStatus, { label: string; color: string; icon: typeof Check; description: string }> = {
  active: {
    label: '有効',
    color: 'text-success bg-success/20',
    icon: Check,
    description: 'サブスクリプションは有効です',
  },
  canceled: {
    label: '解約済み',
    color: 'text-slate-400 bg-slate-700',
    icon: XCircle,
    description: '次回更新日に自動で終了します',
  },
  past_due: {
    label: '支払い遅延',
    color: 'text-warning bg-warning/20',
    icon: AlertCircle,
    description: 'お支払い情報を更新してください',
  },
  none: {
    label: '未登録',
    color: 'text-slate-400 bg-slate-700',
    icon: Clock,
    description: 'サブスクリプションに登録されていません',
  },
};

const planFeatures = [
  '毎週のディナーイベントに参加',
  '性格診断によるマッチング',
  '4-6人の少人数グループ',
  '厳選されたレストラン',
  '参加者レビュー機能',
];

export function SubscriptionClient({ user }: SubscriptionClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = statusConfig[user.subscription_status];
  const StatusIcon = status.icon;

  const handleManageSubscription = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'ポータルの作成に失敗しました');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'チェックアウトの作成に失敗しました');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setIsLoading(false);
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
          <Link href="/settings" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>戻る</span>
          </Link>
          <h1 className="text-lg font-semibold">
            <AnimatedGradientText>サブスクリプション</AnimatedGradientText>
          </h1>
          <div className="w-16" />
        </div>
      </motion.header>

      <main className="max-w-2xl mx-auto px-4 py-8 relative">
        {/* Current Status */}
        <BlurFade>
          <MagicCard gradientColor="#f59e0b" gradientOpacity={0.1}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">現在のプラン</h2>
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                  <StatusIcon className="w-4 h-4" />
                  {status.label}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-white">¥1,980</span>
                <span className="text-slate-400">/月</span>
              </div>

              <p className="text-slate-400 mb-6">{status.description}</p>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {planFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-amber-500" />
                    </div>
                    <span className="text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              {user.subscription_status === 'active' && (
                <motion.button
                  onClick={handleManageSubscription}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-slate-700 text-slate-200 rounded-lg font-medium hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      支払い方法・解約の管理
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </>
                  )}
                </motion.button>
              )}

              {user.subscription_status === 'canceled' && (
                <div className="space-y-3">
                  <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                    <p className="text-warning text-sm">
                      サブスクリプションは解約されましたが、
                      {user.subscription_period_end && (
                        <>
                          <strong>
                            {new Date(user.subscription_period_end).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </strong>
                          まで
                        </>
                      )}
                      サービスをご利用いただけます。
                    </p>
                  </div>
                  <ShimmerButton
                    onClick={handleSubscribe}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    再登録する
                  </ShimmerButton>
                </div>
              )}

              {user.subscription_status === 'past_due' && (
                <div className="space-y-3">
                  <div className="p-4 bg-error/10 border border-error/30 rounded-lg">
                    <p className="text-error text-sm">
                      お支払いに問題が発生しています。支払い方法を更新してください。
                    </p>
                  </div>
                  <motion.button
                    onClick={handleManageSubscription}
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-error text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        支払い方法を更新
                        <ExternalLink className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </motion.button>
                </div>
              )}

              {user.subscription_status === 'none' && (
                <ShimmerButton
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  サブスクリプションを開始
                </ShimmerButton>
              )}
            </div>
          </MagicCard>
        </BlurFade>

        {/* FAQ */}
        <BlurFade delay={0.1}>
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 text-white">よくある質問</h3>
            <div className="space-y-4">
              <MagicCard gradientColor="#f59e0b" gradientOpacity={0.05}>
                <div className="p-4">
                  <h4 className="font-medium mb-2 text-white">解約はいつでもできますか？</h4>
                  <p className="text-slate-400 text-sm">
                    はい、いつでも解約できます。解約後も、現在の請求期間が終了するまでサービスをご利用いただけます。
                  </p>
                </div>
              </MagicCard>
              <MagicCard gradientColor="#f59e0b" gradientOpacity={0.05}>
                <div className="p-4">
                  <h4 className="font-medium mb-2 text-white">支払い方法は変更できますか？</h4>
                  <p className="text-slate-400 text-sm">
                    「支払い方法・解約の管理」ボタンから、クレジットカード情報を更新できます。
                  </p>
                </div>
              </MagicCard>
              <MagicCard gradientColor="#f59e0b" gradientOpacity={0.05}>
                <div className="p-4">
                  <h4 className="font-medium mb-2 text-white">返金は受けられますか？</h4>
                  <p className="text-slate-400 text-sm">
                    原則として返金には対応しておりません。詳しくは利用規約をご確認ください。
                  </p>
                </div>
              </MagicCard>
            </div>
          </div>
        </BlurFade>
      </main>
    </div>
  );
}
