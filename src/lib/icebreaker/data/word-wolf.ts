import type { WordWolfTopic } from '../types';

export const WORD_WOLF_TOPICS: WordWolfTopic[] = [
  // 食べ物
  { id: 'ww1', majorityWord: 'ラーメン', minorityWord: 'うどん', category: '食べ物' },
  { id: 'ww2', majorityWord: '寿司', minorityWord: '刺身', category: '食べ物' },
  { id: 'ww3', majorityWord: 'カレー', minorityWord: 'シチュー', category: '食べ物' },
  { id: 'ww4', majorityWord: 'ハンバーグ', minorityWord: 'ハンバーガー', category: '食べ物' },
  { id: 'ww5', majorityWord: 'ピザ', minorityWord: 'パスタ', category: '食べ物' },
  { id: 'ww6', majorityWord: 'コーヒー', minorityWord: '紅茶', category: '食べ物' },
  { id: 'ww7', majorityWord: 'ケーキ', minorityWord: 'プリン', category: '食べ物' },
  { id: 'ww8', majorityWord: '焼肉', minorityWord: 'しゃぶしゃぶ', category: '食べ物' },

  // 場所
  { id: 'ww9', majorityWord: '東京', minorityWord: '大阪', category: '場所' },
  { id: 'ww10', majorityWord: '海', minorityWord: 'プール', category: '場所' },
  { id: 'ww11', majorityWord: '山', minorityWord: '丘', category: '場所' },
  { id: 'ww12', majorityWord: '映画館', minorityWord: '劇場', category: '場所' },
  { id: 'ww13', majorityWord: 'カフェ', minorityWord: '喫茶店', category: '場所' },
  { id: 'ww14', majorityWord: 'コンビニ', minorityWord: 'スーパー', category: '場所' },
  { id: 'ww15', majorityWord: '遊園地', minorityWord: '動物園', category: '場所' },

  // 動物
  { id: 'ww16', majorityWord: '犬', minorityWord: '猫', category: '動物' },
  { id: 'ww17', majorityWord: 'パンダ', minorityWord: 'クマ', category: '動物' },
  { id: 'ww18', majorityWord: 'ライオン', minorityWord: 'トラ', category: '動物' },
  { id: 'ww19', majorityWord: 'うさぎ', minorityWord: 'ハムスター', category: '動物' },
  { id: 'ww20', majorityWord: 'イルカ', minorityWord: 'クジラ', category: '動物' },

  // 季節・イベント
  { id: 'ww21', majorityWord: 'クリスマス', minorityWord: '正月', category: '季節' },
  { id: 'ww22', majorityWord: '花火大会', minorityWord: 'お祭り', category: '季節' },
  { id: 'ww23', majorityWord: 'バレンタイン', minorityWord: 'ホワイトデー', category: '季節' },
  { id: 'ww24', majorityWord: '春', minorityWord: '秋', category: '季節' },
  { id: 'ww25', majorityWord: '夏休み', minorityWord: '冬休み', category: '季節' },

  // エンタメ
  { id: 'ww26', majorityWord: 'YouTube', minorityWord: 'TikTok', category: 'エンタメ' },
  { id: 'ww27', majorityWord: 'Netflix', minorityWord: 'Amazon Prime', category: 'エンタメ' },
  { id: 'ww28', majorityWord: 'LINE', minorityWord: 'Instagram', category: 'エンタメ' },
  { id: 'ww29', majorityWord: 'カラオケ', minorityWord: 'ボウリング', category: 'エンタメ' },
  { id: 'ww30', majorityWord: 'ゲーム', minorityWord: '漫画', category: 'エンタメ' },

  // スポーツ
  { id: 'ww31', majorityWord: '野球', minorityWord: 'サッカー', category: 'スポーツ' },
  { id: 'ww32', majorityWord: 'テニス', minorityWord: 'バドミントン', category: 'スポーツ' },
  { id: 'ww33', majorityWord: 'ジョギング', minorityWord: 'ウォーキング', category: 'スポーツ' },
  { id: 'ww34', majorityWord: 'スキー', minorityWord: 'スノーボード', category: 'スポーツ' },
  { id: 'ww35', majorityWord: '筋トレ', minorityWord: 'ヨガ', category: 'スポーツ' },
];

export function getRandomTopic(): WordWolfTopic {
  const randomIndex = Math.floor(Math.random() * WORD_WOLF_TOPICS.length);
  return WORD_WOLF_TOPICS[randomIndex];
}

export function getTopicsByCategory(category: string): WordWolfTopic[] {
  return WORD_WOLF_TOPICS.filter((t) => t.category === category);
}

export function getAllCategories(): string[] {
  return [...new Set(WORD_WOLF_TOPICS.map((t) => t.category))];
}
