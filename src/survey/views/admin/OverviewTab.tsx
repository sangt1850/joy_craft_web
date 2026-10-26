import { useCallback, useEffect, useState } from 'react';
import type { AdminClient } from '../../api/adminClient';
import type { AdminStats } from '../../api/adminTypes';

interface Props {
  client: AdminClient;
}

interface GroupLimitsEditorProps {
  quotas: AdminStats['quotas'];
  targetN: number;
  disabled: boolean;
  onSave: (limits: Record<string, number>) => Promise<void>;
}

/** 그룹 옆에 인원을 직접 입력한다. 합이 목표 인원을 넘거나 이미 찬 인원보다 작으면 저장할 수 없다. */
function GroupLimitsEditor({ quotas, targetN, disabled, onSave }: GroupLimitsEditorProps) {
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(quotas.map((q) => [q.key, String(q.limit)])),
  );

  const rows = quotas.map((q) => {
    const raw = draft[q.key] ?? '';
    const value = raw.trim() === '' ? NaN : Number(raw);
    const min = Math.max(1, q.completed + q.reserved);
    let error = '';
    if (!Number.isInteger(value)) error = '숫자를 입력해 주세요.';
    else if (value < min) error = `이미 ${min.toLocaleString()}명이 찼으므로 ${min.toLocaleString()}명 이상이어야 합니다.`;
    return { q, raw, value, error };
  });

  const total = rows.reduce((sum, r) => sum + (Number.isInteger(r.value) ? r.value : 0), 0);
  const overTarget = total > targetN;
  const changed = rows.some((r) => r.value !== r.q.limit);
  const canSave = changed && !overTarget && rows.every((r) => !r.error) && !disabled;

  return (
    <form
      className="group-limits"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSave) return;
        void onSave(Object.fromEntries(rows.map((r) => [r.q.groupCode as string, r.value])));
      }}
    >
      <div className="group-limits__fields">
      {rows.map(({ q, raw, error }) => (
        <div key={q.key} className="group-limits__row">
          <label className="group-limits__label" htmlFor={`group-limit-${q.key}`}>
            <span className="group-badge">그룹 {q.groupCode}</span>
          </label>
          <input
            id={`group-limit-${q.key}`}
            className="admin-search group-limits__input"
            type="number"
            inputMode="numeric"
            min={1}
            value={raw}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            onChange={(e) => setDraft((d) => ({ ...d, [q.key]: e.target.value }))}
          />
          <span className="group-limits__unit">명</span>
          {error && (
            <span className="group-limits__error" role="alert">
              {error}
            </span>
          )}
        </div>
      ))}
      </div>
      <div className="group-limits__foot">
        <span className={`group-limits__sum${overTarget ? ' group-limits__sum--over' : ''}`}>
          합계 {total.toLocaleString()} / 목표 {targetN.toLocaleString()}명
          {overTarget && ` · ${(total - targetN).toLocaleString()}명 초과`}
        </span>
        <button type="submit" className="admin-action-btn admin-action-btn--primary" disabled={!canSave}>
          저장
        </button>
      </div>
    </form>
  );
}

export function OverviewTab({ client }: Props) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  const handleStatusChange = async (newStatus: string) => {
    const messages: Record<string, string> = {
      TEST: 'TEST로 전환하면 테스트 모드로 돌아갑니다.\n계속할까요?',
      OPEN: 'OPEN으로 전환하면 응답자가 설문에 접속할 수 있습니다.\nOPEN 이후에는 문항을 고치면 안 됩니다. 응답 중인 사람에게 바로 반영되어 제출 오류가 나거나 통계가 틀어질 수 있어요.\n문항 문구·보기를 모두 확인하셨나요? 계속할까요?',
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

  const handleTargetChange = async () => {
    if (!stats) return;
    const input = prompt('목표 인원을 입력하세요.', String(stats.targetN));
    if (input == null) return;
    const n = Number(input.trim());
    if (!Number.isInteger(n) || n < 1 || n > 100000) {
      alert('1 ~ 100000 사이의 정수를 입력해 주세요.');
      return;
    }
    if (n === stats.targetN) return;
    const groupTotal = groupQuotas.reduce((sum, q) => sum + q.limit, 0);
    if (n < groupTotal) {
      alert(`그룹별 모집 인원의 합(${groupTotal.toLocaleString()}명)보다 작게 정할 수 없습니다.\n먼저 그룹별 모집 인원을 줄여 주세요.`);
      return;
    }
    setStatusChanging(true);
    try {
      await client.changeTarget(n);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : '목표 인원 변경 실패');
    } finally {
      setStatusChanging(false);
    }
  };

  const groupQuotas = stats?.quotas.filter((q) => q.kind === 'GROUP' && q.groupCode) ?? [];

  const handleGroupLimits = async (limits: Record<string, number>) => {
    setStatusChanging(true);
    try {
      await client.changeGroupLimits(limits);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : '모집 인원 변경 실패');
    } finally {
      setStatusChanging(false);
    }
  };

  const handleReset = async () => {
    if (
      !confirm(
        '데이터를 초기화합니다.\n모든 응답자의 응답 · 선물발송 데이터가 삭제됩니다.\n설문 문항 정의는 유지됩니다.\n\n계속할까요?',
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
          <button
            className="admin-action-btn"
            onClick={handleTargetChange}
            disabled={statusChanging}
          >
            목표 변경
          </button>
        </div>
        <div className="admin-actions">
          {stats.status !== 'TEST' && (
            <div className="admin-action-group">
              <button
                className="admin-action-btn"
                onClick={() => handleStatusChange('TEST')}
                disabled={statusChanging}
              >
                TEST 전환
              </button>
            </div>
          )}
          {stats.status !== 'OPEN' && (
            <div className="admin-action-group">
              <button
                className="admin-action-btn admin-action-btn--primary"
                onClick={() => handleStatusChange('OPEN')}
                disabled={statusChanging}
              >
                OPEN 전환
              </button>
            </div>
          )}
          {stats.status !== 'CLOSED' && (
            <div className="admin-action-group">
              <button
                className="admin-action-btn"
                onClick={() => handleStatusChange('CLOSED')}
                disabled={statusChanging}
              >
                CLOSED 전환
              </button>
            </div>
          )}
          {stats.status === 'TEST' && (
            <div className="admin-action-group">
              <button
                className="admin-action-btn admin-action-btn--danger"
                onClick={handleReset}
                disabled={statusChanging}
              >
                데이터 초기화
              </button>
            </div>
          )}
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

      {/* 쿼터 현황 */}
      {stats.quotas.length > 0 && (
        <div className="admin-card">
          <div className="admin-card__title">그룹별 모집 인원</div>
          <p className="admin-card__help">
            응답자는 동의·기본 정보 뒤에 A/B 그룹 중 충원이 적은 쪽으로 무작위 배정됩니다.
            한도가 차면 그 그룹으로는 더 배정되지 않고, 모든 그룹이 차면 쿼터 마감으로 끝납니다.
          </p>
          {groupQuotas.length > 0 && (
            <GroupLimitsEditor
              quotas={groupQuotas}
              targetN={stats.targetN}
              disabled={statusChanging}
              onSave={handleGroupLimits}
            />
          )}
          <div className="admin-card__subtitle">현황</div>
          <div className="quota-list">
            {stats.quotas.map((q) => {
              // 서버는 진행 중인 참여자의 자리까지 채운 것으로 세므로 남은 자리에 반영한다
              const filled = q.completed + q.reserved;
              const remaining = Math.max(0, q.limit - filled);
              const pct = q.limit > 0 ? Math.min(100, Math.round((filled / q.limit) * 100)) : 0;
              return (
                <div key={q.key} className="quota-item">
                  <div className="quota-item__head">
                    <span className="quota-item__key">{q.groupCode ? `그룹 ${q.groupCode}` : q.key}</span>
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
                    <span className="quota-stat quota-stat--remain">
                      <span className="quota-stat__label">남은 자리</span>
                      <span className="quota-stat__value">{remaining.toLocaleString()}</span>
                    </span>
                    <span className="quota-stat quota-stat--limit">
                      <span className="quota-stat__label">모집 인원</span>
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
            정상 완료한 응답자의 그룹별 인원입니다. 그룹별 목표는 위 모집 인원을 따릅니다.
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
