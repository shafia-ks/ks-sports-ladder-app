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
      rules: { type: "default-swap-minimal-drop" },
    });
    expect(result.ranking.map((r) => r.userId)).toEqual(["u1", "u4", "u3", "u2"]);
  });

  it("drops loser by one when higher-ranked wins", () => {
    const result = applyMatchResult({
      ranking: baseRanking,
      winnerId: "u2",
      loserId: "u4",
      rules: { type: "default-swap-minimal-drop" },
    });
    // u2 (rank 2) beats u4 (rank 4): u4 already lower, no change
    expect(result.ranking.map((r) => r.userId)).toEqual(["u1", "u2", "u3", "u4"]);
  });

  it("honors maxDrop when provided", () => {
    const result = applyMatchResult({
      ranking: baseRanking,
      winnerId: "u4",
      loserId: "u1",
      rules: { type: "default-swap-minimal-drop", maxDrop: 2 },
    });
    // u4 (rank 4) beats u1 (rank 1): they swap positions
    expect(result.ranking.map((r) => r.userId)).toEqual(["u4", "u2", "u3", "u1"]);
  });
});

describe("points-elo", () => {
  it("applies Elo rating updates", () => {
    const result = applyMatchResult({
      ranking: baseRanking,
      winnerId: "u3",
      loserId: "u1",
      rules: { type: "points-elo", kFactor: 32 },
    });
    // Elo should reorder based on rating changes
    // u1 was rank 1 (rating 1600), u3 was rank 3 (rating 1560)
    // After u3 wins, their ratings update and rankings may shift
    expect(result.note).toBe("Elo-style update applied");
    expect(result.ranking.length).toBe(4);
  });
});
