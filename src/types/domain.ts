export type Role = "player" | "organizer" | "admin";

export type RankingRuleType =
  | "swap-positions"
  | "default-swap-minimal-drop"
  | "slide-shift"
  | "points-elo";

export type ChallengeStatus =
  | "Pending"
  | "Accepted"
  | "Declined"
  | "Completed"
  | "Expired"
  | "Cancelled";

export type MatchStatus = "Pending" | "ScoreSubmitted" | "Confirmed" | "Disputed" | "Cancelled";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  preferredSport?: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerProfile {
  userId: string;
  ladderId: string;
  currentRank: number;
  wins: number;
  losses: number;
  noShows: number;
}

export interface Sport {
  id: string;
  name: string;
  scoringRules?: string;
}

export interface ChallengeRules {
  maxPositionsUp: number;
  preventChallengingBusyPlayers: boolean;
  maxActiveChallengesPerPlayer: number;
  expiryDays: number;
  cooldownHours?: number;
}

export interface RankingRules {
  type: RankingRuleType;
  kFactor?: number;
  maxDrop?: number;
  bonusWinStreak?: number;
}

export interface Ladder {
  id: string;
  name: string;
  description?: string;
  sportId: string;
  location?: string;
  status: "active" | "inactive";
  visibility: "public" | "private";
  challengeRules: ChallengeRules;
  rankingRules: RankingRules;
}

export interface LadderMembership {
  ladderId: string;
  userId: string;
  joinDate: string;
  currentRank: number;
}

export interface Challenge {
  id: string;
  ladderId: string;
  challengerId: string;
  challengedId: string;
  createdAt: string;
  status: ChallengeStatus;
  scheduledDateTime?: string;
  location?: string;
  notes?: string;
}

export interface Match {
  id: string;
  ladderId: string;
  challengeId?: string;
  player1Id: string;
  player2Id: string;
  setScores: string[];
  winnerId: string;
  status: MatchStatus;
  confirmedById?: string;
  disputedById?: string;
  playedAt: string;
}

export interface Season {
  id: string;
  ladderId: string;
  name: string;
  startDate: string;
  endDate: string;
  archived: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  timestamp: string;
}
