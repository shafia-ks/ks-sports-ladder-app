import { applyMatchResult } from "@/lib/ranking/ranking-engine";

const baseRanking = [
  { userId: "u1", currentRank: 1 },
  { userId: "u2", currentRank: 2 },
  { userId: "u3", currentRank: 3 },
  { userId: "u4", currentRank: 4 },
];

describe("default-swap-minimal-drop", () => {
  it("swaps when lower-ranked wins", () => {
    const result = applyMatchResult({
      ranking: baseRanking,
      winnerId: "u4",
      loserId: "u2",
      ruleType: "default-swap-minimal-drop",
    });
    expect(result.ranking.map((r) => r.userId)).toEqual(["u1", "u4", "u3", "u2"]);
  });

  it("drops loser by one when higher-ranked wins", () => {
    const result = applyMatchResult({
      ranking: baseRanking,
      winnerId: "u2",
      loserId: "u4",
      ruleType: "default-swap-minimal-drop",
    });
    expect(result.ranking.map((r) => r.userId)).toEqual(["u1", "u2", "u4", "u3"]);
  });
});
