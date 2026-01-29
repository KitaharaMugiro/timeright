import type { WouldYouRatherChoice } from '../types';

export const WOULD_YOU_RATHER: WouldYouRatherChoice[] = [
  { id: 'w1', optionA: '時間を止められる', optionB: '空を飛べる' },
  { id: 'w2', optionA: '過去に戻れる', optionB: '未来が見える' },
  { id: 'w3', optionA: '海派', optionB: '山派' },
  { id: 'w4', optionA: '一生夏', optionB: '一生冬' },
  { id: 'w5', optionA: 'お金持ちだけど忙しい', optionB: '普通だけど自由' },
  { id: 'w6', optionA: '透明人間になれる', optionB: '瞬間移動できる' },
  { id: 'w7', optionA: '動物と話せる', optionB: '全言語を話せる' },
  { id: 'w8', optionA: '過去の失敗をやり直す', optionB: '未来の成功を知る' },
  { id: 'w9', optionA: '記憶力抜群', optionB: '運動神経抜群' },
  { id: 'w10', optionA: '大勢の前でスピーチ', optionB: '一人でバンジージャンプ' },
  { id: 'w11', optionA: '毎日同じ服', optionB: '毎日同じ食事' },
  { id: 'w12', optionA: '田舎で静かに暮らす', optionB: '都会で刺激的に暮らす' },
  { id: 'w13', optionA: '一生スマホなし', optionB: '一生お菓子なし' },
  { id: 'w14', optionA: '歌がうまくなる', optionB: 'ダンスがうまくなる' },
  { id: 'w15', optionA: '料理上手になる', optionB: '掃除上手になる' },
  { id: 'w16', optionA: '常に正直でいる', optionB: '常に優しくいる' },
  { id: 'w17', optionA: '一人旅', optionB: 'グループ旅行' },
  { id: 'w18', optionA: '映画館で映画', optionB: '家で映画' },
  { id: 'w19', optionA: '朝5時起き生活', optionB: '深夜2時起き生活' },
  { id: 'w20', optionA: 'ずっと若いまま', optionB: '知恵がどんどん増える' },
  { id: 'w21', optionA: '有名になる', optionB: '影響力を持つ' },
  { id: 'w22', optionA: '何でも作れる', optionB: '何でも直せる' },
  { id: 'w23', optionA: '過去を変える', optionB: '未来を選ぶ' },
  { id: 'w24', optionA: '世界中を旅する', optionB: '宇宙に行く' },
  { id: 'w25', optionA: '天才だけど孤独', optionB: '普通だけど友達多い' },
  { id: 'w26', optionA: '猫派', optionB: '犬派' },
  { id: 'w27', optionA: '肉派', optionB: '魚派' },
  { id: 'w28', optionA: '電車通勤', optionB: '車通勤' },
  { id: 'w29', optionA: '読書', optionB: '映画鑑賞' },
  { id: 'w30', optionA: '早起き', optionB: '夜更かし' },
  { id: 'w31', optionA: 'サプライズする', optionB: 'サプライズされる' },
  { id: 'w32', optionA: '計画的に行動', optionB: '直感で行動' },
  { id: 'w33', optionA: '挑戦して失敗', optionB: '挑戦せず後悔' },
  { id: 'w34', optionA: '昔の友達と再会', optionB: '新しい友達を作る' },
  { id: 'w35', optionA: '好きなことを仕事に', optionB: '仕事と趣味は別' },
  { id: 'w36', optionA: 'ラーメン一生食べられる', optionB: '寿司一生食べられる' },
  { id: 'w37', optionA: 'ずっと同じ場所に住む', optionB: '色々な場所に住む' },
  { id: 'w38', optionA: '何でも覚えられる', optionB: '嫌なことは忘れられる' },
  { id: 'w39', optionA: '自分が好き', optionB: '人に好かれる' },
  { id: 'w40', optionA: 'リーダータイプ', optionB: 'サポートタイプ' },
  { id: 'w41', optionA: '和食', optionB: '洋食' },
  { id: 'w42', optionA: 'スポーツ観戦', optionB: '音楽ライブ' },
  { id: 'w43', optionA: 'テレビ派', optionB: 'YouTube派' },
  { id: 'w44', optionA: '辛いもの好き', optionB: '甘いもの好き' },
  { id: 'w45', optionA: 'お酒好き', optionB: 'スイーツ好き' },
  { id: 'w46', optionA: '即決タイプ', optionB: '熟考タイプ' },
  { id: 'w47', optionA: '褒められるのが好き', optionB: '褒めるのが好き' },
  { id: 'w48', optionA: '聞き上手', optionB: '話し上手' },
  { id: 'w49', optionA: '現金派', optionB: 'キャッシュレス派' },
  { id: 'w50', optionA: '一目惚れ', optionB: 'ゆっくり好きになる' },
];

export function getRandomChoices(count: number): WouldYouRatherChoice[] {
  const shuffled = [...WOULD_YOU_RATHER].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getChoiceById(id: string): WouldYouRatherChoice | undefined {
  return WOULD_YOU_RATHER.find((c) => c.id === id);
}
