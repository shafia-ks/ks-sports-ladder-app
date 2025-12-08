import { test, expect } from "@playwright/test";

test.describe("Ladder App E2E", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Sports ladder challenges");
  });

  test("can navigate to ladders page", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Browse ladders");
    await expect(page).toHaveURL(/\/ladders/);
  });

  test("dashboard shows widgets", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("text=My Rank")).toBeVisible();
    await expect(page.locator("text=Active Challenges")).toBeVisible();
  });
});
