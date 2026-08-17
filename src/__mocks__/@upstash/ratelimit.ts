// Mock for @upstash/ratelimit — used in Jest tests only
export class Ratelimit {
  constructor(_opts: unknown) {}
  async limit(_identifier: string) {
    return { success: true, limit: 10, remaining: 9, reset: Date.now() + 10_000 };
  }
  static slidingWindow(_limit: number, _window: string) {
    return {};
  }
}
