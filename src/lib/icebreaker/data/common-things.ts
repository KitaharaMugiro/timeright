import type { CommonThingsCategory } from '../types';

export const COMMON_THINGS_CATEGORIES: CommonThingsCategory[] = [
  {
    id: 'food',
    name: '食べ物',
    prompts: [
      '好きな食べ物',
      '苦手な食べ物',
      'よく食べるもの',
      '好きなお菓子',
      '好きな飲み物',
      'お気に入りのレストラン',
      'よく作る料理',
    ],
  },
  {
    id: 'hobbies',
    name: '趣味',
    prompts: [
      '休日の過ごし方',
      'ハマっていること',
      '好きなスポーツ',
      '見るスポーツ',
      '好きな音楽ジャンル',
      '好きなアーティスト',
      'よく見るYouTubeチャンネル',
    ],
  },
  {
    id: 'travel',
    name: '旅行',
    prompts: [
      '行ったことある国',
      '行ってみたい国',
      '好きな観光地',
      '旅行で大事にすること',
      '旅行の思い出',
      '好きな交通手段',
      '旅行先でやること',
    ],
  },
  {
    id: 'lifestyle',
    name: 'ライフスタイル',
    prompts: [
      '朝のルーティン',
      '夜のルーティン',
      'リラックス方法',
      'ストレス発散法',
      '大切にしている習慣',
      'よく使うアプリ',
      '持っているもの',
    ],
  },
  {
    id: 'personality',
    name: '性格・考え方',
    prompts: [
      '自分の長所',
      '直したいところ',
      '大切にしている価値観',
      '譲れないこと',
      '苦手なこと',
      '得意なこと',
      '好きな言葉',
    ],
  },
  {
    id: 'experiences',
    name: '経験',
    prompts: [
      'アルバイト経験',
      '学生時代の部活',
      '習い事の経験',
      '感動した経験',
      '挑戦したこと',
      '失敗した経験',
      '成功した経験',
    ],
  },
  {
    id: 'random',
    name: 'その他',
    prompts: [
      '血液型',
      '星座',
      '出身地域',
      '兄弟構成',
      '住んだことある場所',
      '持っている資格',
      'SNSの使い方',
    ],
  },
];

export function getRandomPrompts(count: number): string[] {
  const allPrompts = COMMON_THINGS_CATEGORIES.flatMap((c) => c.prompts);
  const shuffled = [...allPrompts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getCategoryById(id: string): CommonThingsCategory | undefined {
  return COMMON_THINGS_CATEGORIES.find((c) => c.id === id);
}
