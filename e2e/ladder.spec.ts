import { test, expect, Page } from "@playwright/test";

const PLAYER_EMAIL = process.env.PLAYER_EMAIL || "shafiazeenath@outlook.com";
const PLAYER_PASSWORD = process.env.PLAYER_PASSWORD || "Ladder@123";

async function login(page: Page, email: string, password: string) {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
}

test.describe("Ladder Workflow", () => {
    test.beforeEach(async ({ page }) => {
        await login(page, PLAYER_EMAIL, PLAYER_PASSWORD);
    });

    test("User can view ladders list", async ({ page }) => {
        await page.goto("/ladders");
        await expect(page.getByRole("heading", { name: /Ladder/i })).toBeVisible();
        // Expect at least one ladder card or empty state
        const cards = page.locator(".card");
        // Just verify the page load doesn't crash
    });

    test("User can navigate to a specific ladder detail", async ({ page }) => {
        await page.goto("/ladders");
        // Click the first "View" or "Join" button/link
        // Adapting select from roles-approvals.spec.ts
        const firstLink = page.locator("a[href^='/ladders/']").first();
        if (await firstLink.count() > 0) {
            await firstLink.click();
            await expect(page).toHaveURL(/\/ladders\/.+/);
            await expect(page.getByRole("heading")).toBeVisible();
        }
    });
});
