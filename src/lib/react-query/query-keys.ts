/**
 * Centralized query keys for React Query
 * Ensures consistency and easier invalidation
 */

export const queryKeys = {
    ladder: (id: string) => ['ladder', id] as const,
    ladders: () => ['ladders'] as const,
    memberships: (userId?: string) => ['memberships', userId] as const,
    challenges: (ladderId: string) => ['challenges', ladderId] as const,
    matches: (ladderId: string) => ['matches', ladderId] as const,
    dashboard: (userId: string) => ['dashboard', userId] as const,
    notifications: (userId: string) => ['notifications', userId] as const,
};
