import { validateChallenge, ChallengeValidationContext } from "../validation";

const baseRules = {
  maxPositionsUp: 5,
  preventChallengingBusyPlayers: false,
  maxActiveChallengesPerPlayer: 2,
  expiryDays: 7,
};

const baseCtx: ChallengeValidationContext = {
  challengerRank: 10,
  challengedRank: 5,
  challengerActiveChallenges: 0,
  challengedActiveChallenges: 0,
  challengerBusy: false,
  challengedBusy: false,
  rules: baseRules,
};

describe("validateChallenge — range", () => {
  it("allows challenge within maxPositionsUp", () => {
    expect(validateChallenge(baseCtx)).toEqual([]);
  });

  it("blocks challenge beyond maxPositionsUp with no override", () => {
    const ctx = { ...baseCtx, challengedRank: 4 }; // 6 positions up, limit 5
    const errors = validateChallenge(ctx);
    expect(errors).toContain(
      "You can only challenge up to 5 positions above your current rank."
    );
  });

  it("uses effectiveMaxPositionsUp when 2 players on leave in range", () => {
    // rank 10 vs rank 4 = 6 positions up; normally blocked
    // 2 locked players extend effective limit to 7 → should pass
    const ctx = { ...baseCtx, challengedRank: 4, effectiveMaxPositionsUp: 7 };
    expect(validateChallenge(ctx)).toEqual([]);
  });

  it("still blocks when beyond effectiveMaxPositionsUp", () => {
    // rank 10 vs rank 3 = 7 positions up; effectiveMax = 6 → still blocked
    const ctx = { ...baseCtx, challengedRank: 3, effectiveMaxPositionsUp: 6 };
    expect(validateChallenge(ctx).length).toBeGreaterThan(0);
  });

  it("error message always shows the rule value, not the effective value", () => {
    const ctx = { ...baseCtx, challengedRank: 2, effectiveMaxPositionsUp: 6 };
    const errors = validateChallenge(ctx);
    expect(errors).toContain(
      "You can only challenge up to 5 positions above your current rank."
    );
  });
});
