import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import Runtime "mo:core/Runtime";
import Types "../types/game";
import GameLib "../lib/game";

mixin (
  accessControlState : AccessControl.AccessControlState,
  places : Map.Map<Types.PlaceId, Types.Place>,
  rooms : Map.Map<Types.RoomCode, Types.Room>,
  profiles : Map.Map<Principal, Types.PlayerProfile>,
) {
  // Create a new room; the caller becomes the host.
  public shared ({ caller }) func createRoom(totalRounds : Nat) : async Result.Result<Types.RoomView, Types.GameError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err(#notSignedIn);
    };
    let room = GameLib.createRoom(rooms, caller, totalRounds);
    rooms.add(room.code, room);
    #ok(GameLib.toView(room));
  };

  // Join an existing room by its shareable code.
  public shared ({ caller }) func joinRoom(code : Types.RoomCode) : async Result.Result<Types.RoomView, Types.GameError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err(#notSignedIn);
    };
    switch (rooms.get(code)) {
      case null { #err(#roomNotFound(code)) };
      case (?room) {
        if (room.status != #waiting) {
          #err(#gameAlreadyStarted);
        } else if (room.players.contains(caller)) {
          #err(#alreadyInRoom);
        } else {
          let updated = GameLib.joinRoom(room, caller);
          rooms.add(code, updated);
          #ok(GameLib.toView(updated));
        };
      };
    };
  };

  // Host starts the game; all players see the same place each round.
  public shared ({ caller }) func startGame(code : Types.RoomCode) : async Result.Result<Types.RoomView, Types.GameError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err(#notSignedIn);
    };
    switch (rooms.get(code)) {
      case null { #err(#roomNotFound(code)) };
      case (?room) {
        if (room.host != caller) {
          #err(#notHost);
        } else if (room.status != #waiting) {
          #err(#gameAlreadyStarted);
        } else {
          let updated = GameLib.startGame(room, places);
          rooms.add(code, updated);
          #ok(GameLib.toView(updated));
        };
      };
    };
  };

  // Get the current round's place (name + coordinates) for a room.
  public query ({ caller }) func getCurrentRoundPlace(code : Types.RoomCode) : async Result.Result<Types.Place, Types.GameError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err(#notSignedIn);
    };
    switch (rooms.get(code)) {
      case null { #err(#roomNotFound(code)) };
      case (?room) {
        if (not room.players.contains(caller)) {
          #err(#notInRoom);
        } else if (room.status != #inProgress) {
          #err(#gameNotStarted);
        } else {
          let round = room.rounds[room.currentRound];
          let p = GameLib.getPlace(places, round.place) ?? Runtime.trap("Place not found");
          #ok(p);
        };
      };
    };
  };

  // Submit a typed guess for the current round.
  public shared ({ caller }) func submitGuess(code : Types.RoomCode, guess : Text) : async Result.Result<Types.RoomView, Types.GameError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err(#notSignedIn);
    };
    switch (rooms.get(code)) {
      case null { #err(#roomNotFound(code)) };
      case (?room) {
        if (not room.players.contains(caller)) {
          #err(#notInRoom);
        } else if (room.status != #inProgress) {
          #err(#gameNotStarted);
        } else {
          let round = room.rounds[room.currentRound];
          if (round.guesses.any(func g = g.player == caller)) {
            #err(#invalidGuess);
          } else {
            let withGuess = GameLib.submitGuess(room, caller, guess, places);
            let allSubmitted = withGuess.rounds[withGuess.currentRound].guesses.size() >= withGuess.players.size();
            let advanced = if (allSubmitted) {
              GameLib.advanceRound(withGuess, places);
            } else {
              withGuess;
            };
            if (advanced.status == #finished) {
              GameLib.applyGameResults(profiles, advanced);
            };
            rooms.add(code, advanced);
            #ok(GameLib.toView(advanced));
          };
        };
      };
    };
  };

  // Get the current state of a room (players, round, scores).
  public query ({ caller }) func getRoomState(code : Types.RoomCode) : async Result.Result<Types.RoomView, Types.GameError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err(#notSignedIn);
    };
    switch (rooms.get(code)) {
      case null { #err(#roomNotFound(code)) };
      case (?room) {
        if (not room.players.contains(caller)) {
          #err(#notInRoom);
        } else {
          #ok(GameLib.toView(room));
        };
      };
    };
  };

  // Global leaderboard ranked by cumulative score.
  public query func getLeaderboard() : async [Types.LeaderboardEntry] {
    GameLib.leaderboard(profiles);
  };

  // The caller's persistent profile.
  public query ({ caller }) func getProfile() : async Result.Result<Types.PlayerProfile, Types.GameError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err(#notSignedIn);
    };
    switch (profiles.get(caller)) {
      case (?p) { #ok(p) };
      case null {
        #ok({
          principal = caller;
          displayName = "";
          totalScore = 0;
          bestScore = 0;
          gamesPlayed = 0;
        });
      };
    };
  };

  // Set the caller's display name.
  public shared ({ caller }) func setDisplayName(name : Text) : async Result.Result<Types.PlayerProfile, Types.GameError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err(#notSignedIn);
    };
    let profile = GameLib.getOrCreateProfile(profiles, caller);
    let updated = GameLib.setDisplayName(profile, name);
    profiles.add(caller, updated);
    #ok(updated);
  };
};
