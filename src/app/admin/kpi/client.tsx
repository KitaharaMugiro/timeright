'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { TrendChart, DistributionChart, BarChartComponent } from '@/components/ui/chart';
import {
  ArrowLeft,
  Users,
  CreditCard,
  Calendar,
  Star,
  Share2,
  TrendingUp,
  UserCheck,
  UserX,
  Activity,
} from 'lucide-react';
import type { KPIData } from '@/types/kpi';

interface KPIDashboardClientProps {
  data: KPIData;
}

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ label, value, subValue, icon }: StatCardProps) {
  return (
    <Card className="glass-card border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-slate-400">{label}</div>
            <div className="text-2xl font-bold mt-1 text-white">{value}</div>
            {subValue && <div className="text-xs text-slate-500 mt-1">{subValue}</div>}
          </div>
          {icon && <div className="text-amber-500">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

export function KPIDashboardClient({ data }: KPIDashboardClientProps) {
  const { userMetrics, subscriptionMetrics, eventMetrics, participationMetrics, reviewMetrics, referralMetrics, dailySignups, dailyParticipations } = data;

  // Prepare chart data
  const subscriptionDistribution = [
    { name: 'Active', value: subscriptionMetrics.active_subscribers },
    { name: 'Canceled', value: subscriptionMetrics.canceled_subscribers },
    { name: 'Past Due', value: subscriptionMetrics.past_due_subscribers },
    { name: 'None', value: subscriptionMetrics.no_subscription },
  ].filter((item) => item.value > 0);

  const moodDistribution = [
    { name: 'Lively', value: participationMetrics.mood_lively },
    { name: 'Relaxed', value: participationMetrics.mood_relaxed },
    { name: 'Inspire', value: participationMetrics.mood_inspire },
    { name: 'Other', value: participationMetrics.mood_other },
  ].filter((item) => item.value > 0);

  const ratingDistribution = [
    { name: '1', value: reviewMetrics.rating_1 },
    { name: '2', value: reviewMetrics.rating_2 },
    { name: '3', value: reviewMetrics.rating_3 },
    { name: '4', value: reviewMetrics.rating_4 },
    { name: '5', value: reviewMetrics.rating_5 },
  ];

  const entryTypeData = [
    { name: 'Solo', value: participationMetrics.solo_entries },
    { name: 'Pair', value: participationMetrics.pair_entries },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="glass border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xl font-bold text-white">
              dine tokyo
            </Link>
            <span className="text-sm text-slate-400 bg-slate-800 px-2 py-1 rounded">
              Admin
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          管理画面へ戻る
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <TrendingUp className="w-6 h-6 text-amber-500" />
            KPIダッシュボード
          </h1>
          <div className="text-sm text-slate-400">
            最終更新: {new Date(data.generatedAt).toLocaleString('ja-JP')}
          </div>
        </div>

        {/* User Metrics Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
            <Users className="w-5 h-5 text-amber-500" />
            ユーザー指標
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="総ユーザー数"
              value={userMetrics.total_users}
              icon={<Users className="w-5 h-5" />}
            />
            <StatCard
              label="今日の新規"
              value={userMetrics.new_users_today}
              subValue={`今週: ${userMetrics.new_users_week} / 今月: ${userMetrics.new_users_month}`}
              icon={<UserCheck className="w-5 h-5" />}
            />
            <StatCard
              label="オンボーディング完了"
              value={userMetrics.onboarded_users}
              icon={<Activity className="w-5 h-5" />}
            />
            <StatCard
              label="完了率"
              value={`${userMetrics.onboarding_completion_rate || 0}%`}
              icon={<TrendingUp className="w-5 h-5" />}
            />
          </div>
        </section>

        {/* Daily Signups Chart */}
        {dailySignups.length > 0 && (
          <section className="mb-8">
            <Card className="glass-card border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-slate-400 mb-4">
                  日別新規登録（過去30日）
                </h3>
                <TrendChart data={dailySignups} dataKey="signups" label="登録数" />
              </CardContent>
            </Card>
          </section>
        )}

        {/* Subscription Metrics Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
            <CreditCard className="w-5 h-5 text-amber-500" />
            サブスクリプション指標
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatCard
              label="アクティブ会員"
              value={subscriptionMetrics.active_subscribers}
              icon={<UserCheck className="w-5 h-5" />}
            />
            <StatCard
              label="解約済み"
              value={subscriptionMetrics.canceled_subscribers}
              icon={<UserX className="w-5 h-5" />}
            />
            <StatCard
              label="支払い遅延"
              value={subscriptionMetrics.past_due_subscribers}
            />
            <StatCard
              label="会員率"
              value={`${subscriptionMetrics.subscription_rate || 0}%`}
              icon={<TrendingUp className="w-5 h-5" />}
            />
          </div>
          {subscriptionDistribution.length > 0 && (
            <Card className="glass-card border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-slate-400 mb-4">
                  ステータス分布
                </h3>
                <DistributionChart data={subscriptionDistribution} />
              </CardContent>
            </Card>
          )}
        </section>

        {/* Event Metrics Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
            <Calendar className="w-5 h-5 text-amber-500" />
            イベント指標
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="総イベント数" value={eventMetrics.total_events} />
            <StatCard label="受付中" value={eventMetrics.open_events} />
            <StatCard label="マッチング済" value={eventMetrics.matched_events} />
            <StatCard label="終了" value={eventMetrics.closed_events} />
          </div>
        </section>

        {/* Participation Metrics Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
            <Activity className="w-5 h-5 text-amber-500" />
            参加指標
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatCard label="総参加数" value={participationMetrics.total_participations} />
            <StatCard
              label="ソロ / ペア"
              value={`${participationMetrics.solo_entries} / ${participationMetrics.pair_entries}`}
            />
            <StatCard label="キャンセル数" value={participationMetrics.canceled_entries} />
            <StatCard
              label="キャンセル率"
              value={`${participationMetrics.cancellation_rate || 0}%`}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {dailyParticipations.length > 0 && (
              <Card className="glass-card border-slate-700">
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium text-slate-400 mb-4">
                    日別参加数（過去30日）
                  </h3>
                  <TrendChart
                    data={dailyParticipations}
                    dataKey="participations"
                    secondaryDataKey="cancellations"
                    label="参加"
                    secondaryLabel="キャンセル"
                  />
                </CardContent>
              </Card>
            )}
            <Card className="glass-card border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-slate-400 mb-4">
                  エントリータイプ
                </h3>
                <BarChartComponent data={entryTypeData} height={200} />
              </CardContent>
            </Card>
          </div>

          {moodDistribution.length > 0 && (
            <Card className="mt-4 glass-card border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-slate-400 mb-4">ムード分布</h3>
                <DistributionChart data={moodDistribution} />
              </CardContent>
            </Card>
          )}
        </section>

        {/* Review Metrics Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
            <Star className="w-5 h-5 text-amber-500" />
            レビュー指標
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatCard label="総レビュー数" value={reviewMetrics.total_reviews} />
            <StatCard
              label="平均評価"
              value={reviewMetrics.average_rating}
              icon={<Star className="w-5 h-5 fill-amber-500" />}
            />
            <StatCard label="ブロック数" value={reviewMetrics.block_count} />
            <StatCard label="ブロック率" value={`${reviewMetrics.block_rate || 0}%`} />
          </div>
          <Card className="glass-card border-slate-700">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-slate-400 mb-4">評価分布</h3>
              <BarChartComponent data={ratingDistribution} height={200} />
            </CardContent>
          </Card>
        </section>

        {/* Referral Metrics Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
            <Share2 className="w-5 h-5 text-amber-500" />
            紹介指標
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="総紹介数" value={referralMetrics.total_referrals} />
            <StatCard label="保留中" value={referralMetrics.pending_referrals} />
            <StatCard label="完了" value={referralMetrics.completed_referrals} />
            <StatCard
              label="完了率"
              value={`${referralMetrics.completion_rate || 0}%`}
              icon={<TrendingUp className="w-5 h-5" />}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
