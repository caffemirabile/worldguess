// Shared domain types for WorldGuess.
// These are the frontend-facing contracts that page tasks import.

export interface Place {
  id: string;
  name: string;
  aliases: string[];
  latitude: number;
  longitude: number;
  hint?: string;
}

export interface Player {
  principal: string;
  displayName: string;
  score: number;
}

export type PlayerStatus = "guessing" | "submitted";

export interface RoomPlayer {
  player: Player;
  status: PlayerStatus;
}

export type RoomStatus = "lobby" | "playing" | "finished";

export interface Room {
  code: string;
  hostPrincipal: string;
  players: RoomPlayer[];
  status: RoomStatus;
  currentRound: number;
  totalRounds: number;
}

export interface GuessResult {
  correct: boolean;
  points: number;
  answer: string;
  playerAnswer: string;
}

export interface GameRound {
  roundNumber: number;
  place: Place;
  status: "active" | "revealed";
  result?: GuessResult;
}

export interface LeaderboardEntry {
  rank: number;
  player: Player;
}

export interface PlayerProfile {
  displayName: string;
  totalScore: number;
  bestScore: number;
  gamesPlayed: number;
}
