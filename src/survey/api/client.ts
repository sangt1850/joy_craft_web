import { ApiError, type ApiErrorCode, type SurveyApi } from './types';
import { mockApi } from './mock';

// 기존 src/api/client.ts는 401이면 로그인 화면으로 보내는 등 JWT 전제라 쓰지 않는다.
const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/survey${path}`, {
      method,
      credentials: 'include', // sv_rid 쿠키
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('NETWORK', '네트워크 연결을 확인해 주세요.');
  }

  const json = (await res.json().catch(() => null)) as
    | { data?: T; code?: string; detail?: Record<string, unknown> }
    | null;

  if (!res.ok) {
    throw new ApiError((json?.code as ApiErrorCode | undefined) ?? 'NETWORK', undefined, json?.detail);
  }
  // JoyCraft API 규약: 성공 응답은 { data: ... } 봉투
  return json?.data as T;
}

const realApi: SurveyApi = {
  start: (code, uid) => request('POST', `/${code}/start`, { uid }),
  current: (code) => request('GET', `/${code}/current`),
  enter: (code, seq) => request('POST', `/${code}/pages/${seq}/enter`),
  submit: (code, seq, body) => request('POST', `/${code}/pages/${seq}/submit`, body),
  submitPhone: (code, body) => request('POST', `/${code}/gift/phone`, body),
  checkPhone: (code, body) => request('POST', `/${code}/gift/phone/check`, body),
};

export const api: SurveyApi = import.meta.env.VITE_USE_MOCK === 'true' ? mockApi : realApi;
