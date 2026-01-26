import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Onboarding Page (/onboarding)
 *
 * The onboarding flow has 3 steps:
 * 1. Profile - User enters display name, gender, birth date, job
 * 2. Personality Quiz - 5 questions with 2 options each
 * 3. Result - Shows personality type (Leader/Supporter/Analyst/Entertainer)
 */
export class OnboardingPage {
  readonly page: Page;

  // Progress indicator
  readonly progressBar: Locator;
  readonly stepIndicator: Locator;

  // Step 1: Profile form
  readonly profileCard: Locator;
  readonly nicknameInput: Locator;
  readonly maleButton: Locator;
  readonly femaleButton: Locator;
  readonly birthDateInput: Locator;
  readonly jobInput: Locator;
  readonly profileNextButton: Locator;

  // Step 2: Personality quiz
  readonly quizCard: Locator;
  readonly questionText: Locator;
  readonly questionProgress: Locator;
  readonly optionButtons: Locator;
  readonly progressDots: Locator;

  // Step 3: Result
  readonly resultCard: Locator;
  readonly personalityEmoji: Locator;
  readonly personalityTitle: Locator;
  readonly personalityDescription: Locator;
  readonly matchingInfoBox: Locator;
  readonly subscribeButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Progress
    this.progressBar = page.locator('.h-2.bg-neutral-200');
    this.stepIndicator = page.locator('text=/Step \\d+ \\/ 3/');

    // Profile form (Step 1)
    this.profileCard = page.locator('form').first();
    this.nicknameInput = page.locator('input[placeholder="食事中に呼ばれる名前"]');
    this.maleButton = page.locator('button', { hasText: '男性' });
    this.femaleButton = page.locator('button', { hasText: '女性' });
    this.birthDateInput = page.locator('input[type="date"]');
    this.jobInput = page.locator('input[placeholder*="エンジニア"]');
    this.profileNextButton = page.locator('button[type="submit"]', { hasText: '次へ' });

    // Quiz (Step 2)
    this.quizCard = page.locator('div', { hasText: '性格診断' }).first();
    this.questionText = page.locator('p.text-lg.font-medium');
    this.questionProgress = page.locator('text=/質問 \\d+ \\/ 5/');
    this.optionButtons = page.locator('button.w-full.p-4');
    this.progressDots = page.locator('.w-2.h-2.rounded-full');

    // Result (Step 3)
    this.resultCard = page.locator('div', { hasText: 'あなたは...' });
    this.personalityEmoji = page.locator('.text-4xl').first();
    this.personalityTitle = page.locator('h2');
    this.personalityDescription = page.locator('p.text-neutral-600').first();
    this.matchingInfoBox = page.locator('div', { hasText: '相性の良いメンバー' });
    // Updated: After payment timing change, this button now says "始める" and redirects to /dashboard
    this.subscribeButton = page.locator('button', { hasText: /始める|処理中/ });
  }

  /**
   * Navigate to onboarding page
   */
  async goto() {
    await this.page.goto('/onboarding');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify we are on step 1 (Profile)
   */
  async verifyProfileStep() {
    await expect(this.page.locator('text=プロフィール登録')).toBeVisible();
    await expect(this.nicknameInput).toBeVisible();
    await expect(this.birthDateInput).toBeVisible();
    await expect(this.jobInput).toBeVisible();
  }

  /**
   * Fill profile form with test data
   */
  async fillProfile(data: {
    nickname: string;
    gender: 'male' | 'female';
    birthDate: string;
    job: string;
  }) {
    await this.nicknameInput.fill(data.nickname);

    if (data.gender === 'male') {
      await this.maleButton.click();
    } else {
      await this.femaleButton.click();
    }

    await this.birthDateInput.fill(data.birthDate);
    await this.jobInput.fill(data.job);
  }

  /**
   * Submit profile form
   */
  async submitProfile() {
    await this.profileNextButton.click();
    // Wait for transition to quiz step
    await this.page.waitForTimeout(500);
  }

  /**
   * Verify we are on step 2 (Quiz)
   */
  async verifyQuizStep() {
    await expect(this.page.locator('text=性格診断')).toBeVisible();
    await expect(this.questionText).toBeVisible();
  }

  /**
   * Get current question text
   */
  async getCurrentQuestion(): Promise<string> {
    return (await this.questionText.textContent()) || '';
  }

  /**
   * Get available answer options
   */
  async getAnswerOptions(): Promise<string[]> {
    const options = await this.optionButtons.allTextContents();
    return options;
  }

  /**
   * Select answer by index (0 or 1)
   */
  async selectAnswer(index: number) {
    await this.optionButtons.nth(index).click();
    // Wait for animation
    await this.page.waitForTimeout(300);
  }

  /**
   * Complete all quiz questions with specified answers
   * answers: array of 0 or 1 for each question
   */
  async completeQuiz(answers: number[]) {
    for (const answerIndex of answers) {
      await this.selectAnswer(answerIndex);
      await this.page.waitForTimeout(400);
    }
  }

  /**
   * Complete quiz with random answers
   */
  async completeQuizRandomly() {
    const answers = Array.from({ length: 5 }, () => Math.floor(Math.random() * 2));
    await this.completeQuiz(answers);
  }

  /**
   * Complete quiz to get a specific personality type
   * Leader: [0, 0, 0, 0, 0] - Extrovert, Lead, Plan, Solve, Direct
   * Supporter: [1, 1, 1, 1, 1] - Introvert, Support, Intuition, Empathize, Collaborate
   */
  async completeQuizForType(type: 'Leader' | 'Supporter' | 'Analyst' | 'Entertainer') {
    const answerMap: Record<string, number[]> = {
      Leader: [0, 0, 0, 0, 0],
      Supporter: [1, 1, 1, 1, 1],
      Analyst: [1, 1, 0, 0, 1],
      Entertainer: [0, 0, 1, 1, 1],
    };
    await this.completeQuiz(answerMap[type]);
  }

  /**
   * Verify we are on step 3 (Result)
   */
  async verifyResultStep() {
    await expect(this.page.locator('text=あなたは...')).toBeVisible();
    await expect(this.subscribeButton).toBeVisible();
  }

  /**
   * Get the personality type result
   */
  async getPersonalityType(): Promise<string> {
    const title = await this.personalityTitle.textContent();
    return title || '';
  }

  /**
   * Click proceed to subscription button
   */
  async proceedToSubscription() {
    await this.subscribeButton.click();
  }

  /**
   * Complete the entire onboarding flow
   */
  async completeOnboarding(profile: {
    nickname: string;
    gender: 'male' | 'female';
    birthDate: string;
    job: string;
  }) {
    await this.fillProfile(profile);
    await this.submitProfile();
    await this.verifyQuizStep();
    await this.completeQuizRandomly();
    await this.verifyResultStep();
  }

  /**
   * Take screenshot of current step
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/onboarding-${name}.png`,
    });
  }
}
