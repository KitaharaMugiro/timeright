'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDate, formatTime, getAreaLabel, isReviewAccessible, isWithin48Hours } from '@/lib/utils';
import { Calendar, MapPin, LogOut, Star, ArrowRight, Settings, User as UserIcon, X, Ticket, Clock } from 'lucide-react';
import { useState } from 'react';
import {
  ShimmerButton,
  GlassCard,
  AnimatedGradientText,
  BlurFade,
  Particles,
} from '@/components/ui/magicui';
import { AvatarCircles } from '@/components/ui/avatar-circles';
import { ReferralCard } from '@/components/ReferralCard';
import type { User, Event, Participation, Match } from '@/types/database';

interface DashboardClientProps {
  user: User;
  events: Event[];
  participations: (Participation & { events: Event })[];
  matches: (Match & { events: Event })[];
  participantsMap: Record<string, { avatar_url: string | null; job: string }>;
}

export function DashboardClient({
  user,
  events,
  participations,
  matches,
  participantsMap,
}: DashboardClientProps) {
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [localParticipations, setLocalParticipations] = useState(participations);

  const userParticipationEventIds = localParticipations.map((p) => p.event_id);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  const handleCancel = async (participationId: string) => {
    if (!confirm('エントリーをキャンセルしますか？')) {
      return;
    }

    setCancelingId(participationId);
    try {
      const response = await fetch('/api/events/entry', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participation_id: participationId }),
      });

      if (response.ok) {
        setLocalParticipations((prev) =>
          prev.filter((p) => p.id !== participationId)
        );
      } else {
        const data = await response.json();
        alert(data.error || 'キャンセルに失敗しました');
      }
    } catch {
      alert('キャンセルに失敗しました');
    } finally {
      setCancelingId(null);
    }
  };

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
          <Link href="/dashboard" className="text-xl font-semibold text-white">
            unplanned
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/profile">
              <motion.div
                className="p-2 text-slate-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <UserIcon className="w-5 h-5" />
              </motion.div>
            </Link>
            <Link href="/settings">
              <motion.div
                className="p-2 text-slate-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Settings className="w-5 h-5" />
              </motion.div>
            </Link>
            <motion.button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-white transition-colors"
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
            <p className="text-amber-500 text-sm font-medium tracking-wider mb-2">WELCOME BACK</p>
            <h1 className="text-2xl font-serif text-white mb-2">
              こんにちは、
              <AnimatedGradientText className="font-serif">{user.display_name}</AnimatedGradientText>
              さん
            </h1>
            <p className="text-slate-400">
              今週末のディナーに参加しませんか？
            </p>
          </div>
        </BlurFade>

        {/* Referral section */}
        <section className="mb-8">
          <ReferralCard />
        </section>

        {/* Confirmed matches - Premium Ticket Style */}
        {matches.length > 0 && (
          <section className="mb-8">
            <BlurFade>
              <div className="flex items-center gap-2 mb-4">
                <Ticket className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-white">確定したディナー</h2>
              </div>
            </BlurFade>
            <div className="space-y-4">
              {matches.map((match, index) => (
                <BlurFade key={match.id} delay={index * 0.1}>
                  <div className="ticket">
                    <div className="p-6">
                      {/* Top section */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-amber-500 text-xs font-medium tracking-wider mb-1">
                            DINNER TICKET
                          </p>
                          <h3 className="font-serif text-xl text-white">
                            {match.restaurant_name}
                          </h3>
                        </div>
                        {match.restaurant_url && (
                          <motion.a
                            href={match.restaurant_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-amber-500 transition-colors"
                            whileHover={{ scale: 1.1 }}
                          >
                            <ArrowRight className="w-5 h-5" />
                          </motion.a>
                        )}
                      </div>

                      {/* Date and location */}
                      <div className="flex items-center gap-6 mb-4">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Calendar className="w-4 h-4 text-amber-500/70" />
                          <span className="text-sm">{formatDate(match.events.event_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <MapPin className="w-4 h-4 text-amber-500/70" />
                          <span className="text-sm">{getAreaLabel(match.events.area)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Clock className="w-4 h-4 text-amber-500/70" />
                          <span className="text-sm">{formatTime(match.events.event_date)}</span>
                        </div>
                      </div>

                      {/* Divider with ticket punch effect */}
                      <div className="ticket-divider my-4" />

                      {/* Bottom section - participants */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AvatarCircles
                            avatarUrls={match.table_members
                              .filter((id) => id !== user.id)
                              .map((memberId) => ({
                                imageUrl: participantsMap[memberId]?.avatar_url || '/default-avatar.png',
                                job: participantsMap[memberId]?.job || '',
                              }))}
                            showJob
                          />
                          <span className="text-sm text-slate-400">
                            他{match.table_members.length - 1}人と食事
                          </span>
                        </div>

                        {isReviewAccessible(match.events.event_date) && (
                          <Link href={`/reviews/${match.id}`} data-testid="review-link">
                            <motion.button
                              className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-amber-500 border border-amber-500/30 hover:bg-amber-500/10 transition-colors"
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
                  </div>
                </BlurFade>
              ))}
            </div>
          </section>
        )}

        {/* Pending participations */}
        {localParticipations.filter((p) => p.status === 'pending').length > 0 && (
          <section className="mb-8">
            <BlurFade>
              <h2 className="text-lg font-semibold text-white mb-4">エントリー中</h2>
            </BlurFade>
            <div className="space-y-4">
              {localParticipations
                .filter((p) => p.status === 'pending')
                .map((participation, index) => {
                  const canCancel = !isWithin48Hours(participation.events.event_date);
                  const isCanceling = cancelingId === participation.id;

                  return (
                    <BlurFade key={participation.id} delay={index * 0.1}>
                      <GlassCard>
                        <div className="p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-4 text-sm text-slate-300">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4 text-amber-500/70" />
                                  {formatDate(participation.events.event_date)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4 text-amber-500/70" />
                                  {getAreaLabel(participation.events.area)}
                                </span>
                              </div>
                              <p className="mt-2 text-sm font-medium text-slate-400">
                                {participation.entry_type === 'pair'
                                  ? 'ペアで参加'
                                  : 'ソロで参加'}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <motion.span
                                className="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500 font-medium"
                                animate={{ opacity: [1, 0.6, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                マッチング待ち
                              </motion.span>
                              {canCancel && (
                                <motion.button
                                  onClick={() => handleCancel(participation.id)}
                                  disabled={isCanceling}
                                  className="p-2 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  title="キャンセル"
                                >
                                  <X className="w-5 h-5" />
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    </BlurFade>
                  );
                })}
            </div>
          </section>
        )}

        {/* Upcoming events */}
        <section>
          <BlurFade>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-white">開催予定</h2>
            </div>
          </BlurFade>
          {events.length === 0 ? (
            <BlurFade>
              <GlassCard>
                <div className="p-10 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-500">現在、予定されている開催はありません</p>
                </div>
              </GlassCard>
            </BlurFade>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {events.map((event, index) => {
                const isEntered = userParticipationEventIds.includes(event.id);

                return (
                  <BlurFade key={event.id} delay={index * 0.1}>
                    <GlassCard className={isEntered ? 'border-emerald-500/20' : ''}>
                      <div className="p-5">
                        <div className="flex items-center gap-4 mb-3 text-sm text-slate-300">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-amber-500/70" />
                            {formatDate(event.event_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-amber-500/70" />
                            {getAreaLabel(event.area)}
                          </span>
                        </div>

                        <p className="text-sm text-slate-400 mb-4">
                          {formatTime(event.event_date)}〜
                        </p>

                        {isEntered ? (
                          <motion.button
                            className="w-full py-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-medium cursor-not-allowed border border-emerald-500/20"
                            disabled
                          >
                            エントリー済み
                          </motion.button>
                        ) : (
                          <Link href={`/events/${event.id}/entry`}>
                            <ShimmerButton variant="primary" className="w-full">
                              参加する
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </ShimmerButton>
                          </Link>
                        )}
                      </div>
                    </GlassCard>
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
