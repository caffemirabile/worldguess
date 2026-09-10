import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link, Outlet } from "@tanstack/react-router";
import { LogOut, MapPin, Trophy, User, Users } from "lucide-react";

const navLinkClass =
  "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-smooth text-muted-foreground hover:bg-muted hover:text-foreground";

const navLinkActiveClass = "bg-primary/15 text-primary";

export function Layout() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-subtle">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-foreground"
          >
            <MapPin className="size-5 text-primary" />
            WorldGuess
          </Link>

          <nav className="flex items-center gap-1" aria-label="Primary">
            <Link
              to="/"
              className={navLinkClass}
              activeProps={{ className: navLinkActiveClass }}
              data-ocid="nav.lobby"
            >
              <Users className="size-4" />
              <span className="hidden sm:inline">Lobby</span>
            </Link>
            <Link
              to="/leaderboard"
              className={navLinkClass}
              activeProps={{ className: navLinkActiveClass }}
              data-ocid="nav.leaderboard"
            >
              <Trophy className="size-4" />
              <span className="hidden sm:inline">Leaderboard</span>
            </Link>
            <Link
              to="/profile"
              className={navLinkClass}
              activeProps={{ className: navLinkActiveClass }}
              data-ocid="nav.profile"
            >
              <User className="size-4" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
          </nav>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            data-ocid="logout_button"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 text-xs text-muted-foreground sm:px-6">
          <span className="font-mono">WorldGuess · guess the place</span>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="transition-smooth hover:text-foreground"
          >
            © {new Date().getFullYear()}. Built with love using caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
