import { RankingRules } from "@/types/domain";

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
  rules: RankingRules;
}): RankingUpdateResult {
  const ordered = sortByRank(params.ranking);
  const winnerIndex = ordered.findIndex((r) => r.userId === params.winnerId);
  const loserIndex = ordered.findIndex((r) => r.userId === params.loserId);
  if (winnerIndex === -1 || loserIndex === -1) {
    return { ranking: ordered, note: "Winner or loser not found in ranking" };
  }

  const winnerRank = ordered[winnerIndex].currentRank;
  const loserRank = ordered[loserIndex].currentRank;
  const ruleType = params.rules.type;

  switch (ruleType) {
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
      // Higher-ranked winner: loser drops by configured maxDrop (default 1), others shift up.
      const maxDrop = params.rules.maxDrop ?? 1;
      if (loserIndex >= ordered.length - 1 || maxDrop <= 0) {
        return { ranking: ordered, note: "Loser already at bottom; no drop applied" };
      }
      const arr = [...ordered];
      const [loser] = arr.splice(loserIndex, 1);
      // Insert loser maxDrop positions down (but not past the end)
      const newIndex = Math.min(loserIndex + maxDrop, arr.length);
      arr.splice(newIndex, 0, loser);
      return { ranking: renumber(arr), note: `Loser dropped ${Math.min(maxDrop, arr.length - loserIndex)} rank${maxDrop > 1 ? "s" : ""}` };
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
      // Treat rank as a proxy rating; higher rank = higher rating.
      const baseRating = 1600;
      const step = 20;
      const k = params.rules.kFactor ?? 24;

      const ratings = ordered.map((r) => ({
        ...r,
        rating: baseRating - (r.currentRank - 1) * step,
      }));

      const winner = ratings[winnerIndex];
      const loser = ratings[loserIndex];
      const expectedWin = 1 / (1 + Math.pow(10, (loser.rating - winner.rating) / 400));
      const expectedLose = 1 / (1 + Math.pow(10, (winner.rating - loser.rating) / 400));

      const winnerDelta = k * (1 - expectedWin);
      const loserDelta = k * (0 - expectedLose);

      ratings[winnerIndex] = { ...winner, rating: winner.rating + winnerDelta };
      ratings[loserIndex] = { ...loser, rating: loser.rating + loserDelta };

      // Optional bonus for streaks could be layered here when streak data is available.

      const ranked = ratings
        .sort((a, b) => b.rating - a.rating)
        .map((r, idx) => ({ userId: r.userId, currentRank: idx + 1 }));

      return { ranking: ranked, note: "Elo-style update applied" };
    }

    default:
      return { ranking: ordered, note: "Unknown rule; no change" };
  }
}
