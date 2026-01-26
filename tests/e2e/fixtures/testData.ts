/**
 * Test data and fixtures for E2E tests
 */

export interface TestUser {
  nickname: string;
  gender: 'male' | 'female';
  birthDate: string;
  job: string;
}

/**
 * Sample test users for onboarding tests
 */
export const testUsers: Record<string, TestUser> = {
  maleUser: {
    nickname: 'Taro',
    gender: 'male',
    birthDate: '1990-05-15',
    job: 'Engineer',
  },
  femaleUser: {
    nickname: 'Hanako',
    gender: 'female',
    birthDate: '1992-08-22',
    job: 'Designer',
  },
  youngUser: {
    nickname: 'Yuki',
    gender: 'female',
    birthDate: '2000-01-01',
    job: 'Student',
  },
  seniorUser: {
    nickname: 'Ichiro',
    gender: 'male',
    birthDate: '1975-12-31',
    job: 'Manager',
  },
};

/**
 * Quiz answer patterns for different personality types
 */
export const personalityAnswers = {
  // All first options - tends to Leader
  leader: [0, 0, 0, 0, 0],
  // All second options - tends to Supporter
  supporter: [1, 1, 1, 1, 1],
  // Mix for Analyst
  analyst: [1, 1, 0, 0, 1],
  // Mix for Entertainer
  entertainer: [0, 0, 1, 1, 1],
};

/**
 * Expected personality type titles (Japanese)
 */
export const personalityTitles = {
  Leader: 'リーダータイプ',
  Supporter: 'サポータータイプ',
  Analyst: 'アナリストタイプ',
  Entertainer: 'エンターテイナータイプ',
};

/**
 * Generate random test user
 */
export function generateRandomUser(): TestUser {
  const names = ['Test', 'User', 'Sample', 'Demo'];
  const jobs = ['Engineer', 'Designer', 'Product Manager', 'Marketing', 'Sales'];
  const genders: ('male' | 'female')[] = ['male', 'female'];

  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
  const randomGender = genders[Math.floor(Math.random() * genders.length)];
  const randomYear = 1980 + Math.floor(Math.random() * 25);
  const randomMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const randomDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');

  return {
    nickname: `${randomName}${Math.floor(Math.random() * 1000)}`,
    gender: randomGender,
    birthDate: `${randomYear}-${randomMonth}-${randomDay}`,
    job: randomJob,
  };
}

/**
 * Generate random quiz answers
 */
export function generateRandomAnswers(count: number = 5): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 2));
}

/**
 * Subscription status types for testing
 */
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'none';

/**
 * Mock subscription data for different test scenarios
 */
export interface MockSubscriptionState {
  status: SubscriptionStatus;
  periodEnd: string | null;
  description: string;
}

/**
 * Get a future date string (days from now)
 */
export function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

/**
 * Get a past date string (days ago)
 */
export function getPastDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

/**
 * Format date for display matching Japanese locale format
 * Used for verifying displayed dates in tests
 */
export function formatDateJapanese(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Mock subscription states for different test scenarios
 */
export const mockSubscriptionStates: Record<string, MockSubscriptionState> = {
  active: {
    status: 'active',
    periodEnd: getFutureDate(30),
    description: 'Active subscription with 30 days remaining',
  },
  canceledValidPeriod: {
    status: 'canceled',
    periodEnd: getFutureDate(15),
    description: 'Canceled subscription but still within valid period (15 days)',
  },
  canceledExpired: {
    status: 'canceled',
    periodEnd: getPastDate(5),
    description: 'Canceled subscription with expired period (5 days ago)',
  },
  pastDue: {
    status: 'past_due',
    periodEnd: getPastDate(3),
    description: 'Past due subscription - payment failed',
  },
  none: {
    status: 'none',
    periodEnd: null,
    description: 'No subscription - never subscribed',
  },
};

/**
 * Expected UI labels for subscription statuses (Japanese)
 */
export const subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  active: '有効',
  canceled: '解約済み',
  past_due: '支払い遅延',
  none: '未登録',
};

/**
 * Expected UI descriptions for subscription statuses (Japanese)
 */
export const subscriptionStatusDescriptions: Record<SubscriptionStatus, string> = {
  active: 'サブスクリプションは有効です',
  canceled: '次回更新日に自動で終了します',
  past_due: 'お支払い情報を更新してください',
  none: 'サブスクリプションに登録されていません',
};

// =============================================================================
// Matching Flow Test Data
// =============================================================================

/**
 * Seeded test user IDs from supabase/seed.test.sql
 */
export const seededUserIds = {
  activeUser: '11111111-1111-1111-1111-111111111111',
  canceledValidUser: '22222222-2222-2222-2222-222222222222',
  canceledExpiredUser: '33333333-3333-3333-3333-333333333333',
  noSubscriptionUser: '44444444-4444-4444-4444-444444444444',
  pastDueUser: '55555555-5555-5555-5555-555555555555',
  incompleteUser: '66666666-6666-6666-6666-666666666666',
  pairUser1: '77777777-7777-7777-7777-777777777777',
  pairUser2: '88888888-8888-8888-8888-888888888888',
  adminUser: '99999999-9999-9999-9999-999999999999',
};

/**
 * Seeded test event IDs from supabase/seed.test.sql
 */
export const seededEventIds = {
  shibuyaOpen: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  shinjukuOpen: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  ikebukuroOpen: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  roppongiMatched: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  omotesandoClosed: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
};

/**
 * Test user display names (from seed data)
 */
export const seededUserNames = {
  activeUser: 'アクティブユーザー',
  canceledValidUser: '解約済ユーザー（期限内）',
  canceledExpiredUser: '解約済ユーザー（期限切れ）',
  noSubscriptionUser: 'サブスクなしユーザー',
  pastDueUser: '支払い遅延ユーザー',
  incompleteUser: '未完了ユーザー',
  pairUser1: 'ペアユーザー1',
  pairUser2: 'ペアユーザー2',
  adminUser: '管理者',
};

/**
 * Match data structure for API mocking
 */
export interface MatchData {
  table_id: string;
  restaurant_name: string;
  restaurant_url: string;
  members: string[];
}

/**
 * Generate mock match data for testing
 */
export function generateMockMatchData(
  members: string[],
  options?: {
    restaurantName?: string;
    restaurantUrl?: string;
  }
): MatchData {
  return {
    table_id: `table-${Date.now()}`,
    restaurant_name: options?.restaurantName || 'テスト レストラン',
    restaurant_url: options?.restaurantUrl || 'https://example.com/restaurant',
    members,
  };
}

/**
 * Test restaurant data
 */
export const testRestaurants = {
  italian: {
    name: 'イタリアン・ビストロ 渋谷',
    url: 'https://example.com/italian-shibuya',
  },
  french: {
    name: 'フレンチバル 新宿',
    url: 'https://example.com/french-shinjuku',
  },
  japanese: {
    name: '和食処 池袋',
    url: 'https://example.com/japanese-ikebukuro',
  },
};

/**
 * Area labels mapping (Japanese)
 */
export const areaLabels: Record<string, string> = {
  shibuya: '渋谷',
  shinjuku: '新宿',
  ikebukuro: '池袋',
  roppongi: '六本木',
  ginza: '銀座',
  ebisu: '恵比寿',
  omotesando: '表参道',
};

// =============================================================================
// Review Feature Test Data
// =============================================================================

/**
 * Seeded match IDs from supabase/seed.test.sql
 */
export const seededMatchIds = {
  // Past event match (7 days ago) - reviews should be accessible
  pastEventMatch: '11111111-1111-1111-1111-111111111114',
};

/**
 * Participants in the past event match
 * All 4 users are part of table_members in this match
 */
export const matchParticipants = {
  activeUser: {
    id: seededUserIds.activeUser,
    name: seededUserNames.activeUser,
  },
  pairUser1: {
    id: seededUserIds.pairUser1,
    name: seededUserNames.pairUser1,
  },
  pairUser2: {
    id: seededUserIds.pairUser2,
    name: seededUserNames.pairUser2,
  },
  canceledValidUser: {
    id: seededUserIds.canceledValidUser,
    name: seededUserNames.canceledValidUser,
  },
};

/**
 * Review test scenarios
 */
export const reviewTestScenarios = {
  /**
   * User can review other participants (activeUser has already reviewed pairUser1)
   */
  partiallyReviewed: {
    userId: seededUserIds.activeUser,
    matchId: seededMatchIds.pastEventMatch,
    alreadyReviewed: [seededUserIds.pairUser1],
    canReview: [seededUserIds.pairUser2, seededUserIds.canceledValidUser],
  },

  /**
   * User with fresh reviews to complete
   */
  freshReviewer: {
    userId: seededUserIds.canceledValidUser,
    matchId: seededMatchIds.pastEventMatch,
    alreadyReviewed: [],
    canReview: [
      seededUserIds.activeUser,
      seededUserIds.pairUser1,
      seededUserIds.pairUser2,
    ],
  },
};

/**
 * Sample review comments for testing
 */
export const sampleReviewComments = {
  positive: '楽しい時間を過ごせました！また機会があればお話ししたいです。',
  neutral: '普通の会話ができました。',
  negative: 'あまり話が合いませんでした。',
};

/**
 * Get a date in the past (hours ago)
 */
export function getPastHours(hoursAgo: number): string {
  const date = new Date();
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
}

/**
 * Get a date in the future (hours from now)
 */
export function getFutureHours(hoursFromNow: number): string {
  const date = new Date();
  date.setHours(date.getHours() + hoursFromNow);
  return date.toISOString();
}
