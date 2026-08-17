import { inMemoryRateLimit, resetInMemoryStore } from "../rate-limit";

describe("inMemoryRateLimit", () => {
  beforeEach(() => resetInMemoryStore());

  it("allows first request", () => {
    const result = inMemoryRateLimit("user:1", 3, 10_000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("blocks on the (limit + 1)th request within the window", () => {
    inMemoryRateLimit("user:2", 2, 10_000);
    inMemoryRateLimit("user:2", 2, 10_000);
    const third = inMemoryRateLimit("user:2", 2, 10_000);
    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("allows requests again after the window expires", () => {
    const windowMs = 50;
    inMemoryRateLimit("user:3", 1, windowMs);
    inMemoryRateLimit("user:3", 1, windowMs);
    return new Promise<void>((resolve) =>
      setTimeout(() => {
        const result = inMemoryRateLimit("user:3", 1, windowMs);
        expect(result.success).toBe(true);
        resolve();
      }, 60)
    );
  });

  it("isolates different identifiers", () => {
    inMemoryRateLimit("a", 1, 10_000);
    inMemoryRateLimit("a", 1, 10_000);
    const b = inMemoryRateLimit("b", 1, 10_000);
    expect(b.success).toBe(true);
  });
});
