import { useCallback, useEffect, useState } from 'react';
import type { AdminClient } from '../../api/adminClient';
import type { RespondentPage } from '../../api/adminTypes';

const PAGE_SIZE = 50;
const COLUMN_COUNT = 7;

function formatDuration(ms: number | null): string {
  if (ms == null || ms < 0) return '-';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m === 0) return `${sec}초`;
  return `${m}분 ${sec}초`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Props {
  client: AdminClient;
}

export function RespondentsTab({ client }: Props) {
  const [data, setData] = useState<RespondentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [groups, setGroups] = useState<string[]>([]);
  const [group, setGroup] = useState('');
  const [attention, setAttention] = useState<'' | 'pass' | 'fail'>('');

  useEffect(() => {
    client
      .stats()
      .then((s) => setGroups(Object.keys(s.byGroup).sort()))
      .catch(() => undefined);
  }, [client]);

  const load = useCallback(
    (p: number) => {
      setLoading(true);
      setError('');
      client
        .respondents({
          page: p,
          size: PAGE_SIZE,
          group: group || undefined,
          attentionFailed: attention === '' ? undefined : attention === 'fail',
        })
        .then(setData)
        .catch((e: unknown) => setError(e instanceof Error ? e.message : '불러오기 실패'))
        .finally(() => setLoading(false));
    },
    [client, group, attention],
  );

  useEffect(() => {
    load(page);
  }, [load, page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="admin-section">
      <div className="admin-filters">
        <select
          className="admin-select"
          aria-label="그룹 필터"
          value={group}
          onChange={(e) => {
            setGroup(e.target.value);
            setPage(0);
          }}
        >
          <option value="">전체 그룹</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              그룹 {g}
            </option>
          ))}
        </select>
        <select
          className="admin-select"
          aria-label="주의 점검 필터"
          value={attention}
          onChange={(e) => {
            setAttention(e.target.value as '' | 'pass' | 'fail');
            setPage(0);
          }}
        >
          <option value="">주의 점검 전체</option>
          <option value="pass">주의 점검 통과</option>
          <option value="fail">주의 점검 실패</option>
        </select>
        {data && (
          <span className="admin-total-count">총 {data.total.toLocaleString()}명</span>
        )}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>그룹</th>
              <th>
                <span
                  className="th-with-tip"
                  data-tooltip="주의 점검 문항(ATT)에서 지정된 답을 선택하지 않은 응답자. 분석에서 제외 권장."
                >
                  주의 ⓘ
                </span>
              </th>
              <th>
                <span
                  className="th-with-tip"
                  data-tooltip="설문 완료 후 이벤트(선물 받기)에 참여한 응답자. 전화번호를 등록한 경우입니다."
                >
                  이벤트 ⓘ
                </span>
              </th>
              <th>시작</th>
              <th>완료</th>
              <th>소요시간</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="admin-table__status" colSpan={COLUMN_COUNT}>
                  불러오는 중…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="admin-table__status admin-table__status--error" colSpan={COLUMN_COUNT}>
                  <span role="alert">{error}</span>
                  <button className="admin-retry-btn" onClick={() => load(page)}>
                    다시 시도
                  </button>
                </td>
              </tr>
            ) : !data || data.items.length === 0 ? (
              <tr>
                <td className="admin-table__status" colSpan={COLUMN_COUNT}>
                  응답자가 없습니다.
                </td>
              </tr>
            ) : (
              data.items.map((item) => (
                <tr key={item.id}>
                  <td className="admin-table__id" title={item.id}>
                    {item.id.slice(0, 8)}…
                  </td>
                  <td>{item.groupCode ?? '-'}</td>
                  <td
                    className={
                      item.attentionFailed ? 'admin-table__att-fail' : 'admin-table__att-ok'
                    }
                    title={
                      item.attentionFailed
                        ? '주의 점검 실패 — 불성실 응답 가능성 있음'
                        : '주의 점검 통과'
                    }
                  >
                    {item.attentionFailed ? '✗ 실패' : '✓ 통과'}
                  </td>
                  <td
                    className={item.giftPhone ? 'respondent-gift--yes' : 'respondent-gift--no'}
                    title={item.giftPhone ? `전화번호: ${item.giftPhone}` : '미참여'}
                  >
                    {item.giftPhone ? '✓ 참여' : '-'}
                  </td>
                  <td className="admin-table__time">{formatDateTime(item.startedAt)}</td>
                  <td className="admin-table__time">{formatDateTime(item.finishedAt)}</td>
                  <td>{formatDuration(item.totalMs)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-pagination">
        <button
          className="admin-page-btn"
          disabled={loading || page === 0}
          onClick={() => setPage((p) => p - 1)}
        >
          이전
        </button>
        <span className="admin-page-info">
          {page + 1} / {totalPages}
        </span>
        <button
          className="admin-page-btn"
          disabled={loading || page >= totalPages - 1}
          onClick={() => setPage((p) => p + 1)}
        >
          다음
        </button>
      </div>
    </div>
  );
}
