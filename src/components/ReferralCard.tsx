'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Check, Share2 } from 'lucide-react';
import { MagicCard, BlurFade } from '@/components/ui/magicui';

export function ReferralCard() {
  const [referralUrl, setReferralUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferralLink = async () => {
      try {
        const response = await fetch('/api/referral/link');
        if (response.ok) {
          const data = await response.json();
          setReferralUrl(data.referralUrl);
        }
      } catch (error) {
        console.error('Failed to fetch referral link:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralLink();
  }, []);

  const handleCopy = async () => {
    if (!referralUrl) return;

    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    if (!referralUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'unplannedに招待',
          text: '友達紹介で初月無料！一緒にディナーを楽しもう',
          url: referralUrl,
        });
      } catch (error) {
        // User cancelled or share failed
        console.error('Share failed:', error);
      }
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return (
      <BlurFade>
        <MagicCard gradientColor="#FF6B6B" gradientOpacity={0.1}>
          <div className="p-6 animate-pulse">
            <div className="h-6 bg-neutral-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
          </div>
        </MagicCard>
      </BlurFade>
    );
  }

  if (!referralUrl) {
    return null;
  }

  return (
    <BlurFade>
      <MagicCard
        className="border-[#FF6B6B]/20 bg-gradient-to-br from-pink-50 to-orange-50"
        gradientColor="#FF6B6B"
        gradientOpacity={0.15}
      >
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-5 h-5 text-[#FF6B6B]" />
            <h3 className="font-semibold text-lg">友達を招待</h3>
          </div>

          <p className="text-sm text-neutral-600 mb-4">
            友達に紹介リンクを共有すると、友達の初月が無料になります
          </p>

          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-neutral-200">
            <input
              type="text"
              value={referralUrl}
              readOnly
              className="flex-1 text-sm text-neutral-600 bg-transparent outline-none truncate"
            />
            <motion.button
              onClick={handleCopy}
              className="p-2 text-neutral-500 hover:text-[#FF6B6B] transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="コピー"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </motion.button>
          </div>

          <motion.button
            onClick={handleShare}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Share2 className="w-4 h-4" />
            友達に共有する
          </motion.button>
        </div>
      </MagicCard>
    </BlurFade>
  );
}
