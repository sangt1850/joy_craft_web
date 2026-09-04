import { api } from "./client";
import type { ApiResponse } from "../types/api";

export interface AssetImage {
  id: string;
  url: string;
  originalFilename: string | null;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export function toAssetRef(assetId: string): string {
  return `asset:${assetId}`;
}

export function isAssetRef(value: unknown): value is string {
  return typeof value === "string" && /^asset:[0-9a-fA-F-]{36}$/.test(value);
}

export function assetIdFromRef(value: string): string {
  return value.slice("asset:".length);
}

export function assetContentUrl(assetId: string): string {
  return `/api/assets/${encodeURIComponent(assetId)}/content`;
}

export function resolveImageValue(value: unknown): string {
  if (isAssetRef(value)) return assetContentUrl(assetIdFromRef(value));
  return typeof value === "string" ? value : "";
}

export function resolveAssetRefsDeep<T>(value: T): T {
  if (isAssetRef(value)) return resolveImageValue(value) as T;
  if (Array.isArray(value)) return value.map((item) => resolveAssetRefsDeep(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveAssetRefsDeep(item)])
    ) as T;
  }
  return value;
}

export async function uploadImage(file: File): Promise<AssetImage> {
  const form = new FormData();
  form.append("file", file);
  const res = await api.postForm<ApiResponse<AssetImage>>("/assets/images", form);
  return res.data;
}

export async function fetchMyImages(): Promise<AssetImage[]> {
  const res = await api.get<ApiResponse<AssetImage[]>>("/assets/images");
  return res.data;
}
