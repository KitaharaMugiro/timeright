'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDate, formatTime, getAreaLabel, isReviewAccessible } from '@/lib/utils';
import { Calendar, MapPin, Users, ExternalLink, LogOut, Star, ArrowRight, Sparkles, Settings, User as UserIcon } from 'lucide-react';
import {
  ShimmerButton,
  MagicCard,
  AnimatedGradientText,
  BlurFade,
  Particles,
} from '@/components/ui/magicui';
import { ReferralCard } from '@/components/ReferralCard';
import type { User, Event, Participation, Match } from '@/types/database';

interface DashboardClientProps {
  user: User;
  events: Event[];
  participations: (Participation & { events: Event })[];
  matches: (Match & { events: Event })[];
}

export function DashboardClient({
  user,
  events,
  participations,
  matches,
}: DashboardClientProps) {
  const userParticipationEventIds = participations.map((p) => p.event_id);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
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
          <Link href="/dashboard" className="text-xl font-bold">
            <AnimatedGradientText>unplanned</AnimatedGradientText>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/profile">
              <motion.div
                className="p-2 text-neutral-500 hover:text-neutral-700 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <UserIcon className="w-5 h-5" />
              </motion.div>
            </Link>
            <Link href="/settings">
              <motion.div
                className="p-2 text-neutral-500 hover:text-neutral-700 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Settings className="w-5 h-5" />
              </motion.div>
            </Link>
            <motion.button
              onClick={handleLogout}
              className="p-2 text-neutral-500 hover:text-neutral-700 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main className="max-w-4xl mx-auto px-4 py-8 relative">
        {/* User greeting */}
        <BlurFade>
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">
              こんにちは、
              <AnimatedGradientText>{user.display_name}</AnimatedGradientText>
              さん
            </h1>
            <p className="text-neutral-600">
              今週末のディナーに参加しませんか？
            </p>
          </div>
        </BlurFade>

        {/* Referral section */}
        <section className="mb-8">
          <ReferralCard />
        </section>

        {/* Confirmed matches */}
        {matches.length > 0 && (
          <section className="mb-8">
            <BlurFade>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FF6B6B]" />
                確定したディナー
              </h2>
            </BlurFade>
            <div className="space-y-4">
              {matches.map((match, index) => (
                <BlurFade key={match.id} delay={index * 0.1}>
                  <MagicCard
                    className="border-[#FF6B6B]/20 bg-gradient-to-br from-orange-50 to-red-50"
                    gradientColor="#FF6B6B"
                    gradientOpacity={0.2}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {match.restaurant_name}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-neutral-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(match.events.event_date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {getAreaLabel(match.events.area)}
                            </span>
                          </div>
                        </div>
                        {match.restaurant_url && (
                          <motion.a
                            href={match.restaurant_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neutral-600 hover:text-[#FF6B6B] transition-colors"
                            whileHover={{ scale: 1.1 }}
                          >
                            <ExternalLink className="w-5 h-5" />
                          </motion.a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Users className="w-4 h-4" />
                        <span>{match.table_members.length}人で食事</span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-[#FF6B6B]/20 flex items-center justify-between">
                        <p className="text-sm text-neutral-600">
                          当日は {formatTime(match.events.event_date)} にお店へお越しください
                        </p>
                        {isReviewAccessible(match.events.event_date) && (
                          <Link href={`/reviews/${match.id}`} data-testid="review-link">
                            <motion.button
                              className="flex items-center gap-1 px-4 py-2 bg-white rounded-full text-sm font-medium text-[#FF6B6B] border border-[#FF6B6B]/30 hover:bg-[#FF6B6B]/5 transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              data-testid="review-button"
                            >
                              <Star className="w-4 h-4" />
                              レビュー
                            </motion.button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </MagicCard>
                </BlurFade>
              ))}
            </div>
          </section>
        )}

        {/* Pending participations */}
        {participations.filter((p) => p.status === 'pending').length > 0 && (
          <section className="mb-8">
            <BlurFade>
              <h2 className="text-lg font-semibold mb-4">エントリー中</h2>
            </BlurFade>
            <div className="space-y-4">
              {participations
                .filter((p) => p.status === 'pending')
                .map((participation, index) => (
                  <BlurFade key={participation.id} delay={index * 0.1}>
                    <MagicCard gradientColor="#FF8E53" gradientOpacity={0.15}>
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-4 text-sm text-neutral-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(participation.events.event_date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {getAreaLabel(participation.events.area)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-medium">
                              {participation.entry_type === 'pair'
                                ? 'ペアで参加'
                                : 'ソロで参加'}
                            </p>
                          </div>
                          <motion.span
                            className="text-sm px-3 py-1 rounded-full bg-amber-100 text-amber-700"
                            animate={{ opacity: [1, 0.7, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            マッチング待ち
                          </motion.span>
                        </div>
                      </div>
                    </MagicCard>
                  </BlurFade>
                ))}
            </div>
          </section>
        )}

        {/* Upcoming events */}
        <section>
          <BlurFade>
            <h2 className="text-lg font-semibold mb-4">開催予定</h2>
          </BlurFade>
          {events.length === 0 ? (
            <BlurFade>
              <MagicCard gradientColor="#FF6B6B" gradientOpacity={0.1}>
                <div className="p-8 text-center text-neutral-600">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                  <p>現在、予定されている開催はありません</p>
                </div>
              </MagicCard>
            </BlurFade>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {events.map((event, index) => {
                const isEntered = userParticipationEventIds.includes(event.id);

                return (
                  <BlurFade key={event.id} delay={index * 0.1}>
                    <MagicCard gradientColor={isEntered ? '#10B981' : '#FF6B6B'}>
                      <div className="p-6">
                        <div className="flex items-center gap-4 mb-4 text-sm text-neutral-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(event.event_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {getAreaLabel(event.area)}
                          </span>
                        </div>

                        <p className="text-sm text-neutral-600 mb-4">
                          {formatTime(event.event_date)}〜
                        </p>

                        {isEntered ? (
                          <motion.button
                            className="w-full py-3 rounded-full bg-neutral-100 text-neutral-500 font-medium cursor-not-allowed"
                            disabled
                          >
                            エントリー済み
                          </motion.button>
                        ) : (
                          <Link href={`/events/${event.id}/entry`}>
                            <ShimmerButton className="w-full">
                              参加する
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </ShimmerButton>
                          </Link>
                        )}
                      </div>
                    </MagicCard>
                  </BlurFade>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
