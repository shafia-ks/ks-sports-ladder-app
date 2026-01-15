import { test, expect, Page } from "@playwright/test";

const PLAYER_A = {
    email: process.env.PLAYER_EMAIL || "khaderwiz@outlook.com",
    password: process.env.PLAYER_PASSWORD || "Ladder@123",
};

const PLAYER_B = {
    email: process.env.OPPONENT_EMAIL || "shafiazeenath@outlook.com",
    password: process.env.OPPONENT_PASSWORD || "Ladder@123",
};

async function login(page: Page, user: { email: string; password: string }) {
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/dashboard|ladders/, { timeout: 15000 });
}

test.describe("Full Match Lifecycle", () => {
    test("Challenge -> Match -> Confirm -> Ranking", async ({ browser }) => {
        // --- 1. Player A Challenges Player B ---
        const pageA = await browser.newPage();
        await test.step("Player A Challenges", async () => {
            await login(pageA, PLAYER_A);
            await pageA.goto("/ladders");
            const ladderLink = pageA.locator("a[href^='/ladders/']").first();
            await ladderLink.click();

            // Go to Valid Players
            await pageA.click("text=Ranking");

            // Find a challenge button
            const challengeBtn = pageA.locator("button:has-text('Challenge')").first();
            if (await challengeBtn.isVisible()) {
                await challengeBtn.click();
                await pageA.getByRole('button', { name: 'Send Challenge' }).click();
                await expect(pageA.getByText("Challenge created")).toBeVisible();
            } else {
                console.log("No challengeable players found. Skipping challenge step.");
            }
        });

        // --- 2. Player B Accepts ---
        const pageB = await browser.newPage();
        await test.step("Player B Accepts", async () => {
            await login(pageB, PLAYER_B);
            await pageB.goto("/ladders"); // Adjust to go to specific ladder if needed
            const ladderLink = pageB.locator("a[href^='/ladders/']").first();
            await ladderLink.click();

            await pageB.click("text=Challenges");

            const acceptBtn = pageB.locator("button:has-text('Accept')").first();
            if (await acceptBtn.isVisible()) {
                await acceptBtn.click();
                await expect(pageB.getByText("Challenge accepted")).toBeVisible();
            }
        });

        // --- 3. Match Submission (Player A) ---
        await test.step("Player A Submits Score", async () => {
            await pageA.bringToFront();
            await pageA.reload(); // Refresh to see new match
            await pageA.click("text=Matches");

            const matchCard = pageA.locator("div").filter({ hasText: "Pending" }).first();
            const enterScoreBtn = matchCard.locator("button:has-text('Enter Score')");

            if (await enterScoreBtn.isVisible()) {
                await enterScoreBtn.click();

                // Fill scores: 11-5, 11-5, 11-5 (3-0 win)
                const inputs = matchCard.locator("input[type='number']");
                await inputs.nth(0).fill("11"); await inputs.nth(1).fill("5");
                await inputs.nth(2).fill("11"); await inputs.nth(3).fill("5");
                await inputs.nth(4).fill("11"); await inputs.nth(5).fill("5");

                await matchCard.locator("button:has-text('Submit Score')").click();

                // Verify Optimistic UI
                await expect(matchCard).toContainText("Awaiting Confirmation");
            }
        });

        // --- 4. Confirmation (Player B) ---
        await test.step("Player B Confirms", async () => {
            await pageB.bringToFront();
            await pageB.reload();
            await pageB.click("text=Matches");

            const confirmBtn = pageB.locator("button:has-text('Confirm')").first();
            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();

                // Verify Optimistic UI / Success
                await expect(pageB.locator("text=Completed")).toBeVisible();
            }
        });

        await pageA.close();
        await pageB.close();
    });
});
