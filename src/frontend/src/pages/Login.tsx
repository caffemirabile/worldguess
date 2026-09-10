import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "@tanstack/react-router";
import { Globe2, Loader2, Lock, MapPin, Trophy, Users } from "lucide-react";

const features = [
  {
    icon: Globe2,
    title: "Random places worldwide",
    description: "Every round drops you somewhere new on the map.",
  },
  {
    icon: Users,
    title: "Play against friends",
    description: "Compete head-to-head in live multiplayer rooms.",
  },
  {
    icon: Trophy,
    title: "Climb the leaderboard",
    description: "Earn points for sharp guesses and fast answers.",
  },
];

export function LoginPage() {
  const {
    isAuthenticated,
    login,
    isInitializing,
    isLoggingIn,
    isLoginError,
    loginError,
  } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  const disabled = isInitializing || isLoggingIn;

  return (
    <main
      data-ocid="page"
      className="map-texture flex min-h-screen flex-col items-center justify-center gap-10 bg-background px-6 py-16"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/15 shadow-card">
          <MapPin className="size-8 text-primary" />
        </span>
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            WorldGuess
          </h1>
          <p className="max-w-md text-base text-muted-foreground sm:text-lg">
            Guess the place. Challenge your friends. Climb the leaderboard.
          </p>
        </div>
      </div>

      <Card
        data-ocid="login_card"
        className="w-full max-w-md border-border/60 bg-card/70 shadow-elevated backdrop-blur-sm"
      >
        <CardHeader className="items-center text-center">
          <Badge
            variant="secondary"
            data-ocid="login_required_badge"
            className="gap-1.5 rounded-full px-3 py-1"
          >
            <Lock className="size-3.5 text-accent" />
            Sign in required to play
          </Badge>
          <CardTitle className="font-display text-xl text-foreground">
            Ready to explore the world?
          </CardTitle>
          <CardDescription className="max-w-sm">
            Connect with Internet Identity to join rooms, guess locations, and
            track your score. Your progress is saved to your profile.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <Button
            type="button"
            size="lg"
            onClick={() => login()}
            disabled={disabled}
            data-ocid="login_button"
            className="w-full rounded-full px-8 py-6 text-base"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                <Lock className="size-5" />
                Sign in with Internet Identity
              </>
            )}
          </Button>

          {isLoginError && (
            <p
              data-ocid="login_error"
              className="text-center text-sm text-destructive"
            >
              {loginError?.message ?? "Sign-in failed. Please try again."}
            </p>
          )}

          <div className="grid gap-3 border-t border-border/60 pt-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-3 text-left"
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <feature.icon className="size-4.5 text-accent" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {feature.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="max-w-sm text-center text-sm text-muted-foreground">
        You&apos;ll need an account to play. Signing in is free and takes just a
        moment.
      </p>
    </main>
  );
}
