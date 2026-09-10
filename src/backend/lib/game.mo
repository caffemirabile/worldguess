import Array "mo:core/Array";
import Int "mo:core/Int";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Types "../types/game";

module {
  // ---- Place dataset ----

  // Look up a place by id.
  public func getPlace(places : Map.Map<Types.PlaceId, Types.Place>, id : Types.PlaceId) : ?Types.Place {
    places.get(id);
  };

  // Select a random place from the dataset, seeded by wall-clock time.
  public func randomPlace(places : Map.Map<Types.PlaceId, Types.Place>) : ?Types.Place {
    let arr = places.toArray();
    if (arr.size() == 0) {
      null;
    } else {
      let idx = Int.abs(Time.now()) % arr.size();
      ?arr[idx].1;
    };
  };

  // ---- Answer matching & scoring ----

  // Lowercase + trim for case-insensitive comparison.
  func normalize(t : Text) : Text {
    t.toLower().trim(#char ' ');
  };

  // Exact (case-insensitive) match against the name or any alias.
  func isExactMatch(place : Types.Place, guess : Text) : Bool {
    let g = normalize(guess);
    if (normalize(place.name) == g) {
      return true;
    };
    for (alias in place.aliases.values()) {
      if (normalize(alias) == g) {
        return true;
      };
    };
    false;
  };

  func min3(a : Nat, b : Nat, c : Nat) : Nat {
    if (a <= b and a <= c) {
      a;
    } else if (b <= c) {
      b;
    } else {
      c;
    };
  };

  // Levenshtein edit distance between two texts (typo tolerance).
  func levenshtein(a : Text, b : Text) : Nat {
    let s = a.toArray();
    let t = b.toArray();
    let n = s.size();
    let m = t.size();
    if (n == 0) {
      return m;
    };
    if (m == 0) {
      return n;
    };
    var prev = Array.tabulate(m + 1, func j = j).toVarArray<Nat>();
    for (i in Nat.range(1, n)) {
      let curr = Array.tabulate(m + 1, func j = 0).toVarArray<Nat>();
      curr[0] := i;
      for (j in Nat.range(1, m)) {
        let cost = if (s[i - 1] == t[j - 1]) { 0 } else { 1 };
        let del = prev[j] + 1;
        let ins = curr[j - 1] + 1;
        let sub = prev[j - 1] + cost;
        curr[j] := min3(del, ins, sub);
      };
      prev := curr;
    };
    prev[m];
  };

  // Close-variant (fuzzy) match: substring containment or small edit distance.
  func isFuzzyMatch(place : Types.Place, guess : Text) : Bool {
    let g = normalize(guess);
    if (g.size() == 0) {
      return false;
    };
    let candidates = [place.name].concat(place.aliases);
    for (c in candidates.values()) {
      let nc = normalize(c);
      if (nc.size() == 0) {
        continue;
      };
      if (g.size() >= 3 and (nc.contains(#text g) or g.contains(#text nc))) {
        return true;
      };
      if (levenshtein(nc, g) <= 2) {
        return true;
      };
    };
    false;
  };

  // Case-insensitive, alias-aware match of a typed guess against a place.
  public func matchesPlace(place : Types.Place, guess : Text) : Bool {
    isExactMatch(place, guess) or isFuzzyMatch(place, guess);
  };

  // Accuracy-based score for a guess (no time bonus).
  public func scoreGuess(place : Types.Place, guess : Text) : Types.Score {
    if (isExactMatch(place, guess)) {
      100;
    } else if (isFuzzyMatch(place, guess)) {
      50;
    } else {
      0;
    };
  };

  // ---- Rooms ----

  // Generate a unique shareable room code.
  public func newRoomCode(rooms : Map.Map<Types.RoomCode, Types.Room>) : Types.RoomCode {
    let chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toArray();
    let seed = Int.abs(Time.now());
    var n = seed;
    var code = "";
    for (_ in Nat.range(0, 5)) {
      let idx = n % chars.size();
      code := code # chars[idx].toText();
      n := n / chars.size();
    };
    if (rooms.get(code) != null) {
      code := code # Nat.toText(seed % 10);
    };
    code;
  };

  // Create a room owned by `host`.
  public func createRoom(rooms : Map.Map<Types.RoomCode, Types.Room>, host : Principal, totalRounds : Nat) : Types.Room {
    let code = newRoomCode(rooms);
    {
      code;
      host;
      players = [host];
      status = #waiting;
      rounds = [];
      currentRound = 0;
      totalRounds;
    };
  };

  // Add a player to a waiting room.
  public func joinRoom(room : Types.Room, player : Principal) : Types.Room {
    if (room.players.contains(player)) {
      room;
    } else {
      { room with players = room.players.concat([player]) };
    };
  };

  // Start the game: select the first round's place and move to inProgress.
  public func startGame(room : Types.Room, places : Map.Map<Types.PlaceId, Types.Place>) : Types.Room {
    let p = randomPlace(places) ?? Runtime.trap("No places available");
    let firstRound = { place = p.id; guesses = [] };
    { room with status = #inProgress; rounds = [firstRound]; currentRound = 0 };
  };

  // Record a player's guess for the current round and score it.
  public func submitGuess(room : Types.Room, player : Principal, guess : Text, places : Map.Map<Types.PlaceId, Types.Place>) : Types.Room {
    let currentRound = room.rounds[room.currentRound];
    let place = getPlace(places, currentRound.place) ?? Runtime.trap("Place not found");
    let score = scoreGuess(place, guess);
    let newGuess = { player; text = guess; score };
    let updatedRound = { currentRound with guesses = currentRound.guesses.concat([newGuess]) };
    let newRounds = Array.tabulate(room.rounds.size(), func i =
      if (i == room.currentRound) { updatedRound } else { room.rounds[i] }
    );
    { room with rounds = newRounds };
  };

  // Advance to the next round, or finish the game when all rounds are done.
  public func advanceRound(room : Types.Room, places : Map.Map<Types.PlaceId, Types.Place>) : Types.Room {
    if (room.currentRound + 1 < room.totalRounds) {
      let p = randomPlace(places) ?? Runtime.trap("No places available");
      let nextRound = { place = p.id; guesses = [] };
      {
        room with
        status = #inProgress;
        rounds = room.rounds.concat([nextRound]);
        currentRound = room.currentRound + 1;
      };
    } else {
      { room with status = #finished };
    };
  };

  // ---- Profiles & leaderboard ----

  // Get or create a player's profile.
  public func getOrCreateProfile(profiles : Map.Map<Principal, Types.PlayerProfile>, player : Principal) : Types.PlayerProfile {
    switch (profiles.get(player)) {
      case (?p) { p };
      case null {
        let profile = {
          principal = player;
          displayName = "";
          totalScore = 0;
          bestScore = 0;
          gamesPlayed = 0;
        };
        profiles.add(player, profile);
        profile;
      };
    };
  };

  // Set a player's display name.
  public func setDisplayName(profile : Types.PlayerProfile, name : Text) : Types.PlayerProfile {
    { profile with displayName = name };
  };

  // Fold a finished room's round scores into each player's profile.
  public func applyGameResults(profiles : Map.Map<Principal, Types.PlayerProfile>, room : Types.Room) : () {
    for (player in room.players.values()) {
      var total = 0;
      for (round in room.rounds.values()) {
        for (g in round.guesses.values()) {
          if (g.player == player) {
            total += g.score;
          };
        };
      };
      let profile = getOrCreateProfile(profiles, player);
      let updated = {
        profile with
        totalScore = profile.totalScore + total;
        bestScore = if (total > profile.bestScore) { total } else { profile.bestScore };
        gamesPlayed = profile.gamesPlayed + 1;
      };
      profiles.add(player, updated);
    };
  };

  // Build the global leaderboard ranked by cumulative score.
  public func leaderboard(profiles : Map.Map<Principal, Types.PlayerProfile>) : [Types.LeaderboardEntry] {
    let entries = profiles.toArray().map(func (_, p) = {
      principal = p.principal;
      displayName = p.displayName;
      totalScore = p.totalScore;
    });
    entries.sort(func (a, b) =
      if (a.totalScore > b.totalScore) { #less }
      else if (a.totalScore < b.totalScore) { #greater }
      else { #equal }
    );
  };

  // Public view of a room for the frontend.
  public func toView(room : Types.Room) : Types.RoomView {
    {
      code = room.code;
      host = room.host;
      players = room.players;
      status = room.status;
      currentRound = room.currentRound;
      totalRounds = room.totalRounds;
      roundScores = room.rounds.map(func r = {
        place = r.place;
        guesses = r.guesses;
      });
    };
  };
};
