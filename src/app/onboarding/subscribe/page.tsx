'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, CreditCard, ArrowRight, Sparkles } from 'lucide-react';
import {
  ShimmerButton,
  MagicCard,
  AnimatedGradientText,
  BlurFade,
  Particles,
  BorderBeam,
} from '@/components/ui/magicui';

const features = [
  '参加回数無制限',
  '性格診断によるマッチング',
  '厳選されたお店をセレクト',
  '安心の会員制コミュニティ',
  'いつでも解約可能',
];

export default function SubscribePage() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const { url, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('エラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 relative overflow-hidden">
      <Particles className="absolute inset-0" quantity={25} color="#FF6B6B" staticity={40} />

      <div className="max-w-md mx-auto relative">
        <BlurFade>
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4 text-[#FF6B6B]" />
              <span className="text-sm font-medium text-orange-400">
                最後のステップ
              </span>
            </motion.div>

            <h1 className="text-2xl font-bold mb-2">
              <AnimatedGradientText>メンバー登録</AnimatedGradientText>
            </h1>
            <p className="text-slate-400">
              サブスクリプションを開始して、
              <br />
              dine tokyo の体験を始めましょう
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.1}>
          <div className="relative">
            <MagicCard gradientColor="#FF6B6B" gradientOpacity={0.2}>
              <BorderBeam size={250} duration={12} />
              <div className="p-8">
                <div className="text-center mb-8">
                  <motion.div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.3 }}
                  >
                    <CreditCard className="w-8 h-8 text-white" />
                  </motion.div>

                  <motion.div
                    className="text-5xl font-bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <AnimatedGradientText>¥1,980</AnimatedGradientText>
                    <span className="text-base font-normal text-slate-400">
                      /月
                    </span>
                  </motion.div>
                  <p className="text-sm text-slate-500 mt-1">税込</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {features.map((feature, index) => (
                    <motion.li
                      key={index}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <motion.div
                        className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 text-white flex items-center justify-center flex-shrink-0"
                        whileHover={{ scale: 1.1 }}
                      >
                        <Check className="w-4 h-4" />
                      </motion.div>
                      <span className="text-sm font-medium text-white">{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                <ShimmerButton
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full text-lg py-4"
                >
                  {loading ? (
                    <motion.span
                      className="flex items-center gap-2"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      処理中...
                    </motion.span>
                  ) : (
                    <>
                      サブスクリプションを開始
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </ShimmerButton>

                <p className="text-xs text-center text-slate-500 mt-4">
                  続行することで、
                  <a href="/terms" className="underline hover:text-[#FF6B6B] transition-colors">利用規約</a>
                  および
                  <a href="/privacy" className="underline hover:text-[#FF6B6B] transition-colors">プライバシーポリシー</a>
                  に同意したものとみなされます。
                </p>
              </div>
            </MagicCard>
          </div>
        </BlurFade>

        <BlurFade delay={0.3}>
          <p className="text-sm text-center text-slate-500 mt-6">
            お食事代は当日、現地でお支払いください。
          </p>
        </BlurFade>
      </div>
    </div>
  );
}
