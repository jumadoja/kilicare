// hooks/useProtectedRoute.ts
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { isTokenExpired } from "../utils/getTokenExpiry";

interface UseProtectedRouteProps {
  requiredRole?: "ADMIN" | "LOCAL" | "TOURIST";
  requireVerified?: boolean;
}

export const useProtectedRoute = ({ requiredRole, requireVerified }: UseProtectedRouteProps = {}) => {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const accessToken = useAuthStore(state => state.accessToken);
  const logout = useAuthStore(state => state.logout);

  useEffect(() => {
    if (!user || !accessToken || isTokenExpired(accessToken)) {
      logout();
      router.replace("/login");
      return;
    }

    if (requireVerified && !user.is_verified) {
      router.replace("/unverified");
      return;
    }

    if (requiredRole && user.role !== requiredRole) {
      router.replace("/unauthorized");
      return;
    }
  }, [user, accessToken, requiredRole, requireVerified, logout, router]);
};