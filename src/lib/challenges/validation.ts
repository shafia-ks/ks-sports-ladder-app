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
  scheduledDateTime?: string;
  location?: string;
  notes?: string;
  rules: ChallengeRules;
}

export function validateChallenge(ctx: ChallengeValidationContext): string[] {
  const errors: string[] = [];

  if (ctx.challengerRank === ctx.challengedRank) {
    errors.push("Challenge must involve two different players.");
  }

  // Disallow challenging down the ladder; only challenge higher-ranked players (smaller rank numbers)
  const positionsUp = ctx.challengerRank - ctx.challengedRank; // positive means challenged is above
  if (positionsUp < 0) {
    errors.push("You can only challenge players ranked above you.");
  } else if (positionsUp === 0) {
    errors.push("Challenge must involve two different players.");
  } else if (positionsUp > ctx.rules.maxPositionsUp) {
    errors.push(`You can only challenge up to ${ctx.rules.maxPositionsUp} positions above your current rank.`);
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
