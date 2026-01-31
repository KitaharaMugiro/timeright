'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Upload, Clock, Users, MessageCircle, ArrowRight, CheckCircle } from 'lucide-react';
import {
  GlassCard,
  AnimatedGradientText,
  BlurFade,
  Particles,
  ShimmerButton,
} from '@/components/ui/magicui';

export function VerificationClient() {
  const handleLineOA = () => {
    window.location.href = process.env.NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_URL || 'https://lin.ee/5uOPktg';
  };

  const steps = [
    {
      icon: MessageCircle,
      title: '公式LINEを開く',
      description: '下のボタンから公式LINEにアクセスしてください。',
    },
    {
      icon: Upload,
      title: '身分証をアップロード',
      description: '運転免許証やマイナンバーカードなどの身分証明書の写真を送信してください。',
    },
    {
      icon: Clock,
      title: '運営が確認',
      description: '運営チームが確認します。通常2〜3日で完了します。',
    },
    {
      icon: CheckCircle,
      title: 'バッジ付与',
      description: '確認完了後、本人確認済みバッジがプロフィールに表示されます。',
    },
  ];

  const benefits = [
    {
      icon: Users,
      title: '信頼できるマッチング',
      description: '本人確認済みユーザー同士でマッチングされやすくなります。',
    },
    {
      icon: Shield,
      title: '安心・安全',
      description: '身元が確認されたメンバーとして、より安心して参加できます。',
    },
  ];

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
          <Link href="/profile" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>戻る</span>
          </Link>
          <h1 className="text-lg font-semibold">
            <AnimatedGradientText>本人確認</AnimatedGradientText>
          </h1>
          <div className="w-16" />
        </div>
      </motion.header>

      <main className="max-w-2xl mx-auto px-4 py-8 relative">
        {/* Hero Section */}
        <BlurFade>
          <div className="text-center mb-8">
            <motion.div
              className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-amber-500/20 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <Shield className="w-10 h-10 text-amber-500" />
            </motion.div>
            <h2 className="text-2xl font-serif text-white mb-2">本人確認をしましょう</h2>
            <p className="text-slate-400">
              本人確認を完了して、より安心・安全なマッチング体験を
            </p>
          </div>
        </BlurFade>

        {/* Benefits */}
        <BlurFade delay={0.1}>
          <GlassCard className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-amber-500">✨</span>
              本人確認のメリット
            </h3>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{benefit.title}</p>
                    <p className="text-sm text-slate-400">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </BlurFade>

        {/* Steps */}
        <BlurFade delay={0.2}>
          <GlassCard className="p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-amber-500">📋</span>
              本人確認の流れ
            </h3>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <step.icon className="w-5 h-5 text-amber-500" />
                    </div>
                    {index < steps.length - 1 && (
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-slate-700" />
                    )}
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-amber-500/80 font-medium">STEP {index + 1}</span>
                    </div>
                    <p className="font-medium text-white">{step.title}</p>
                    <p className="text-sm text-slate-400">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </BlurFade>

        {/* CTA */}
        <BlurFade delay={0.4}>
          <div className="text-center">
            <ShimmerButton onClick={handleLineOA} variant="accent" className="text-lg px-8 py-4">
              公式LINEで本人確認を始める
              <ArrowRight className="w-5 h-5 ml-2" />
            </ShimmerButton>
            <p className="mt-4 text-sm text-slate-500">
              身分証明書の情報は本人確認のみに使用され、安全に管理されます
            </p>
          </div>
        </BlurFade>
      </main>
    </div>
  );
}
