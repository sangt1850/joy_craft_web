import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './client';
import { ApiError } from './types';

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => (body === undefined ? Promise.reject(new Error('no body')) : Promise.resolve(body)),
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe('survey api client', () => {
  it('JoyCraft 응답 봉투({data})를 풀어서 돌려준다', async () => {
    mockFetch(200, { data: { status: 'IN_PROGRESS' } });
    await expect(api.current('demo')).resolves.toEqual({ status: 'IN_PROGRESS' });
  });

  it('/api/survey/{code}/... 로 쿠키(credentials)를 포함해 호출한다', async () => {
    const fn = mockFetch(200, { data: {} });
    await api.start('demo', 'P1');
    const [url, init] = fn.mock.calls[0];
    expect(url).toBe('/api/survey/demo/start');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(JSON.parse(init.body)).toEqual({ uid: 'P1' });
  });

  it('submit/enter 경로에 페이지 번호가 들어간다', async () => {
    const fn = mockFetch(200, { data: {} });
    await api.enter('demo', 4);
    await api.submit('demo', 4, { answers: [], clientActiveMs: 1, hiddenCount: 0, blurCount: 0 });
    expect(fn.mock.calls[0][0]).toBe('/api/survey/demo/pages/4/enter');
    expect(fn.mock.calls[1][0]).toBe('/api/survey/demo/pages/4/submit');
  });

  it('서버 에러 코드와 detail을 ApiError로 보존한다', async () => {
    mockFetch(422, { code: 'TOO_EARLY', message: '…', detail: { remainingMs: 1200 } });
    const err = await api.submit('demo', 4, { answers: [], clientActiveMs: 0, hiddenCount: 0, blurCount: 0 }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('TOO_EARLY');
    expect(err.detail).toEqual({ remainingMs: 1200 });
  });

  it('본문이 없는 실패 응답은 NETWORK로 처리한다', async () => {
    mockFetch(502, undefined);
    const err = await api.current('demo').catch((e) => e);
    expect(err.code).toBe('NETWORK');
  });

  it('fetch 자체가 실패하면(오프라인 등) NETWORK', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const err = await api.current('demo').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('NETWORK');
  });

  it('401이어도 로그인 화면으로 보내지 않고 RESPONDENT_NOT_FOUND 코드만 올린다', async () => {
    mockFetch(401, { code: 'RESPONDENT_NOT_FOUND', message: '…' });
    const err = await api.current('demo').catch((e) => e);
    expect(err.code).toBe('RESPONDENT_NOT_FOUND');
  });
});
