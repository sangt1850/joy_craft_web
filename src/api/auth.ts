import { api, quietApi } from "./client";
import type {
  ApiResponse,
  LoginResponse,
  UserResponse,
  KakaoAuthResponse,
  KakaoAuthUrlResponse,
} from "../types/api";

/** 인가 요청 시 발급받은 state를 콜백까지 들고 가기 위한 sessionStorage 키 */
export const KAKAO_STATE_KEY = "kakaoOAuthState";

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

/**
 * 서버 세션을 지워 액세스 토큰을 즉시 무효화한다.
 * 실패해도 던지지 않는다 — 로컬 로그아웃은 무슨 일이 있어도 진행되어야 한다.
 */
export async function logout(): Promise<void> {
  if (!localStorage.getItem("accessToken")) return;
  try {
    await quietApi.post("/auth/logout");
  } catch {
    // 네트워크 오류나 이미 만료된 토큰(401) — 어느 쪽이든 로컬 정리는 그대로 진행한다
  }
}

/** 인가 URL과 함께 대조용 state를 받아온다 */
export async function fetchKakaoUrl(): Promise<KakaoAuthUrlResponse> {
  const res = await api.get<ApiResponse<KakaoAuthUrlResponse>>("/auth/kakao/url");
  return res.data;
}

export async function kakaoCallback(code: string, state: string): Promise<KakaoAuthResponse> {
  const res = await api.post<ApiResponse<KakaoAuthResponse>>("/auth/kakao/callback", { code, state });
  return res.data;
}

export async function kakaoRegister(registerToken: string, nickname: string): Promise<KakaoAuthResponse> {
  const res = await api.post<ApiResponse<KakaoAuthResponse>>("/auth/kakao/register", {
    registerToken,
    nickname,
  });
  return res.data;
}
