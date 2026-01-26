'use client';

import {
  Users,
  Calendar,
  UserPlus,
  MapPin,
  ChevronDown,
  Shield,
  CreditCard,
  Clock,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShimmerButton,
  MagicCard,
  AnimatedGradientText,
  Particles,
  BlurFade,
} from '@/components/ui/magicui';

const steps = [
  {
    icon: Users,
    title: '登録・性格診断',
    description: '簡単な質問に答えて、あなたのタイプを診断。相性の良いメンバーとマッチング。',
  },
  {
    icon: Calendar,
    title: '日程を選ぶ',
    description: '開催予定の日程から、参加したい日を選択。エリアも選べます。',
  },
  {
    icon: UserPlus,
    title: '友達を誘う or 1人で',
    description: '友達と一緒に参加も、1人での参加もOK。どちらでも楽しめます。',
  },
  {
    icon: MapPin,
    title: '当日、店に行くだけ',
    description: 'マッチング結果とお店の情報をお届け。あとは当日を楽しむだけ。',
  },
];

const faqs = [
  {
    question: '安全性は大丈夫ですか？',
    answer: '全員が本人確認済みの会員制サービスです。また、イベント後の相互評価システムにより、マナーの良いコミュニティを維持しています。',
  },
  {
    question: '料金はいくらですか？',
    answer: '月額1,980円のサブスクリプション制です。参加回数に制限はありません。お食事代は当日割り勘となります。',
  },
  {
    question: '1人で参加しても大丈夫？',
    answer: 'もちろんです！約半数の方が1人で参加されています。性格診断をもとに相性の良いメンバーとマッチングするので、初対面でも自然と会話が弾みます。',
  },
  {
    question: 'どんな人が参加していますか？',
    answer: '20代後半〜30代を中心に、様々な職業の方が参加しています。「新しい出会いを楽しみたい」という共通点を持った、オープンマインドな方々です。',
  },
];

const features = [
  {
    icon: Shield,
    title: '安心の会員制',
    description: '本人確認済み・相互評価システムで、安心して参加できます。',
  },
  {
    icon: CreditCard,
    title: 'シンプルな料金',
    description: '月額1,980円で参加し放題。食事代は当日割り勘のみ。',
  },
  {
    icon: Clock,
    title: '手間いらず',
    description: '日程とエリアを選ぶだけ。お店選びもマッチングもお任せ。',
  },
];

export default function LandingPage() {
  const handleLogin = async () => {
    window.location.href = '/api/auth/line';
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <AnimatedGradientText>unplanned</AnimatedGradientText>
          </Link>
          <motion.button
            onClick={handleLogin}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ログイン
          </motion.button>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <Particles
          className="absolute inset-0"
          quantity={30}
          color="#FF6B6B"
          staticity={30}
        />

        <div className="relative max-w-3xl mx-auto text-center">
          <BlurFade delay={0.1}>
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span className="text-sm font-medium text-orange-700">
                次回開催: 渋谷 2/8(土)
              </span>
            </motion.div>
          </BlurFade>

          <BlurFade delay={0.2}>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
              目的のない出会いを、
              <br />
              <AnimatedGradientText className="text-4xl md:text-6xl font-bold">
                友達と。
              </AnimatedGradientText>
            </h1>
          </BlurFade>

          <BlurFade delay={0.3}>
            <p className="text-lg md:text-xl text-neutral-600 mb-10 max-w-xl mx-auto">
              4〜6人のソーシャルディナーで、
              <br className="md:hidden" />
              新しい出会いを楽しむ。
            </p>
          </BlurFade>

          <BlurFade delay={0.4}>
            <div className="flex flex-col items-center gap-4">
              <ShimmerButton onClick={handleLogin} className="text-lg px-8 py-4">
                メンバーになる
                <ArrowRight className="w-5 h-5 ml-2" />
              </ShimmerButton>
              <p className="text-sm text-neutral-500">
                月額1,980円 ・ LINE でかんたん登録
              </p>
            </div>
          </BlurFade>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="flex justify-center pt-16"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronDown className="w-6 h-6 text-neutral-400" />
        </motion.div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-4xl mx-auto">
          <BlurFade>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
              How it works
            </h2>
            <p className="text-neutral-600 text-center mb-12">
              たった4ステップで、新しい出会いへ
            </p>
          </BlurFade>

          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((step, index) => (
              <BlurFade key={index} delay={0.1 * index}>
                <MagicCard className="h-full" gradientColor="#FF6B6B">
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <motion.div
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] text-white flex items-center justify-center flex-shrink-0"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <step.icon className="w-5 h-5" />
                      </motion.div>
                      <div>
                        <div className="text-sm text-neutral-500 mb-1">
                          Step {index + 1}
                        </div>
                        <h3 className="font-semibold mb-2">{step.title}</h3>
                        <p className="text-sm text-neutral-600">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </MagicCard>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <BlurFade>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              unplanned の特徴
            </h2>
          </BlurFade>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <BlurFade key={index} delay={0.1 * index}>
                <motion.div
                  className="text-center"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 text-[#FF6B6B] flex items-center justify-center mx-auto mb-4"
                    whileHover={{ scale: 1.1 }}
                  >
                    <feature.icon className="w-7 h-7" />
                  </motion.div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-neutral-600">
                    {feature.description}
                  </p>
                </motion.div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-neutral-50">
        <div className="max-w-2xl mx-auto">
          <BlurFade>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              よくある質問
            </h2>
          </BlurFade>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <BlurFade key={index} delay={0.1 * index}>
                <MagicCard gradientColor="#FF8E53" gradientOpacity={0.15}>
                  <div className="p-6">
                    <h3 className="font-semibold mb-2">{faq.question}</h3>
                    <p className="text-sm text-neutral-600">{faq.answer}</p>
                  </div>
                </MagicCard>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B6B]/5 via-transparent to-[#FF8E53]/5" />
        <Particles
          className="absolute inset-0"
          quantity={20}
          color="#FF8E53"
          staticity={50}
        />

        <div className="relative max-w-xl mx-auto text-center">
          <BlurFade>
            <h2 className="text-2xl md:text-4xl font-bold mb-6">
              新しい出会いを、
              <br />
              <AnimatedGradientText className="text-2xl md:text-4xl font-bold">
                はじめよう
              </AnimatedGradientText>
            </h2>
          </BlurFade>

          <BlurFade delay={0.1}>
            <p className="text-neutral-600 mb-8">
              今すぐ登録して、次回の開催に参加しませんか？
            </p>
          </BlurFade>

          <BlurFade delay={0.2}>
            <ShimmerButton onClick={handleLogin} className="text-lg px-8 py-4">
              メンバーになる
              <ArrowRight className="w-5 h-5 ml-2" />
            </ShimmerButton>
          </BlurFade>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-neutral-100 bg-white">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <AnimatedGradientText className="text-xl font-bold">
            unplanned
          </AnimatedGradientText>
          <div className="flex gap-6 text-sm text-neutral-600">
            <Link href="/terms" className="hover:text-neutral-900 transition-colors">
              利用規約
            </Link>
            <Link href="/privacy" className="hover:text-neutral-900 transition-colors">
              プライバシーポリシー
            </Link>
          </div>
          <div className="text-sm text-neutral-500">
            © 2024 unplanned
          </div>
        </div>
      </footer>
    </div>
  );
}
