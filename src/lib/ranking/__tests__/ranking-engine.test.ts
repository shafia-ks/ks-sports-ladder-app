import { applyMatchResult, LadderRankingEntry } from '../ranking-engine';

describe('Ranking Engine', () => {
    const initialRanking: LadderRankingEntry[] = [
        { userId: 'A', currentRank: 1 },
        { userId: 'B', currentRank: 2 },
        { userId: 'C', currentRank: 3 },
        { userId: 'D', currentRank: 4 },
    ];

    describe('swap-positions', () => {
        const rules = { type: 'swap-positions' } as const;

        it('should swap positions if lower-ranked player wins', () => {
            // 3 wins against 1
            const result = applyMatchResult({
                ranking: initialRanking,
                winnerId: 'C', // Rank 3
                loserId: 'A', // Rank 1
                rules,
            });

            expect(result.ranking.find(r => r.userId === 'C')?.currentRank).toBe(1);
            expect(result.ranking.find(r => r.userId === 'A')?.currentRank).toBe(3);
            expect(result.ranking.find(r => r.userId === 'B')?.currentRank).toBe(2);
        });

        it('should do nothing if higher-ranked player wins', () => {
            // 1 wins against 3
            const result = applyMatchResult({
                ranking: initialRanking,
                winnerId: 'A',
                loserId: 'C',
                rules,
            });

            expect(result.ranking).toEqual(initialRanking);
        });
    });

    describe('default-swap-minimal-drop', () => {
        const rules = { type: 'default-swap-minimal-drop', maxDrop: 1 } as const;

        it('should swap if lower wins', () => {
            const result = applyMatchResult({
                ranking: initialRanking,
                winnerId: 'C', // 3
                loserId: 'A', // 1
                rules,
            });
            // C becomes 1, A becomes 3
            expect(result.ranking.find(r => r.userId === 'C')?.currentRank).toBe(1);
            expect(result.ranking.find(r => r.userId === 'A')?.currentRank).toBe(3);
        });

        it('should drop loser by 1 spot if higher wins', () => {
            // A (1) beats C (3). 
            // Logic: "Higher-ranked winner: loser drops by configured maxDrop (default 1)"
            // Loser C is at 3. Drops 1 -> should be 4.
            // D at 4 should shift UP to 3? Or just insert?
            // Let's trace code: splice(loserIndex, 1), insert at newIndex.

            const result = applyMatchResult({
                ranking: initialRanking,
                winnerId: 'A',
                loserId: 'C', // Rank 3
                rules,
            });

            // C (3) drops to 4. D (4) shifts to 3.
            expect(result.ranking.find(r => r.userId === 'C')?.currentRank).toBe(4);
            expect(result.ranking.find(r => r.userId === 'D')?.currentRank).toBe(3);
        });
    });
});
