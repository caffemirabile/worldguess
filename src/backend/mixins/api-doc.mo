mixin () {
  public query func getApiDoc() : async Text {
    "# WorldGuess Backend API

WorldGuess is a multiplayer geography guessing game. Players sign in with
Internet Identity, create or join a room by a shareable code, and race to type
the name of a randomly selected place in the world. Each game is a fixed number
of rounds (default 5) with a running total; the global leaderboard ranks every
player by cumulative score.

## Authentication

All game endpoints require a signed-in (non-anonymous) caller with at least the
`user` role. Anonymous callers and unregistered principals are rejected.

The app uses Internet Identity SSO. The frontend pins an Internet Identity
derivation origin, published at `/.well-known/ii-derivation-origin` when
available. An agent already holding the user's Internet Identity authorization
derives the correct per-app principal against that origin, for example
`icp identity link web <name> --app <host>`. Such a delegation acts with the
user's full authority in this app until it expires.

### Registration prerequisite

Before any role-guarded call (guarded queries included) succeeds, a caller must
be registered. Registration happens only when a caller signs in through the
app's own frontend, which calls `_internet_identity_sign_in_finish` (or
`_initialize_access_control`) once as a signed-in caller. The first principal to
register becomes the `admin`; every subsequent caller becomes a `user`. A
principal that never signed in through the frontend is unregistered even when it
belongs to the app's owner, and a signed-in caller derived against a different
origin is a different principal than the one the frontend registered.

An unregistered or anonymous caller receives `#err(#notSignedIn)` from every
guarded game endpoint. `getCallerUserRole` returns `#guest` for anonymous
callers and traps with `\"User is not registered\"` for a signed-in but
unregistered caller.

## Authorization

- `admin` — full access; may assign roles via `assignCallerUserRole`.
- `user` — can create/join rooms, play games, and read their own profile.
- `guest` — anonymous; no game access.

Role-guarded game methods check `hasPermission(..., #user)`, which admits
`admin` and `user` callers. `assignCallerUserRole` is admin-only and traps with
`\"Unauthorized: Only admins can assign user roles\"` for non-admins.

## Public methods

### Auth

- `_internet_identity_sign_in_start() : async Blob` — begin an Internet Identity
  sign-in; returns a challenge blob.
- `_internet_identity_sign_in_finish() : async Result<(), Error>` — complete the
  sign-in and register the caller (first caller becomes admin).
- `_initialize_access_control() : async ()` — register the caller directly
  (first caller becomes admin).
- `getCallerUserRole() : async UserRole` — the caller's role (`#admin`, `#user`,
  or `#guest` for anonymous).
- `assignCallerUserRole(user : Principal, role : UserRole) : async ()` —
  admin-only; assigns a role to a user.
- `isCallerAdmin() : async Bool` — whether the caller is an admin.

### Game

- `createRoom(totalRounds : Nat) : async Result<RoomView, GameError>` — create a
  room; the caller becomes host. Returns the room view.
- `joinRoom(code : Text) : async Result<RoomView, GameError>` — join a waiting
  room by its shareable code.
- `startGame(code : Text) : async Result<RoomView, GameError>` — host-only;
  selects the first round's place and moves the room to `inProgress`.
- `getCurrentRoundPlace(code : Text) : async Result<Place, GameError>` — the
  current round's place (name + lat/lng) for a room the caller is in.
- `submitGuess(code : Text, guess : Text) : async Result<RoomView, GameError>` —
  submit a typed guess for the current round; returns the updated room view.
- `getRoomState(code : Text) : async Result<RoomView, GameError>` — current room
  state (players, round, scores) for a room the caller is in.
- `getLeaderboard() : async [LeaderboardEntry]` — global leaderboard ranked by
  cumulative score (world-readable, no auth).
- `getProfile() : async Result<PlayerProfile, GameError>` — the caller's
  persistent profile (or a zeroed profile if none exists).
- `setDisplayName(name : Text) : async Result<PlayerProfile, GameError>` — set
  the caller's display name.

### Data intelligence

- `schema() : async Text` — the OQL schema of queryable entities.
- `execute(query : Text) : async Text` — run a JSON OQL query over the exposed
  entities.

### Documentation

- `getApiDoc() : async Text` — this document.

## Units and encodings

- `PlaceId` and `Score` are `Nat` (non-negative integers).
- `RoomCode` is `Text` (e.g. `\"ABCDE\"`), generated from an unambiguous
  alphabet.
- `lat` / `lng` are `Float` degrees (WGS84).
- `Principal` values are the standard textual principal encoding.
- `RoomStatus` is a variant: `#waiting`, `#inProgress`, `#finished`.
- `GameError` is a variant carrying caller-actionable failures (see Errors).
- `Time` values are nanoseconds since the Unix epoch (used internally for
  random place selection and room-code generation; not exposed in the API).

## Lifecycle and polling

A room moves `#waiting -> #inProgress -> #finished`.

- `#waiting`: players join via `joinRoom`; the host calls `startGame`.
- `#inProgress`: each round shows one place; every player submits one guess via
  `submitGuess`. When all players have submitted, the round advances
  automatically. After the final round, the room becomes `#finished` and each
  player's profile is updated with the game's results.
- `#finished`: no further guesses are accepted; standings are visible via
  `getRoomState`.

Polling: the frontend can poll `getRoomState` (a query) to observe who has
submitted and when the room advances. `getCurrentRoundPlace` is also a query and
safe to poll. There is no server-side timer; rounds advance only when all
players have submitted.

## Mutation retry safety

- `createRoom` always creates a fresh room with a unique code; retrying creates
  a new room (no idempotency).
- `joinRoom` is idempotent for an already-present player only in the sense that
  it returns `#err(#alreadyInRoom)` rather than duplicating the player.
- `submitGuess` is not idempotent: a player may submit exactly one guess per
  round. A second submission for the same round returns `#err(#invalidGuess)`.
  Do not retry a guess that returned `#err(#invalidGuess)`.
- `setDisplayName` is idempotent (last write wins).
- `startGame` is guarded: calling it on a non-waiting room returns
  `#err(#gameAlreadyStarted)`.

## Errors

`GameError` variants returned by game methods:

- `#notSignedIn` — caller is anonymous or unregistered.
- `#roomNotFound(code)` — no room with that code.
- `#roomFull` — reserved; the room is full.
- `#alreadyInRoom` — caller already in the room.
- `#notHost` — only the host may start the game.
- `#notInRoom` — caller is not a player in the room.
- `#gameNotStarted` — the game is not in progress.
- `#gameAlreadyStarted` — the game has already started (or the room is not
  waiting).
- `#invalidGuess` — the guess is invalid (e.g. already submitted this round).
- `#roundNotActive` — reserved; no active round.

## Non-obvious gotchas

- A player must be registered (signed in through the frontend) before any
  guarded call, including guarded queries, succeeds.
- `getCurrentRoundPlace` and `getRoomState` require the caller to be a player in
  the room; they return `#err(#notInRoom)` otherwise.
- `getLeaderboard` is the only game method that does not require a signed-in
  caller.
- `submitGuess` advances the round only when every player in the room has
  submitted; a room with a single player advances immediately after that
  player's guess.
- Answer matching is case-insensitive and alias-aware; close variants (typos,
  substrings) are accepted with a reduced score. Exact matches score 100, fuzzy
  matches 50, misses 0. There is no time bonus.
- `getProfile` returns a zeroed profile (not an error) for a registered caller
  who has not yet played.
"
  };
};
