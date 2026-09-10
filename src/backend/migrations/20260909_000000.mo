import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  type PlaceId = Nat;
  type RoomCode = Text;
  type Score = Nat;

  type Place = {
    id : PlaceId;
    name : Text;
    lat : Float;
    lng : Float;
    aliases : [Text];
  };

  type Guess = {
    player : Principal;
    text : Text;
    score : Score;
  };

  type Round = {
    place : PlaceId;
    guesses : [Guess];
  };

  type RoomStatus = {
    #waiting;
    #inProgress;
    #finished;
  };

  type Room = {
    code : RoomCode;
    host : Principal;
    players : [Principal];
    status : RoomStatus;
    rounds : [Round];
    currentRound : Nat;
    totalRounds : Nat;
  };

  type PlayerProfile = {
    principal : Principal;
    displayName : Text;
    totalScore : Score;
    bestScore : Score;
    gamesPlayed : Nat;
  };

  type UserRole = {
    #admin;
    #user;
    #guest;
  };

  type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  type OldActor = {
    accessControlState : AccessControlState;
  };

  type NewActor = {
    accessControlState : AccessControlState;
    places : Map.Map<PlaceId, Place>;
    rooms : Map.Map<RoomCode, Room>;
    profiles : Map.Map<Principal, PlayerProfile>;
  };

  func place(id : Nat, name : Text, lat : Float, lng : Float, aliases : [Text]) : Place {
    { id; name; lat; lng; aliases };
  };

  public func migration(old : OldActor) : NewActor {
    let places = Map.empty<PlaceId, Place>();
    places.add(1, place(1, "Paris", 48.8566, 2.3522, ["paris", "city of light", "ville lumiere"]));
    places.add(2, place(2, "London", 51.5074, -0.1278, ["london", "londres"]));
    places.add(3, place(3, "New York City", 40.7128, -74.0060, ["new york", "nyc", "new york city", "the big apple"]));
    places.add(4, place(4, "Tokyo", 35.6762, 139.6503, ["tokyo", "tokio"]));
    places.add(5, place(5, "Sydney", -33.8688, 151.2093, ["sydney"]));
    places.add(6, place(6, "Rome", 41.9028, 12.4964, ["rome", "roma"]));
    places.add(7, place(7, "Cairo", 30.0444, 31.2357, ["cairo", "al qahirah"]));
    places.add(8, place(8, "Rio de Janeiro", -22.9068, -43.1729, ["rio de janeiro", "rio"]));
    places.add(9, place(9, "Cape Town", -33.9249, 18.4241, ["cape town", "kaapstad"]));
    places.add(10, place(10, "Moscow", 55.7558, 37.6173, ["moscow", "moskva"]));
    places.add(11, place(11, "Beijing", 39.9042, 116.4074, ["beijing", "peking"]));
    places.add(12, place(12, "Delhi", 28.6139, 77.2090, ["delhi", "new delhi"]));
    places.add(13, place(13, "Istanbul", 41.0082, 28.9784, ["istanbul", "constantinople"]));
    places.add(14, place(14, "Bangkok", 13.7563, 100.5018, ["bangkok", "krung thep"]));
    places.add(15, place(15, "Mexico City", 19.4326, -99.1332, ["mexico city", "ciudad de mexico"]));
    places.add(16, place(16, "Buenos Aires", -34.6037, -58.3816, ["buenos aires"]));
    places.add(17, place(17, "Los Angeles", 34.0522, -118.2437, ["los angeles", "la", "l.a."]));
    places.add(18, place(18, "Chicago", 41.8781, -87.6298, ["chicago"]));
    places.add(19, place(19, "Toronto", 43.6532, -79.3832, ["toronto"]));
    places.add(20, place(20, "Vancouver", 49.2827, -123.1207, ["vancouver"]));
    places.add(21, place(21, "Dubai", 25.2048, 55.2708, ["dubai"]));
    places.add(22, place(22, "Singapore", 1.3521, 103.8198, ["singapore"]));
    places.add(23, place(23, "Hong Kong", 22.3193, 114.1694, ["hong kong", "hongkong"]));
    places.add(24, place(24, "Seoul", 37.5665, 126.9780, ["seoul"]));
    places.add(25, place(25, "Berlin", 52.5200, 13.4050, ["berlin"]));
    places.add(26, place(26, "Madrid", 40.4168, -3.7038, ["madrid"]));
    places.add(27, place(27, "Lisbon", 38.7223, -9.1393, ["lisbon", "lisboa"]));
    places.add(28, place(28, "Amsterdam", 52.3676, 4.9041, ["amsterdam"]));
    places.add(29, place(29, "Vienna", 48.2082, 16.3738, ["vienna", "wien"]));
    places.add(30, place(30, "Prague", 50.0755, 14.4378, ["prague", "praha"]));
    places.add(31, place(31, "Athens", 37.9838, 23.7275, ["athens", "athina"]));
    places.add(32, place(32, "Barcelona", 41.3874, 2.1686, ["barcelona"]));
    places.add(33, place(33, "San Francisco", 37.7749, -122.4194, ["san francisco", "sf"]));
    places.add(34, place(34, "Las Vegas", 36.1699, -115.1398, ["las vegas", "vegas"]));
    places.add(35, place(35, "Miami", 25.7617, -80.1918, ["miami"]));
    places.add(36, place(36, "Nairobi", -1.2921, 36.8219, ["nairobi"]));
    places.add(37, place(37, "Marrakech", 31.6295, -7.9811, ["marrakech", "marrakesh"]));
    places.add(38, place(38, "Bali", -8.4095, 115.1889, ["bali", "denpasar"]));
    places.add(39, place(39, "Auckland", -36.8509, 174.7645, ["auckland"]));
    places.add(40, place(40, "Reykjavik", 64.1466, -21.9426, ["reykjavik"]));

    {
      accessControlState = old.accessControlState;
      places;
      rooms = Map.empty();
      profiles = Map.empty();
    };
  };
};
