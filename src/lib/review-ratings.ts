/**
 * レビュー評価の星の意味定義
 *
 * 星1-3: BLOCK（今後マッチングしない）
 * 星4-5: 通常（また会いたい）
 */

export interface RatingDefinition {
  value: number;
  label: string;
  description: string;
  isBlock: boolean;
}

export const RATING_DEFINITIONS: RatingDefinition[] = [
  {
    value: 1,
    label: '迷惑行為',
    description: '迷惑行為を行なっていた',
    isBlock: true,
  },
  {
    value: 2,
    label: 'もう会いたくない',
    description: '嫌い。もう会いたくない',
    isBlock: true,
  },
  {
    value: 3,
    label: '普通',
    description: '普通。でももう会いたくない',
    isBlock: true,
  },
  {
    value: 4,
    label: 'また会いたい',
    description: '好き。また会いたい',
    isBlock: false,
  },
  {
    value: 5,
    label: 'ぜひまた会いたい',
    description: '大好き。ぜひまた会いたい',
    isBlock: false,
  },
];

/**
 * 評価値から定義を取得
 */
export function getRatingDefinition(rating: number): RatingDefinition | undefined {
  return RATING_DEFINITIONS.find((r) => r.value === rating);
}

/**
 * 評価値からブロックフラグを判定
 */
export function isBlockRating(rating: number): boolean {
  const definition = getRatingDefinition(rating);
  return definition?.isBlock ?? false;
}
