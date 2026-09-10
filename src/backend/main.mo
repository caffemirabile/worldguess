import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Entity "mo:caffeineai-oql/Entity";
import Expose "mo:caffeineai-oql/Expose";
import MapEntity "mo:caffeineai-oql/MapEntity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import TextValue "mo:caffeineai-oql/TextValue";
import FloatValue "mo:caffeineai-oql/FloatValue";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Types "types/game";
import GameApi "mixins/game-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  // Game state: curated place dataset, multiplayer rooms, player profiles.
  let places : Map.Map<Types.PlaceId, Types.Place>;
  let rooms : Map.Map<Types.RoomCode, Types.Room>;
  let profiles : Map.Map<Principal, Types.PlayerProfile>;

  include GameApi(accessControlState, places, rooms, profiles);
  include ApiDocMixin();

  // Sample principal for OQL schema seeding (value ignored — only shape matters).
  transient let anyP : Principal = Principal.fromText("aaaaa-aa");

  include Expose({
    entities = [
      // userRoles : Map<Principal, UserRole> — the identity (Principal) lives
      // in the map key, so iterate .entries() in manual mode and promote the
      // key as the "user" primary-key column. UserRole is a variant, so project
      // its tag to Text. controllerOnly (default): private to users, readable
      // by the Data Intelligence agent.
      do {
        let b0 = Entity.manual<(Principal, AccessControl.UserRole)>(
          "userRole",
          func() = accessControlState.userRoles.entries(),
          "UserRole",
          "user",
        );
        let b1 = b0.sample((anyP, #user));
        let b2 = b1.payload("user", func((p, _)) = p);
        let b3 = b2.payload(
          "role",
          func((_, r)) = switch (r) {
            case (#admin) "admin";
            case (#user) "user";
            case (#guest) "guest";
          },
        );
        b3.controllerOnly().build();
      },
      // playerProfile : Map<Principal, PlayerProfile> — the record carries its
      // own `principal` field, so auto-derive over .values() with that as the
      // primary key. public_ so the global leaderboard is world-readable.
      profiles.toEntity("playerProfile", "PlayerProfile", "principal")
        .sample({ principal = anyP; displayName = ""; totalScore = 0; bestScore = 0; gamesPlayed = 0 })
        .public_()
        .build(),
      // place : Map<PlaceId, Place> — the curated worldwide dataset. Place has a
      // collection field (aliases), so iterate .entries() in manual mode and
      // project flat columns. public_ so the dataset is world-readable.
      do {
        let b0 = Entity.manual<(Types.PlaceId, Types.Place)>(
          "place",
          func() = places.entries(),
          "Place",
          "id",
        );
        let b1 = b0.sample((1, { id = 1; name = ""; lat = 0.0; lng = 0.0; aliases = [] }));
        let b2 = b1.payload("id", func((id, _)) = id);
        let b3 = b2.payload("name", func((_, p)) = p.name);
        let b4 = b3.payload("lat", func((_, p)) = p.lat);
        let b5 = b4.payload("lng", func((_, p)) = p.lng);
        let b6 = b5.payload("aliasCount", func((_, p)) = p.aliases.size());
        b6.public_().build();
      },
      // room : Map<RoomCode, Room> — the identity (RoomCode) lives in the map
      // key, so iterate .entries() in manual mode and promote the key as the
      // "code" primary-key column. Room has collection/variant fields, so
      // project a few flat columns. controllerOnly: private to users, readable
      // by the Data Intelligence agent.
      do {
        let b0 = Entity.manual<(Types.RoomCode, Types.Room)>(
          "room",
          func() = rooms.entries(),
          "Room",
          "code",
        );
        let b1 = b0.sample(("ABCDE", { code = "ABCDE"; host = anyP; players = [anyP]; status = #waiting; rounds = []; currentRound = 0; totalRounds = 5 }));
        let b2 = b1.payload("code", func((c, _)) = c);
        let b3 = b2.payload("host", func((_, r)) = r.host);
        let b4 = b3.payload("playerCount", func((_, r)) = r.players.size());
        let b5 = b4.payload(
          "status",
          func((_, r)) = switch (r.status) {
            case (#waiting) "waiting";
            case (#inProgress) "inProgress";
            case (#finished) "finished";
          },
        );
        let b6 = b5.payload("currentRound", func((_, r)) = r.currentRound);
        let b7 = b6.payload("totalRounds", func((_, r)) = r.totalRounds);
        b7.controllerOnly().build();
      },
    ];
  });
};
