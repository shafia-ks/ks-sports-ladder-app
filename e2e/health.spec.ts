import { test, expect } from "@playwright/test";

// This test verifies environment configuration and basic DB connectivity
// via the `/api/health` endpoint. It will fail with a clear message
// if required Supabase env vars are missing or the DB probe fails.

test.describe("Health endpoint", () => {
  test("reports configured and db ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status(), "GET /api/health should be OK").toBe(200);
    const json = await res.json();

    const { env, supabaseAdminAvailable, dbOk, dbError } = json;

    // Assert env keys are present
    expect(env?.hasUrl, "NEXT_PUBLIC_SUPABASE_URL is missing").toBe(true);
    expect(env?.hasAnon, "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing").toBe(true);
    expect(env?.hasService, "SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) is missing").toBe(true);

    // Assert server-side client is available
    expect(
      Boolean(supabaseAdminAvailable),
      "Supabase admin client is not available; check server env vars"
    ).toBe(true);

    // Assert DB probe succeeded
    expect(dbOk, `Supabase DB probe failed: ${dbError ?? "unknown error"}`).toBe(true);
  });
});
