'use client';

import { useEffect, useState } from 'react';
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
  GlassCard,
  AnimatedGradientText,
  Particles,
  BlurFade,
  Marquee,
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
    answer: 'イベント後の相互評価システムにより、マナーの良いコミュニティを維持しています。',
  },
  {
    question: '1人で参加しても大丈夫？',
    answer: 'もちろんです！約半数の方が1人で参加されています。性格診断をもとに相性の良いメンバーとマッチングするので、初対面でも自然と会話が弾みます。',
  },
  {
    question: 'どんな人が参加していますか？',
    answer: '20代〜30代を中心に、様々な職業の方が参加しています。「新しい出会いを楽しみたい」という共通点を持った、オープンマインドな方々です。',
  },
  {
    question: 'Dine Tokyoへの問い合わせ方法を教えてください',
    answer: '公式LINEからお問い合わせいただけます。',
  },
];

const features = [
  {
    icon: Shield,
    title: '安心の会員制',
    description: 'LINE連携・相互評価システムで、安心して参加できます。',
  },
  {
    icon: CreditCard,
    title: 'シンプルな料金',
    description: '定額サブスクリプションで参加し放題。食事代は当日割り勘のみ。',
  },
  {
    icon: Clock,
    title: '手間いらず',
    description: '日程とエリアを選ぶだけ。お店選びもマッチングもお任せ。',
  },
];

const testimonials = [
  {
    name: 'ゆうこ',
    age: 28,
    body: '1人で参加するのは緊張したけど、同じ趣味の人と出会えて本当に楽しかった！今では月1で参加してます。',
  },
  {
    name: 'けんた',
    age: 32,
    body: '仕事以外で新しい人と出会う機会がなかったので、すごく新鮮でした。マッチングの精度が高くて驚き。',
  },
  {
    name: 'あやか',
    age: 26,
    body: '友達と2人で参加しました。初対面の人とも自然に話せる雰囲気で、また参加したいです！',
  },
  {
    name: 'たくや',
    age: 30,
    body: 'お店選びも任せられるのがラク。仕事終わりにふらっと参加できるのが気に入ってます。',
  },
  {
    name: 'みさき',
    age: 29,
    body: '性格診断で相性の良い人と同じグループになれるので、会話が弾みやすい！毎回新しい発見があります。',
  },
  {
    name: 'しょうた',
    age: 34,
    body: '料金がシンプルでわかりやすいのがいい。変な勧誘もないし、純粋に楽しめる場所です。',
  },
];

export default function LandingPage() {
  const [nextEvent, setNextEvent] = useState<{ area: string; date: string } | null>(null);

  useEffect(() => {
    const fetchNextEvent = async () => {
      try {
        const res = await fetch('/api/next-event');
        const { nextEvent } = await res.json();
        if (nextEvent) {
          setNextEvent(nextEvent);
        }
      } catch {
        // Ignore fetch errors
      }
    };
    fetchNextEvent();
  }, []);

  const handleLineOA = () => {
    window.location.href = process.env.NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_URL || 'https://lin.ee/5uOPktg';
  };

  return (
    <div className="min-h-screen bg-slate-900 overflow-hidden">
      {/* Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 glass"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight text-white">
            Dine Tokyo<span className="text-sm">(ダイントーキョー)</span>
          </Link>
          <motion.button
            onClick={handleLineOA}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            LINE公式
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.header>

      {/* Hero Section - Cinematic */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-900" />

        {/* Subtle ambient light effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px]" />

        <Particles
          className="absolute inset-0"
          quantity={40}
          color="#f59e0b"
          staticity={50}
        />

        <div className="relative max-w-3xl mx-auto text-center pt-20">
          <BlurFade delay={0.1}>
            {nextEvent && (
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-sm font-medium text-slate-300">
                  次回開催: {nextEvent.area} {nextEvent.date}
                </span>
              </motion.div>
            )}
          </BlurFade>

          <BlurFade delay={0.2}>
            <p className="text-lg md:text-xl text-slate-300 mb-4">
              初対面の男女4-6人とディナーができるアプリ
            </p>
          </BlurFade>

          <BlurFade delay={0.3}>
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white leading-relaxed mb-6 overflow-visible">
              <AnimatedGradientText className="font-serif text-4xl md:text-6xl lg:text-7xl pb-4">
                Dine Tokyo
              </AnimatedGradientText>
            </h1>
          </BlurFade>

          <BlurFade delay={0.4}>
            <p className="font-serif text-xl md:text-2xl text-slate-300 mb-12">
              人生を動かすのは偶然の出会いだ
            </p>
          </BlurFade>

          <BlurFade delay={0.6}>
            <div className="flex flex-col items-center gap-4">
              <ShimmerButton onClick={handleLineOA} variant="accent" className="text-lg px-8 py-4">
                今すぐLINEではじめる
                <ArrowRight className="w-5 h-5 ml-2" />
              </ShimmerButton>
            </div>
          </BlurFade>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronDown className="w-6 h-6 text-slate-500" />
        </motion.div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <BlurFade>
            <h2 className="font-serif text-3xl md:text-4xl text-white text-center mb-4">
              たった<span className="text-amber-500 text-4xl md:text-5xl font-bold">4</span>ステップ
            </h2>
            <p className="text-slate-400 text-center mb-16 max-w-xl mx-auto">
              面倒な準備は一切不要。あなたは当日お店に行くだけ。
            </p>
          </BlurFade>

          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((step, index) => (
              <BlurFade key={index} delay={0.1 * index}>
                <GlassCard className="h-full">
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <motion.div
                        className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <step.icon className="w-5 h-5" />
                      </motion.div>
                      <div>
                        <div className="text-xs text-amber-500/80 font-medium tracking-wider mb-1">
                          STEP {index + 1}
                        </div>
                        <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                        <p className="text-sm text-slate-400">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <BlurFade>
            <p className="text-amber-500 font-medium tracking-widest text-sm text-center mb-4">
              WHY Dine Tokyo(ダイントーキョー)
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-white text-center mb-16">
              Dine Tokyo(ダイントーキョー) の特徴
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
                    className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4"
                    whileHover={{ scale: 1.1 }}
                  >
                    <feature.icon className="w-7 h-7" />
                  </motion.div>
                  <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400">
                    {feature.description}
                  </p>
                </motion.div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Founding Member */}
      <section className="py-24 px-4 bg-slate-900">
        <div className="max-w-2xl mx-auto">
          <BlurFade>
            <div className="text-center mb-8">
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <span className="text-sm font-medium text-amber-400">
                  🎉 最初の1,000名限定
                </span>
              </motion.div>
              <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
                あなたの席は、一生この価格で。
              </h2>
            </div>

            <GlassCard className="p-8 md:p-10">
              <div className="text-center mb-8">
                <div className="mb-6">
                  <span className="text-slate-400 line-through text-xl">通常価格: ¥3,980/月</span>
                </div>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <AnimatedGradientText className="text-5xl md:text-6xl font-bold">
                    ¥1,980
                  </AnimatedGradientText>
                  <span className="text-xl text-slate-400">/月</span>
                </div>
                <p className="text-amber-500 font-medium">創設メンバー価格（永久継続）</p>
              </div>

              <div className="border-t border-slate-700 pt-6">
                <p className="text-center text-slate-300">
                  <span className="text-amber-400 font-medium">1回あたりワンコイン（約500円）</span>
                  <br />
                  <span className="text-slate-400 text-sm mt-2 block">
                    週に一度の新しい出会いを、コーヒー1杯の価格で。
                  </span>
                </p>
              </div>

              <div className="mt-8 flex justify-center">
                <ShimmerButton onClick={handleLineOA} variant="accent" className="text-lg px-8 py-4">
                  今すぐLINEではじめる
                  <ArrowRight className="w-5 h-5 ml-2" />
                </ShimmerButton>
              </div>
            </GlassCard>
          </BlurFade>
        </div>
      </section>

      {/* Founder Story Section */}
      <section className="py-24 px-4 bg-slate-950">
        <div className="max-w-2xl mx-auto">
          <BlurFade>
            <GlassCard className="p-8 md:p-12">
              <p className="text-amber-500 font-medium tracking-widest text-sm mb-6">
                FOUNDER&apos;S NOTE
              </p>
              <div className="font-serif text-lg md:text-xl text-slate-300 leading-relaxed space-y-6">
                <p>
                  自宅と会社の往復をして、いつものお馴染みの友達と飲んでいませんか？
                </p>
                <p className="text-slate-400">
                  人生を動かすのは、日々の小さな積み重ねと、それを昇華させる「偶然の出会い」だと思っています。
                </p>
                <p className="text-slate-400">
                  このサービスは偶然の出会いを提供します。
                  恋愛目的ではなく、友達作り目的でもなく、純粋に「新しい人と出会う」楽しさを感じてください。
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-700">
                <p className="text-slate-500 text-sm">Founder, Dine Tokyo(ダイントーキョー)</p>
              </div>
            </GlassCard>
          </BlurFade>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <BlurFade>
            <p className="text-amber-500 font-medium tracking-widest text-sm text-center mb-4">
              VOICES
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-white text-center mb-4">
              メンバーの声
            </h2>
            <p className="text-slate-400 text-center mb-12">
              実際に参加した方々からの感想
            </p>
          </BlurFade>
        </div>

        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-950 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-950 to-transparent z-10" />

          <Marquee pauseOnHover className="[--duration:50s]">
            {testimonials.map((testimonial, index) => (
              <figure
                key={index}
                className="relative w-72 mx-4 glass-card rounded-2xl p-6"
              >
                <blockquote className="text-sm text-slate-300 leading-relaxed">
                  &ldquo;{testimonial.body}&rdquo;
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 text-xs font-medium">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{testimonial.name}</div>
                    <div className="text-xs text-slate-500">{testimonial.age}歳</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </Marquee>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 bg-slate-900">
        <div className="max-w-2xl mx-auto">
          <BlurFade>
            <p className="text-amber-500 font-medium tracking-widest text-sm text-center mb-4">
              FAQ
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-white text-center mb-12">
              よくある質問
            </h2>
          </BlurFade>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <BlurFade key={index} delay={0.1 * index}>
                <GlassCard>
                  <div className="p-6">
                    <h3 className="font-semibold text-white mb-2">{faq.question}</h3>
                    <p className="text-sm text-slate-400">{faq.answer}</p>
                  </div>
                </GlassCard>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 px-4 overflow-hidden bg-slate-950">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px]" />

        <Particles
          className="absolute inset-0"
          quantity={25}
          color="#f59e0b"
          staticity={50}
        />

        <div className="relative max-w-xl mx-auto text-center">
          <BlurFade>
            <h2 className="font-serif text-3xl md:text-5xl text-white mb-6">
              新しい出会いを、
              <br />
              <AnimatedGradientText className="font-serif text-3xl md:text-5xl">
                はじめよう
              </AnimatedGradientText>
            </h2>
          </BlurFade>

          <BlurFade delay={0.1}>
            <p className="text-slate-400 mb-10">
              今すぐ登録して、次回の開催に参加しませんか？
            </p>
          </BlurFade>

          <BlurFade delay={0.2}>
            <div className="flex justify-center">
              <ShimmerButton onClick={handleLineOA} variant="accent" className="text-lg px-8 py-4">
                今すぐLINEではじめる
                <ArrowRight className="w-5 h-5 ml-2" />
              </ShimmerButton>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-slate-800 bg-slate-950">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xl font-semibold text-white">
            Dine Tokyo<span className="text-sm">(ダイントーキョー)</span>
          </span>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              利用規約
            </Link>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              プライバシーポリシー
            </Link>
          </div>
          <div className="text-sm text-slate-600">
            © 2026 Dine Tokyo(ダイントーキョー)
          </div>
        </div>
      </footer>
    </div>
  );
}
