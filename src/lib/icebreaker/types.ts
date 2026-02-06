export type IcebreakerGameType =
  | 'questions'
  | 'would_you_rather'
  | 'two_truths'
  | 'word_wolf'
  | 'common_things'
  | 'whodunit'
  | 'guess_favorite'
  | 'peer_intro'
  | 'ng_word';

export type IcebreakerSessionStatus = 'waiting' | 'playing' | 'finished';

export interface IcebreakerSession {
  id: string;
  match_id: string;
  game_type: IcebreakerGameType;
  status: IcebreakerSessionStatus;
  current_round: number;
  game_data: GameData;
  host_user_id: string;
  created_at: string;
}

export interface IcebreakerPlayer {
  id: string;
  session_id: string;
  user_id: string;
  player_data: PlayerData;
  is_ready: boolean;
  joined_at: string;
}

export interface GameDefinition {
  id: IcebreakerGameType;
  name: string;
  description: string;
  emoji: string;
  minPlayers: number;
  maxPlayers: number;
  hasRounds: boolean;
  instructions: string[];
}

// Game-specific data types
export interface GameData {
  // Questions game
  currentQuestion?: string;
  questionHistory?: string[];

  // Would You Rather
  optionA?: string;
  optionB?: string;

  // Two Truths and a Lie
  currentPlayerId?: string;
  statements?: string[];
  lieIndex?: number;
  revealed?: boolean;

  // Word Wolf
  majorityWord?: string;
  minorityWord?: string;
  wolfId?: string;
  discussionEndTime?: string;
  votingPhase?: boolean;
  resultRevealed?: boolean;
  pointsAwarded?: boolean;

  // Common Things
  pairs?: [string, string][];
  currentPairIndex?: number;
  foundItems?: string[];

  // Whodunit
  stories?: { text: string; authorId: string }[];
  currentStoryIndex?: number;

  // Guess Favorite
  category?: string;
  answers?: { userId: string; answer: string }[];
  shuffledPlayerIds?: string[];
  guessingPhase?: boolean;

  // Peer Intro
  peerIntroPhase?: 'pairing' | 'interview' | 'presentation';
  interviewEndTime?: string;
  interviewPairs?: [string, string][];
  currentPairIndex2?: number;
  introductions?: { aboutUserId: string; byUserId: string; text: string }[];

  // NG Word
  ngWordAssignments?: { userId: string; ngWord: string }[];
  eliminatedPlayers?: string[];
  discussionTopic?: string;
}

export interface PlayerData {
  // General
  answer?: string;
  vote?: string;
  guesses?: Record<string, string>;

  // Two Truths
  myStatements?: string[];
  myLieIndex?: number;

  // Word Wolf
  isWolf?: boolean;
  myWord?: string;

  // Common Things
  sharedItems?: string[];

  // Whodunit
  myStory?: string;

  // Guess Favorite
  myFavorite?: string;

  // Peer Intro
  partnerId?: string;
  notes?: string;
  introduction?: string;

  // NG Word
  myNgWord?: string;
  isEliminated?: boolean;

  // Two Truths - guess which statement is the lie
  lieGuess?: number;
}

// Icebreaker scores (match-level, persists across games)
export interface IcebreakerScore {
  id: string;
  match_id: string;
  user_id: string;
  points: number;
  updated_at: string;
}

// Question types for data files
export interface GetToKnowQuestion {
  id: string;
  question: string;
  category: 'casual' | 'deep' | 'fun';
}

export interface WouldYouRatherChoice {
  id: string;
  optionA: string;
  optionB: string;
}

export interface WordWolfTopic {
  id: string;
  majorityWord: string;
  minorityWord: string;
  category: string;
}

export interface TwoTruthsExample {
  id: string;
  statements: string[];
  lieIndex: number;
}

export interface CommonThingsCategory {
  id: string;
  name: string;
  prompts: string[];
}

export interface NgWordItem {
  id: string;
  word: string;
  category: string;
}

export interface NgWordTopic {
  id: string;
  topic: string;
}
