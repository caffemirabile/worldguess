import { createActor } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Compass,
  Globe2,
  KeyRound,
  Play,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";

const TOTAL_ROUNDS = 5n;

function gameErrorText(err: { __kind__: string }): string {
  switch (err.__kind__) {
    case "roomNotFound":
      return "That room code doesn't exist. Double-check and try again.";
    case "roomFull":
      return "That room is already full.";
    case "alreadyInRoom":
      return "You're already in a room.";
    case "gameAlreadyStarted":
      return "That game has already started.";
    case "notSignedIn":
      return "Please sign in to play.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function HomePage() {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useAuth();
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getProfile();
      return result.__kind__ === "ok" ? result.ok : null;
    },
    enabled: !!actor && !isFetching,
  });

  const createRoomMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.createRoom(TOTAL_ROUNDS);
      if (result.__kind__ === "err") throw new Error(gameErrorText(result.err));
      return result.ok;
    },
    onSuccess: (room) => {
      navigate({ to: "/game", search: { mode: "room", roomCode: room.code } });
    },
  });

  const joinRoomMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.joinRoom(code.trim().toUpperCase());
      if (result.__kind__ === "err") throw new Error(gameErrorText(result.err));
      return result.ok;
    },
    onSuccess: (room) => {
      navigate({ to: "/game", search: { mode: "room", roomCode: room.code } });
    },
  });

  const startSoloMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      const created = await actor.createRoom(TOTAL_ROUNDS);
      if (created.__kind__ === "err")
        throw new Error(gameErrorText(created.err));
      const started = await actor.startGame(created.ok.code);
      if (started.__kind__ === "err")
        throw new Error(gameErrorText(started.err));
      return started.ok;
    },
    onSuccess: (room) => {
      navigate({ to: "/game", search: { mode: "room", roomCode: room.code } });
    },
  });

  const displayName = profileQuery.data?.displayName ?? "Player";
  const totalScore = profileQuery.data
    ? Number(profileQuery.data.totalScore)
    : 0;
  const gamesPlayed = profileQuery.data
    ? Number(profileQuery.data.gamesPlayed)
    : 0;
  const principal = identity?.getPrincipal().toString() ?? "";

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const code = roomCode.trim();
    if (!code) return;
    joinRoomMutation.mutate(code);
  };

  return (
    <section
      data-ocid="page"
      className="map-texture mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col gap-10 px-6 py-12 sm:py-16"
    >
      {/* Greeting + score */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-lg">
            <Globe2 className="size-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Welcome back
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {displayName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            data-ocid="score_chip"
            className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm"
          >
            <Trophy className="size-4 text-primary" />
            <span className="font-mono text-lg font-semibold text-foreground">
              {totalScore.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">total pts</span>
          </div>
          <div
            data-ocid="games_chip"
            className="hidden items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm sm:flex"
          >
            <Compass className="size-4 text-accent" />
            <span className="font-mono text-lg font-semibold text-foreground">
              {gamesPlayed}
            </span>
            <span className="text-xs text-muted-foreground">games</span>
          </div>
        </div>
      </div>

      {/* Hero intro */}
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Guess the place. Beat the world.
        </h2>
        <p className="mt-2 text-base text-muted-foreground">
          A random spot on the planet is shown each round. Type the city or
          landmark to score points — the faster and closer you are, the more you
          earn. Start a room with friends or warm up solo.
        </p>
      </div>

      {/* Action cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Create room */}
        <Card
          data-ocid="create_room_card"
          className="relative overflow-hidden border-border bg-card/80 shadow-lg backdrop-blur transition-smooth hover:border-primary/40"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-primary/10 blur-2xl" />
          <CardHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Users className="size-5" />
            </div>
            <CardTitle className="font-display text-xl">
              Create a room
            </CardTitle>
            <CardDescription>
              Host a {Number(TOTAL_ROUNDS)}-round game and invite friends with a
              shareable room code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={() => createRoomMutation.mutate()}
              disabled={createRoomMutation.isPending}
              data-ocid="create_room_button"
            >
              {createRoomMutation.isPending ? (
                "Creating…"
              ) : (
                <>
                  Create room <ArrowRight className="size-4" />
                </>
              )}
            </Button>
            {createRoomMutation.isError && (
              <p
                data-ocid="create_room_error"
                className="mt-3 text-sm text-destructive"
              >
                {createRoomMutation.error.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Join room */}
        <Card
          data-ocid="join_room_card"
          className="relative overflow-hidden border-border bg-card/80 shadow-lg backdrop-blur transition-smooth hover:border-accent/40"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-accent/10 blur-2xl" />
          <CardHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <KeyRound className="size-5" />
            </div>
            <CardTitle className="font-display text-xl">Join a room</CardTitle>
            <CardDescription>
              Enter a friend's room code to jump straight into their game.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="flex flex-col gap-3">
              <label htmlFor="room-code" className="sr-only">
                Room code
              </label>
              <Input
                id="room-code"
                data-ocid="join_room_input"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. 0312-255"
                className="font-mono uppercase tracking-widest"
                maxLength={12}
                autoComplete="off"
              />
              <Button
                type="submit"
                size="lg"
                variant="secondary"
                className="w-full"
                disabled={
                  joinRoomMutation.isPending || roomCode.trim().length === 0
                }
                data-ocid="join_room_button"
              >
                {joinRoomMutation.isPending ? (
                  "Joining…"
                ) : (
                  <>
                    Join room <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
            {joinRoomMutation.isError && (
              <p
                data-ocid="join_room_error"
                className="mt-3 text-sm text-destructive"
              >
                {joinRoomMutation.error.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Solo practice */}
        <Card
          data-ocid="solo_card"
          className="relative overflow-hidden border-border bg-card/80 shadow-lg backdrop-blur transition-smooth hover:border-success/40"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-success/10 blur-2xl" />
          <CardHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-success/15 text-success">
              <Sparkles className="size-5" />
            </div>
            <CardTitle className="font-display text-xl">
              Practice solo
            </CardTitle>
            <CardDescription>
              Play a {Number(TOTAL_ROUNDS)}-round game on your own to sharpen
              your geography skills.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => startSoloMutation.mutate()}
              disabled={startSoloMutation.isPending}
              data-ocid="solo_button"
            >
              <Play className="size-4" />
              {startSoloMutation.isPending ? "Starting…" : "Start practice"}
            </Button>
            {startSoloMutation.isError && (
              <p
                data-ocid="solo_error"
                className="mt-3 text-sm text-destructive"
              >
                {startSoloMutation.error.message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <div className="mt-2 grid gap-4 rounded-2xl border border-border bg-card/60 p-6 sm:grid-cols-3">
        {[
          {
            icon: Globe2,
            title: "See the place",
            text: "A static map of a random worldwide location is shown each round.",
          },
          {
            icon: KeyRound,
            title: "Type your guess",
            text: "Name the city or landmark. Common spellings and close variants count.",
          },
          {
            icon: Trophy,
            title: "Climb the board",
            text: "Earn points for accuracy and speed, then compare with the leaderboard.",
          },
        ].map((step) => (
          <div key={step.title} className="flex gap-3">
            <step.icon className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <h3 className="font-display text-sm font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Signed in as{" "}
        <span className="font-mono">{principal.slice(0, 10)}…</span>
      </p>
    </section>
  );
}
