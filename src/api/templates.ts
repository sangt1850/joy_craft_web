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

// 모듈 레벨 캐시 — SPA 세션 동안 동일 id 재요청 방지
const _detailCache = new Map<string, Promise<TemplateDetailResponse>>();

/** fetchTemplateDetail의 캐시 버전. 동일 id는 네트워크 요청 1회만 발생한다. */
export function fetchTemplateDetailCached(id: string): Promise<TemplateDetailResponse> {
  if (!_detailCache.has(id)) {
    _detailCache.set(
      id,
      fetchTemplateDetail(id).catch((err) => {
        // 에러 시 캐시에서 제거해 재시도 허용
        _detailCache.delete(id);
        throw err;
      })
    );
  }
  return _detailCache.get(id)!;
}
