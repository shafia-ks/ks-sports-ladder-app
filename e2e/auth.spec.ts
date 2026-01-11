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

test.describe("Authentication Flow", () => {
    test("User can login successfully", async ({ page }) => {
        await login(page, PLAYER_EMAIL, PLAYER_PASSWORD);
        await expect(page).toHaveURL("/");
        // Check for dashboard or nav element
        await expect(page.locator("nav")).toBeVisible();
    });

    test("Protected route redirects to login", async ({ page }) => {
        await page.goto("/dashboard");
        await expect(page).toHaveURL(/\/login/);
    });

    test("User can logout", async ({ page }) => {
        await login(page, PLAYER_EMAIL, PLAYER_PASSWORD);
        await page.goto("/profile"); // Ensure we are on a page where logout is accessible or use direct url if applicable

        // Using direct logout URL if UI button is hidden or complex
        await page.goto("/logout").catch(() => { });
        // Or try clicking button if visible
        // await page.getByRole("button", { name: /Sign out/i }).click();

        await expect(page).toHaveURL(/\/login/);
    });
});
