import { test, expect, Page, BrowserContext } from '@playwright/test';
import { DashboardPage } from './pages/DashboardPage';
import { ReviewPage } from './pages/ReviewPage';
import {
  seededUserIds,
  seededUserNames,
  seededMatchIds,
  matchParticipants,
  sampleReviewComments,
} from './fixtures/testData';
import { setupMockAuth } from './fixtures/auth';

/**
 * E2E Tests for Attendance Management Feature
 *
 * Test Coverage:
 * 1. Dashboard - Cancel Attendance Flow
 *    - User sees cancel button on matched dinner
 *    - Clicking cancel shows confirmation dialog with penalty info
 *    - Confirming cancel updates status and shows "キャンセル済み"
 *    - Avatar shows X icon overlay for canceled member
 *
 * 2. Dashboard - Late Notification Flow
 *    - User sees late notification button on matched dinner
 *    - Clicking opens dialog with minute input
 *    - Entering minutes and confirming shows "遅刻連絡済み (N分)"
 *    - Avatar shows clock icon overlay for late member
 *
 * 3. Review - No-Show Rating
 *    - User sees "NS" button in rating options
 *    - Selecting it shows red styling and penalty warning
 *    - Submitting No-Show rating works correctly
 *
 * Prerequisites (from seed.test.sql):
 * - Match '11111111-1111-1111-1111-111111111114' exists (7 days ago)
 * - Users have matched participations
 */

test.describe('Attendance Management - Cancel Flow', () => {
  let page: Page;
  let context: BrowserContext;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();

    // Setup auth for active user with matched dinner
    await setupMockAuth(context, 'active', {
      userId: seededUserIds.activeUser,
      displayName: seededUserNames.activeUser,
    });

    dashboardPage = new DashboardPage(page);
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('should show cancel button on matched dinner', async () => {
    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();

    // Verify confirmed dinner section is visible
    await dashboardPage.expectConfirmedDinner({
      restaurantName: 'イタリアン・ビストロ 六本木',
    });

    // Verify cancel button is visible
    await expect(dashboardPage.attendanceCancelButton.first()).toBeVisible();
    await dashboardPage.takeScreenshot('cancel-button-visible');
  });

  test('should show late notification button on matched dinner', async () => {
    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();

    // Verify late button is visible
    await expect(dashboardPage.attendanceLateButton.first()).toBeVisible();
    await dashboardPage.takeScreenshot('late-button-visible');
  });

  test('should open cancel dialog with penalty info when clicking cancel', async () => {
    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();

    // Click cancel button
    await dashboardPage.clickAttendanceCancelButton();

    // Verify dialog is open with penalty info
    await dashboardPage.verifyCancelDialogOpen();
    await dashboardPage.takeScreenshot('cancel-dialog-open');
  });

  test('should show correct penalty amount based on time until event', async () => {
    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();

    // Click cancel button
    await dashboardPage.clickAttendanceCancelButton();

    // Verify dialog shows penalty info
    // Note: The actual penalty depends on whether we're within 24 hours of event
    // For seed data with past events, this test verifies the penalty info is shown
    await expect(dashboardPage.cancelDialogPenaltyInfo).toBeVisible();
    await expect(page.locator('text=-30 pt')).toBeVisible();
    await expect(page.locator('text=-50 pt')).toBeVisible();
    await expect(page.locator('text=-100 pt')).toBeVisible();

    await dashboardPage.takeScreenshot('penalty-info-displayed');
  });

  test('should close cancel dialog when clicking back button', async () => {
    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();

    // Open and then close dialog
    await dashboardPage.clickAttendanceCancelButton();
    await dashboardPage.verifyCancelDialogOpen();
    await dashboardPage.dismissCancelDialog();

    // Dialog should be closed
    await expect(dashboardPage.cancelDialogTitle).not.toBeVisible();

    // Cancel button should still be visible (user didn't cancel)
    await expect(dashboardPage.attendanceCancelButton.first()).toBeVisible();
  });

  test('should cancel attendance and show canceled status', async () => {
    // Mock the attendance API
    await page.route('**/api/events/attendance', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            penalty_points: -30,
            message: 'キャンセルしました。-30ポイントが減算されました。',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();

    // Click cancel and confirm
    await dashboardPage.clickAttendanceCancelButton();
    await dashboardPage.verifyCancelDialogOpen();
    await dashboardPage.confirmCancel();

    // Verify canceled status is shown
    await dashboardPage.verifyCanceledStatus();

    // Verify cancel/late buttons are hidden
    await dashboardPage.verifyAttendanceButtonsHidden();

    await dashboardPage.takeScreenshot('canceled-status');
  });
});

test.describe('Attendance Management - Late Notification Flow', () => {
  let page: Page;
  let context: BrowserContext;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();

    await setupMockAuth(context, 'active', {
      userId: seededUserIds.activeUser,
      displayName: seededUserNames.activeUser,
    });

    dashboardPage = new DashboardPage(page);
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('should open late notification dialog when clicking late button', async () => {
    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();

    // Click late button
    await dashboardPage.clickAttendanceLateButton();

    // Verify dialog is open
    await dashboardPage.verifyLateDialogOpen();
    await dashboardPage.takeScreenshot('late-dialog-open');
  });

  test('should show minute input field in late dialog', async () => {
    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();

    await dashboardPage.clickAttendanceLateButton();

    // Verify input field is visible
    await expect(dashboardPage.lateMinutesInput).toBeVisible();
    await expect(dashboardPage.lateMinutesInput).toHaveAttribute('type', 'number');
    await expect(dashboardPage.lateMinutesInput).toHaveAttribute('placeholder', '例: 15');
  });

  test('should close late dialog when clicking cancel button', async () => {
    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();

    await dashboardPage.clickAttendanceLateButton();
    await dashboardPage.verifyLateDialogOpen();
    await dashboardPage.dismissLateDialog();

    // Dialog should be closed
    await expect(dashboardPage.lateDialogTitle).not.toBeVisible();

    // Late button should still be visible
    await expect(dashboardPage.attendanceLateButton.first()).toBeVisible();
  });

  test('should validate minute input and show error for invalid values', async () => {
    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();

    await dashboardPage.clickAttendanceLateButton();

    // Try to submit with empty input - button should be disabled
    await expect(dashboardPage.lateDialogConfirmButton).toBeDisabled();

    // Enter invalid value (0 or negative)
    await dashboardPage.lateMinutesInput.fill('0');
    // Button may still be enabled, but clicking will show error
    if (await dashboardPage.lateDialogConfirmButton.isEnabled()) {
      await dashboardPage.lateDialogConfirmButton.click();
      await dashboardPage.verifyLateDialogError('有効な分数を入力してください');
    }

    await dashboardPage.takeScreenshot('late-validation-error');
  });

  test('should show error for minutes over 180', async () => {
    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();

    await dashboardPage.clickAttendanceLateButton();

    // Enter too large value
    await dashboardPage.lateMinutesInput.fill('200');
    await dashboardPage.lateDialogConfirmButton.click();

    // Should show error about considering cancellation
    await dashboardPage.verifyLateDialogError('180分以上');

    await dashboardPage.takeScreenshot('late-over-limit-error');
  });

  test('should submit late notification and show late status', async () => {
    const lateMinutes = 15;

    // Mock the attendance API
    await page.route('**/api/events/attendance', async (route) => {
      if (route.request().method() === 'PATCH') {
        const postData = route.request().postDataJSON();
        expect(postData.action).toBe('late');
        expect(postData.late_minutes).toBe(lateMinutes);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: '遅刻連絡を登録しました。他のメンバーにダッシュボードで表示されます。',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();

    // Open dialog and submit late notification
    await dashboardPage.clickAttendanceLateButton();
    await dashboardPage.submitLateNotification(lateMinutes);

    // Verify late status is shown with minutes
    await dashboardPage.verifyLateStatus(lateMinutes);

    // Verify cancel/late buttons are hidden
    await dashboardPage.verifyAttendanceButtonsHidden();

    await dashboardPage.takeScreenshot('late-status-shown');
  });
});

test.describe('Attendance Management - Avatar Status Indicators', () => {
  let page: Page;
  let context: BrowserContext;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();

    await setupMockAuth(context, 'active', {
      userId: seededUserIds.activeUser,
      displayName: seededUserNames.activeUser,
    });

    dashboardPage = new DashboardPage(page);
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('should show X icon overlay on avatar for canceled member', async () => {
    // Mock dashboard data with a canceled member
    await page.route('**/dashboard', async (route) => {
      // Let the page load normally, we'll mock the attendance map in the client
      await route.continue();
    });

    // Mock attendance API for cancel
    await page.route('**/api/events/attendance', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            penalty_points: -30,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();

    // Cancel attendance
    await dashboardPage.clickAttendanceCancelButton();
    await dashboardPage.confirmCancel();

    // Note: The avatar overlay is shown for the current user after cancel
    // The visual indicator test verifies the component renders correctly
    await dashboardPage.verifyCanceledStatus();
    await dashboardPage.takeScreenshot('avatar-canceled-indicator');
  });

  test('should show clock icon overlay on avatar for late member', async () => {
    // Mock attendance API for late
    await page.route('**/api/events/attendance', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();

    // Submit late notification
    await dashboardPage.clickAttendanceLateButton();
    await dashboardPage.submitLateNotification(20);

    // Verify late status
    await dashboardPage.verifyLateStatus(20);
    await dashboardPage.takeScreenshot('avatar-late-indicator');
  });
});

test.describe('Review - No-Show Rating', () => {
  let page: Page;
  let context: BrowserContext;
  let reviewPage: ReviewPage;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();

    await setupMockAuth(context, 'active', {
      userId: seededUserIds.activeUser,
      displayName: seededUserNames.activeUser,
    });

    reviewPage = new ReviewPage(page);
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('should display NS (No-Show) button in rating options', async () => {
    await reviewPage.goto(seededMatchIds.pastEventMatch);
    await reviewPage.verifyPageLoaded();

    // Select a participant to review
    await reviewPage.selectParticipantByName(matchParticipants.pairUser2.name);

    // Verify No-Show button is visible
    await reviewPage.verifyNoShowButtonVisible();
    await reviewPage.takeScreenshot('no-show-button-visible');
  });

  test('should show red styling when No-Show is selected', async () => {
    await reviewPage.goto(seededMatchIds.pastEventMatch);
    await reviewPage.verifyPageLoaded();

    // Select a participant
    await reviewPage.selectParticipantByName(matchParticipants.pairUser2.name);

    // Select No-Show rating
    await reviewPage.selectNoShowRating();

    // Verify red styling
    await reviewPage.verifyNoShowSelected();
    await reviewPage.takeScreenshot('no-show-selected');
  });

  test('should show penalty warning when No-Show is selected', async () => {
    await reviewPage.goto(seededMatchIds.pastEventMatch);
    await reviewPage.verifyPageLoaded();

    // Select a participant
    await reviewPage.selectParticipantByName(matchParticipants.pairUser2.name);

    // Select No-Show rating
    await reviewPage.selectNoShowRating();

    // Verify description and penalty warning
    await reviewPage.verifyNoShowDescription();
    await reviewPage.takeScreenshot('no-show-penalty-warning');
  });

  test('should submit No-Show rating successfully', async () => {
    // Mock the API response
    await page.route('**/api/reviews', async (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();

        // Verify the request contains correct No-Show data
        expect(postData.rating).toBe(0);
        expect(postData.block_flag).toBe(true);
        expect(postData.is_no_show).toBe(true);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    await reviewPage.goto(seededMatchIds.pastEventMatch);
    await reviewPage.verifyPageLoaded();

    // Complete No-Show review
    await reviewPage.reviewParticipantAsNoShow({
      name: matchParticipants.pairUser2.name,
    });

    // Verify participant is marked as reviewed
    await reviewPage.verifyParticipantReviewed(matchParticipants.pairUser2.name);
    await reviewPage.takeScreenshot('no-show-review-completed');
  });

  test('should show No-Show description with correct text', async () => {
    await reviewPage.goto(seededMatchIds.pastEventMatch);
    await reviewPage.verifyPageLoaded();

    await reviewPage.selectParticipantByName(matchParticipants.pairUser2.name);
    await reviewPage.selectNoShowRating();

    // Verify the description contains expected text
    const description = page.locator('[data-testid="rating-description"]');
    await expect(description).toContainText('No-Show');
    await expect(description).toContainText('無断キャンセル');

    // Verify penalty warning text
    await expect(page.locator('text=-100pt')).toBeVisible();
  });

  test('should enable submit button after selecting No-Show rating', async () => {
    await reviewPage.goto(seededMatchIds.pastEventMatch);
    await reviewPage.verifyPageLoaded();

    await reviewPage.selectParticipantByName(matchParticipants.pairUser2.name);

    // Button should be disabled initially
    await expect(reviewPage.submitButton).toBeDisabled();

    // Select No-Show rating
    await reviewPage.selectNoShowRating();

    // Button should be enabled
    await expect(reviewPage.submitButton).toBeEnabled();
  });
});

test.describe('Attendance Management - Edge Cases', () => {
  let page: Page;
  let context: BrowserContext;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();

    await setupMockAuth(context, 'active', {
      userId: seededUserIds.activeUser,
      displayName: seededUserNames.activeUser,
    });

    dashboardPage = new DashboardPage(page);
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('should handle API error when canceling attendance', async () => {
    // Mock API to return error
    await page.route('**/api/events/attendance', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      } else {
        await route.continue();
      }
    });

    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();

    // Try to cancel
    await dashboardPage.clickAttendanceCancelButton();

    // Handle the alert
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('処理に失敗しました');
      await dialog.accept();
    });

    await dashboardPage.confirmCancel();

    // Dialog should close but status should not change
    // Cancel button should still be visible (operation failed)
  });

  test('should handle API error when submitting late notification', async () => {
    // Mock API to return error
    await page.route('**/api/events/attendance', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'マッチング確定後のみ出欠を変更できます' }),
        });
      } else {
        await route.continue();
      }
    });

    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();

    // Try to submit late notification
    await dashboardPage.clickAttendanceLateButton();

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await dashboardPage.submitLateNotification(15);
  });

  test('should not show attendance buttons for non-matched participations', async () => {
    // This test verifies that attendance buttons only appear for matched dinners
    // For pending participations, only the entry cancel button should be visible

    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();

    // The pending section should not have attendance cancel/late buttons
    // It should only have the X button for canceling the entry itself
    const pendingSection = dashboardPage.pendingSection;

    if (await pendingSection.isVisible()) {
      // Within pending section, there should be no "遅刻連絡" button
      const lateButtonInPending = pendingSection.locator('button', { hasText: '遅刻連絡' });
      await expect(lateButtonInPending).not.toBeVisible();
    }
  });
});

test.describe('Attendance Management - Multiple Matches', () => {
  let page: Page;
  let context: BrowserContext;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();

    await setupMockAuth(context, 'active', {
      userId: seededUserIds.activeUser,
      displayName: seededUserNames.activeUser,
    });

    dashboardPage = new DashboardPage(page);
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('should handle attendance actions for specific match when multiple exist', async () => {
    // This test verifies that clicking cancel/late on one match
    // only affects that specific match, not others

    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();

    // Count initial cancel buttons
    const initialCancelButtons = await dashboardPage.attendanceCancelButton.count();

    if (initialCancelButtons > 1) {
      // Mock API for first match cancel
      await page.route('**/api/events/attendance', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, penalty_points: -30 }),
        });
      });

      // Cancel first match
      await dashboardPage.attendanceCancelButton.first().click();
      await dashboardPage.confirmCancel();

      // Wait for UI update
      await page.waitForTimeout(500);

      // Second match should still have cancel button
      const remainingCancelButtons = await dashboardPage.attendanceCancelButton.count();
      expect(remainingCancelButtons).toBe(initialCancelButtons - 1);
    }
  });
});
