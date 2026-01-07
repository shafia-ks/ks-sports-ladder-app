import { test, expect, Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "khaderwiz@outlook.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Fatima@432";
const PLAYER_EMAIL = process.env.PLAYER_EMAIL || "khader.mohmmad@outlook.com";
const PLAYER_PASSWORD = process.env.PLAYER_PASSWORD || "Fatima@432";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  // Wait for navigation away from login
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });

  // Confirm auth token is present (Supabase stores in localStorage)
  await page.waitForFunction(() => {
    try {
      return !!localStorage.getItem("supabase.auth.token");
    } catch (e) {
      return false;
    }
  }, undefined, { timeout: 10000 });

  // Best-effort check for Sign out button (may be hidden on small viewports)
  const signOut = page.getByRole("button", { name: /Sign out/i });
  await signOut.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
}

test.describe("Roles & approvals workflow", () => {
  test("player joins ladder and requests leader; admin approves; UI updates", async ({ page }) => {
    // Player login
    await login(page, PLAYER_EMAIL, PLAYER_PASSWORD);

    // Go to Ladders and join first available ladder
    await page.goto("/ladders");
    // If no ladders, skip gracefully
    const ladderCards = page.locator(".card:has-text('Create ladder')");
    await page.goto("/ladders");
    await expect(page.locator("text=Ladders")).toBeVisible();

    // Choose first ladder card that has Join CTA
    const joinButtons = page.locator("button:has-text('Join ladder'), a:has-text('Join')");
    const joinCount = await joinButtons.count();
    if (joinCount > 0) {
      await joinButtons.first().click();
    }

    // Navigate into the first ladder detail via list link
    const ladderLinks = page.locator("a.btn.btn-primary:has-text('Join')");
    const linkCount = await ladderLinks.count();
    if (linkCount > 0) {
      await ladderLinks.first().click();
    }

    // On ladder detail, request to lead if visible
    const leaderRequestCTA = page.locator("text=Request to Lead This Ladder");
    if (await leaderRequestCTA.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Open form
      await page.locator("text=Submit Request →").click();
      // Fill reason
      await page.getByRole("textbox", { name: /why/i }).fill("I can organize this ladder.");
      // Submit
      await page.getByRole("button", { name: "Submit Request" }).click();
      await expect(page.locator("text=Request submitted")).toBeVisible({ timeout: 10000 });
    }

    // Logout
    await page.goto("/logout").catch(() => {});

    // Admin login
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Admin reviews leader requests
    await page.goto("/admin/leader-requests");
    await expect(page.locator("text=Organizer Requests")).toBeVisible();
    const approveBtn = page.getByRole("button", { name: /Approve/ });
    if (await approveBtn.count() > 0) {
      await approveBtn.first().click();
      // Wait for status flip
      await expect(page.locator("text=Approved")).toBeVisible({ timeout: 10000 });
    }

    // Verify player now sees organizer UI on ladder page
    // Admin logs out
    await page.goto("/logout").catch(() => {});
    await login(page, PLAYER_EMAIL, PLAYER_PASSWORD);

    // Visit ladder again via dashboard recent or ladders list
    await page.goto("/ladders");
    // Click the same ladder (best effort)
    const ladderDetailLink = page.locator("a:has-text('Join')").first();
    if (await ladderDetailLink.count() > 0) {
      await ladderDetailLink.click();
    }

    // Organizer UI should be visible (Manage Rankings button)
    const manageRankings = page.locator("text=Manage Rankings");
    await expect(manageRankings).toBeVisible({ timeout: 15000 });
  });

  test("Create ladder button hidden for players; visible for admin", async ({ page }) => {
    // Player login
    await login(page, PLAYER_EMAIL, PLAYER_PASSWORD);
    await page.goto("/ladders");
    await expect(page.locator("text=Create ladder")).toHaveCount(0);

    // Admin login
    await page.goto("/logout").catch(() => {});
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/ladders");
    await expect(page.locator("text=Create ladder")).toBeVisible({ timeout: 15000 });
  });
});
