'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDate, formatTime, getAreaLabel, isReviewAccessible, isToday, isWithin48Hours, isWithinEventWindow } from '@/lib/utils';
import { Calendar, MapPin, LogOut, Star, ArrowRight, Settings, User as UserIcon, X, Ticket, Clock, Copy, Check, Users, Sparkles, UserPlus } from 'lucide-react';
import { useState } from 'react';
import {
  ShimmerButton,
  GlassCard,
  AnimatedGradientText,
  BlurFade,
  Particles,
} from '@/components/ui/magicui';
import { AvatarCircles } from '@/components/ui/avatar-circles';
import type { User, Event, Participation, Match, AttendanceStatus } from '@/types/database';
import { CancelDialog, LateDialog } from '@/components/AttendanceDialogs';

interface PairPartner {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface DashboardClientProps {
  user: User;
  events: Event[];
  participations: (Participation & { events: Event })[];
  matches: (Match & { events: Event })[];
  participantsMap: Record<string, { display_name: string; avatar_url: string | null; job: string }>;
  guestsMap: Record<string, { display_name: string; gender: string }>;
  attendanceMap: Record<string, Record<string, { attendance_status: string; late_minutes: number | null }>>;
  pairPartnersMap: Record<string, PairPartner>;
}

export function DashboardClient({
  user,
  events,
  participations,
  matches,
  participantsMap,
  guestsMap,
  attendanceMap,
  pairPartnersMap,
}: DashboardClientProps) {
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [localParticipations, setLocalParticipations] = useState(participations);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [localAttendanceMap, setLocalAttendanceMap] = useState(attendanceMap);

  // Attendance dialog state
  const [cancelDialogMatch, setCancelDialogMatch] = useState<(Match & { events: Event }) | null>(null);
  const [lateDialogMatch, setLateDialogMatch] = useState<(Match & { events: Event }) | null>(null);

  const handleCopyInviteLink = async (inviteToken: string, participationId: string) => {
    const inviteUrl = `${window.location.origin}/invite/${inviteToken}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedId(participationId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert('リンクのコピーに失敗しました');
    }
  };

  const userParticipationEventIds = localParticipations.map((p) => p.event_id);

  // 今日のディナーとそれ以外を分離
  const todayDinner = matches.find((match) => isToday(match.events.event_date));
  const otherMatches = matches.filter((match) => !isToday(match.events.event_date));

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  // Get user's participation for a match
  const getUserParticipation = (match: Match & { events: Event }) => {
    return localParticipations.find(
      (p) => p.event_id === match.event_id && p.status === 'matched'
    );
  };

  // Check if within 24 hours
  const isWithin24Hours = (eventDate: string) => {
    const event = new Date(eventDate);
    const now = new Date();
    return event.getTime() - now.getTime() < 24 * 60 * 60 * 1000;
  };

  // Handle attendance cancel
  const handleAttendanceCancel = async () => {
    if (!cancelDialogMatch) return;
    const participation = getUserParticipation(cancelDialogMatch);
    if (!participation) return;

    const response = await fetch('/api/events/attendance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participation_id: participation.id,
        action: 'cancel',
      }),
    });

    if (response.ok) {
      // Update local attendance map
      setLocalAttendanceMap((prev) => ({
        ...prev,
        [cancelDialogMatch.event_id]: {
          ...prev[cancelDialogMatch.event_id],
          [user.id]: { attendance_status: 'canceled', late_minutes: null },
        },
      }));
    } else {
      const data = await response.json();
      alert(data.error || '処理に失敗しました');
    }
  };

  // Handle late notification
  const handleLateNotify = async (minutes: number) => {
    if (!lateDialogMatch) return;
    const participation = getUserParticipation(lateDialogMatch);
    if (!participation) return;

    const response = await fetch('/api/events/attendance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participation_id: participation.id,
        action: 'late',
        late_minutes: minutes,
      }),
    });

    if (response.ok) {
      // Update local attendance map
      setLocalAttendanceMap((prev) => ({
        ...prev,
        [lateDialogMatch.event_id]: {
          ...prev[lateDialogMatch.event_id],
          [user.id]: { attendance_status: 'late', late_minutes: minutes },
        },
      }));
    } else {
      const data = await response.json();
      alert(data.error || '処理に失敗しました');
    }
  };

  // Check if user has already canceled or is late
  const getUserAttendanceStatus = (match: Match & { events: Event }) => {
    return localAttendanceMap[match.event_id]?.[user.id]?.attendance_status || 'attending';
  };

  // Get late members (excluding current user) for a match
  const getLateMembers = (match: Match & { events: Event }) => {
    return match.table_members
      .filter((memberId) => memberId !== user.id && !memberId.startsWith('guest:'))
      .filter((memberId) => localAttendanceMap[match.event_id]?.[memberId]?.attendance_status === 'late')
      .map((memberId) => ({
        id: memberId,
        displayName: participantsMap[memberId]?.display_name || '参加者',
        avatarUrl: participantsMap[memberId]?.avatar_url,
        lateMinutes: localAttendanceMap[match.event_id]?.[memberId]?.late_minutes,
      }));
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
            Dine Tokyo<span className="text-sm">(ダイントーキョー)</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/connections">
              <motion.div
                className="p-2 text-slate-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="出会った人たち"
              >
                <Users className="w-5 h-5" />
              </motion.div>
            </Link>
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
        {/* Today's Dinner - Hero Section */}
        {todayDinner && (
          <BlurFade>
            <section className="mb-10">
              <motion.div
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-slate-900 border border-amber-500/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Animated background glow */}
                <div className="absolute inset-0 overflow-hidden">
                  <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-amber-500/30 to-transparent rounded-full blur-3xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                </div>

                <div className="relative p-8">
                  {/* Badge */}
                  <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/40 mb-6"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-400 text-sm font-semibold tracking-wider">本日開催</span>
                  </motion.div>

                  {/* Restaurant name - Large */}
                  <h2 className="font-serif text-3xl md:text-4xl text-white mb-6">
                    {todayDinner.restaurant_name}
                  </h2>

                  {/* Event details */}
                  <div className="flex flex-wrap items-center gap-6 mb-8">
                    <div className="flex items-center gap-2 text-white">
                      <Calendar className="w-5 h-5 text-amber-400" />
                      <span className="text-lg">{formatDate(todayDinner.events.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <Clock className="w-5 h-5 text-amber-400" />
                      <span className="text-lg">{formatTime(todayDinner.events.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <MapPin className="w-5 h-5 text-amber-400" />
                      <span className="text-lg">{getAreaLabel(todayDinner.events.area)}</span>
                    </div>
                  </div>

                  {/* Late members banner */}
                  {getLateMembers(todayDinner).length > 0 && (
                    <motion.div
                      className="mb-6 p-4 rounded-xl bg-amber-500/20 border border-amber-500/40"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-amber-500/30">
                          <Clock className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-amber-400 font-medium mb-1">遅刻のお知らせ</p>
                          <div className="space-y-1">
                            {getLateMembers(todayDinner).map((member) => (
                              <div key={member.id} className="flex items-center gap-2 text-sm text-white/90">
                                {member.avatarUrl && (
                                  <img
                                    src={member.avatarUrl}
                                    alt={member.displayName}
                                    className="w-5 h-5 rounded-full object-cover"
                                  />
                                )}
                                <span>
                                  <span className="font-medium">{member.displayName}</span>さんが約
                                  <span className="font-medium text-amber-400">{member.lateMinutes}分</span>
                                  遅れます
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Participants */}
                  <div className="flex items-center gap-4 mb-8">
                    <AvatarCircles
                      avatarUrls={todayDinner.table_members
                        .filter((id) => id !== user.id)
                        .map((memberId) => {
                          const isGuest = memberId.startsWith('guest:');
                          if (isGuest) {
                            const guest = guestsMap[memberId];
                            return {
                              imageUrl: '/default-avatar.png',
                              job: guest?.display_name || 'ゲスト',
                              attendanceStatus: 'attending' as AttendanceStatus,
                              lateMinutes: undefined,
                            };
                          }
                          return {
                            imageUrl: participantsMap[memberId]?.avatar_url || '/default-avatar.png',
                            job: participantsMap[memberId]?.job || '',
                            attendanceStatus: (localAttendanceMap[todayDinner.event_id]?.[memberId]?.attendance_status || 'attending') as AttendanceStatus,
                            lateMinutes: localAttendanceMap[todayDinner.event_id]?.[memberId]?.late_minutes ?? undefined,
                          };
                        })}
                      showJob
                      noOverlap
                      className="scale-110"
                    />
                    <span className="text-slate-300">
                      他{todayDinner.table_members.filter((id) => id !== user.id).length}人と食事
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-4">
                    {todayDinner.restaurant_url && (
                      <motion.a
                        href={todayDinner.restaurant_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <MapPin className="w-4 h-4" />
                        お店を見る
                        <ArrowRight className="w-4 h-4" />
                      </motion.a>
                    )}
                    {isWithinEventWindow(todayDinner.events.event_date, 3) && (
                      <Link href={`/events/${todayDinner.event_id}/icebreaker`}>
                        <motion.button
                          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 hover:from-amber-400 hover:to-orange-400 transition-colors shadow-lg shadow-amber-500/25"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Sparkles className="w-4 h-4" />
                          ゲームを始める
                        </motion.button>
                      </Link>
                    )}
                    {isReviewAccessible(todayDinner.events.event_date) && (
                      <Link href={`/reviews/${todayDinner.id}`}>
                        <motion.button
                          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-amber-400 border border-amber-500/40 hover:bg-amber-500/10 transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Star className="w-4 h-4" />
                          レビューを書く
                        </motion.button>
                      </Link>
                    )}

                    {/* Attendance buttons - only show if not already canceled */}
                    {getUserAttendanceStatus(todayDinner) === 'attending' && (
                      <>
                        <motion.button
                          onClick={() => setLateDialogMatch(todayDinner)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Clock className="w-4 h-4" />
                          遅刻連絡
                        </motion.button>
                        <motion.button
                          onClick={() => setCancelDialogMatch(todayDinner)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <X className="w-4 h-4" />
                          キャンセル
                        </motion.button>
                      </>
                    )}
                    {getUserAttendanceStatus(todayDinner) === 'late' && (
                      <motion.button
                        onClick={() => setLateDialogMatch(todayDinner)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Clock className="w-4 h-4" />
                        遅刻連絡済み ({localAttendanceMap[todayDinner.event_id]?.[user.id]?.late_minutes}分)
                      </motion.button>
                    )}
                    {getUserAttendanceStatus(todayDinner) === 'canceled' && (
                      <span className="flex items-center gap-2 px-4 py-2 text-sm text-red-400">
                        <X className="w-4 h-4" />
                        キャンセル済み
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </section>
          </BlurFade>
        )}

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

        {/* Confirmed matches - Premium Ticket Style (excluding today's dinner) */}
        {otherMatches.length > 0 && (
          <section className="mb-8">
            <BlurFade>
              <div className="flex items-center gap-2 mb-4">
                <Ticket className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-white">確定したディナー</h2>
              </div>
            </BlurFade>
            <div className="space-y-4">
              {otherMatches.map((match, index) => (
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

                      {/* Late members banner */}
                      {getLateMembers(match).length > 0 && (
                        <motion.div
                          className="mb-4 p-3 rounded-lg bg-amber-500/15 border border-amber-500/30"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                              {getLateMembers(match).map((member) => (
                                <span key={member.id} className="flex items-center gap-1 text-amber-300">
                                  {member.avatarUrl && (
                                    <img
                                      src={member.avatarUrl}
                                      alt={member.displayName}
                                      className="w-4 h-4 rounded-full object-cover"
                                    />
                                  )}
                                  <span>{member.displayName}さん 約{member.lateMinutes}分遅れ</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Bottom section - participants */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AvatarCircles
                            avatarUrls={match.table_members
                              .filter((id) => id !== user.id)
                              .map((memberId) => {
                                const isGuest = memberId.startsWith('guest:');
                                if (isGuest) {
                                  const guest = guestsMap[memberId];
                                  return {
                                    imageUrl: '/default-avatar.png',
                                    job: guest?.display_name || 'ゲスト',
                                    attendanceStatus: 'attending' as AttendanceStatus,
                                    lateMinutes: undefined,
                                  };
                                }
                                return {
                                  imageUrl: participantsMap[memberId]?.avatar_url || '/default-avatar.png',
                                  job: participantsMap[memberId]?.job || '',
                                  attendanceStatus: (localAttendanceMap[match.event_id]?.[memberId]?.attendance_status || 'attending') as AttendanceStatus,
                                  lateMinutes: localAttendanceMap[match.event_id]?.[memberId]?.late_minutes ?? undefined,
                                };
                              })}
                            showJob
                            noOverlap
                          />
                          <span className="text-sm text-slate-400">
                            他{match.table_members.filter((id) => id !== user.id).length}人と食事
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isWithinEventWindow(match.events.event_date, 3) && (
                            <Link href={`/events/${match.event_id}/icebreaker`}>
                              <motion.button
                                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 hover:from-amber-400 hover:to-orange-400 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Sparkles className="w-4 h-4" />
                                Ice Breaker
                              </motion.button>
                            </Link>
                          )}
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

                          {/* Attendance buttons */}
                          {getUserAttendanceStatus(match) === 'attending' && (
                            <>
                              <motion.button
                                onClick={() => setLateDialogMatch(match)}
                                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title="遅刻連絡"
                              >
                                <Clock className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                onClick={() => setCancelDialogMatch(match)}
                                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title="キャンセル"
                              >
                                <X className="w-4 h-4" />
                              </motion.button>
                            </>
                          )}
                          {getUserAttendanceStatus(match) === 'late' && (
                            <motion.button
                              onClick={() => setLateDialogMatch(match)}
                              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              title="遅刻時間を変更"
                            >
                              <Clock className="w-3 h-3" />
                              {localAttendanceMap[match.event_id]?.[user.id]?.late_minutes}分遅れ
                            </motion.button>
                          )}
                          {getUserAttendanceStatus(match) === 'canceled' && (
                            <span className="flex items-center gap-1 px-3 py-2 text-xs text-red-400">
                              <X className="w-3 h-3" />
                              キャンセル済
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </BlurFade>
              ))}
            </div>
          </section>
        )}

        {/* Accept invite button */}
        <section className="mb-8">
          <BlurFade>
            <Link href="/invite/enter">
              <GlassCard className="hover:border-amber-500/30 transition-colors cursor-pointer">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">友達からの招待を受ける</p>
                      <p className="text-sm text-slate-400">招待コードを入力して参加</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              </GlassCard>
            </Link>
          </BlurFade>
        </section>

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
                  const isPair = participation.entry_type === 'pair';
                  const pairPartner = isPair ? pairPartnersMap[participation.group_id] : null;
                  const isCopied = copiedId === participation.id;

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
                                {isPair ? 'ペアで参加' : 'ソロで参加'}
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

                          {/* Pair participation section */}
                          {isPair && (
                            <div className="mt-4 pt-4 border-t border-slate-700/50">
                              {pairPartner ? (
                                // Partner has joined
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-emerald-500" />
                                    <span className="text-sm text-emerald-400">ペア確定</span>
                                  </div>
                                  <div className="flex items-center gap-2 ml-2">
                                    <img
                                      src={pairPartner.avatar_url || '/default-avatar.png'}
                                      alt={pairPartner.display_name}
                                      className="w-6 h-6 rounded-full object-cover"
                                    />
                                    <span className="text-sm text-slate-300">
                                      {pairPartner.display_name}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                // Waiting for partner - show invite link and short code
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-400">
                                      <Users className="w-4 h-4" />
                                      <span className="text-sm">ペア待ち</span>
                                    </div>
                                    <motion.button
                                      onClick={() => handleCopyInviteLink(participation.invite_token, participation.id)}
                                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isCopied
                                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20'
                                        }`}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      {isCopied ? (
                                        <>
                                          <Check className="w-4 h-4" />
                                          コピーしました
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-4 h-4" />
                                          招待リンクをコピー
                                        </>
                                      )}
                                    </motion.button>
                                  </div>
                                  {participation.short_code && (
                                    <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
                                      <span>招待コード:</span>
                                      <code className="bg-white/5 px-2 py-1 rounded font-mono text-slate-300">
                                        {participation.short_code}
                                      </code>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
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

      {/* Attendance Dialogs */}
      <CancelDialog
        isOpen={!!cancelDialogMatch}
        onClose={() => setCancelDialogMatch(null)}
        onConfirm={handleAttendanceCancel}
        isWithin24Hours={cancelDialogMatch ? isWithin24Hours(cancelDialogMatch.events.event_date) : false}
      />
      <LateDialog
        isOpen={!!lateDialogMatch}
        onClose={() => setLateDialogMatch(null)}
        onConfirm={handleLateNotify}
        initialMinutes={lateDialogMatch ? localAttendanceMap[lateDialogMatch.event_id]?.[user.id]?.late_minutes : null}
      />
    </div>
  );
}
