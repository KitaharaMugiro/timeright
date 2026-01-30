import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Landing Page (/)
 *
 * The landing page is the main entry point for the Dine Tokyo(ダイントーキョー) app.
 * Updated for the new dark mode design with:
 * - Glassmorphism header and components
 * - Hero section with AnimatedGradientText and particles
 * - How it works section (4 steps with STEP X format)
 * - Features section (3 features)
 * - Testimonials with Marquee
 * - FAQ section
 * - Footer CTA with particles
 */
export class LandingPage {
  readonly page: Page;

  // Header elements
  readonly header: Locator;
  readonly logo: Locator;
  readonly loginButton: Locator;

  // Hero section
  readonly heroSection: Locator;
  readonly heroTitle: Locator;
  readonly heroSubtitle: Locator;
  readonly heroCTAButton: Locator;
  readonly nextEventBadge: Locator;

  // How it works section
  readonly howItWorksSection: Locator;
  readonly steps: Locator;

  // Features section
  readonly featuresSection: Locator;
  readonly featureCards: Locator;

  // Testimonials section
  readonly testimonialsSection: Locator;

  // FAQ section
  readonly faqSection: Locator;
  readonly faqItems: Locator;

  // Footer section
  readonly footer: Locator;
  readonly footerCTAButton: Locator;
  readonly termsLink: Locator;
  readonly privacyLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header - glassmorphism style
    this.header = page.locator('header');
    this.logo = page.locator('header a[href="/"]');
    this.loginButton = page.locator('header button', { hasText: /ログイン/ });

    // Hero section - new design with "Dine Tokyo(ダイントーキョー)"
    this.heroSection = page.locator('section').first();
    this.heroTitle = page.locator('h1');
    this.heroSubtitle = page.locator('text=人生は、予測不能な「点」でできている。');
    this.heroCTAButton = page.locator('button', { hasText: /メンバーになる/ }).first();
    this.nextEventBadge = page.locator('text=次回開催');

    // How it works section - uses "STEP X" format now
    this.howItWorksSection = page.locator('section', { hasText: 'HOW IT WORKS' });
    this.steps = page.locator('text=/STEP \\d/');

    // Features section
    this.featuresSection = page.locator('section', { hasText: 'Dine Tokyo(ダイントーキョー) の特徴' });
    this.featureCards = this.featuresSection.locator('text=/安心の会員制|シンプルな料金|手間いらず/');

    // Testimonials section
    this.testimonialsSection = page.locator('section', { hasText: 'VOICES' });

    // FAQ section
    this.faqSection = page.locator('section', { hasText: 'よくある質問' });
    this.faqItems = page.locator('text=/安全性は大丈夫|料金はいくら|1人で参加|どんな人が参加/');

    // Footer - no contact link in new design
    this.footer = page.locator('footer');
    this.footerCTAButton = page.locator('section').last().locator('button', { hasText: /メンバーになる/ });
    this.termsLink = page.locator('a[href="/terms"]');
    this.privacyLink = page.locator('a[href="/privacy"]');
  }

  /**
   * Navigate to landing page
   */
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify page title contains expected text
   */
  async verifyPageTitle() {
    await expect(this.page).toHaveTitle(/Dine Tokyo(ダイントーキョー)/i);
  }

  /**
   * Verify header is visible and contains logo
   */
  async verifyHeader() {
    await expect(this.header).toBeVisible();
    await expect(this.logo).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  /**
   * Verify hero section content - updated for new design
   * Hero now shows "Dine Tokyo(ダイントーキョー)" with animated gradient text
   */
  async verifyHeroSection() {
    await expect(this.heroTitle).toBeVisible();
    // New hero title: "Dine Tokyo(ダイントーキョー)"
    await expect(this.heroTitle).toContainText(/Dine Tokyo(ダイントーキョー)/i);
    await expect(this.heroCTAButton).toBeVisible();
    await expect(this.nextEventBadge).toBeVisible();
  }

  /**
   * Verify how it works section has all 4 steps
   * Updated for new design using "STEP X" format
   */
  async verifyHowItWorksSection() {
    await expect(this.howItWorksSection).toBeVisible();
    const stepCount = await this.steps.count();
    expect(stepCount).toBe(4);
  }

  /**
   * Verify features section has all 3 features
   */
  async verifyFeaturesSection() {
    await expect(this.featuresSection).toBeVisible();
    const featureCount = await this.featureCards.count();
    expect(featureCount).toBe(3);
  }

  /**
   * Verify FAQ section has all questions
   */
  async verifyFAQSection() {
    await expect(this.faqSection).toBeVisible();
    const faqCount = await this.faqItems.count();
    expect(faqCount).toBe(4);
  }

  /**
   * Verify footer content - updated for new design (no contact link)
   */
  async verifyFooter() {
    await expect(this.footer).toBeVisible();
    await expect(this.termsLink).toBeVisible();
    await expect(this.privacyLink).toBeVisible();
  }

  /**
   * Click login button (triggers LINE OAuth redirect)
   */
  async clickLogin() {
    await this.loginButton.click();
  }

  /**
   * Click main CTA button
   */
  async clickHeroCTA() {
    await this.heroCTAButton.click();
  }

  /**
   * Click footer CTA button
   */
  async clickFooterCTA() {
    await this.footerCTAButton.click();
  }

  /**
   * Get the price text from the page
   */
  async getPriceText(): Promise<string> {
    const priceElement = this.page.locator('text=1,980円');
    return await priceElement.textContent() || '';
  }

  /**
   * Scroll to a specific section
   */
  async scrollToSection(section: 'features' | 'howItWorks' | 'faq' | 'footer') {
    const sectionMap = {
      features: this.featuresSection,
      howItWorks: this.howItWorksSection,
      faq: this.faqSection,
      footer: this.footer,
    };
    await sectionMap[section].scrollIntoViewIfNeeded();
  }

  /**
   * Take screenshot of current state
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: false,
    });
  }

  /**
   * Take full page screenshot
   */
  async takeFullPageScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-full.png`,
      fullPage: true,
    });
  }
}
