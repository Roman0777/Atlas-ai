import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";

export function useAuth() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.currentUser);
  const { signIn, signOut } = useAuthActions();

  // Derive isLoading directly from the dependencies instead of managing separate state
  const isLoading = isAuthLoading || user === undefined;

  const role = user?.role ?? "user";
  const isAdmin = role === "admin";
  const isPremium =
    isAdmin || (role === "member" && user?.subscriptionStatus === "active");

  return {
    isLoading,
    isAuthenticated,
    user,
    role,
    isAdmin,
    isPremium,
    signIn,
    signOut,
  };
}
