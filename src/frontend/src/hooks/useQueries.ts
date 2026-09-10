import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useCallerUserRole() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["callerUserRole"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProfile() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getProfile();
      if (result.__kind__ === "ok") return result.ok;
      return null;
    },
    enabled: !!actor && !isFetching,
  });
}

/**
 * Registers the signed-in user in the backend. `_internet_identity_sign_in_finish`
 * is idempotent (it calls AccessControl.initialize), so it is safe to call on
 * every sign-in. This must run before any guarded game endpoint is called so the
 * backend never reports "User is not registered".
 */
export function useRegisterUser() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor._internet_identity_sign_in_finish();
      if (result.__kind__ === "err") {
        throw new Error("Could not register your account");
      }
      return result.ok;
    },
    retry: false,
  });
}

export function useSetDisplayName() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.setDisplayName(name);
      if (result.__kind__ === "err") {
        throw new Error("Could not update your display name");
      }
      return result.ok;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
