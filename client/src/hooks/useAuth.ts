/**
 * useAuth Hook
 * 
 * Provides authentication state and helpers
 */

import { trpc } from "@/lib/trpc";

export function useAuth() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
  };
}

export function getLoginUrl() {
  return "/login";
}
