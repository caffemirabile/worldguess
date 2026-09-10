import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GamePage } from "@/pages/Game";
import { HomePage } from "@/pages/Home";
import { LeaderboardPage } from "@/pages/Leaderboard";
import { LoginPage } from "@/pages/Login";
import { ProfilePage } from "@/pages/Profile";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute();

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const protectedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  component: () => (
    <ProtectedRoute>
      <Layout />
    </ProtectedRoute>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/",
  component: HomePage,
});

const gameRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/game",
  component: GamePage,
});

const leaderboardRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/leaderboard",
  component: LeaderboardPage,
});

const profileRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/profile",
  component: ProfilePage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedLayoutRoute.addChildren([
    homeRoute,
    gameRoute,
    leaderboardRoute,
    profileRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
