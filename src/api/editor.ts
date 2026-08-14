import { api } from "./client";
import type {
  ApiResponse,
  SiteDetailResponse,
  SlideResponse,
  PublishResponse,
} from "../types/api";

export async function fetchSiteDetail(id: string): Promise<SiteDetailResponse> {
  const res = await api.get<ApiResponse<SiteDetailResponse>>(`/sites/${id}`);
  return res.data;
}

export async function updateSite(
  id: string,
  data: { title?: string; theme?: unknown; flowPolicy?: unknown }
): Promise<SiteDetailResponse> {
  const res = await api.put<ApiResponse<SiteDetailResponse>>(`/sites/${id}`, data);
  return res.data;
}

export async function addSlide(
  siteId: string,
  templateId: string,
  overrides?: Record<string, unknown>
): Promise<SiteDetailResponse> {
  const res = await api.post<ApiResponse<SiteDetailResponse>>(`/sites/${siteId}/slides`, {
    templateId,
    overrides,
  });
  return res.data;
}

export async function removeSlide(siteId: string, slideId: string): Promise<void> {
  await api.delete(`/sites/${siteId}/slides/${slideId}`);
}

export async function reorderSlides(siteId: string, slideIds: string[]): Promise<void> {
  await api.put(`/sites/${siteId}/slides/reorder`, { slideIds });
}

export async function updateSlide(
  siteId: string,
  slideId: string,
  data: { overrides?: Record<string, unknown>; escapeAfter?: number }
): Promise<SlideResponse> {
  const res = await api.put<ApiResponse<SlideResponse>>(
    `/sites/${siteId}/slides/${slideId}`,
    data
  );
  return res.data;
}

export async function publishSite(siteId: string): Promise<PublishResponse> {
  const res = await api.post<ApiResponse<PublishResponse>>(`/sites/${siteId}/publish`);
  return res.data;
}
