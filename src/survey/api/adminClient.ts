import type { AdminStats, AnswerDistribution, GiftPhonesResponse, RespondentPage } from './adminTypes';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function req<T>(path: string, adminKey: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/survey/admin${path}`, {
      ...options,
      headers: {
        'X-Admin-Key': adminKey,
        ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
        ...options?.headers,
      },
    });
  } catch {
    throw new Error('네트워크 오류가 발생했습니다.');
  }
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(json?.message ?? `오류 ${res.status}`);
  }
  const json = (await res.json().catch(() => null)) as { data?: T } | null;
  return json?.data as T;
}

export function createAdminClient(code: string, adminKey: string) {
  const base = `/${code}`;
  return {
    stats: () => req<AdminStats>(`${base}/stats`, adminKey),
    respondents: (params: { page?: number; size?: number; status?: string; group?: string }) => {
      const q = new URLSearchParams();
      if (params.page != null) q.set('page', String(params.page));
      if (params.size != null) q.set('size', String(params.size));
      if (params.status) q.set('status', params.status);
      if (params.group) q.set('group', params.group);
      const qs = q.toString();
      return req<RespondentPage>(`${base}/respondents${qs ? `?${qs}` : ''}`, adminKey);
    },
    answers: (excludeAttFail: boolean) =>
      req<AnswerDistribution>(`${base}/answers?excludeAttFail=${excludeAttFail}`, adminKey),
    changeStatus: (status: string) =>
      req<{ status: string }>(`${base}/status`, adminKey, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
    reset: () =>
      req<{ deletedRespondents: number }>(`${base}/reset`, adminKey, { method: 'POST' }),
    gifts: (params?: { sent?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.sent != null) q.set('sent', String(params.sent));
      const qs = q.toString();
      return req<GiftPhonesResponse>(`${base}/gifts${qs ? `?${qs}` : ''}`, adminKey);
    },
    markGiftSent: (giftId: number, sent: boolean) =>
      req<{ id: number; sent: boolean }>(`${base}/gifts/${giftId}/sent`, adminKey, {
        method: 'POST',
        body: JSON.stringify({ sent }),
      }),
    downloadCsv: async (filterStatus?: string) => {
      const q = new URLSearchParams();
      if (filterStatus) q.set('status', filterStatus);
      const qs = q.toString();
      const res = await fetch(`${BASE}/survey/admin${base}/export.csv${qs ? `?${qs}` : ''}`, {
        headers: { 'X-Admin-Key': adminKey },
      });
      if (!res.ok) throw new Error(`CSV 내보내기 실패 (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${code}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  };
}

export type AdminClient = ReturnType<typeof createAdminClient>;
