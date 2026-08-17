import { create } from "zustand";
import { fetchMe, logout as apiLogout } from "../api/auth";
import type { UserResponse } from "../types/api";

interface AuthState {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  fetchMe: () => Promise<void>;
  setUser: (user: UserResponse, token: string) => void;
  /** 서버 세션까지 지운다. 서버 호출이 실패해도 로컬 상태는 반드시 정리된다. */
  logout: () => Promise<void>;
}

/**
 * 이미 /auth/me로 확인을 마친 토큰.
 * AuthGuard는 보호 라우트를 열 때마다 마운트되므로 fetchMe도 그때마다 불린다.
 * 같은 토큰으로 이미 확인했다면 화면을 옮길 때마다 서버에 다시 물을 이유가 없다.
 */
let verifiedToken: string | null = null;
/** 진행 중인 확인 요청. 여러 곳에서 동시에 불러도 요청은 한 번만 나가게 한다. */
let inflight: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  fetchMe: async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      verifiedToken = null;
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    // 같은 토큰으로 이미 확인이 끝났다 — 그대로 쓴다
    if (verifiedToken === token && get().isAuthenticated) {
      if (get().isLoading) set({ isLoading: false });
      return;
    }

    // 확인이 이미 날아가 있으면 그것을 기다린다(중복 요청 방지)
    if (inflight) return inflight;

    inflight = (async () => {
      try {
        const user = await fetchMe();
        verifiedToken = token;
        set({ user, isAuthenticated: true, isLoading: false });
      } catch {
        verifiedToken = null;
        localStorage.removeItem("accessToken");
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    })();

    try {
      await inflight;
    } finally {
      inflight = null;
    }
  },

  setUser: (user: UserResponse, token: string) => {
    localStorage.setItem("accessToken", token);
    // 방금 받은 토큰은 확인된 것으로 본다 — 로그인 직후 /auth/me를 또 부르지 않는다
    verifiedToken = token;
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    // 먼저 서버 세션을 지운다. 이걸 빼먹으면 토큰이 만료될 때까지 계속 살아 있다.
    // apiLogout은 절대 던지지 않으므로 아래 정리는 항상 실행된다.
    await apiLogout();
    verifiedToken = null;
    localStorage.removeItem("accessToken");
    set({ user: null, isAuthenticated: false });
  },
}));
