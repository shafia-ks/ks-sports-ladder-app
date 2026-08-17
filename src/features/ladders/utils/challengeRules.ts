export function canChallenge(
    targetRank: number,
    myRank: number | null,
    maxPositionsUp?: number | null
): boolean {
    if (!myRank || !targetRank) return false;
    if (myRank <= targetRank) return false; // Can't challenge someone below you

    const diff = myRank - targetRank;
    if (maxPositionsUp === null || maxPositionsUp === undefined || maxPositionsUp <= 0) {
        return diff > 0;
    }
    return diff > 0 && diff <= maxPositionsUp;
}

export function getChallengeEligibilityMessage(
    targetRank: number,
    myRank: number | null,
    maxPositionsUp?: number | null
): string {
    if (!myRank) return "You need a rank to challenge";
    if (myRank <= targetRank) return "Can only challenge players above you";

    const diff = myRank - targetRank;
    if (maxPositionsUp && maxPositionsUp > 0 && diff > maxPositionsUp) {
        return `Out of range (max ${maxPositionsUp} positions up)`;
    }

    return "Can challenge";
}
