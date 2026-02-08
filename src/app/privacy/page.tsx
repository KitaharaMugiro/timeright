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
    title: '1. 収集する情報',
    content: `当社は、本サービスの提供にあたり、以下の情報を収集します。

【ユーザーから直接提供される情報】
・氏名（表示名）
・メールアドレス
・性別
・生年月日
・職業
・プロフィール画像

【自動的に収集される情報】
・LINE認証情報
・利用ログ（アクセス日時、利用機能等）
・デバイス情報（OS、ブラウザ等）

【第三者から取得する情報】
・決済情報（Stripe経由）`,
  },
  {
    title: '2. 情報の利用目的',
    content: `当社は、収集した情報を以下の目的で利用します。

・本サービスの提供・運営
・ユーザー間のマッチング処理
・イベント参加の管理
・利用料金の請求・決済処理
・本サービスに関するご案内・お知らせの送信
・お問い合わせへの対応
・利用規約に違反する行為への対応
・本サービスの改善・新サービスの開発
・統計データの作成（個人を特定できない形式）`,
  },
  {
    title: '3. 情報の第三者提供',
    content: `当社は、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。

・ユーザーの同意がある場合
・法令に基づく場合
・人の生命、身体または財産の保護のために必要がある場合
・公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合
・国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合

なお、マッチングしたユーザー間では、以下の情報が相互に共有されます。
・表示名
・性別
・年齢
・職業
・パーソナリティタイプ`,
  },
  {
    title: '4. 情報の管理',
    content: `当社は、ユーザーの個人情報を正確かつ最新の状態に保ち、個人情報への不正アクセス・紛失・破損・改ざん・漏洩などを防止するため、セキュリティシステムの維持・管理体制の整備・社員教育の徹底等の必要な措置を講じ、安全対策を実施し個人情報の厳重な管理を行います。

主な安全管理措置：
・SSL/TLS暗号化通信の使用
・データベースの暗号化
・アクセス権限の制限
・定期的なセキュリティ監査`,
  },
  {
    title: '5. 情報の保存期間',
    content: `当社は、利用目的に必要な範囲内で個人情報を保存します。ユーザーが退会した場合、当社は合理的な期間内に個人情報を削除します。ただし、法令により保存が義務付けられている情報については、法定期間保存します。`,
  },
  {
    title: '6. Cookie・アクセス解析ツールの使用',
    content: `本サービスでは、ユーザー体験の向上およびサービス改善のため、Cookieおよびアクセス解析ツールを使用しています。これらは、ユーザーを個人として特定するものではありません。Cookieの使用を希望されない場合は、ブラウザの設定で無効にすることができます。`,
  },
  {
    title: '7. ユーザーの権利',
    content: `ユーザーは、当社に対して以下の権利を有します。

・個人情報の開示請求
・個人情報の訂正・追加・削除請求
・個人情報の利用停止・消去請求
・個人情報の第三者提供停止請求

これらの請求は、お問い合わせフォームよりご連絡ください。本人確認の上、合理的な期間内に対応いたします。`,
  },
  {
    title: '8. 外部サービスとの連携',
    content: `本サービスは、以下の外部サービスと連携しています。各サービスにおける個人情報の取り扱いについては、それぞれのプライバシーポリシーをご確認ください。

・LINE（認証）
・Stripe（決済処理）
・Supabase（データベース）`,
  },
  {
    title: '9. プライバシーポリシーの変更',
    content: `当社は、法令の変更や本サービスの変更に伴い、本プライバシーポリシーを変更することがあります。変更後のプライバシーポリシーは、当社ウェブサイトに掲載した時点から効力を生じるものとします。`,
  },
  {
    title: '10. お問い合わせ窓口',
    content: `本ポリシーに関するお問い合わせは、お問い合わせフォームよりご連絡ください。`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 text-neutral-900 relative overflow-hidden">
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
            <AnimatedGradientText>プライバシーポリシー</AnimatedGradientText>
          </h1>
          <div className="w-16" />
        </div>
      </motion.header>

      <main className="max-w-3xl mx-auto px-4 py-8 relative">
        <BlurFade>
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">プライバシーポリシー</h1>
            <p className="text-neutral-600">最終更新日: 2025年1月1日</p>
            <p className="mt-4 text-neutral-700">
              Dine Tokyo(ダイントーキョー)（以下「当社」）は、本サービスにおけるユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシーを定めます。
            </p>
          </div>
        </BlurFade>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <BlurFade key={index} delay={index * 0.05}>
              <section className="bg-white rounded-xl border border-neutral-200 p-6">
                <h2 className="text-lg font-semibold mb-3">{section.title}</h2>
                <p className="text-neutral-700 whitespace-pre-line leading-relaxed">
                  {section.content}
                </p>
              </section>
            </BlurFade>
          ))}
        </div>

        <BlurFade delay={0.5}>
          <div className="mt-8 text-center text-neutral-500 text-sm">
            <p>以上</p>
          </div>
        </BlurFade>
      </main>
    </div>
  );
}
