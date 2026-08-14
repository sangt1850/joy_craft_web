import { api } from "./client";
import type { ApiResponse, LoginResponse, UserResponse, KakaoAuthResponse } from "../types/api";

export async function login(loginId: string, password: string): Promise<LoginResponse> {
  const res = await api.post<ApiResponse<LoginResponse>>("/auth/login", { loginId, password });
  return res.data;
}

export async function forceLogin(preAuthTicket: string): Promise<LoginResponse> {
  const res = await api.post<ApiResponse<LoginResponse>>("/auth/force-login", { preAuthTicket });
  return res.data;
}

export async function register(params: {
  loginId: string;
  password: string;
  name: string;
  email?: string;
  phone?: string;
  marketingAgreed: boolean;
}): Promise<LoginResponse> {
  const res = await api.post<ApiResponse<LoginResponse>>("/auth/register", params);
  return res.data;
}

export async function fetchMe(): Promise<UserResponse> {
  const res = await api.get<ApiResponse<UserResponse>>("/auth/me");
  return res.data;
}

export async function fetchKakaoUrl(): Promise<string> {
  const res = await api.get<ApiResponse<{ url: string }>>("/auth/kakao/url");
  return res.data.url;
}

export async function kakaoCallback(code: string): Promise<KakaoAuthResponse> {
  const res = await api.post<ApiResponse<KakaoAuthResponse>>("/auth/kakao/callback", { code });
  return res.data;
}

export async function kakaoRegister(registerToken: string, nickname: string): Promise<KakaoAuthResponse> {
  const res = await api.post<ApiResponse<KakaoAuthResponse>>("/auth/kakao/register", {
    registerToken,
    nickname,
  });
  return res.data;
}
