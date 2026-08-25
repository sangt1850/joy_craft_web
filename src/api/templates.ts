import { api } from "./client";
import type { ApiResponse, TemplateListResponse, TemplateDetailResponse } from "../types/api";

export async function fetchTemplates(category?: string, search?: string): Promise<TemplateListResponse[]> {
  const params = new URLSearchParams();
  if (category && category !== "전체") params.set("category", category);
  if (search) params.set("search", search);
  const query = params.toString() ? `?${params}` : "";
  const res = await api.get<ApiResponse<TemplateListResponse[]>>(`/templates/browse${query}`);
  return res.data;
}

export async function fetchCategories(): Promise<string[]> {
  const res = await api.get<ApiResponse<string[]>>("/templates/categories");
  return res.data;
}

export async function fetchTemplateDetail(id: string): Promise<TemplateDetailResponse> {
  const res = await api.get<ApiResponse<TemplateDetailResponse>>(`/templates/${encodeURIComponent(id)}`);
  return res.data;
}
