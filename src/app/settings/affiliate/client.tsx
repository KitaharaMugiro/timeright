'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Tag, Check, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  MagicCard,
  AnimatedGradientText,
  BlurFade,
  Particles,
} from '@/components/ui/magicui';

interface AppliedCode {
  code: string;
  name: string;
  appliedAt: string;
}

interface AffiliateClientProps {
  appliedCodes: AppliedCode[];
}

function AffiliateContent({ appliedCodes }: AffiliateClientProps) {
  const searchParams = useSearchParams();
  const prefilledCode = searchParams.get('code') || '';

  const [inputValue, setInputValue] = useState(prefilledCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = inputValue.trim().toUpperCase();

    if (!code) {
      setError('コードを入力してください');
      return;
    }

    // Cross-detection: 6-char code might be an event invite code
    if (/^[A-Za-z0-9]{6}$/.test(code)) {
      setError('6文字のコードはイベント招待コードの可能性があります。');
      return;
    }

    if (!/^[A-Za-z0-9]{8}$/.test(code)) {
      setError('アフィリエイトコードは8文字の英数字です');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/affiliate/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'コードの適用に失敗しました');
      }

      setSuccess(`コード「${data.codeName}」を適用しました`);
      setInputValue('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'コードの適用に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      <Particles className="absolute inset-0 pointer-events-none" quantity={15} color="#f59e0b" staticity={60} />

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
            <AnimatedGradientText>アフィリエイトコード</AnimatedGradientText>
          </h1>
          <div className="w-16" />
        </div>
      </motion.header>

      <main className="max-w-2xl mx-auto px-4 py-8 relative">
        <BlurFade>
          <div className="mb-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Tag className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">アフィリエイトコード入力</h2>
            <p className="text-slate-400 text-sm">
              お持ちのアフィリエイトコード（8文字）を入力してください
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.1}>
          <MagicCard gradientColor="#f59e0b" gradientOpacity={0.1}>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="例: ABCD2345"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setError(null);
                    setSuccess(null);
                  }}
                  maxLength={8}
                  className="bg-white/5 border-white/20 text-white placeholder:text-slate-500 text-center text-lg tracking-widest uppercase"
                  disabled={loading}
                />

                {error && (
                  <div className="space-y-2">
                    <p className="text-red-400 text-sm">{error}</p>
                    {error.includes('イベント招待コード') && (
                      <Link
                        href={`/invite/enter`}
                        className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 text-sm underline"
                      >
                        <Info className="w-3 h-3" />
                        イベント招待コードの入力はこちら
                      </Link>
                    )}
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <Check className="w-4 h-4" />
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      確認中...
                    </>
                  ) : (
                    'コードを適用'
                  )}
                </Button>
              </form>
            </CardContent>
          </MagicCard>
        </BlurFade>

        {/* Applied codes history */}
        {appliedCodes.length > 0 && (
          <BlurFade delay={0.2}>
            <div className="mt-8">
              <h3 className="text-sm font-medium text-slate-400 mb-3 px-1">
                適用済みコード
              </h3>
              <MagicCard gradientColor="#f59e0b" gradientOpacity={0.1}>
                <div className="divide-y divide-slate-700">
                  {appliedCodes.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-mono text-white tracking-wider">{item.code}</p>
                        <p className="text-sm text-slate-400">{item.name}</p>
                      </div>
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <Check className="w-4 h-4" />
                        適用済み
                      </div>
                    </div>
                  ))}
                </div>
              </MagicCard>
            </div>
          </BlurFade>
        )}
      </main>
    </div>
  );
}

export function AffiliateClient({ appliedCodes }: AffiliateClientProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    }>
      <AffiliateContent appliedCodes={appliedCodes} />
    </Suspense>
  );
}
