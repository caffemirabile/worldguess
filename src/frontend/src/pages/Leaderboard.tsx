import { createActor } from "@/backend";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { Crown, Medal, RefreshCw, Trophy, Users } from "lucide-react";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

function shortPrincipal(principal: string): string {
  if (principal.length <= 12) return principal;
  return `${principal.slice(0, 6)}…${principal.slice(-4)}`;
}

const podiumStyles = [
  {
    order: "md:order-2",
    ring: "border-primary/50 bg-primary/10",
    medal: "bg-primary text-primary-foreground",
    label: "1st",
    icon: <Crown className="size-4" />,
    scale: "md:scale-105",
  },
  {
    order: "md:order-1",
    ring: "border-accent/40 bg-accent/10",
    medal: "bg-accent text-accent-foreground",
    label: "2nd",
    icon: <Medal className="size-4" />,
    scale: "",
  },
  {
    order: "md:order-3",
    ring: "border-warning/40 bg-warning/10",
    medal: "bg-warning text-warning-foreground",
    label: "3rd",
    icon: <Medal className="size-4" />,
    scale: "",
  },
];

export function LeaderboardPage() {
  const { identity } = useAuth();
  const { actor, isFetching } = useActor(createActor);

  const leaderboardQuery = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });

  const currentPrincipal = identity?.getPrincipal().toString() ?? "";
  const entries = leaderboardQuery.data ?? [];
  const ranked = entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    score: Number(entry.totalScore),
    isCurrent: entry.principal.toString() === currentPrincipal,
  }));

  const topThree = ranked.slice(0, 3);

  const refresh = () => {
    void leaderboardQuery.refetch();
  };

  return (
    <section
      data-ocid="page"
      className="map-texture mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-8 px-6 py-10"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-lg">
              <Trophy className="size-6" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Leaderboard
              </h1>
              <p className="text-base text-muted-foreground">
                Global rankings by cumulative score across every game.
              </p>
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={leaderboardQuery.isFetching}
          data-ocid="leaderboard.refresh_button"
        >
          <RefreshCw
            className={`size-4 ${leaderboardQuery.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {leaderboardQuery.isLoading ? (
        <div className="flex flex-col gap-6" data-ocid="loading_state">
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => `podium-${i}`).map((id) => (
              <Skeleton key={id} className="h-44 rounded-2xl" />
            ))}
          </div>
          <Card className="gap-0">
            <CardContent className="flex flex-col gap-3 px-6 py-5">
              {Array.from({ length: 5 }, (_, i) => `row-${i}`).map((id) => (
                <div key={id} className="flex items-center gap-4">
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="ml-auto h-5 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : leaderboardQuery.isError ? (
        <Card data-ocid="error_state" className="gap-4">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
              <Trophy className="size-7" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-xl font-bold text-foreground">
                Couldn't load the leaderboard
              </h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                Something went wrong while fetching the global rankings. Please
                try again.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={refresh}
              data-ocid="leaderboard.retry_button"
            >
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : ranked.length === 0 ? (
        <Card data-ocid="empty_state" className="gap-4">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Users className="size-7" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-xl font-bold text-foreground">
                No scores yet
              </h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                Play your first game to earn points and claim a spot on the
                global leaderboard.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Podium for top 3 */}
          {topThree.length > 0 && (
            <div
              className="grid gap-4 md:grid-cols-3 md:items-end"
              data-ocid="leaderboard.podium"
            >
              {topThree.map((entry, index) => {
                const style = podiumStyles[index];
                return (
                  <div
                    key={entry.principal.toString()}
                    data-ocid={`leaderboard.podium.${index + 1}`}
                    className={`flex flex-col items-center gap-3 rounded-2xl border bg-card/80 p-6 text-center shadow-lg backdrop-blur transition-smooth ${style.ring} ${style.order} ${style.scale}`}
                  >
                    <div
                      className={`flex size-10 items-center justify-center rounded-full ${style.medal}`}
                    >
                      {style.icon}
                    </div>
                    <Avatar className="size-16 border-4 border-card bg-muted">
                      <AvatarFallback className="bg-primary/20 font-display text-xl font-bold text-primary">
                        {initials(entry.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center justify-center gap-2">
                        <p className="truncate font-display text-lg font-bold text-foreground">
                          {entry.displayName}
                        </p>
                        {entry.isCurrent && (
                          <Badge
                            variant="secondary"
                            className="text-primary"
                            data-ocid="leaderboard.you_badge"
                          >
                            You
                          </Badge>
                        )}
                      </div>
                      <p className="font-mono text-sm text-muted-foreground">
                        {shortPrincipal(entry.principal.toString())}
                      </p>
                    </div>
                    <p className="font-display text-3xl font-bold tracking-tight text-foreground">
                      {entry.score.toLocaleString()}
                    </p>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {style.label} · total pts
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full ranked list */}
          <Card className="gap-0 overflow-hidden" data-ocid="leaderboard.list">
            <CardContent className="flex flex-col px-0 py-0">
              {ranked.map((entry, index) => (
                <div
                  key={entry.principal.toString()}
                  data-ocid={`leaderboard.row.${index + 1}`}
                  className={`flex items-center gap-4 px-6 py-4 transition-smooth ${
                    entry.isCurrent
                      ? "bg-primary/10"
                      : index % 2 === 1
                        ? "bg-muted/30"
                        : ""
                  }`}
                >
                  <span className="w-8 shrink-0 text-center font-mono text-sm font-semibold text-muted-foreground">
                    {entry.rank}
                  </span>
                  <Avatar className="size-9 bg-muted">
                    <AvatarFallback className="bg-primary/15 font-display text-sm font-bold text-primary">
                      {initials(entry.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-display text-base font-semibold text-foreground">
                        {entry.displayName}
                      </p>
                      {entry.isCurrent && (
                        <Badge
                          variant="secondary"
                          className="text-primary"
                          data-ocid="leaderboard.you_badge"
                        >
                          You
                        </Badge>
                      )}
                    </div>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {shortPrincipal(entry.principal.toString())}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-lg font-semibold text-foreground">
                      {entry.score.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">pts</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}
