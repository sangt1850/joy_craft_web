import { create } from "zustand";
import { fetchMySites, fetchMyStats } from "../api/sites";
import type { SiteListResponse, SiteStatsResponse } from "../types/api";

interface SiteState {
  sites: SiteListResponse[];
  stats: SiteStatsResponse | null;
  isLoading: boolean;
  loadSites: () => Promise<void>;
  loadStats: () => Promise<void>;
  setSites: (sites: SiteListResponse[]) => void;
}

export const useSiteStore = create<SiteState>()((set) => ({
  sites: [],
  stats: null,
  isLoading: false,

  loadSites: async () => {
    set({ isLoading: true });
    try {
      const sites = await fetchMySites();
      set({ sites, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  loadStats: async () => {
    try {
      const stats = await fetchMyStats();
      set({ stats });
    } catch {
      // ignore
    }
  },

  setSites: (sites) => set({ sites }),
}));
