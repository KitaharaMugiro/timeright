import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Profile Page (/profile)
 *
 * Features:
 * - Avatar upload (click camera icon, select file)
 * - Avatar delete (click trash icon when avatar exists)
 * - Loading spinner during upload
 * - Edit display name and job
 * - View personality type
 * - Links to settings and subscription
 *
 * Dark mode design with:
 * - Glassmorphism cards
 * - Particles background
 * - Amber accent colors
 */
export class ProfilePage {
  readonly page: Page;

  // Page elements
  readonly pageContainer: Locator;
  readonly header: Locator;
  readonly backButton: Locator;
  readonly pageTitle: Locator;

  // Avatar section
  readonly avatarContainer: Locator;
  readonly avatarImage: Locator;
  readonly defaultUserIcon: Locator;
  readonly loadingSpinner: Locator;
  readonly cameraButton: Locator;
  readonly deleteButton: Locator;
  readonly fileInput: Locator;

  // Profile info section
  readonly displayName: Locator;
  readonly userGender: Locator;
  readonly userAge: Locator;

  // Edit section
  readonly editButton: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly displayNameInput: Locator;
  readonly jobInput: Locator;

  // Messages
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  // Personality section
  readonly personalitySection: Locator;
  readonly personalityLabel: Locator;
  readonly personalityDescription: Locator;

  // Quick links
  readonly settingsLink: Locator;
  readonly subscriptionLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main container
    this.pageContainer = page.locator('main');

    // Header
    this.header = page.locator('header');
    this.backButton = page.locator('a', { hasText: '戻る' });
    this.pageTitle = page.locator('h1');

    // Avatar section - using the relative container with avatar
    this.avatarContainer = page.locator('.relative.w-24.h-24');
    this.avatarImage = this.avatarContainer.locator('img');
    // The large user icon (w-12 h-12) in the avatar container, not the small one in the profile info
    this.defaultUserIcon = this.avatarContainer.locator('svg.lucide-user.w-12');
    this.loadingSpinner = this.avatarContainer.locator('svg.lucide-loader-2');
    this.cameraButton = page.locator('button', { has: page.locator('svg.lucide-camera') });
    this.deleteButton = page.locator('button', { has: page.locator('svg.lucide-trash-2') });
    this.fileInput = page.locator('input[type="file"]');

    // Profile display
    this.displayName = page.locator('h2.text-2xl.font-serif');
    this.userGender = page.locator('p.text-slate-400');
    this.userAge = page.locator('p.text-slate-400');

    // Edit controls
    this.editButton = page.locator('button', { hasText: '編集' });
    this.saveButton = page.locator('button', { hasText: /保存/ });
    this.cancelButton = page.locator('button', { hasText: 'キャンセル' });
    this.displayNameInput = page.locator('input').first();
    this.jobInput = page.locator('input').nth(1);

    // Messages
    this.successMessage = page.locator('text=保存しました');
    this.errorMessage = page.locator('div.text-red-400');

    // Personality section
    this.personalitySection = page.locator('section, div').filter({ hasText: 'パーソナリティタイプ' }).first();
    this.personalityLabel = this.personalitySection.locator('p.text-xl.font-serif');
    this.personalityDescription = this.personalitySection.locator('p.text-slate-400');

    // Quick links
    this.settingsLink = page.locator('a[href="/settings"]');
    this.subscriptionLink = page.locator('a[href="/settings/subscription"]');
  }

  /**
   * Navigate to profile page
   */
  async goto() {
    await this.page.goto('/profile');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify page loaded correctly
   */
  async verifyPageLoaded() {
    await expect(this.pageContainer).toBeVisible();
    await expect(this.displayName).toBeVisible();
  }

  /**
   * Verify redirect to home (unauthenticated)
   */
  async verifyRedirectToHome() {
    await expect(this.page).toHaveURL('/');
  }

  /**
   * Check if avatar image is displayed (vs default icon)
   */
  async hasAvatarImage(): Promise<boolean> {
    return await this.avatarImage.isVisible();
  }

  /**
   * Check if default user icon is displayed
   */
  async hasDefaultIcon(): Promise<boolean> {
    return await this.defaultUserIcon.isVisible();
  }

  /**
   * Check if loading spinner is visible
   */
  async isUploading(): Promise<boolean> {
    return await this.loadingSpinner.isVisible();
  }

  /**
   * Upload an avatar image file
   *
   * @param filePath - Path to the image file to upload
   */
  async uploadAvatar(filePath: string) {
    // Click the camera button to trigger file selection
    // Since the file input is hidden, we need to set files directly
    await this.fileInput.setInputFiles(filePath);
  }

  /**
   * Click the camera button (avatar upload trigger)
   */
  async clickCameraButton() {
    await this.cameraButton.click();
  }

  /**
   * Delete the current avatar
   */
  async deleteAvatar() {
    await expect(this.deleteButton).toBeVisible();
    await this.deleteButton.click();
  }

  /**
   * Wait for avatar upload to complete
   */
  async waitForUploadComplete() {
    // Wait for loading spinner to disappear
    await expect(this.loadingSpinner).not.toBeVisible({ timeout: 30000 });
    // Wait for success message
    await expect(this.successMessage).toBeVisible({ timeout: 10000 });
  }

  /**
   * Wait for delete to complete
   */
  async waitForDeleteComplete() {
    await expect(this.loadingSpinner).not.toBeVisible({ timeout: 30000 });
    await expect(this.successMessage).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify avatar image is displayed
   */
  async expectAvatarImage() {
    await expect(this.avatarImage).toBeVisible();
  }

  /**
   * Verify default user icon is displayed (no avatar)
   */
  async expectDefaultIcon() {
    await expect(this.defaultUserIcon).toBeVisible();
    await expect(this.avatarImage).not.toBeVisible();
  }

  /**
   * Verify delete button is visible (only when avatar exists)
   */
  async expectDeleteButtonVisible() {
    await expect(this.deleteButton).toBeVisible();
  }

  /**
   * Verify delete button is hidden (no avatar)
   */
  async expectDeleteButtonHidden() {
    await expect(this.deleteButton).not.toBeVisible();
  }

  /**
   * Verify loading spinner is visible
   */
  async expectLoadingSpinner() {
    await expect(this.loadingSpinner).toBeVisible();
  }

  /**
   * Verify success message is displayed
   */
  async expectSuccessMessage() {
    await expect(this.successMessage).toBeVisible();
  }

  /**
   * Verify error message is displayed
   */
  async expectErrorMessage(text?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (text) {
      await expect(this.errorMessage).toContainText(text);
    }
  }

  /**
   * Get current avatar URL
   */
  async getAvatarUrl(): Promise<string | null> {
    if (await this.avatarImage.isVisible()) {
      return await this.avatarImage.getAttribute('src');
    }
    return null;
  }

  /**
   * Get display name text
   */
  async getDisplayName(): Promise<string> {
    return await this.displayName.textContent() || '';
  }

  /**
   * Navigate back to dashboard
   */
  async goBack() {
    await this.backButton.click();
    await this.page.waitForURL('**/dashboard');
  }

  /**
   * Navigate to settings
   */
  async goToSettings() {
    await this.settingsLink.click();
    await this.page.waitForURL('**/settings');
  }

  /**
   * Navigate to subscription settings
   */
  async goToSubscription() {
    await this.subscriptionLink.click();
    await this.page.waitForURL('**/settings/subscription');
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/profile-${name}.png`,
    });
  }
}
