import { useAuth } from "@/hooks/useAuth";
import { useRegisterUser } from "@/hooks/useQueries";
import { Navigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Requires login before any gameplay. While the stored session is restoring
 * we show a brief loading state; unauthenticated users are redirected to the
 * login screen.
 *
 * On every sign-in we register the user in the backend (idempotent) so guarded
 * game endpoints never report "User is not registered".
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing } = useAuth();
  const registerUser = useRegisterUser();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (
      isAuthenticated &&
      !isInitializing &&
      !registeredRef.current &&
      !registerUser.isPending
    ) {
      registeredRef.current = true;
      registerUser.mutate();
    }
  }, [isAuthenticated, isInitializing, registerUser]);

  if (isInitializing) {
    return (
      <div
        data-ocid="loading_state"
        className="flex min-h-screen items-center justify-center bg-background"
      >
        <p className="font-mono text-sm text-muted-foreground">
          Restoring session…
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
