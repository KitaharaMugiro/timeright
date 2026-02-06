import { GameDefinition, IcebreakerGameType } from './types';

export const GAME_DEFINITIONS: GameDefinition[] = [
  {
    id: 'questions',
    name: '質問タイム',
    description: 'みんなで同じ質問に答えよう！',
    emoji: '💬',
    minPlayers: 2,
    maxPlayers: 10,
    hasRounds: true,
    instructions: [
      '質問が表示されます',
      '全員が順番に答えます',
      '理由を一言添えると盛り上がります',
    ],
  },
  {
    id: 'would_you_rather',
    name: 'どっちがいい？',
    description: 'AとBどっちを選ぶ？理由を一言',
    emoji: '🤔',
    minPlayers: 2,
    maxPlayers: 10,
    hasRounds: true,
    instructions: [
      '2つの選択肢が表示されます',
      '全員がどちらかを選びます',
      '選んだ理由を話し合いましょう',
    ],
  },
  {
    id: 'two_truths',
    name: '2つの真実と1つの嘘',
    description: '3つの発言のうち嘘を当てる',
    emoji: '🎭',
    minPlayers: 3,
    maxPlayers: 8,
    hasRounds: true,
    instructions: [
      '発表者が3つの発言をします',
      '2つは本当、1つは嘘',
      '他の人は嘘を当てましょう',
    ],
  },
  {
    id: 'word_wolf',
    name: 'ワードウルフ',
    description: '少数派のお題を持つ人を探す',
    emoji: '🐺',
    minPlayers: 4,
    maxPlayers: 8,
    hasRounds: false,
    instructions: [
      '全員にお題が配られます',
      '1人だけ違うお題（ウルフ）',
      '会話でウルフを探しましょう',
    ],
  },
  {
    id: 'common_things',
    name: '10の共通点',
    description: 'グループで共通点を10個探す',
    emoji: '🤝',
    minPlayers: 2,
    maxPlayers: 10,
    hasRounds: false,
    instructions: [
      'ペアを作ります',
      '細かい共通点を10個探します',
      '意外な共通点ほど盛り上がります',
    ],
  },
  {
    id: 'whodunit',
    name: '犯人探し',
    description: '誰の面白い経験か当てる',
    emoji: '🔍',
    minPlayers: 4,
    maxPlayers: 10,
    hasRounds: true,
    instructions: [
      '全員が面白い経験を書きます',
      'シャッフルして読み上げます',
      '誰の話か当てましょう',
    ],
  },
  {
    id: 'guess_favorite',
    name: '好きなもの当て',
    description: '誰の好みか当てる',
    emoji: '❤️',
    minPlayers: 3,
    maxPlayers: 10,
    hasRounds: true,
    instructions: [
      'カテゴリーが発表されます',
      '全員が好きなものを書きます',
      '誰のか当てましょう',
    ],
  },
  {
    id: 'peer_intro',
    name: '他己紹介',
    description: 'ペアでインタビューして紹介',
    emoji: '🎤',
    minPlayers: 4,
    maxPlayers: 10,
    hasRounds: false,
    instructions: [
      'ペアを作ります',
      '数分間インタビューします',
      '全体に向けて相手を紹介',
    ],
  },
  {
    id: 'ng_word',
    name: 'NGワードゲーム',
    description: '自分のNGワードを言わずに会話',
    emoji: '🚫',
    minPlayers: 3,
    maxPlayers: 8,
    hasRounds: false,
    instructions: [
      '全員にNGワードが配られます',
      '自分のNGワードは見えません',
      '会話中に言ってしまったらアウト！',
    ],
  },
];

export function getGameDefinition(gameType: IcebreakerGameType): GameDefinition {
  const game = GAME_DEFINITIONS.find((g) => g.id === gameType);
  if (!game) {
    throw new Error(`Unknown game type: ${gameType}`);
  }
  return game;
}

export function getGameEmoji(gameType: IcebreakerGameType): string {
  return getGameDefinition(gameType).emoji;
}

export function getGameName(gameType: IcebreakerGameType): string {
  return getGameDefinition(gameType).name;
}

export function isValidPlayerCount(
  gameType: IcebreakerGameType,
  playerCount: number
): boolean {
  const game = getGameDefinition(gameType);
  return playerCount >= game.minPlayers && playerCount <= game.maxPlayers;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function pickRandom<T>(array: T[], count: number = 1): T[] {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}

export function createPairs(playerIds: string[]): [string, string][] {
  const shuffled = shuffleArray(playerIds);
  const pairs: [string, string][] = [];

  for (let i = 0; i < shuffled.length - 1; i += 2) {
    pairs.push([shuffled[i], shuffled[i + 1]]);
  }

  // If odd number of players, add the remaining person to the last pair as a 3rd member
  if (shuffled.length % 2 === 1 && pairs.length > 0) {
    const lastPerson = shuffled[shuffled.length - 1];
    const lastPair = pairs[pairs.length - 1];
    // Create two pairs from the 3-person group so everyone interacts
    pairs[pairs.length - 1] = [lastPair[0], lastPerson];
    pairs.push([lastPair[1], lastPerson]);
  }

  return pairs;
}

export function selectWolf(playerIds: string[]): string {
  const randomIndex = Math.floor(Math.random() * playerIds.length);
  return playerIds[randomIndex];
}
