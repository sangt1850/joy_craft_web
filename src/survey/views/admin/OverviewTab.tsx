import { useCallback, useEffect, useState } from 'react';
import type { AdminClient } from '../../api/adminClient';
import type { AdminStats } from '../../api/adminTypes';

interface StatusInfo {
  label: string;
  color: string;
  desc: string;
}

const STATUS_INFO: Record<string, StatusInfo> = {
  COMPLETE: {
    label: '완료',
    color: '#15803d',
    desc: '모든 페이지를 완료한 응답자. 분석 대상.',
  },
  IN_PROGRESS: {
    label: '진행 중',
    color: '#1f5bd8',
    desc: '현재 설문에 접속해 응답 중이거나, 중단 후 재개 가능한 상태.',
  },
  SCREENOUT: {
    label: '스크린아웃',
    color: '#d97706',
    desc: '스크리닝 조건 불충족(출생연도, 국적 등)으로 조기 종료됨.',
  },
  QUOTAFULL: {
    label: '쿼터 마감',
    color: '#7c3aed',
    desc: '배정 그룹 또는 선택지 쿼터가 이미 찼을 때 접속한 응답자.',
  },
  ATTENTION_FAIL: {
    label: '주의 실패',
    color: '#dc2626',
    desc: '주의 점검 문항(ATT)에서 지정된 값을 선택하지 않아 불성실 응답으로 분류됨. CSV 내보내기 시 제외 권장.',
  },
  ABANDONED: {
    label: '이탈',
    color: '#6b7280',
    desc: '중간에 창을 닫거나 일정 시간 활동이 없어 미완료 처리됨.',
  },
};

interface Props {
  client: AdminClient;
}

export function OverviewTab({ client }: Props) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [csvLoading, setCsvLoading] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    client
      .stats()
      .then(setStats)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : '불러오기 실패'))
      .finally(() => setLoading(false));
  }, [client]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCsvDownload = async () => {
    setCsvLoading(true);
    try {
      await client.downloadCsv();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'CSV 내보내기 실패');
    } finally {
      setCsvLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const messages: Record<string, string> = {
      OPEN: 'OPEN으로 전환하면 응답자가 설문에 접속할 수 있습니다.\n계속할까요?',
      CLOSED: 'CLOSED로 전환하면 새 응답을 받지 않습니다.\n계속할까요?',
    };
    if (!confirm(messages[newStatus] ?? `상태를 "${newStatus}"로 변경할까요?`)) return;
    setStatusChanging(true);
    try {
      await client.changeStatus(newStatus);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : '상태 변경 실패');
    } finally {
      setStatusChanging(false);
    }
  };

  const handleReset = async () => {
    if (
      !confirm(
        'TEST 데이터를 초기화합니다.\n모든 응답자·응답·쿼터 카운트가 삭제됩니다.\n설문 문항 정의는 유지됩니다.\n\n계속할까요?',
      )
    )
      return;
    try {
      const res = await client.reset();
      alert(`초기화 완료: ${res.deletedRespondents}명 삭제됨`);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : '초기화 실패');
    }
  };

  if (loading) return <div className="admin-loading">불러오는 중…</div>;
  if (error)
    return (
      <div className="admin-error">
        <p>{error}</p>
        <button className="admin-retry-btn" onClick={load}>
          다시 시도
        </button>
      </div>
    );
  if (!stats) return null;

  const totalComplete = stats.byStatus['COMPLETE'] ?? 0;
  const progressPct = stats.targetN > 0
    ? Math.min(100, Math.round((totalComplete / stats.targetN) * 100))
    : 0;

  return (
    <div className="admin-section">
      {/* 상단 액션 바 */}
      <div className="admin-section__head">
        <div className="admin-section__meta">
          <span className="admin-status-badge" data-status={stats.status}>
            {stats.status}
          </span>
          <span className="admin-target">목표 {stats.targetN.toLocaleString()}명</span>
        </div>
        <div className="admin-actions">
          {stats.status === 'TEST' && (
            <>
              <div className="admin-action-group">
                <button
                  className="admin-action-btn admin-action-btn--primary"
                  onClick={() => handleStatusChange('OPEN')}
                  disabled={statusChanging}
                >
                  OPEN 전환
                </button>
                <span className="admin-action-hint">정식 모집 시작. 응답자 접속 허용.</span>
              </div>
              <div className="admin-action-group">
                <button
                  className="admin-action-btn admin-action-btn--danger"
                  onClick={handleReset}
                  disabled={statusChanging}
                >
                  데이터 초기화
                </button>
                <span className="admin-action-hint">파일럿 응답 전체 삭제. TEST 전용.</span>
              </div>
            </>
          )}
          {stats.status === 'OPEN' && (
            <div className="admin-action-group">
              <button
                className="admin-action-btn"
                onClick={() => handleStatusChange('CLOSED')}
                disabled={statusChanging}
              >
                CLOSED 전환
              </button>
              <span className="admin-action-hint">모집 종료. 새 응답 차단.</span>
            </div>
          )}
          <button
            className="admin-action-btn admin-action-btn--csv"
            onClick={handleCsvDownload}
            disabled={csvLoading}
          >
            {csvLoading ? '내보내는 중…' : '↓ CSV 내보내기'}
          </button>
        </div>
      </div>

      {/* 완료 진행률 */}
      <div className="admin-card">
        <div className="admin-card__label">완료 진행률</div>
        <div className="admin-progress-bar">
          <div className="admin-progress-bar__fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="admin-progress-text">
          <span>
            {totalComplete.toLocaleString()} / {stats.targetN.toLocaleString()}명 완료
          </span>
          <span className="admin-progress-pct">{progressPct}%</span>
        </div>
      </div>

      {/* 상태별 카드 */}
      <div>
        <div className="admin-card__title" style={{ marginBottom: 12 }}>응답자 상태</div>
        <div className="stat-grid">
          {Object.entries(STATUS_INFO).map(([key, info]) => (
            <div
              key={key}
              className="stat-card"
              style={{ '--status-color': info.color } as React.CSSProperties}
              data-tooltip={info.desc}
            >
              <div className="stat-card__value">
                {(stats.byStatus[key] ?? 0).toLocaleString()}
              </div>
              <div className="stat-card__label">{info.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 쿼터 현황 */}
      {stats.quotas.length > 0 && (
        <div className="admin-card">
          <div className="admin-card__title">쿼터 현황</div>
          <p className="admin-card__help">
            쿼터는 그룹·선택지별로 수집 인원을 제한합니다.
            완료가 한도에 도달하면 해당 그룹/보기로 더 이상 배정되지 않습니다.
          </p>
          <div className="quota-list">
            {stats.quotas.map((q) => {
              const filled = q.completed + q.reserved;
              const remaining = Math.max(0, q.limit - filled);
              const pct = q.limit > 0 ? Math.min(100, Math.round((filled / q.limit) * 100)) : 0;
              return (
                <div key={q.key} className="quota-item">
                  <div className="quota-item__head">
                    <span className="quota-item__key">{q.key}</span>
                    <span className="quota-item__pct">{pct}%</span>
                  </div>
                  <div className="admin-progress-bar">
                    <div
                      className="admin-progress-bar__fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="quota-item__stats">
                    <span className="quota-stat quota-stat--done">
                      <span className="quota-stat__label">완료</span>
                      <span className="quota-stat__value">{q.completed.toLocaleString()}</span>
                    </span>
                    <span className="quota-stat quota-stat--reserved">
                      <span className="quota-stat__label">예약</span>
                      <span className="quota-stat__value">{q.reserved.toLocaleString()}</span>
                    </span>
                    <span className="quota-stat quota-stat--remain">
                      <span className="quota-stat__label">여유</span>
                      <span className="quota-stat__value">{remaining.toLocaleString()}</span>
                    </span>
                    <span className="quota-stat quota-stat--limit">
                      <span className="quota-stat__label">한도</span>
                      <span className="quota-stat__value">{q.limit.toLocaleString()}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 그룹 배정 */}
      {Object.keys(stats.byGroup).length > 0 && (
        <div className="admin-card">
          <div className="admin-card__title">그룹 배정 현황</div>
          <p className="admin-card__help">
            그룹은 무작위로 균등 배정됩니다(A/B 각 {stats.targetN / 2}명 목표).
            스크린아웃·이탈 포함 전체 배정 수입니다.
          </p>
          <div className="group-table">
            {Object.entries(stats.byGroup).map(([group, count]) => (
              <div key={group} className="group-table__row">
                <span className="group-badge">그룹 {group}</span>
                <span className="group-table__count">{count.toLocaleString()}명 배정됨</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
