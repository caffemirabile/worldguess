module {
  public type PlaceId = Nat;
  public type RoomCode = Text;
  public type Score = Nat;

  // A curated place in the worldwide dataset. `aliases` holds common spellings
  // and close variants used for answer matching.
  public type Place = {
    id : PlaceId;
    name : Text;
    lat : Float;
    lng : Float;
    aliases : [Text];
  };

  // A single player's guess for a round, with its accuracy score.
  public type Guess = {
    player : Principal;
    text : Text;
    score : Score;
  };

  // One round of a game: a selected place plus every player's guess.
  public type Round = {
    place : PlaceId;
    guesses : [Guess];
  };

  public type RoomStatus = {
    #waiting;
    #inProgress;
    #finished;
  };

  // A multiplayer room. `players` is the ordered list of participants; the host
  // starts the game. `rounds` accumulates per-round results; `currentRound` is
  // the zero-based index of the active round.
  public type Room = {
    code : RoomCode;
    host : Principal;
    players : [Principal];
    status : RoomStatus;
    rounds : [Round];
    currentRound : Nat;
    totalRounds : Nat;
  };

  // A player's persistent profile: display name and cumulative/best scores.
  public type PlayerProfile = {
    principal : Principal;
    displayName : Text;
    totalScore : Score;
    bestScore : Score;
    gamesPlayed : Nat;
  };

  // One row of the global leaderboard, ranked by cumulative score.
  public type LeaderboardEntry = {
    principal : Principal;
    displayName : Text;
    totalScore : Score;
  };

  // Public view of a room for the frontend, with shared types only.
  public type RoomView = {
    code : RoomCode;
    host : Principal;
    players : [Principal];
    status : RoomStatus;
    currentRound : Nat;
    totalRounds : Nat;
    roundScores : [RoundView];
  };

  public type RoundView = {
    place : PlaceId;
    guesses : [Guess];
  };

  // Caller-actionable failures returned from the public API.
  public type GameError = {
    #notSignedIn;
    #roomNotFound : RoomCode;
    #roomFull;
    #alreadyInRoom;
    #notHost;
    #notInRoom;
    #gameNotStarted;
    #gameAlreadyStarted;
    #invalidGuess;
    #roundNotActive;
  };
};
