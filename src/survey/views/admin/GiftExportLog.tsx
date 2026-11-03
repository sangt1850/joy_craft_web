import { useCallback, useEffect, useState } from 'react';
import type { AdminClient } from '../../api/adminClient';
import type { GiftExportLogItem, GiftPhoneItem } from '../../api/adminTypes';

function fmt(iso: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('ko-KR', {
    year: '2-digit', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

interface Props {
  client: AdminClient;
}

export function GiftExportLog({ client }: Props) {
  const [records, setRecords] = useState<GiftExportLogItem[]>([]);
  const [allGifts, setAllGifts] = useState<GiftPhoneItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [processing, setProcessing] = useState<Set<number>>(new Set());
  const [toggling, setToggling] = useState<Set<number>>(new Set());

  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      client.giftExportLogs(),
      client.gifts().then((r) => r.items),
    ])
      .then(([logs, gifts]) => {
        setRecords(logs);
        setAllGifts(gifts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [client]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const toggleExpand = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const withProcessing = async (id: number, fn: () => Promise<void>) => {
    setProcessing((prev) => new Set(prev).add(id));
    try { await fn(); } finally {
      setProcessing((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const handleMarkSent = async (record: GiftExportLogItem) => {
    await withProcessing(record.id, async () => {
      try {
        await client.markGiftExportSent(record.id, true);
        loadAll();
      } catch (e) { alert(e instanceof Error ? e.message : '일괄 발송완료 처리 실패'); }
    });
  };

  const handleRevert = async (record: GiftExportLogItem) => {
    if (!confirm(`${record.totalCount}건을 미발송으로 되돌릴까요?`)) return;
    await withProcessing(record.id, async () => {
      try {
        await client.markGiftExportSent(record.id, false);
        loadAll();
      } catch (e) { alert(e instanceof Error ? e.message : '되돌리기 실패'); }
    });
  };

  const handleDelete = async (record: GiftExportLogItem) => {
    if (!confirm('기록을 삭제할까요? 발송 상태는 변경되지 않습니다.')) return;
    await withProcessing(record.id, async () => {
      try {
        await client.deleteGiftExportLog(record.id);
        setRecords((prev) => prev.filter((r) => r.id !== record.id));
      } catch (e) { alert(e instanceof Error ? e.message : '삭제 실패'); }
    });
  };

  const handleItemToggle = async (item: GiftPhoneItem) => {
    const newSent = item.sentAt == null;
    setToggling((prev) => new Set(prev).add(item.id));
    try {
      await client.markGiftSent(item.id, newSent);
      const updatedAt = newSent ? new Date().toISOString() : null;
      setAllGifts((prev) =>
        prev.map((g) => g.id === item.id ? { ...g, sentAt: updatedAt } : g),
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : '업데이트 실패');
    } finally {
      setToggling((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-card gift-export-log">
        <div className="admin-card__title">발송 기록</div>
        <p className="admin-card__help">
          엑셀을 내보낼 때마다 기록이 쌓입니다. 기록을 펼쳐서 포함된 번호와 발송 여부를 확인하고,
          일괄 처리하거나 개별로 체크할 수 있습니다.
        </p>

        {loading ? (
          <div className="admin-loading">불러오는 중…</div>
        ) : records.length === 0 ? (
          <div className="admin-empty">발송 기록이 없습니다.</div>
        ) : (
          <ul className="gel__list">
            {records.map((r) => {
              const busy = processing.has(r.id);
              const isOpen = expanded.has(r.id);
              const idSet = new Set(r.giftIds);
              const items = allGifts.filter((g) => idSet.has(g.id));
              const sentInThis = items.filter((g) => g.sentAt != null).length;
              const totalInThis = items.length;

              return (
                <li key={r.id} className={`gel__item${isOpen ? ' gel__item--open' : ''}`}>
                  <div className="gel__header" onClick={() => toggleExpand(r.id)}>
                    <span className="gel__arrow">{isOpen ? '▼' : '▶'}</span>
                    <span className="gel__date">{fmt(r.exportedAt)}</span>
                    <span className="gel__count">{r.totalCount}건 내보냄</span>

                    {totalInThis > 0 ? (
                      <span
                        className={`gel__progress${
                          sentInThis === totalInThis
                            ? ' gel__progress--done'
                            : sentInThis > 0
                              ? ' gel__progress--partial'
                              : ''
                        }`}
                      >
                        {sentInThis}/{totalInThis} 발송완료
                      </span>
                    ) : r.markedSentAt ? (
                      <span className="gel__progress gel__progress--done">
                        ✓ {fmt(r.markedSentAt)} 처리됨
                      </span>
                    ) : (
                      <span className="gel__progress">미처리</span>
                    )}

                    <div className="gel__header-actions" onClick={(e) => e.stopPropagation()}>
                      {r.markedSentAt ? (
                        <button
                          className="gel__btn gel__btn--revert"
                          onClick={() => handleRevert(r)}
                          disabled={busy}
                        >
                          {busy ? '…' : '↺ 되돌리기'}
                        </button>
                      ) : (
                        <button
                          className="gel__btn gel__btn--mark"
                          onClick={() => handleMarkSent(r)}
                          disabled={busy}
                        >
                          {busy ? '…' : '✓ 전체 발송완료'}
                        </button>
                      )}
                      <button
                        className="gel__btn gel__btn--delete"
                        onClick={() => handleDelete(r)}
                        disabled={busy}
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="gel__detail">
                      {items.length === 0 ? (
                        <p className="gel__empty">
                          포함된 항목을 불러올 수 없습니다. 페이지를 새로고침해 주세요.
                        </p>
                      ) : (
                        <table className="gel__table">
                          <thead>
                            <tr>
                              <th>전화번호</th>
                              <th>설문완료일</th>
                              <th>발송 여부</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item) => (
                              <tr
                                key={item.id}
                                className={item.sentAt != null ? 'gel__row--sent' : ''}
                              >
                                <td className="gel__phone">{item.phone}</td>
                                <td className="gel__time">{fmt(item.finishedAt)}</td>
                                <td>
                                  <button
                                    className={`gift-sent-btn${item.sentAt != null ? ' gift-sent-btn--sent' : ''}`}
                                    onClick={() => handleItemToggle(item)}
                                    disabled={toggling.has(item.id)}
                                    title={
                                      item.sentAt != null
                                        ? `발송 완료: ${fmt(item.sentAt)}\n클릭하면 미발송으로 되돌립니다.`
                                        : '클릭하면 발송 완료로 표시합니다.'
                                    }
                                  >
                                    {toggling.has(item.id)
                                      ? '…'
                                      : item.sentAt != null
                                        ? '✓ 발송완료'
                                        : '미발송'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
