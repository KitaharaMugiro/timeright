'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ShimmerButton,
  GlassCard,
  AnimatedGradientText,
  BlurFade,
  Particles,
} from '@/components/ui/magicui';
import { BirthdatePicker } from '@/components/ui/birthdate-picker';
import type { PersonalityType, Gender } from '@/types/database';
import { ArrowRight, Sparkles, User, Briefcase, Calendar } from 'lucide-react';

interface ProfileData {
  display_name: string;
  gender: Gender;
  birth_date: string;
  job: string;
}

interface QuestionAnswer {
  question: string;
  subtext?: string;
  options: { label: string; value: string; emoji?: string }[];
}

const personalityQuestions: QuestionAnswer[] = [
  {
    question: '休日はどう過ごすことが多いですか？',
    subtext: 'あなたのエネルギーの源を教えてください',
    options: [
      { label: '外出して人と会う', value: 'E', emoji: '🌆' },
      { label: '家でゆっくり過ごす', value: 'I', emoji: '🏠' },
    ],
  },
  {
    question: 'グループでの会話では？',
    subtext: 'コミュニケーションスタイルについて',
    options: [
      { label: '積極的に話を振る', value: 'L', emoji: '💬' },
      { label: '聞き役になることが多い', value: 'S', emoji: '👂' },
    ],
  },
  {
    question: '新しいことを始めるとき、どちらが大切？',
    subtext: '意思決定のスタイルについて',
    options: [
      { label: '計画をしっかり立てる', value: 'A', emoji: '📋' },
      { label: '直感を信じて動く', value: 'N', emoji: '✨' },
    ],
  },
  {
    question: '困っている人がいたら？',
    subtext: 'サポートのアプローチについて',
    options: [
      { label: '具体的な解決策を提案', value: 'T', emoji: '💡' },
      { label: 'まず話を聞いて共感する', value: 'F', emoji: '🤝' },
    ],
  },
  {
    question: 'チームでの役割は？',
    subtext: 'グループでのポジションについて',
    options: [
      { label: '方向性を決めてリードする', value: 'D', emoji: '🎯' },
      { label: 'みんなをサポートする', value: 'C', emoji: '🌟' },
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

const personalityDescriptions: Record<PersonalityType, { title: string; description: string; emoji: string }> = {
  Leader: {
    title: 'リーダータイプ',
    description: 'グループを引っ張る存在。自然と周りを巻き込み、場を盛り上げます。',
    emoji: '👑',
  },
  Supporter: {
    title: 'サポータータイプ',
    description: '聞き上手で共感力が高い。周りを気遣い、居心地の良い空間を作ります。',
    emoji: '🤝',
  },
  Analyst: {
    title: 'アナリストタイプ',
    description: '深い会話が得意。論理的で、興味深い話題を提供します。',
    emoji: '🔍',
  },
  Entertainer: {
    title: 'エンターテイナータイプ',
    description: '場を明るくするムードメーカー。初対面でもすぐに打ち解けます。',
    emoji: '🎉',
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

  const totalSteps = 3;
  const quizProgress = step === 2 ? (currentQuestion + 1) / personalityQuestions.length : 0;
  const overallProgress = step === 1 ? 0.33 : step === 2 ? 0.33 + (0.34 * quizProgress) : 1;

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

      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('エラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 relative overflow-hidden">
      <Particles className="absolute inset-0" quantity={30} color="#f59e0b" staticity={60} />

      {/* Ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px]" />

      <div className="max-w-md mx-auto relative">
        {/* Progress bar - thin amber */}
        <BlurFade>
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium tracking-wider text-amber-500">
                STEP {step} / {totalSteps}
              </span>
              <span className="text-xs text-slate-500">
                {step === 1 && 'プロフィール'}
                {step === 2 && '性格診断'}
                {step === 3 && '結果'}
              </span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </BlurFade>

        <AnimatePresence mode="wait">
          {/* Step 1: Profile - Chat-like cards */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Welcome message - chat bubble style */}
              <div className="mb-6">
                <motion.div
                  className="glass-card rounded-2xl rounded-tl-sm p-4 max-w-[85%]"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-slate-300 text-sm">
                    はじめまして！unplannedへようこそ。
                    まずはあなたのことを教えてください。
                  </p>
                </motion.div>
              </div>

              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-white">プロフィール登録</h1>
                    <p className="text-xs text-slate-500">基本情報を入力</p>
                  </div>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      ニックネーム
                    </label>
                    <input
                      type="text"
                      value={profile.display_name}
                      onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                      placeholder="食事中に呼ばれる名前"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      性別
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'male', label: '男性' },
                        { value: 'female', label: '女性' },
                      ].map((option) => (
                        <motion.button
                          key={option.value}
                          type="button"
                          onClick={() => setProfile({ ...profile, gender: option.value as Gender })}
                          className={cn(
                            'px-4 py-3 rounded-xl border transition-all',
                            profile.gender === option.value
                              ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                              : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                          )}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="font-medium">{option.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      生年月日
                    </label>
                    <BirthdatePicker
                      value={profile.birth_date}
                      onChange={(value) => setProfile({ ...profile, birth_date: value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      <Briefcase className="w-4 h-4 inline mr-1" />
                      職業
                    </label>
                    <input
                      type="text"
                      value={profile.job}
                      onChange={(e) => setProfile({ ...profile, job: e.target.value })}
                      placeholder="例: エンジニア、デザイナー"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all"
                    />
                  </div>

                  <ShimmerButton type="submit" variant="accent" className="w-full mt-6">
                    次へ
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </ShimmerButton>
                </form>
              </GlassCard>
            </motion.div>
          )}

          {/* Step 2: Personality Quiz - Magazine style */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-white">性格診断</h1>
                    <p className="text-xs text-slate-500">
                      Q{currentQuestion + 1} / {personalityQuestions.length}
                    </p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mb-8">
                      <p className="font-serif text-xl text-white mb-2">
                        {personalityQuestions[currentQuestion].question}
                      </p>
                      {personalityQuestions[currentQuestion].subtext && (
                        <p className="text-sm text-slate-500">
                          {personalityQuestions[currentQuestion].subtext}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      {personalityQuestions[currentQuestion].options.map((option, idx) => (
                        <motion.button
                          key={option.value}
                          onClick={() => handleAnswerSelect(option.value)}
                          className={cn(
                            'w-full p-4 text-left rounded-xl',
                            'bg-slate-800/50 border border-slate-700',
                            'hover:border-amber-500/50 hover:bg-amber-500/5',
                            'transition-all duration-200 group'
                          )}
                          whileHover={{ scale: 1.02, x: 5 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <div className="flex items-center gap-3">
                            {option.emoji && (
                              <span className="text-2xl group-hover:scale-110 transition-transform">
                                {option.emoji}
                              </span>
                            )}
                            <span className="text-slate-300 group-hover:text-white transition-colors">
                              {option.label}
                            </span>
                          </div>
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
                          ? 'bg-amber-500'
                          : index === currentQuestion
                          ? 'bg-amber-400'
                          : 'bg-slate-700'
                      )}
                      animate={{
                        scale: index === currentQuestion ? 1.3 : 1,
                      }}
                    />
                  ))}
                </div>
              </GlassCard>
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
              <GlassCard className="p-8 text-center">
                <motion.div
                  className="w-24 h-24 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-6"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', duration: 0.6 }}
                >
                  <span className="text-5xl">
                    {personalityDescriptions[personalityType].emoji}
                  </span>
                </motion.div>

                <BlurFade delay={0.2}>
                  <p className="text-slate-500 text-sm mb-2">あなたは...</p>
                  <h2 className="text-2xl font-serif mb-4">
                    <AnimatedGradientText className="text-2xl font-serif">
                      {personalityDescriptions[personalityType].title}
                    </AnimatedGradientText>
                  </h2>
                </BlurFade>

                <BlurFade delay={0.3}>
                  <p className="text-slate-400 mb-8">
                    {personalityDescriptions[personalityType].description}
                  </p>
                </BlurFade>

                <BlurFade delay={0.4}>
                  <div className="glass rounded-xl p-4 mb-8">
                    <p className="text-sm text-slate-400">
                      この結果をもとに、相性の良いメンバーとマッチングします。
                    </p>
                  </div>
                </BlurFade>

                <BlurFade delay={0.5}>
                  <ShimmerButton
                    onClick={handleCompleteOnboarding}
                    disabled={loading}
                    variant="accent"
                    className="w-full"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <motion.span
                          className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        処理中...
                      </span>
                    ) : (
                      <>
                        始める
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </ShimmerButton>
                </BlurFade>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
