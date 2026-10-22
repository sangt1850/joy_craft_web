import { api } from "./client";
import type { ApiResponse, TemplateListResponse, TemplateDetailResponse } from "../types/api";

export interface CreatorTemplateUpdateRequest {
  name?: string;
  description?: string;
  defaultValues?: Record<string, unknown>;
}

export async function fetchMyTemplates(): Promise<TemplateListResponse[]> {
  const res = await api.get<ApiResponse<TemplateListResponse[]>>("/creator/templates");
  return res.data;
}

export async function fetchMyTemplateDetail(id: string): Promise<TemplateDetailResponse> {
  const res = await api.get<ApiResponse<TemplateDetailResponse>>(
    `/creator/templates/${encodeURIComponent(id)}`
  );
  return res.data;
}

export async function updateMyTemplate(
  id: string,
  data: CreatorTemplateUpdateRequest
): Promise<TemplateDetailResponse> {
  const res = await api.put<ApiResponse<TemplateDetailResponse>>(
    `/creator/templates/${encodeURIComponent(id)}`,
    data
  );
  return res.data;
}
