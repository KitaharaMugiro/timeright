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
    title: '第1条（適用）',
    content: `本規約は、本サービスの利用に関する条件を定めるものであり、本サービスを利用するすべてのユーザーに適用されます。ユーザーは、本サービスを利用することにより、本規約に同意したものとみなされます。`,
  },
  {
    title: '第2条（定義）',
    content: `「本サービス」とは、当社が提供する「dine tokyo」という名称のマッチングディナーサービスをいいます。「ユーザー」とは、本サービスに登録し、利用する個人をいいます。`,
  },
  {
    title: '第3条（登録）',
    content: `本サービスの利用を希望する者は、当社所定の方法により利用登録を行うものとします。利用登録の申請者が以下のいずれかに該当する場合、当社は利用登録を拒否することがあります。

1. 虚偽の事項を届け出た場合
2. 本規約に違反したことがある者からの申請である場合
3. その他、当社が利用登録を相当でないと判断した場合`,
  },
  {
    title: '第4条（料金および支払方法）',
    content: `ユーザーは、本サービスの有料部分の対価として、当社が別途定める利用料金を、当社が指定する支払方法により支払うものとします。ユーザーが利用料金の支払を遅滞した場合、当社は本サービスの提供を停止することができます。`,
  },
  {
    title: '第5条（禁止事項）',
    content: `ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。

1. 法令または公序良俗に違反する行為
2. 犯罪行為に関連する行為
3. 当社のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為
4. 本サービスの運営を妨害するおそれのある行為
5. 他のユーザーに関する個人情報等を収集または蓄積する行為
6. 他のユーザーに成りすます行為
7. 反社会的勢力に対して直接または間接に利益を供与する行為
8. 当社、本サービスの他のユーザーまたは第三者の知的財産権、肖像権、プライバシー、名誉その他の権利または利益を侵害する行為
9. 営業、宣伝、広告、勧誘、その他営利を目的とする行為
10. 面識のない異性との出会いや交際を目的とする行為
11. その他、当社が不適切と判断する行為`,
  },
  {
    title: '第6条（本サービスの提供の停止等）',
    content: `当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。

1. 本サービスにかかるコンピュータシステムの保守点検または更新を行う場合
2. 地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合
3. コンピュータまたは通信回線等が事故により停止した場合
4. その他、当社が本サービスの提供が困難と判断した場合`,
  },
  {
    title: '第7条（退会）',
    content: `ユーザーは、当社所定の方法により、本サービスから退会することができます。退会した場合、当該ユーザーに関する情報は、当社のプライバシーポリシーに従い取り扱われます。`,
  },
  {
    title: '第8条（免責事項）',
    content: `当社は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。当社は、本サービスに事実上または法律上の瑕疵がないことを明示的にも黙示的にも保証しておりません。`,
  },
  {
    title: '第9条（サービス内容の変更等）',
    content: `当社は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。`,
  },
  {
    title: '第10条（利用規約の変更）',
    content: `当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。変更後の利用規約は、当社ウェブサイトに掲載したときから効力を生じるものとします。`,
  },
  {
    title: '第11条（準拠法・裁判管轄）',
    content: `本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、東京地方裁判所を第一審の専属的合意管轄裁判所とします。`,
  },
];

export default function TermsPage() {
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
            <AnimatedGradientText>利用規約</AnimatedGradientText>
          </h1>
          <div className="w-16" />
        </div>
      </motion.header>

      <main className="max-w-3xl mx-auto px-4 py-8 relative">
        <BlurFade>
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">dine tokyo 利用規約</h1>
            <p className="text-neutral-600">最終更新日: 2025年1月1日</p>
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
