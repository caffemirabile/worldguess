import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface LeaderboardEntry {
    principal: Principal;
    displayName: string;
    totalScore: Score;
}
export type Result_2 = {
    __kind__: "ok";
    ok: Place;
} | {
    __kind__: "err";
    err: GameError;
};
export type Score = bigint;
export interface Result__1 {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export interface PlayerProfile {
    principal: Principal;
    displayName: string;
    gamesPlayed: bigint;
    bestScore: Score;
    totalScore: Score;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export type Result_1 = {
    __kind__: "ok";
    ok: PlayerProfile;
} | {
    __kind__: "err";
    err: GameError;
};
export interface Place {
    id: PlaceId;
    lat: number;
    lng: number;
    name: string;
    aliases: Array<string>;
}
export interface RoundView {
    place: PlaceId;
    guesses: Array<Guess>;
}
export type Result_3 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type Result = {
    __kind__: "ok";
    ok: RoomView;
} | {
    __kind__: "err";
    err: GameError;
};
export interface Cell {
    value: Value;
    name: string;
}
export type RoomCode = string;
export interface RoomView {
    status: RoomStatus;
    currentRound: bigint;
    code: RoomCode;
    host: Principal;
    roundScores: Array<RoundView>;
    players: Array<Principal>;
    totalRounds: bigint;
}
export type PlaceId = bigint;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export interface Guess {
    player: Principal;
    text: string;
    score: Score;
}
export type GameError = {
    __kind__: "notInRoom";
    notInRoom: null;
} | {
    __kind__: "alreadyInRoom";
    alreadyInRoom: null;
} | {
    __kind__: "notHost";
    notHost: null;
} | {
    __kind__: "invalidGuess";
    invalidGuess: null;
} | {
    __kind__: "gameNotStarted";
    gameNotStarted: null;
} | {
    __kind__: "roundNotActive";
    roundNotActive: null;
} | {
    __kind__: "notSignedIn";
    notSignedIn: null;
} | {
    __kind__: "roomNotFound";
    roomNotFound: RoomCode;
} | {
    __kind__: "roomFull";
    roomFull: null;
} | {
    __kind__: "gameAlreadyStarted";
    gameAlreadyStarted: null;
};
export enum RoomStatus {
    finished = "finished",
    waiting = "waiting",
    inProgress = "inProgress"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createRoom(totalRounds: bigint): Promise<Result>;
    execute(qJson: string): Promise<Result__1>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentRoundPlace(code: RoomCode): Promise<Result_2>;
    getLeaderboard(): Promise<Array<LeaderboardEntry>>;
    getProfile(): Promise<Result_1>;
    getRoomState(code: RoomCode): Promise<Result>;
    isCallerAdmin(): Promise<boolean>;
    joinRoom(code: RoomCode): Promise<Result>;
    schema(): Promise<string>;
    setDisplayName(name: string): Promise<Result_1>;
    startGame(code: RoomCode): Promise<Result>;
    submitGuess(code: RoomCode, guess: string): Promise<Result>;
}
