import { api } from "./client";
import type {
  ApiResponse,
  SiteListResponse,
  SiteStatsResponse,
  SiteDetailResponse,
} from "../types/api";

export async function fetchMySites(): Promise<SiteListResponse[]> {
  const res = await api.get<ApiResponse<SiteListResponse[]>>("/sites");
  return res.data;
}

export async function fetchMyStats(): Promise<SiteStatsResponse> {
  const res = await api.get<ApiResponse<SiteStatsResponse>>("/sites/stats");
  return res.data;
}

export async function createSite(title: string, timezone?: string): Promise<SiteDetailResponse> {
  const res = await api.post<ApiResponse<SiteDetailResponse>>("/sites", { title, timezone });
  return res.data;
}

export async function deleteSite(id: string): Promise<void> {
  await api.delete(`/sites/${id}`);
}
