import { ApiError, type ApiErrorCode, type SurveyApi } from './types';
import { mockApi } from './mock';

async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'include', // rid 쿠키
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('NETWORK', '네트워크 연결을 확인해 주세요.');
  }
  if (!res.ok) {
    let code: ApiErrorCode = 'NETWORK';
    try {
      const data = await res.json();
      if (data?.code) code = data.code;
    } catch {
      /* 본문 없음 */
    }
    throw new ApiError(code);
  }
  return res.json() as Promise<T>;
}

const realApi: SurveyApi = {
  start: (code, uid) => request('POST', `/s/${code}/start`, { uid }),
  current: (code) => request('GET', `/s/${code}/current`),
  enter: (code, seq) => request('POST', `/s/${code}/pages/${seq}/enter`),
  submit: (code, seq, body) => request('POST', `/s/${code}/pages/${seq}/submit`, body),
};

export const api: SurveyApi = import.meta.env.VITE_USE_MOCK === 'true' ? mockApi : realApi;
