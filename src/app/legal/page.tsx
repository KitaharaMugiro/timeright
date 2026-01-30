'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import {
  AnimatedGradientText,
  BlurFade,
  Particles,
} from '@/components/ui/magicui';

const sections = [
  {
    title: '販売業者',
    content: `Dine Tokyo(ダイントーキョー)`,
  },
  {
    title: '運営責任者',
    content: `請求があった場合、遅滞なく開示いたします。`,
  },
  {
    title: '所在地',
    content: `請求があった場合、遅滞なく開示いたします。`,
  },
  {
    title: '連絡先',
    content: `請求があった場合、遅滞なく開示いたします。
※お問い合わせはアプリ内のお問い合わせフォームよりご連絡ください。`,
  },
  {
    title: '販売価格',
    content: `各サービスの料金は、サービス申込画面に表示される価格となります。
表示価格は税込みです。`,
  },
  {
    title: '販売価格以外の必要料金',
    content: `・インターネット接続料金
・通信料金
※上記はお客様のご負担となります。`,
  },
  {
    title: '支払方法',
    content: `クレジットカード決済（Stripe）
・Visa
・Mastercard
・American Express
・JCB`,
  },
  {
    title: '支払時期',
    content: `サービス申込時に即時決済となります。`,
  },
  {
    title: 'サービス提供時期',
    content: `決済完了後、即時にサービスをご利用いただけます。`,
  },
  {
    title: 'キャンセル・返金について',
    content: `デジタルコンテンツの性質上、決済完了後の返金は原則としていたしかねます。`,
  },
  {
    title: '動作環境',
    content: `【推奨ブラウザ】
・Google Chrome（最新版）
・Safari（最新版）
・Microsoft Edge（最新版）
・Firefox（最新版）

【推奨OS】
・iOS 15以降
・Android 10以降
・Windows 10以降
・macOS 12以降`,
  },
];

export default function LegalPage() {
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
          <Link href="/settings" className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>戻る</span>
          </Link>
          <h1 className="text-lg font-semibold">
            <AnimatedGradientText>特定商取引法に基づく表記</AnimatedGradientText>
          </h1>
          <div className="w-16" />
        </div>
      </motion.header>

      <main className="max-w-3xl mx-auto px-4 py-8 relative">
        <BlurFade>
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">特定商取引法に基づく表記</h1>
            <p className="text-neutral-600">最終更新日: 2025年1月1日</p>
          </div>
        </BlurFade>

        <div className="space-y-6">
          {sections.map((section, index) => (
            <BlurFade key={index} delay={index * 0.03}>
              <section className="bg-white rounded-xl border border-neutral-200 p-6">
                <h2 className="text-lg font-semibold mb-3 text-neutral-900">{section.title}</h2>
                <p className="text-neutral-700 whitespace-pre-line leading-relaxed">
                  {section.content}
                </p>
              </section>
            </BlurFade>
          ))}
        </div>

        <BlurFade delay={0.4}>
          <div className="mt-8 text-center text-neutral-500 text-sm">
            <p>以上</p>
          </div>
        </BlurFade>
      </main>
    </div>
  );
}
