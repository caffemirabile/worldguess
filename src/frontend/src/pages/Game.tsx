import { createActor } from "@/backend";
import { RoomStatus } from "@/backend";
import { MapView } from "@/components/MapView";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { Crown, MapPin, Send, Trophy, Users } from "lucide-react";
import { type FormEvent, useState } from "react";

const TOTAL_ROUNDS = 5n;

function shortName(principal: string): string {
  return `${principal.slice(0, 6)}…${principal.slice(-4)}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function useRoomState(code: string | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["roomState", code],
    queryFn: async () => {
      if (!actor || !code) return null;
      const result = await actor.getRoomState(code);
      return result.__kind__ === "ok" ? result.ok : null;
    },
    enabled: !!actor && !isFetching && !!code,
    refetchInterval: 2000,
  });
}

function useCurrentRoundPlace(code: string | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["currentRoundPlace", code],
    queryFn: async () => {
      if (!actor || !code) return null;
      const result = await actor.getCurrentRoundPlace(code);
      return result.__kind__ === "ok" ? result.ok : null;
    },
    enabled: !!actor && !isFetching && !!code,
    refetchInterval: 2000,
  });
}

function useLeaderboard() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard();
    },
    enabled: !!actor && !isFetching,
  });
}

function useCreateRoom() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (totalRounds: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createRoom(totalRounds);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roomState"] });
    },
  });
}

function useJoinRoom() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.joinRoom(code);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roomState"] });
    },
  });
}

function useStartGame(code: string | null) {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor || !code) throw new Error("Backend is not ready");
      return actor.startGame(code);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roomState", code] });
    },
  });
}

function useSubmitGuess(code: string | null) {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (guess: string) => {
      if (!actor || !code) throw new Error("Backend is not ready");
      return actor.submitGuess(code, guess);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roomState", code] });
    },
  });
}

function RoundRing({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? current / total : 0;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative flex size-16 items-center justify-center">
      <svg
        className="size-16 -rotate-90"
        viewBox="0 0 64 64"
        aria-hidden="true"
      >
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="oklch(0.27 0.03 258)"
          strokeWidth="6"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="oklch(0.66 0.2 25)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute font-mono text-sm font-semibold text-foreground">
        {current}/{total}
      </span>
    </div>
  );
}

function CreateJoinPanel({
  onCreate,
  onJoin,
  createPending,
  joinPending,
  error,
}: {
  onCreate: () => void;
  onJoin: (code: string) => void;
  createPending: boolean;
  joinPending: boolean;
  error: string | null;
}) {
  const [joinCode, setJoinCode] = useState("");

  const handleJoin = (e: FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim();
    if (!code) return;
    onJoin(code);
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/15">
          <MapPin className="size-7 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Start a game
        </h1>
        <p className="mt-2 text-muted-foreground">
          Create a room and invite friends with the room code, or join one that
          is already open.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={onCreate}
            disabled={createPending}
            data-ocid="game.create_room_button"
          >
            <Users className="size-4" />
            {createPending ? "Creating room…" : "Create a room"}
          </Button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or join with a code
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleJoin} className="flex gap-2">
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Room code"
              aria-label="Room code"
              data-ocid="game.join_code_input"
              className="font-mono uppercase"
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={joinPending || !joinCode.trim()}
              data-ocid="game.join_room_button"
            >
              {joinPending ? "Joining…" : "Join"}
            </Button>
          </form>

          {error ? (
            <p className="text-sm text-destructive" data-ocid="game.room_error">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function RoomSidebar({
  roomCode,
  roomStatus,
  currentRound,
  totalRounds,
  hostPrincipal,
  players,
  submittedSet,
  nameByPrincipal,
  callerPrincipal,
  isHost,
  onStart,
  startPending,
}: {
  roomCode: string;
  roomStatus: RoomStatus;
  currentRound: number;
  totalRounds: number;
  hostPrincipal: string;
  players: string[];
  submittedSet: Set<string>;
  nameByPrincipal: Map<string, string>;
  callerPrincipal: string;
  isHost: boolean;
  onStart: () => void;
  startPending: boolean;
}) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="font-display text-sm uppercase tracking-wider text-muted-foreground">
          Room
        </CardTitle>
        <div className="flex items-center justify-between">
          <span
            className="font-mono text-lg font-semibold tracking-widest text-foreground"
            data-ocid="game.room_code"
          >
            {roomCode}
          </span>
          <RoundRing current={currentRound} total={totalRounds} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Players
          </p>
          <ul className="flex flex-col gap-2" data-ocid="game.roster">
            {players.map((principal) => {
              const name =
                nameByPrincipal.get(principal) ?? shortName(principal);
              const submitted = submittedSet.has(principal);
              const isCaller = principal === callerPrincipal;
              const isRoomHost = principal === hostPrincipal;
              return (
                <li
                  key={principal}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background/60 px-3 py-2"
                  data-ocid={`game.roster_item.${players.indexOf(principal)}`}
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary/15 text-primary">
                      {initials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 truncate text-sm font-medium text-foreground">
                      {name}
                      {isRoomHost ? (
                        <Crown
                          className="size-3.5 shrink-0 text-warning"
                          aria-label="Host"
                        />
                      ) : null}
                      {isCaller ? (
                        <span className="text-xs text-muted-foreground">
                          (you)
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className={`size-2 rounded-full ${
                        submitted ? "bg-success" : "animate-pulse bg-primary"
                      }`}
                      aria-hidden="true"
                    />
                    {submitted ? "submitted" : "guessing"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {roomStatus === RoomStatus.waiting ? (
          <div className="flex flex-col gap-2">
            {isHost ? (
              <Button
                type="button"
                size="lg"
                onClick={onStart}
                disabled={startPending || players.length < 1}
                data-ocid="game.start_button"
              >
                {startPending ? "Starting…" : "Start game"}
              </Button>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Waiting for the host to start…
              </p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function LeaderboardPanel({
  entries,
  loading,
}: {
  entries: { rank: number; name: string; score: number }[];
  loading: boolean;
}) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-sm uppercase tracking-wider text-muted-foreground">
          <Trophy className="size-4 text-primary" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }, (_, i) => `skeleton-${i}`).map((id) => (
              <Skeleton key={id} className="h-9 w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p
            className="text-sm text-muted-foreground"
            data-ocid="game.leaderboard_empty"
          >
            No scores yet.
          </p>
        ) : (
          <ol className="flex flex-col gap-1" data-ocid="game.leaderboard">
            {entries.map((entry) => (
              <li
                key={entry.name}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5"
                data-ocid={`game.leaderboard_item.${entry.rank}`}
              >
                <span className="w-5 text-center font-mono text-sm text-muted-foreground">
                  {entry.rank}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {entry.name}
                </span>
                <span className="font-mono text-sm font-semibold text-primary">
                  {entry.score}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function FinalStandings({
  standings,
  callerPrincipal,
}: {
  standings: { principal: string; name: string; total: number }[];
  callerPrincipal: string;
}) {
  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-2xl bg-primary/15">
          <Trophy className="size-7 text-primary" />
        </div>
        <CardTitle className="font-display text-2xl font-bold text-foreground">
          Game over
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-2" data-ocid="game.standings">
          {standings.map((entry, index) => {
            const isCaller = entry.principal === callerPrincipal;
            return (
              <li
                key={entry.principal}
                className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${
                  index === 0
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-background/60"
                }`}
                data-ocid={`game.standings_item.${index}`}
              >
                <span className="w-8 text-center font-display text-xl font-bold text-primary">
                  {index + 1}
                </span>
                <Avatar className="size-9">
                  <AvatarFallback className="bg-primary/15 text-primary">
                    {initials(entry.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {entry.name}
                  {isCaller ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (you)
                    </span>
                  ) : null}
                </span>
                <span className="font-mono text-lg font-semibold text-foreground">
                  {entry.total}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    pts
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

export function GamePage() {
  const { identity } = useAuth();
  const callerPrincipal = identity?.getPrincipal().toString() ?? "";

  const location = useLocation();
  const search = location.search as { mode?: string; roomCode?: string };

  const [roomCode, setRoomCode] = useState<string | null>(
    search.roomCode ?? null,
  );
  const [guess, setGuess] = useState("");
  const [roomError, setRoomError] = useState<string | null>(null);

  const roomQuery = useRoomState(roomCode);
  const placeQuery = useCurrentRoundPlace(roomCode);
  const leaderboardQuery = useLeaderboard();

  const createRoom = useCreateRoom();
  const joinRoom = useJoinRoom();
  const startGame = useStartGame(roomCode);
  const submitGuess = useSubmitGuess(roomCode);

  const room = roomQuery.data;
  const place = placeQuery.data;

  const nameByPrincipal = new Map(
    (leaderboardQuery.data ?? []).map((e) => [
      e.principal.toString(),
      e.displayName,
    ]),
  );

  const handleCreate = () => {
    setRoomError(null);
    createRoom.mutate(TOTAL_ROUNDS, {
      onSuccess: (result) => {
        if (result.__kind__ === "ok") {
          setRoomCode(result.ok.code);
        } else {
          setRoomError("Could not create a room. Please try again.");
        }
      },
      onError: () => setRoomError("Could not create a room. Please try again."),
    });
  };

  const handleJoin = (code: string) => {
    setRoomError(null);
    joinRoom.mutate(code, {
      onSuccess: (result) => {
        if (result.__kind__ === "ok") {
          setRoomCode(result.ok.code);
        } else {
          setRoomError(
            "Could not join that room. Check the code and try again.",
          );
        }
      },
      onError: () =>
        setRoomError("Could not join that room. Check the code and try again."),
    });
  };

  const handleStart = () => {
    if (!roomCode) return;
    startGame.mutate();
  };

  const handleSubmitGuess = (e: FormEvent) => {
    e.preventDefault();
    const value = guess.trim();
    if (!value || !roomCode) return;
    setGuess("");
    submitGuess.mutate(value, {
      onError: () => setGuess((current) => (current === "" ? value : current)),
    });
  };

  if (!roomCode) {
    return (
      <section
        data-ocid="page"
        className="map-texture flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16"
      >
        <CreateJoinPanel
          onCreate={handleCreate}
          onJoin={handleJoin}
          createPending={createRoom.isPending}
          joinPending={joinRoom.isPending}
          error={roomError}
        />
      </section>
    );
  }

  if (roomQuery.isLoading || !room) {
    return (
      <section
        data-ocid="page"
        className="map-texture mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col items-center justify-center gap-4 px-6 py-16"
      >
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-2xl" />
        <p
          className="text-sm text-muted-foreground"
          data-ocid="game.loading_state"
        >
          Loading room…
        </p>
      </section>
    );
  }

  const currentRound = Number(room.currentRound);
  const totalRounds = Number(room.totalRounds);
  const currentRoundView = room.roundScores[currentRound];
  const callerGuess = currentRoundView?.guesses.find(
    (g) => g.player.toString() === callerPrincipal,
  );
  const hasSubmitted = !!callerGuess;

  const runningScore = room.roundScores.reduce((sum, rv) => {
    const g = rv.guesses.find(
      (guess) => guess.player.toString() === callerPrincipal,
    );
    return sum + (g ? Number(g.score) : 0);
  }, 0);

  const submittedSet = new Set(
    (currentRoundView?.guesses ?? []).map((g) => g.player.toString()),
  );

  const players = room.players.map((p) => p.toString());
  const isHost = room.host.toString() === callerPrincipal;

  const leaderboardEntries = (leaderboardQuery.data ?? [])
    .map((e, index) => ({
      rank: index + 1,
      name: e.displayName,
      score: Number(e.totalScore),
    }))
    .slice(0, 8);

  const standings = players
    .map((principal) => {
      const total = room.roundScores.reduce((sum, rv) => {
        const g = rv.guesses.find(
          (guess) => guess.player.toString() === principal,
        );
        return sum + (g ? Number(g.score) : 0);
      }, 0);
      return {
        principal,
        name: nameByPrincipal.get(principal) ?? shortName(principal),
        total,
      };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <section data-ocid="page" className="map-texture min-h-[calc(100vh-4rem)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        {room.status === RoomStatus.finished ? (
          <div className="flex flex-col gap-6">
            <FinalStandings
              standings={standings}
              callerPrincipal={callerPrincipal}
            />
            <div className="mx-auto flex w-full max-w-2xl justify-center">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setRoomCode(null)}
                data-ocid="game.new_game_button"
              >
                Play another game
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
            <aside className="order-2 lg:order-1">
              <RoomSidebar
                roomCode={room.code}
                roomStatus={room.status}
                currentRound={currentRound}
                totalRounds={totalRounds}
                hostPrincipal={room.host.toString()}
                players={players}
                submittedSet={submittedSet}
                nameByPrincipal={nameByPrincipal}
                callerPrincipal={callerPrincipal}
                isHost={isHost}
                onStart={handleStart}
                startPending={startGame.isPending}
              />
            </aside>

            <main className="order-1 lg:order-2">
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle className="font-display text-lg font-bold text-foreground">
                      Round {currentRound + 1} of {totalRounds}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {room.status === RoomStatus.waiting
                        ? "The host will start the game when everyone is ready."
                        : "Where in the world is this place?"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-2">
                    <span className="text-xs text-muted-foreground">Score</span>
                    <span
                      className="font-mono text-lg font-bold text-primary"
                      data-ocid="game.running_score"
                    >
                      {runningScore}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
                  {room.status === RoomStatus.waiting ? (
                    <div
                      className="flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-border bg-background/40"
                      data-ocid="game.waiting_state"
                    >
                      <div className="text-center">
                        <MapPin className="mx-auto mb-3 size-10 text-primary/60" />
                        <p className="text-sm text-muted-foreground">
                          The map will appear here once the game starts.
                        </p>
                      </div>
                    </div>
                  ) : place ? (
                    <div
                      className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-border"
                      data-ocid="game.map"
                    >
                      <MapView
                        latitude={place.lat}
                        longitude={place.lng}
                        zoom={12}
                        className="h-full w-full"
                      />
                    </div>
                  ) : (
                    <Skeleton className="aspect-[16/9] w-full rounded-xl" />
                  )}

                  {room.status === RoomStatus.inProgress ? (
                    hasSubmitted ? (
                      <div
                        className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background/60 px-6 py-6 text-center"
                        data-ocid="game.reveal"
                      >
                        <Badge
                          variant={
                            callerGuess && Number(callerGuess.score) > 0
                              ? "default"
                              : "secondary"
                          }
                          data-ocid="game.reveal_badge"
                        >
                          {callerGuess && Number(callerGuess.score) > 0
                            ? "Correct!"
                            : "Not quite"}
                        </Badge>
                        <p className="font-display text-2xl font-bold text-foreground">
                          {place ? place.name : ""}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          You earned{" "}
                          <span className="font-mono font-semibold text-primary">
                            {callerGuess ? Number(callerGuess.score) : 0}
                          </span>{" "}
                          points this round.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Waiting for the next round to begin…
                        </p>
                      </div>
                    ) : (
                      <form
                        onSubmit={handleSubmitGuess}
                        className="flex flex-col gap-2 sm:flex-row"
                      >
                        <Input
                          value={guess}
                          onChange={(e) => setGuess(e.target.value)}
                          placeholder="Enter your guess here…"
                          aria-label="Your guess"
                          data-ocid="game.guess_input"
                          className="h-11 flex-1"
                          autoComplete="off"
                        />
                        <Button
                          type="submit"
                          size="lg"
                          disabled={submitGuess.isPending || !guess.trim()}
                          data-ocid="game.guess_button"
                          className="h-11"
                        >
                          <Send className="size-4" />
                          {submitGuess.isPending ? "Submitting…" : "Guess"}
                        </Button>
                      </form>
                    )
                  ) : null}
                </CardContent>
              </Card>
            </main>

            <aside className="order-3">
              <LeaderboardPanel
                entries={leaderboardEntries}
                loading={leaderboardQuery.isLoading}
              />
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
