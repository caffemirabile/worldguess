import { useInternetIdentity } from "@caffeineai/core-infrastructure";

/**
 * Thin wrapper around the Internet Identity auth hook so pages and guards
 * share one consistent surface. `isAuthenticated` is the single source of
 * truth for gating gameplay.
 */
export function useAuth() {
  const {
    identity,
    login,
    clear,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    isLoginSuccess,
    isLoginError,
    loginError,
  } = useInternetIdentity();

  return {
    identity,
    login,
    logout: clear,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    isLoginSuccess,
    isLoginError,
    loginError,
  };
}
