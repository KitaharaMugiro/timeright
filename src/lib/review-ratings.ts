/**
 * レビュー評価の星の意味定義
 *
 * 星0: No-Show（無断キャンセル）- 特別ペナルティ
 * 星1-3: BLOCK（今後マッチングしない）
 * 星4-5: 通常（また会いたい）
 */

export interface RatingDefinition {
  value: number;
  label: string;
  description: string;
  isBlock: boolean;
  isNoShow?: boolean;
}

export const RATING_DEFINITIONS: RatingDefinition[] = [
  {
    value: 0,
    label: 'No-Show（無断キャンセル）',
    description: '当日来なかった、連絡なしにキャンセルした',
    isBlock: true,
    isNoShow: true,
  },
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

/**
 * 評価値からNo-Showフラグを判定
 */
export function isNoShowRating(rating: number): boolean {
  const definition = getRatingDefinition(rating);
  return definition?.isNoShow ?? false;
}
