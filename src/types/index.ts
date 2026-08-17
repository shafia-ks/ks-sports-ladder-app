/**
 * Shared TypeScript types for the application
 */

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: 'player' | 'organizer' | 'admin';
    avatar_url?: string;
    created_at: string;
}

export interface Ladder {
    id: string;
    name: string;
    description?: string;
    sport: string;
    location?: string;
    visibility: 'public' | 'private';
    status?: 'active' | 'archived' | 'pending';
    created_by: string;
    created_at: string;
    profile_picture_url?: string;
    challenge_rules?: {
        maxPositionsUp?: number | null;
        preventChallengingBusyPlayers: boolean;
        maxActiveChallengesPerPlayer: number;
        expiryDays: number;
        cooldownHours?: number;
    };
    ranking_rules?: {
        method: 'elo' | 'simple';
        initialRating?: number;
        kFactor?: number;
    };
}

export interface LadderMembership {
    id: string;
    ladder_id: string;
    user_id: string;
    status: 'active' | 'pending' | 'rejected';
    current_rank: number | null;
    previous_rank?: number | null;
    last_rank_change_at?: string;
    elo_rating?: number;
    wins?: number;
    losses?: number;
    win_streak?: number;
    requested_at?: string;
    joined_at?: string;
    cooling_expires_at?: string | null;
    ladders?: Ladder;
    users?: User;
}

export interface Challenge {
    id: string;
    ladder_id: string;
    challenger_id: string;
    challenged_id: string;
    status: 'Pending' | 'Accepted' | 'Declined' | 'Expired' | 'Cancelled';
    scheduled_at?: string;
    location?: string;
    notes?: string;
    expires_at: string;
    created_at: string;
    accepted_at?: string;
    declined_at?: string;
    completed_at?: string;
    cancellation_reason?: string;
    cancelled_at?: string;
    counter_proposal_time?: string;
    counter_proposal_location?: string;
    counter_proposal_notes?: string;
    challenger?: User;
    challenged?: User;
}

export interface Match {
    id: string;
    ladder_id: string;
    player1_id: string;
    player2_id: string;
    winner_id?: string;
    status: 'Pending' | 'ScoreSubmitted' | 'Confirmed' | 'Disputed' | 'Cancelled';
    set_scores?: Array<{ player1: number; player2: number }>;
    played_at?: string;
    location?: string;
    created_at: string;
    confirmed_by?: string;
    disputed_by?: string;
    dispute_reason?: string;
    submitted_by?: string;
    player1?: User;
    player2?: User;
    winner?: User;
}

export interface DashboardStats {
    totalMatches: number;
    wins: number;
    losses: number;
    winStreak: number;
    currentRank: number | null;
    eloRating?: number;
}

export interface Notification {
    id: string;
    user_id: string;
    type: 'challenge_received' | 'challenge_accepted' | 'challenge_declined' | 'match_submitted' | 'match_confirmed' | 'match_disputed' | 'match_scheduled' | 'rank_changed';
    title: string;
    message: string;
    link_url?: string;
    read_at?: string;
    created_at: string;
    metadata?: any;
}
