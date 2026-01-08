export function canChallenge(
    targetRank: number,
    myRank: number | null,
    maxPositionsUp: number = 3
): boolean {
    if (!myRank || !targetRank) return false;
    if (myRank <= targetRank) return false; // Can't challenge someone below you

    const diff = myRank - targetRank;
    return diff > 0 && diff <= maxPositionsUp;
}

export function getChallengeEligibilityMessage(
    targetRank: number,
    myRank: number | null,
    maxPositionsUp: number = 3
): string {
    if (!myRank) return "You need a rank to challenge";
    if (myRank <= targetRank) return "Can only challenge players above you";

    const diff = myRank - targetRank;
    if (diff > maxPositionsUp) {
        return `Out of range (max ${maxPositionsUp} positions up)`;
    }

    return "Can challenge";
}
