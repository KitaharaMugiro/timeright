'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ShimmerButton,
  MagicCard,
  AnimatedGradientText,
  BlurFade,
  Particles,
} from '@/components/ui/magicui';
import type { PersonalityType, Gender } from '@/types/database';
import { ArrowRight, Sparkles, User, Briefcase, Calendar, Users2 } from 'lucide-react';

interface ProfileData {
  display_name: string;
  gender: Gender;
  birth_date: string;
  job: string;
}

interface QuestionAnswer {
  question: string;
  options: { label: string; value: string }[];
}

const personalityQuestions: QuestionAnswer[] = [
  {
    question: '休日はどう過ごすことが多いですか？',
    options: [
      { label: '外出して人と会う', value: 'E' },
      { label: '家でゆっくり過ごす', value: 'I' },
    ],
  },
  {
    question: 'グループでの会話では？',
    options: [
      { label: '積極的に話を振る', value: 'L' },
      { label: '聞き役になることが多い', value: 'S' },
    ],
  },
  {
    question: '新しいことを始めるとき、どちらが大切？',
    options: [
      { label: '計画をしっかり立てる', value: 'A' },
      { label: '直感を信じて動く', value: 'N' },
    ],
  },
  {
    question: '困っている人がいたら？',
    options: [
      { label: '具体的な解決策を提案', value: 'T' },
      { label: 'まず話を聞いて共感する', value: 'F' },
    ],
  },
  {
    question: 'チームでの役割は？',
    options: [
      { label: '方向性を決めてリードする', value: 'D' },
      { label: 'みんなをサポートする', value: 'C' },
    ],
  },
];

function calculatePersonalityType(answers: string[]): PersonalityType {
  let leader = 0;
  let supporter = 0;
  let analyst = 0;
  let entertainer = 0;

  answers.forEach((answer) => {
    switch (answer) {
      case 'E':
        entertainer++;
        leader++;
        break;
      case 'I':
        analyst++;
        supporter++;
        break;
      case 'L':
        leader += 2;
        break;
      case 'S':
        supporter += 2;
        break;
      case 'A':
        analyst += 2;
        break;
      case 'N':
        entertainer += 2;
        break;
      case 'T':
        analyst++;
        leader++;
        break;
      case 'F':
        supporter++;
        entertainer++;
        break;
      case 'D':
        leader++;
        break;
      case 'C':
        supporter++;
        break;
    }
  });

  const scores = [
    { type: 'Leader' as PersonalityType, score: leader },
    { type: 'Supporter' as PersonalityType, score: supporter },
    { type: 'Analyst' as PersonalityType, score: analyst },
    { type: 'Entertainer' as PersonalityType, score: entertainer },
  ];

  scores.sort((a, b) => b.score - a.score);
  return scores[0].type;
}

const personalityDescriptions: Record<PersonalityType, { title: string; description: string; emoji: string; color: string }> = {
  Leader: {
    title: 'リーダータイプ',
    description: 'グループを引っ張る存在。自然と周りを巻き込み、場を盛り上げます。',
    emoji: '👑',
    color: 'from-amber-400 to-orange-500',
  },
  Supporter: {
    title: 'サポータータイプ',
    description: '聞き上手で共感力が高い。周りを気遣い、居心地の良い空間を作ります。',
    emoji: '🤝',
    color: 'from-emerald-400 to-teal-500',
  },
  Analyst: {
    title: 'アナリストタイプ',
    description: '深い会話が得意。論理的で、興味深い話題を提供します。',
    emoji: '🔍',
    color: 'from-blue-400 to-indigo-500',
  },
  Entertainer: {
    title: 'エンターテイナータイプ',
    description: '場を明るくするムードメーカー。初対面でもすぐに打ち解けます。',
    emoji: '🎉',
    color: 'from-pink-400 to-rose-500',
  },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    display_name: '',
    gender: 'male',
    birth_date: '',
    job: '',
  });

  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [personalityType, setPersonalityType] = useState<PersonalityType | null>(null);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentQuestion < personalityQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const type = calculatePersonalityType(newAnswers);
      setPersonalityType(type);
      setStep(3);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!personalityType) return;

    setLoading(true);
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          personality_type: personalityType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      router.push('/onboarding/subscribe');
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('エラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 py-12 px-4 relative overflow-hidden">
      <Particles className="absolute inset-0" quantity={20} color="#FF6B6B" staticity={50} />

      <div className="max-w-md mx-auto relative">
        {/* Progress indicator */}
        <BlurFade>
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-neutral-600">
                Step {step} / 3
              </span>
              <span className="text-sm text-neutral-400">
                {step === 1 && 'プロフィール'}
                {step === 2 && '性格診断'}
                {step === 3 && '結果'}
              </span>
            </div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53]"
                initial={{ width: 0 }}
                animate={{ width: `${(step / 3) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </BlurFade>

        <AnimatePresence mode="wait">
          {/* Step 1: Profile */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MagicCard gradientColor="#FF6B6B">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold">プロフィール登録</h1>
                      <p className="text-sm text-neutral-500">基本情報を教えてください</p>
                    </div>
                  </div>

                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        ニックネーム
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={profile.display_name}
                          onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                          placeholder="食事中に呼ばれる名前"
                          required
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        性別
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'male', label: '男性', icon: '👨' },
                          { value: 'female', label: '女性', icon: '👩' },
                        ].map((option) => (
                          <motion.button
                            key={option.value}
                            type="button"
                            onClick={() => setProfile({ ...profile, gender: option.value as Gender })}
                            className={cn(
                              'px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2',
                              profile.gender === option.value
                                ? 'border-[#FF6B6B] bg-[#FF6B6B]/5 text-[#FF6B6B]'
                                : 'border-neutral-200 hover:border-neutral-300'
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span>{option.icon}</span>
                            <span className="font-medium">{option.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        生年月日
                      </label>
                      <input
                        type="date"
                        value={profile.birth_date}
                        onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        <Briefcase className="w-4 h-4 inline mr-1" />
                        職業
                      </label>
                      <input
                        type="text"
                        value={profile.job}
                        onChange={(e) => setProfile({ ...profile, job: e.target.value })}
                        placeholder="例: エンジニア、デザイナー"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 outline-none transition-all"
                      />
                    </div>

                    <ShimmerButton type="submit" className="w-full mt-6">
                      次へ
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </ShimmerButton>
                  </form>
                </div>
              </MagicCard>
            </motion.div>
          )}

          {/* Step 2: Personality Quiz */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MagicCard gradientColor="#FF8E53">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold">性格診断</h1>
                      <p className="text-sm text-neutral-500">
                        質問 {currentQuestion + 1} / {personalityQuestions.length}
                      </p>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentQuestion}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-lg font-medium mb-6">
                        {personalityQuestions[currentQuestion].question}
                      </p>

                      <div className="space-y-3">
                        {personalityQuestions[currentQuestion].options.map((option, idx) => (
                          <motion.button
                            key={option.value}
                            onClick={() => handleAnswerSelect(option.value)}
                            className={cn(
                              'w-full p-4 text-left rounded-xl border-2 border-neutral-200',
                              'hover:border-[#FF6B6B] hover:bg-[#FF6B6B]/5',
                              'transition-all duration-200'
                            )}
                            whileHover={{ scale: 1.02, x: 5 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                          >
                            {option.label}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Progress dots */}
                  <div className="flex justify-center gap-2 mt-8">
                    {personalityQuestions.map((_, index) => (
                      <motion.div
                        key={index}
                        className={cn(
                          'w-2 h-2 rounded-full transition-colors',
                          index < currentQuestion
                            ? 'bg-[#FF6B6B]'
                            : index === currentQuestion
                            ? 'bg-[#FF8E53]'
                            : 'bg-neutral-200'
                        )}
                        animate={{
                          scale: index === currentQuestion ? 1.2 : 1,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </MagicCard>
            </motion.div>
          )}

          {/* Step 3: Result */}
          {step === 3 && personalityType && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <MagicCard gradientColor="#FF6B6B">
                <div className="p-6 text-center">
                  <motion.div
                    className={cn(
                      'w-24 h-24 rounded-full bg-gradient-to-br flex items-center justify-center mx-auto mb-6',
                      personalityDescriptions[personalityType].color
                    )}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', duration: 0.6 }}
                  >
                    <span className="text-4xl">
                      {personalityDescriptions[personalityType].emoji}
                    </span>
                  </motion.div>

                  <BlurFade delay={0.2}>
                    <p className="text-neutral-500 mb-2">あなたは...</p>
                    <h2 className="text-2xl font-bold mb-4">
                      <AnimatedGradientText>
                        {personalityDescriptions[personalityType].title}
                      </AnimatedGradientText>
                    </h2>
                  </BlurFade>

                  <BlurFade delay={0.3}>
                    <p className="text-neutral-600 mb-8">
                      {personalityDescriptions[personalityType].description}
                    </p>
                  </BlurFade>

                  <BlurFade delay={0.4}>
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 mb-8 flex items-center gap-3">
                      <Users2 className="w-5 h-5 text-[#FF6B6B] flex-shrink-0" />
                      <p className="text-sm text-neutral-600 text-left">
                        この結果をもとに、相性の良いメンバーとマッチングします。
                      </p>
                    </div>
                  </BlurFade>

                  <BlurFade delay={0.5}>
                    <ShimmerButton
                      onClick={handleCompleteOnboarding}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            ⏳
                          </motion.span>
                          処理中...
                        </span>
                      ) : (
                        <>
                          次へ（お支払い設定）
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </ShimmerButton>
                  </BlurFade>
                </div>
              </MagicCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
