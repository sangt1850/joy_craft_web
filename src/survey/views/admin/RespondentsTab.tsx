import { useCallback, useEffect, useState } from 'react';
import type { AdminClient } from '../../api/adminClient';
import type { AdminStats, RespondentPage } from '../../api/adminTypes';

const PAGE_SIZE = 50;

const STATUS_LIST = [
  { key: 'COMPLETE',       label: '완료',      color: '#15803d' },
  { key: 'IN_PROGRESS',    label: '진행 중',   color: '#1f5bd8' },
  { key: 'SCREENOUT',      label: '스크린아웃', color: '#d97706' },
  { key: 'QUOTAFULL',      label: '쿼터 마감', color: '#7c3aed' },
  { key: 'ATTENTION_FAIL', label: '주의 실패', color: '#dc2626' },
  { key: 'ABANDONED',      label: '이탈',      color: '#6b7280' },
] as const;

const STATUS_LABELS = Object.fromEntries(STATUS_LIST.map((s) => [s.key, s.label]));
const STATUS_COLORS = Object.fromEntries(STATUS_LIST.map((s) => [s.key, s.color]));

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
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [page, setPage] = useState(0);

  // stats는 최초 1회만 가져옴 (상태 탭 카운트용)
  useEffect(() => {
    client.stats().then(setStats).catch(() => null);
  }, [client]);

  const load = useCallback(
    (p: number, status: string, group: string) => {
      setLoading(true);
      setError('');
      client
        .respondents({
          page: p,
          size: PAGE_SIZE,
          status: status || undefined,
          group: group || undefined,
        })
        .then(setData)
        .catch((e: unknown) => setError(e instanceof Error ? e.message : '불러오기 실패'))
        .finally(() => setLoading(false));
    },
    [client],
  );

  useEffect(() => {
    load(page, filterStatus, filterGroup);
  }, [load, page, filterStatus, filterGroup]);

  const changeStatus = (key: string) => {
    setFilterStatus(key);
    setPage(0);
  };

  const changeGroup = (g: string) => {
    setFilterGroup(g);
    setPage(0);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const totalAll = stats
    ? Object.values(stats.byStatus).reduce((a, b) => a + b, 0)
    : null;

  return (
    <div className="admin-section">
      {/* 상태 탭 */}
      <div className="resp-status-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={filterStatus === ''}
          className={`resp-status-tab${filterStatus === '' ? ' resp-status-tab--active' : ''}`}
          onClick={() => changeStatus('')}
        >
          <span className="resp-status-tab__label">전체</span>
          {totalAll != null && (
            <span className="resp-status-tab__count">{totalAll.toLocaleString()}</span>
          )}
        </button>
        {STATUS_LIST.map((s) => {
          const count = stats?.byStatus[s.key] ?? null;
          const active = filterStatus === s.key;
          return (
            <button
              key={s.key}
              role="tab"
              aria-selected={active}
              className={`resp-status-tab${active ? ' resp-status-tab--active' : ''}`}
              style={{ '--tab-color': s.color } as React.CSSProperties}
              onClick={() => changeStatus(s.key)}
            >
              <span className="resp-status-tab__label">{s.label}</span>
              {count != null && (
                <span className="resp-status-tab__count">{count.toLocaleString()}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 그룹 필터 + 총계 */}
      <div className="admin-filters">
        <span className="resp-filter-label">그룹</span>
        {['', 'A', 'B'].map((g) => (
          <button
            key={g}
            className={`gift-filter-btn${filterGroup === g ? ' gift-filter-btn--active' : ''}`}
            onClick={() => changeGroup(g)}
          >
            {g === '' ? '전체' : `그룹 ${g}`}
          </button>
        ))}
        {data && (
          <span className="admin-total-count">
            {filterStatus || filterGroup
              ? `${data.total.toLocaleString()}명 해당`
              : `총 ${data.total.toLocaleString()}명`}
          </span>
        )}
      </div>

      {loading ? (
        <div className="admin-loading">불러오는 중…</div>
      ) : error ? (
        <div className="admin-error">
          <p>{error}</p>
          <button className="admin-retry-btn" onClick={() => load(page, filterStatus, filterGroup)}>
            다시 시도
          </button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="admin-empty">해당 조건의 응답자가 없습니다.</div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  {!filterStatus && <th>상태</th>}
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
                {data.items.map((item) => (
                  <tr key={item.id}>
                    <td className="admin-table__id" title={item.id}>
                      {item.id.slice(0, 8)}…
                    </td>
                    {!filterStatus && (
                      <td>
                        <span
                          className="s-badge"
                          data-status={item.status}
                          style={
                            {
                              '--badge-color': STATUS_COLORS[item.status] ?? '#6b7280',
                            } as React.CSSProperties
                          }
                        >
                          {STATUS_LABELS[item.status] ?? item.status}
                        </span>
                      </td>
                    )}
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
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            <button
              className="admin-page-btn"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              이전
            </button>
            <span className="admin-page-info">
              {page + 1} / {totalPages}
            </span>
            <button
              className="admin-page-btn"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              다음
            </button>
          </div>
        </>
      )}
    </div>
  );
}
