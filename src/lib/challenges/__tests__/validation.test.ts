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
    const ctx = { ...baseCtx, challengedRank: 3, effectiveMaxPositionsUp: 6 };
    expect(validateChallenge(ctx)).toContain(
      "You can only challenge up to 5 positions above your current rank."
    );
  });

  it("error message always shows the rule value, not the effective value", () => {
    const ctx = { ...baseCtx, challengedRank: 2, effectiveMaxPositionsUp: 6 };
    const errors = validateChallenge(ctx);
    expect(errors).toContain(
      "You can only challenge up to 5 positions above your current rank."
    );
  });

  it("allows unlimited challenge range when maxPositionsUp is null or undefined", () => {
    const ctx = { ...baseCtx, challengedRank: 1, rules: { ...baseRules, maxPositionsUp: null } };
    expect(validateChallenge(ctx)).toEqual([]);
  });
});

describe("validateChallenge — other rules", () => {
  it("blocks when challenger is banned", () => {
    const ctx = { ...baseCtx, challengerBanned: true };
    expect(validateChallenge(ctx)).toContain(
      "One or both players are not eligible to challenge."
    );
  });

  it("blocks when challenged is banned", () => {
    const ctx = { ...baseCtx, challengedBanned: true };
    expect(validateChallenge(ctx)).toContain(
      "One or both players are not eligible to challenge."
    );
  });

  it("blocks busy challenged when preventChallengingBusyPlayers is true", () => {
    const ctx = {
      ...baseCtx,
      challengedBusy: true,
      rules: { ...baseRules, preventChallengingBusyPlayers: true },
    };
    expect(validateChallenge(ctx)).toContain(
      "This player is currently engaged in an ongoing challenge or match."
    );
  });

  it("does not block busy challenged when preventChallengingBusyPlayers is false", () => {
    const ctx = { ...baseCtx, challengedBusy: true };
    expect(validateChallenge(ctx)).toEqual([]);
  });

  it("blocks when challenger exceeds maxActiveChallengesPerPlayer", () => {
    const ctx = { ...baseCtx, challengerActiveChallenges: 2 };
    expect(validateChallenge(ctx)).toContain(
      "You already have the maximum number of active challenges for this ladder."
    );
  });

  it("blocks when challenged exceeds maxActiveChallengesPerPlayer", () => {
    const ctx = { ...baseCtx, challengedActiveChallenges: 2 };
    expect(validateChallenge(ctx)).toContain(
      "The challenged player has the maximum number of active challenges."
    );
  });
});
