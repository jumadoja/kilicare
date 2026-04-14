import { create } from "zustand";
import { getPersistedAuth, User } from "../services/auth";
import { isTokenExpired } from "../utils/getTokenExpiry";

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (auth: { user: User; accessToken: string; refreshToken: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,

  setAuth: ({ user, accessToken, refreshToken }) => {
    set({ user, accessToken, refreshToken });

    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
    }
  },

  logout: () => {
    set({ user: null, accessToken: null, refreshToken: null });

    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  },
}));

// 🔥 INIT (important for Next.js)
export const initAuthStore = () => {
  const persisted = getPersistedAuth();

  if (persisted && !isTokenExpired(persisted.accessToken)) {
    useAuthStore.getState().setAuth(persisted);
  } else {
    useAuthStore.getState().logout();
  }
};