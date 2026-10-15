import { create } from "zustand";
import { fetchMySites, fetchMyStats } from "../api/sites";
import type { SiteListResponse, SiteStatsResponse } from "../types/api";

interface SiteState {
  sites: SiteListResponse[];
  stats: SiteStatsResponse | null;
  isLoading: boolean;
  error: boolean;
  loadSites: () => Promise<void>;
  loadStats: () => Promise<void>;
  setSites: (sites: SiteListResponse[]) => void;
}

export const useSiteStore = create<SiteState>()((set) => ({
  sites: [],
  stats: null,
  isLoading: false,
  error: false,

  loadSites: async () => {
    set({ isLoading: true, error: false });
    try {
      const sites = await fetchMySites();
      set({ sites, isLoading: false });
    } catch {
      set({ isLoading: false, error: true });
    }
  },

  loadStats: async () => {
    try {
      const stats = await fetchMyStats();
      set({ stats });
    } catch {
      // 통계는 보조 정보이므로 에러 무시
    }
  },

  setSites: (sites) => set({ sites }),
}));
