import { RankingRuleType } from "@/types/domain";

export interface LadderRankingEntry {
  userId: string;
  currentRank: number;
}

export interface RankingUpdateResult {
  ranking: LadderRankingEntry[];
  note: string;
}

function sortByRank(list: LadderRankingEntry[]) {
  return [...list].sort((a, b) => a.currentRank - b.currentRank);
}

function renumber(list: LadderRankingEntry[]): LadderRankingEntry[] {
  return list.map((entry, idx) => ({ ...entry, currentRank: idx + 1 }));
}

function swapPositions(list: LadderRankingEntry[], idxA: number, idxB: number) {
  const arr = [...list];
  const temp = arr[idxA];
  arr[idxA] = { ...arr[idxB], currentRank: temp.currentRank };
  arr[idxB] = { ...temp, currentRank: arr[idxB].currentRank };
  return arr;
}

export function applyMatchResult(params: {
  ranking: LadderRankingEntry[];
  winnerId: string;
  loserId: string;
  ruleType: RankingRuleType;
}): RankingUpdateResult {
  const ordered = sortByRank(params.ranking);
  const winnerIndex = ordered.findIndex((r) => r.userId === params.winnerId);
  const loserIndex = ordered.findIndex((r) => r.userId === params.loserId);
  if (winnerIndex === -1 || loserIndex === -1) {
    return { ranking: ordered, note: "Winner or loser not found in ranking" };
  }

  const winnerRank = ordered[winnerIndex].currentRank;
  const loserRank = ordered[loserIndex].currentRank;

  switch (params.ruleType) {
    case "swap-positions": {
      if (winnerRank > loserRank) {
        const swapped = swapPositions(ordered, winnerIndex, loserIndex);
        return { ranking: renumber(swapped), note: "Lower-ranked winner swapped positions" };
      }
      return { ranking: ordered, note: "Higher-ranked winner; no change" };
    }

    case "default-swap-minimal-drop": {
      if (winnerRank > loserRank) {
        const swapped = swapPositions(ordered, winnerIndex, loserIndex);
        return { ranking: renumber(swapped), note: "Lower-ranked winner swapped positions" };
      }
      // Higher-ranked winner: loser drops exactly one rank, others shift up.
      if (loserIndex === ordered.length - 1) {
        return { ranking: ordered, note: "Loser already at bottom; no drop applied" };
      }
      const arr = [...ordered];
      const [loser] = arr.splice(loserIndex, 1);
      arr.splice(loserIndex + 1, 0, loser);
      return { ranking: renumber(arr), note: "Loser dropped one rank" };
    }

    case "slide-shift": {
      if (winnerRank <= loserRank) {
        return { ranking: ordered, note: "Higher-ranked winner; no change" };
      }
      const arr = [...ordered];
      const [winner] = arr.splice(winnerIndex, 1);
      arr.splice(loserIndex, 0, winner);
      // loser automatically shifts down one due to insertion order; renumber to normalize
      return { ranking: renumber(arr), note: "Lower-ranked winner slid up; others shifted" };
    }

    case "points-elo": {
      return { ranking: ordered, note: "Points/Elo mode not implemented; no change" };
    }

    default:
      return { ranking: ordered, note: "Unknown rule; no change" };
  }
}
