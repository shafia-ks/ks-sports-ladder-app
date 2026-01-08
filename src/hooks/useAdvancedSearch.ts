import { useState, useMemo } from 'react';

export interface SearchFilters {
    query: string;
    rankMin: number | null;
    rankMax: number | null;
    status: 'all' | 'active' | 'pending' | 'inactive';
    hasActiveChallenge: boolean | null;
    sortBy: 'rank' | 'name' | 'recent';
    sortOrder: 'asc' | 'desc';
}

export interface Searchable {
    id: string;
    name?: string;
    email?: string;
    rank?: number | null;
    status?: string;
    hasActiveChallenge?: boolean;
    [key: string]: any;
}

/**
 * Advanced search and filter hook
 */
export function useAdvancedSearch<T extends Searchable>(
    items: T[],
    initialFilters?: Partial<SearchFilters>
) {
    const [filters, setFilters] = useState<SearchFilters>({
        query: '',
        rankMin: null,
        rankMax: null,
        status: 'all',
        hasActiveChallenge: null,
        sortBy: 'rank',
        sortOrder: 'asc',
        ...initialFilters,
    });

    // Filter and sort items
    const filteredItems = useMemo(() => {
        let result = [...items];

        // Text search
        if (filters.query) {
            const query = filters.query.toLowerCase();
            result = result.filter(item => {
                const name = item.name?.toLowerCase() || '';
                const email = item.email?.toLowerCase() || '';
                return name.includes(query) || email.includes(query);
            });
        }

        // Rank filter
        if (filters.rankMin !== null) {
            result = result.filter(item =>
                item.rank !== null && item.rank !== undefined && item.rank >= filters.rankMin!
            );
        }
        if (filters.rankMax !== null) {
            result = result.filter(item =>
                item.rank !== null && item.rank !== undefined && item.rank <= filters.rankMax!
            );
        }

        // Status filter
        if (filters.status !== 'all') {
            result = result.filter(item => item.status === filters.status);
        }

        // Challenge filter
        if (filters.hasActiveChallenge !== null) {
            result = result.filter(item =>
                item.hasActiveChallenge === filters.hasActiveChallenge
            );
        }

        // Sort
        result.sort((a, b) => {
            let comparison = 0;

            switch (filters.sortBy) {
                case 'rank':
                    const rankA = a.rank ?? Infinity;
                    const rankB = b.rank ?? Infinity;
                    comparison = rankA - rankB;
                    break;
                case 'name':
                    const nameA = a.name || a.email || '';
                    const nameB = b.name || b.email || '';
                    comparison = nameA.localeCompare(nameB);
                    break;
                case 'recent':
                    // Assume items have a createdAt or updatedAt field
                    const dateA = (a as any).createdAt || (a as any).updatedAt || 0;
                    const dateB = (b as any).createdAt || (b as any).updatedAt || 0;
                    comparison = new Date(dateB).getTime() - new Date(dateA).getTime();
                    break;
            }

            return filters.sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [items, filters]);

    // Update individual filter
    const updateFilter = <K extends keyof SearchFilters>(
        key: K,
        value: SearchFilters[K]
    ) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Reset all filters
    const resetFilters = () => {
        setFilters({
            query: '',
            rankMin: null,
            rankMax: null,
            status: 'all',
            hasActiveChallenge: null,
            sortBy: 'rank',
            sortOrder: 'asc',
        });
    };

    // Get filter summary
    const filterSummary = useMemo(() => {
        const active: string[] = [];

        if (filters.query) active.push(`Search: "${filters.query}"`);
        if (filters.rankMin !== null) active.push(`Min rank: ${filters.rankMin}`);
        if (filters.rankMax !== null) active.push(`Max rank: ${filters.rankMax}`);
        if (filters.status !== 'all') active.push(`Status: ${filters.status}`);
        if (filters.hasActiveChallenge !== null) {
            active.push(filters.hasActiveChallenge ? 'Has challenge' : 'No challenge');
        }

        return active;
    }, [filters]);

    return {
        filters,
        filteredItems,
        updateFilter,
        resetFilters,
        filterSummary,
        hasActiveFilters: filterSummary.length > 0,
        resultCount: filteredItems.length,
        totalCount: items.length,
    };
}

/**
 * Search history management
 */
export function useSearchHistory(maxHistory: number = 10) {
    const [history, setHistory] = useState<string[]>([]);

    const addToHistory = (query: string) => {
        if (!query.trim()) return;

        setHistory(prev => {
            const filtered = prev.filter(q => q !== query);
            return [query, ...filtered].slice(0, maxHistory);
        });
    };

    const clearHistory = () => {
        setHistory([]);
    };

    const removeFromHistory = (query: string) => {
        setHistory(prev => prev.filter(q => q !== query));
    };

    return {
        history,
        addToHistory,
        clearHistory,
        removeFromHistory,
    };
}
