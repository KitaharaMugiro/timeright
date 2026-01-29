import type { GetToKnowQuestion } from '../types';

export const QUESTIONS: GetToKnowQuestion[] = [
  // Casual questions
  { id: 'q1', question: '最近ハマっていることは？', category: 'casual' },
  { id: 'q2', question: '休日の過ごし方は？', category: 'casual' },
  { id: 'q3', question: '好きな食べ物は？', category: 'casual' },
  { id: 'q4', question: '最近見た映画やドラマは？', category: 'casual' },
  { id: 'q5', question: '行きたい国はどこ？', category: 'casual' },
  { id: 'q6', question: '朝型？夜型？', category: 'casual' },
  { id: 'q7', question: 'インドア派？アウトドア派？', category: 'casual' },
  { id: 'q8', question: '好きな音楽のジャンルは？', category: 'casual' },
  { id: 'q9', question: '最近買って良かったものは？', category: 'casual' },
  { id: 'q10', question: 'ペット飼ってる？飼いたい？', category: 'casual' },
  { id: 'q11', question: '好きな季節は？', category: 'casual' },
  { id: 'q12', question: 'コーヒー派？紅茶派？', category: 'casual' },
  { id: 'q13', question: '最近読んだ本は？', category: 'casual' },
  { id: 'q14', question: '好きなスポーツは？', category: 'casual' },
  { id: 'q15', question: 'よく使うアプリは？', category: 'casual' },

  // Fun questions
  { id: 'f1', question: 'もし宝くじ1億円当たったら何する？', category: 'fun' },
  { id: 'f2', question: '超能力が使えるなら何がいい？', category: 'fun' },
  { id: 'f3', question: 'タイムマシンで行くなら過去？未来？', category: 'fun' },
  { id: 'f4', question: '生まれ変わったら何になりたい？', category: 'fun' },
  { id: 'f5', question: '無人島に一つだけ持っていくなら？', category: 'fun' },
  { id: 'f6', question: '一日だけ有名人になれるなら誰？', category: 'fun' },
  { id: 'f7', question: '実は隠れた特技がある？', category: 'fun' },
  { id: 'f8', question: '子供の頃の夢は？', category: 'fun' },
  { id: 'f9', question: '今までで一番笑ったことは？', category: 'fun' },
  { id: 'f10', question: 'あだ名はある？', category: 'fun' },
  { id: 'f11', question: '絶対に食べられないものは？', category: 'fun' },
  { id: 'f12', question: '自分を動物に例えると？', category: 'fun' },
  { id: 'f13', question: '一番くだらない買い物は？', category: 'fun' },
  { id: 'f14', question: '明日世界が終わるなら何する？', category: 'fun' },
  { id: 'f15', question: '意外とハマっている趣味は？', category: 'fun' },

  // Deep questions
  { id: 'd1', question: '人生で大切にしていることは？', category: 'deep' },
  { id: 'd2', question: '今の仕事を選んだ理由は？', category: 'deep' },
  { id: 'd3', question: '10年後どうなっていたい？', category: 'deep' },
  { id: 'd4', question: '尊敬する人は？', category: 'deep' },
  { id: 'd5', question: '人生で一番の挑戦は？', category: 'deep' },
  { id: 'd6', question: '自分の長所は？', category: 'deep' },
  { id: 'd7', question: '最近感動したことは？', category: 'deep' },
  { id: 'd8', question: '今一番頑張っていることは？', category: 'deep' },
  { id: 'd9', question: '人生のターニングポイントは？', category: 'deep' },
  { id: 'd10', question: '座右の銘は？', category: 'deep' },
  { id: 'd11', question: '最近学んだことは？', category: 'deep' },
  { id: 'd12', question: '幸せを感じる瞬間は？', category: 'deep' },
  { id: 'd13', question: '苦手を克服した経験は？', category: 'deep' },
  { id: 'd14', question: '自分が変わったきっかけは？', category: 'deep' },
  { id: 'd15', question: '将来の夢は？', category: 'deep' },
];

export function getRandomQuestions(count: number, category?: 'casual' | 'deep' | 'fun'): GetToKnowQuestion[] {
  let filtered = QUESTIONS;
  if (category) {
    filtered = QUESTIONS.filter((q) => q.category === category);
  }
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getQuestionById(id: string): GetToKnowQuestion | undefined {
  return QUESTIONS.find((q) => q.id === id);
}
