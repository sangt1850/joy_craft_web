import { api } from "./client";
import type { ApiResponse, PlatformStatsResponse, UserResponse } from "../types/api";

export async function fetchPlatformStats(): Promise<PlatformStatsResponse> {
  const res = await api.get<ApiResponse<PlatformStatsResponse>>("/admin/stats");
  return res.data;
}

export async function fetchRecentUsers(): Promise<UserResponse[]> {
  const res = await api.get<ApiResponse<UserResponse[]>>("/admin/users/recent");
  return res.data;
}
