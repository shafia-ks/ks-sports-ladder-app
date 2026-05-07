import { ChallengeRules } from "@/types/domain";

export interface ChallengeValidationContext {
  challengerRank: number;
  challengedRank: number;
  challengerActiveChallenges: number;
  challengedActiveChallenges: number;
  challengerBusy: boolean;
  challengedBusy: boolean;
  challengerBanned?: boolean;
  challengedBanned?: boolean;
  rules: ChallengeRules;
  /**
   * When set, overrides rules.maxPositionsUp for the range check only.
   * Used by the API to extend the window past on-leave players so players
   * are never penalised for others being locked.
   */
  effectiveMaxPositionsUp?: number;
}

export function validateChallenge(ctx: ChallengeValidationContext): string[] {
  const errors: string[] = [];
  const rangeLimit = ctx.effectiveMaxPositionsUp ?? ctx.rules.maxPositionsUp;

  if (ctx.challengerRank === ctx.challengedRank) {
    errors.push("Challenge must involve two different players.");
  }

  const positionsUp = ctx.challengerRank - ctx.challengedRank;
  if (positionsUp < 0) {
    errors.push("You can only challenge players ranked above you.");
  } else if (positionsUp === 0) {
    errors.push("Challenge must involve two different players.");
  } else if (positionsUp > rangeLimit) {
    // Always show the rule-configured limit in the message, not the effective one
    errors.push(
      `You can only challenge up to ${ctx.rules.maxPositionsUp} positions above your current rank.`
    );
  }

  if (ctx.challengerBanned || ctx.challengedBanned) {
    errors.push("One or both players are not eligible to challenge.");
  }

  if (ctx.rules.preventChallengingBusyPlayers) {
    if (ctx.challengedBusy) {
      errors.push("This player is currently engaged in an ongoing challenge or match.");
    }
    if (ctx.challengerBusy) {
      errors.push("You already have an ongoing challenge or pending match.");
    }
  }

  if (ctx.challengerActiveChallenges >= ctx.rules.maxActiveChallengesPerPlayer) {
    errors.push("You already have the maximum number of active challenges for this ladder.");
  }
  if (ctx.challengedActiveChallenges >= ctx.rules.maxActiveChallengesPerPlayer) {
    errors.push("The challenged player has the maximum number of active challenges.");
  }

  return errors;
}
