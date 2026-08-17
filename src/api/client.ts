const BASE_URL = "/api";

/** request()가 throw하는 에러 형태 */
export interface ApiError {
  status: number;
  message?: string;
  [key: string]: unknown;
}

export function isApiError(e: unknown): e is ApiError {
  return typeof e === "object" && e !== null && typeof (e as ApiError).status === "number";
}

interface RequestOptions extends RequestInit {
  /**
   * 공개 엔드포인트(permit-all)용.
   * true면 Authorization 헤더를 붙이지 않고, 401이 와도 로그아웃/리다이렉트하지 않는다.
   */
  skipAuth?: boolean;
  /**
   * Authorization 헤더는 붙이되 401을 받아도 리다이렉트하지 않는다.
   * 로그아웃처럼 "어차피 세션을 정리하는 중"이라 튕겨낼 필요가 없는 요청에 쓴다.
   * (로그아웃은 이미 죽은 토큰으로도 불릴 수 있어서 401이 정상 응답이다)
   */
  skipAuthRedirect?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth = false, skipAuthRedirect = false, ...init } = options;
  const token = skipAuth ? null : localStorage.getItem("accessToken");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  // 공개 요청은 세션과 무관하므로 401이어도 로그인 상태를 건드리지 않는다
  if (res.status === 401 && !skipAuth && !skipAuthRedirect) {
    localStorage.removeItem("accessToken");
    window.location.href = "/";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, ...error } as ApiError;
  }

  // 바디가 없는 성공 응답을 JSON 파싱하면 SyntaxError로 reject된다.
  // 204 No Content뿐 아니라 "200 + 빈 바디"(예: PUT /slides/reorder)도 존재한다.
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put:    <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/** 인증이 필요 없는 공개 엔드포인트 전용 (예: /api/play/{slug}) */
export const publicApi = {
  get: <T>(path: string) => request<T>(path, { skipAuth: true }),
};

/** 세션을 정리하는 중이라 401에 튕겨낼 필요가 없는 요청 전용 (예: 로그아웃) */
export const quietApi = {
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body), skipAuthRedirect: true }),
};
