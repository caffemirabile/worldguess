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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useGetProfile, useSetDisplayName } from "@/hooks/useQueries";
import { Check, Crown, Gamepad2, Pencil, Trophy, X } from "lucide-react";
import { useState } from "react";

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

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: "primary" | "accent" | "success";
}) {
  const accentClass =
    accent === "primary"
      ? "bg-primary/15 text-primary"
      : accent === "accent"
        ? "bg-accent/15 text-accent"
        : "bg-success/15 text-success";

  return (
    <Card className="gap-3">
      <CardContent className="flex items-center gap-4 px-5 py-4">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${accentClass}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="font-display text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfilePage() {
  const { identity } = useAuth();
  const { data: profile, isLoading } = useGetProfile();
  const setDisplayName = useSetDisplayName();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const principal = identity?.getPrincipal().toString() ?? "";
  const displayName = profile?.displayName ?? "Explorer";
  const totalScore = profile ? Number(profile.totalScore) : 0;
  const bestScore = profile ? Number(profile.bestScore) : 0;
  const gamesPlayed = profile ? Number(profile.gamesPlayed) : 0;

  const startEditing = () => {
    setDraft(displayName);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraft("");
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = draft.trim();
    if (!name) return;
    setDraft("");
    setEditing(false);
    setDisplayName.mutate(name, {
      onError: () => setDraft(name),
    });
  };

  return (
    <section
      data-ocid="page"
      className="map-texture mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-6 px-6 py-10"
    >
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Profile
        </h1>
        <p className="text-base text-muted-foreground">
          Your identity, display name, and lifetime scores across WorldGuess.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-6" data-ocid="loading_state">
          <Card className="gap-4">
            <CardContent className="flex items-center gap-4 px-6 py-6">
              <Skeleton className="size-16 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => `stat-${i}`).map((id) => (
              <Skeleton key={id} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <Card className="gap-0 overflow-hidden">
            <div className="h-24 bg-gradient-primary" />
            <CardContent className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <Avatar className="size-16 border-4 border-card bg-muted">
                  <AvatarFallback className="bg-primary/20 font-display text-xl font-bold text-primary">
                    {initials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 pb-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                      {displayName}
                    </h2>
                    <Badge
                      variant="secondary"
                      className="gap-1 text-accent"
                      data-ocid="profile.role_badge"
                    >
                      <Crown className="size-3" />
                      Player
                    </Badge>
                  </div>
                  <p className="font-mono text-sm text-muted-foreground">
                    {shortPrincipal(principal)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startEditing}
                data-ocid="profile.edit_name_button"
              >
                <Pencil className="size-4" />
                Edit name
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Total score"
              value={totalScore.toLocaleString()}
              icon={<Trophy className="size-5" />}
              accent="primary"
            />
            <StatCard
              label="Best score"
              value={bestScore.toLocaleString()}
              icon={<Crown className="size-5" />}
              accent="accent"
            />
            <StatCard
              label="Games played"
              value={gamesPlayed.toLocaleString()}
              icon={<Gamepad2 className="size-5" />}
              accent="success"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">
                Display name
              </CardTitle>
              <CardDescription>
                This is the name other players see on the leaderboard and in
                your game room.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editing ? (
                <form
                  onSubmit={submit}
                  className="flex flex-col gap-3 sm:flex-row sm:items-end"
                >
                  <div className="flex w-full flex-col gap-1.5 sm:max-w-xs">
                    <Label htmlFor="display-name">Display name</Label>
                    <Input
                      id="display-name"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Your display name"
                      maxLength={40}
                      autoFocus
                      data-ocid="profile.name_input"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!draft.trim() || setDisplayName.isPending}
                      data-ocid="profile.save_button"
                    >
                      <Check className="size-4" />
                      {setDisplayName.isPending ? "Saving…" : "Save"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={cancelEditing}
                      data-ocid="profile.cancel_button"
                    >
                      <X className="size-4" />
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/40 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-semibold text-foreground">
                      {displayName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Shown to other players
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={startEditing}
                    data-ocid="profile.edit_name_button"
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                </div>
              )}
              {setDisplayName.isError && (
                <p
                  className="mt-3 text-sm text-destructive"
                  data-ocid="profile.error_state"
                >
                  {setDisplayName.error?.message ??
                    "Could not update your display name. Please try again."}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}
