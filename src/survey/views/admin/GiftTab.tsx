import { useCallback, useEffect, useState } from 'react';
import type { AdminClient } from '../../api/adminClient';
import type { GiftPhoneItem, GiftPhonesResponse } from '../../api/adminTypes';

const STATUS_LABELS: Record<string, string> = {
  COMPLETE: '완료',
  IN_PROGRESS: '진행 중',
  SCREENOUT: '스크린아웃',
  QUOTAFULL: '쿼터 마감',
  ATTENTION_FAIL: '주의 실패',
  ABANDONED: '이탈',
};

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

type SentFilter = 'all' | 'sent' | 'unsent';

export function GiftTab({ client }: Props) {
  const [data, setData] = useState<GiftPhonesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sentFilter, setSentFilter] = useState<SentFilter>('all');
  const [toggling, setToggling] = useState<Set<number>>(new Set());

  const load = useCallback(
    (filter: SentFilter) => {
      setLoading(true);
      setError('');
      const sentParam =
        filter === 'sent' ? true : filter === 'unsent' ? false : undefined;
      client
        .gifts({ sent: sentParam })
        .then(setData)
        .catch((e: unknown) => setError(e instanceof Error ? e.message : '불러오기 실패'))
        .finally(() => setLoading(false));
    },
    [client],
  );

  useEffect(() => {
    load(sentFilter);
  }, [load, sentFilter]);

  const handleToggleSent = async (item: GiftPhoneItem) => {
    const newSent = item.sentAt == null;
    setToggling((prev) => new Set(prev).add(item.id));
    try {
      await client.markGiftSent(item.id, newSent);
      // optimistic update
      setData((prev) => {
        if (!prev) return prev;
        const updatedItems = prev.items.map((it) =>
          it.id === item.id
            ? { ...it, sentAt: newSent ? new Date().toISOString() : null }
            : it,
        );
        const sentCount = updatedItems.filter((it) => it.sentAt != null).length;
        return {
          ...prev,
          items: updatedItems,
          sentCount,
          unsentCount: updatedItems.length - sentCount,
        };
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : '업데이트 실패');
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  return (
    <div className="admin-section">
      {/* 요약 카드 */}
      {data && (
        <div className="gift-summary">
          <div className="gift-summary__card gift-summary__card--total">
            <div className="gift-summary__value">{data.total.toLocaleString()}</div>
            <div className="gift-summary__label">전체 이벤트 참여</div>
          </div>
          <div className="gift-summary__card gift-summary__card--sent">
            <div className="gift-summary__value">{data.sentCount.toLocaleString()}</div>
            <div className="gift-summary__label">발송 완료</div>
          </div>
          <div className="gift-summary__card gift-summary__card--unsent">
            <div className="gift-summary__value">{data.unsentCount.toLocaleString()}</div>
            <div className="gift-summary__label">미발송</div>
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="admin-filters">
        {(['all', 'unsent', 'sent'] as const).map((f) => (
          <button
            key={f}
            className={`gift-filter-btn${sentFilter === f ? ' gift-filter-btn--active' : ''}`}
            onClick={() => setSentFilter(f)}
          >
            {f === 'all' ? '전체' : f === 'unsent' ? '미발송' : '발송 완료'}
          </button>
        ))}
        {data && (
          <span className="admin-total-count">
            {data.items.length.toLocaleString()}건
          </span>
        )}
      </div>

      {loading ? (
        <div className="admin-loading">불러오는 중…</div>
      ) : error ? (
        <div className="admin-error">
          <p>{error}</p>
          <button className="admin-retry-btn" onClick={() => load(sentFilter)}>
            다시 시도
          </button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="admin-empty">
          {sentFilter === 'unsent'
            ? '미발송 항목이 없습니다.'
            : sentFilter === 'sent'
              ? '발송 완료 항목이 없습니다.'
              : '이벤트 참여자가 없습니다.'}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>전화번호</th>
                <th>응답자 상태</th>
                <th>그룹</th>
                <th>
                  <span
                    className="th-with-tip"
                    data-tooltip="주의 점검 문항(ATT)에서 지정된 답을 선택하지 않은 응답자."
                  >
                    주의 ⓘ
                  </span>
                </th>
                <th>참여 신청</th>
                <th>설문 완료</th>
                <th>발송 여부</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id}>
                  <td className="gift-phone">{item.phone}</td>
                  <td>
                    <span className="s-badge" data-status={item.respondentStatus}>
                      {STATUS_LABELS[item.respondentStatus] ?? item.respondentStatus}
                    </span>
                  </td>
                  <td>{item.groupCode ?? '-'}</td>
                  <td
                    className={
                      item.attentionFailed ? 'admin-table__att-fail' : 'admin-table__att-ok'
                    }
                  >
                    {item.attentionFailed ? '✗ 실패' : '✓ 통과'}
                  </td>
                  <td className="admin-table__time">{formatDateTime(item.submittedAt)}</td>
                  <td className="admin-table__time">{formatDateTime(item.finishedAt)}</td>
                  <td>
                    <button
                      className={`gift-sent-btn${item.sentAt != null ? ' gift-sent-btn--sent' : ''}`}
                      onClick={() => handleToggleSent(item)}
                      disabled={toggling.has(item.id)}
                      title={
                        item.sentAt != null
                          ? `발송 완료: ${formatDateTime(item.sentAt)}\n클릭하면 미발송으로 되돌립니다.`
                          : '클릭하면 발송 완료로 표시합니다.'
                      }
                    >
                      {toggling.has(item.id)
                        ? '처리 중…'
                        : item.sentAt != null
                          ? '✓ 발송 완료'
                          : '미발송'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
