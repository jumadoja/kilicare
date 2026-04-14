// hooks/Protected.tsx
import { useAuthStore } from "../store/authStore";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isTokenExpired } from "../utils/getTokenExpiry";

interface ProtectedProps {
  children: ReactNode;
  requiredRole?: "ADMIN" | "LOCAL" | "TOURIST";
  requireVerified?: boolean;
}

export const Protected: React.FC<ProtectedProps> = ({ children, requiredRole, requireVerified }) => {
  const user = useAuthStore(state => state.user);
  const accessToken = useAuthStore(state => state.accessToken);
  const logout = useAuthStore(state => state.logout);
  const router = useRouter();

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

  if (!user || !accessToken || isTokenExpired(accessToken) || (requireVerified && !user.is_verified) || (requiredRole && user.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
};