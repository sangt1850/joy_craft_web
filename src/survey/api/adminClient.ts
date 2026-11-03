import type {
  AdminStats,
  AnswerDistribution,
  GiftConfigData,
  GiftExportLogItem,
  GiftPhoneItem,
  GiftPhonesResponse,
  QuestionEditData,
  QuestionType,
  RespondentPage,
} from './adminTypes';
import type { GiftContent } from './types';

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
    respondents: (params: { page?: number; size?: number; status?: string; group?: string; attentionFailed?: boolean }) => {
      const q = new URLSearchParams();
      if (params.page != null) q.set('page', String(params.page));
      if (params.size != null) q.set('size', String(params.size));
      if (params.status) q.set('status', params.status);
      if (params.group) q.set('group', params.group);
      if (params.attentionFailed != null) q.set('attentionFailed', String(params.attentionFailed));
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
    changeTarget: (targetN: number) =>
      req<{ targetN: number }>(`${base}/target`, adminKey, {
        method: 'POST',
        body: JSON.stringify({ targetN }),
      }),
    changeGroupLimits: (limits: Record<string, number>) =>
      req<{ limits: Record<string, number> }>(`${base}/quotas/groups`, adminKey, {
        method: 'POST',
        body: JSON.stringify({ limits }),
      }),
    questions: () => req<QuestionEditData>(`${base}/questions`, adminKey),
    updateQuestion: (
      questionId: number,
      patch: { text?: string; qtype?: QuestionType; required?: boolean },
    ) =>
      req<QuestionEditData>(`${base}/questions/${questionId}`, adminKey, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    updatePage: (
      pageKey: string,
      page: { title: string; instruction: string; minSeconds?: number },
    ) =>
      req<QuestionEditData>(`${base}/pages/${encodeURIComponent(pageKey)}`, adminKey, {
        method: 'PUT',
        body: JSON.stringify(page),
      }),
    moveQuestion: (questionId: number, direction: 'UP' | 'DOWN') =>
      req<QuestionEditData>(`${base}/questions/${questionId}/move`, adminKey, {
        method: 'POST',
        body: JSON.stringify({ direction }),
      }),
    replaceOptions: (questionId: number, options: Array<{ id: number | null; label: string }>) =>
      req<QuestionEditData>(`${base}/questions/${questionId}/options`, adminKey, {
        method: 'PUT',
        body: JSON.stringify({ options }),
      }),
    reset: () =>
      req<{ deletedRespondents: number }>(`${base}/reset`, adminKey, { method: 'POST' }),
    gifts: (params?: { sent?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.sent != null) q.set('sent', String(params.sent));
      const qs = q.toString();
      return req<GiftPhonesResponse>(`${base}/gifts${qs ? `?${qs}` : ''}`, adminKey);
    },
    giftConfig: () => req<GiftConfigData>(`${base}/gift-config`, adminKey),
    saveGiftConfig: (enabled: boolean, content: GiftContent) =>
      req<GiftConfigData>(`${base}/gift-config`, adminKey, {
        method: 'PUT',
        body: JSON.stringify({ enabled, content }),
      }),
    markGiftSent: (giftId: number, sent: boolean) =>
      req<{ id: number; sent: boolean }>(`${base}/gifts/${giftId}/sent`, adminKey, {
        method: 'POST',
        body: JSON.stringify({ sent }),
      }),
    /** 여러 gift를 일괄로 발송완료/미발송 처리한다 (순차 호출) */
    markGiftSentBulk: async (giftIds: number[], sent: boolean) => {
      for (const id of giftIds) {
        await req<{ id: number; sent: boolean }>(`${base}/gifts/${id}/sent`, adminKey, {
          method: 'POST',
          body: JSON.stringify({ sent }),
        });
      }
    },
    /**
     * 미발송 기프트콘 발송용 xlsx를 gift_sample.xlsx 양식 그대로 생성해 다운로드한다.
     * - 미발송(sentAt === null) 항목만 포함, finishedAt 오름차순
     * - 1행: 유의사항, 2행: 휴대폰번호|이름 헤더, 3행~: 데이터 (이름칸도 번호로 채움)
     * @returns 내보낸 미발송 GiftPhoneItem.id 목록
     */
    downloadGiftXlsx: async (): Promise<{ unsentIds: number[] }> => {
      const data = await req<GiftPhonesResponse>(`${base}/gifts`, adminKey);
      const { utils, writeFile } = await import('xlsx');

      const unsent: GiftPhoneItem[] = data.items
        .filter((it) => it.sentAt == null)
        .sort((a, b) => (a.finishedAt ?? '').localeCompare(b.finishedAt ?? ''));

      if (unsent.length === 0) {
        throw new Error('미발송 항목이 없습니다.');
      }

      const NOTICE =
        '*수신자번호 엑셀 업로드 작성 유의사항\r\n' +
        '(※ 양식 변경 시 업로드 불가, 3행부터 수신자정보를 입력해 주세요.)\r\n\r\n' +
        '-양식에 맞춰 휴대폰번호/이름(임의작성가능)을 등록해주세요.\r\n' +
        '(*최대 1,000명까지 등록 가능하며, 초과할 경우 업로드 불가)\r\n\r\n' +
        '-엑셀 업로드 시 중복/스팸/오류번호 등의 휴대폰 번호가 포함되어 있을 경우, 정상 등록이 불가하니 오류사유를 확인 하신 후 삭제 및 수정 등록해 주시기 바랍니다.\r\n\r\n' +
        '-휴대폰번호와 이름은 필수 입력 항목입니다. (이름은 임의작성 가능하며, 입력 시 한글/영문/숫자 입력 가능, 자릿수는 한글 1~26자, 영문1~80자 이내로 입력해 주세요.)\r\n\r\n' +
        '-동일 휴대폰번호는 20개 이상 등록 시 발송 불가합니다.';

      const aoa: (string | number)[][] = [
        [NOTICE, ''],
        ['휴대폰번호', '이름'],
        ...unsent.map((it) => [it.phone, it.phone]),
      ];
      const ws = utils.aoa_to_sheet(aoa);

      // 샘플 파일과 동일한 열 너비
      ws['!cols'] = [
        { wch: 28.3 }, // A열: 휴대폰번호
        { wch: 37.2 }, // B열: 이름
      ];

      // 샘플 파일과 동일한 1행 높이 (유의사항 텍스트 영역)
      ws['!rows'] = [{ hpt: 222 }];

      // A1:B1 병합 (유의사항 셀이 두 열에 걸쳐 표시)
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

      // A1 줄바꿈 표시
      if (ws['A1']) {
        ws['A1'].s = { alignment: { wrapText: true } };
      }

      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Sheet1');

      const filename = `gift_${code}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      writeFile(wb, filename);

      return { unsentIds: unsent.map((it) => it.id) };
    },
    // ── 기프트콘 내보내기 로그 ───────────────────────────────────────────────
    giftExportLogs: () =>
      req<GiftExportLogItem[]>(`${base}/gift-exports`, adminKey),

    createGiftExportLog: (giftIds: number[]) =>
      req<GiftExportLogItem>(`${base}/gift-exports`, adminKey, {
        method: 'POST',
        body: JSON.stringify({ giftIds }),
      }),

    markGiftExportSent: (exportId: number, sent: boolean) =>
      req<{ id: number; sent: boolean }>(`${base}/gift-exports/${exportId}/mark-sent`, adminKey, {
        method: 'POST',
        body: JSON.stringify({ sent }),
      }),

    deleteGiftExportLog: (exportId: number) =>
      req<{ id: number }>(`${base}/gift-exports/${exportId}`, adminKey, {
        method: 'DELETE',
      }),

    /** 선택한 열을 순서대로 담은 서식 있는 엑셀(.xlsx)을 받는다 */
    downloadXlsx: async (columns: string[]) => {
      const q = new URLSearchParams({ format: 'xlsx', columns: columns.join(',') });
      const qs = q.toString();
      const res = await fetch(`${BASE}/survey/admin${base}/export.csv${qs ? `?${qs}` : ''}`, {
        headers: { 'X-Admin-Key': adminKey },
      });
      if (!res.ok) throw new Error(`엑셀 내보내기 실패 (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${code}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  };
}

export type AdminClient = ReturnType<typeof createAdminClient>;
