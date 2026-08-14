import { create } from "zustand";
import { fetchMe } from "../api/auth";
import type { UserResponse } from "../types/api";

interface AuthState {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  fetchMe: () => Promise<void>;
  setUser: (user: UserResponse, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  fetchMe: async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const user = await fetchMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem("accessToken");
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user: UserResponse, token: string) => {
    localStorage.setItem("accessToken", token);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    set({ user: null, isAuthenticated: false });
  },
}));
