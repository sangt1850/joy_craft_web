import { useState } from 'react';
import type { AdminClient } from '../../api/adminClient';

interface Props {
  client: AdminClient;
}

interface ColumnDef {
  key: string;
  label: string;
  hint: string;
}

/** 서버 ExportService.COLUMN_KEYS와 같은 키. 묶음(questions/pages/stimulus)은 여러 열로 펼쳐진다 */
const COLUMNS: ColumnDef[] = [
  { key: 'resp_id', label: '응답자 번호', hint: 'R0001 … 정렬 순서대로 부여' },
  { key: 'respondent_id', label: '응답자 UUID', hint: '시스템 고유 ID' },
  { key: 'group', label: '그룹', hint: 'A / B' },
  { key: 'group_num', label: '그룹 번호', hint: 'A=0, B=1' },
  { key: 'attention_failed', label: '주의력 문항 실패', hint: '실패=1, 통과=0' },
  { key: 'started_at', label: '시작 시간', hint: '2026-10-26 10:23' },
  { key: 'assigned_at', label: '그룹 배정 시간', hint: '2026-10-26 10:23' },
  { key: 'finished_at', label: '완료 시간', hint: '2026-10-26 10:23' },
  { key: 'total_sec', label: '총 소요(초)', hint: '완료 − 시작' },
  { key: 'gift_phone', label: '선물 연락처', hint: '제출한 번호' },
  { key: 'questions', label: '문항 코드 묶음', hint: '모든 문항 code 열(BIRTH, NAT, …)' },
];

const BY_KEY = new Map(COLUMNS.map((c) => [c.key, c]));
const DEFAULT_SELECTED = ['resp_id', 'group', 'group_num', 'total_sec', 'questions'];
const STORAGE_KEY = 'survey-admin-export-columns';

function loadSaved(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SELECTED;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_SELECTED;
    const keys = parsed.filter((k): k is string => typeof k === 'string' && BY_KEY.has(k));
    return keys.length > 0 ? keys : DEFAULT_SELECTED;
  } catch {
    return DEFAULT_SELECTED;
  }
}

type DragSource = { from: 'pool' | 'selected'; key: string };

export function ExportTab({ client }: Props) {
  const [selected, setSelected] = useState<string[]>(loadSaved);
  const [dragging, setDragging] = useState<DragSource | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const pool = COLUMNS.filter((c) => !selected.includes(c.key));

  const persist = (next: string[]) => {
    setSelected(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* 저장 실패는 무시 */
    }
  };

  /** key를 index 위치로 옮기거나(이미 선택됨) 새로 넣는다 */
  const place = (key: string, index: number) => {
    const without = selected.filter((k) => k !== key);
    const at = Math.min(index > selected.indexOf(key) && selected.includes(key) ? index - 1 : index, without.length);
    persist([...without.slice(0, at), key, ...without.slice(at)]);
  };

  const remove = (key: string) => persist(selected.filter((k) => k !== key));

  const endDrag = () => {
    setDragging(null);
    setOverIndex(null);
  };

  const handleDropOnList = (index: number) => {
    if (dragging) place(dragging.key, index);
    endDrag();
  };

  const handleDropOnPool = () => {
    if (dragging?.from === 'selected') remove(dragging.key);
    endDrag();
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      await client.downloadXlsx(selected);
    } catch (e) {
      alert(e instanceof Error ? e.message : '엑셀 내보내기 실패');
    } finally {
      setLoading(false);
    }
  };

  const dragProps = (from: DragSource['from'], key: string) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', key);
      setDragging({ from, key });
    },
    onDragEnd: endDrag,
  });

  return (
    <div className="admin-section">
      <div className="admin-card">
        <div className="admin-card__title">엑셀 내보내기</div>
        <p className="admin-card__help">
          왼쪽의 열을 오른쪽으로 끌어다 놓으면 추가되고, 오른쪽에서 끌어 순서를 바꾸거나 왼쪽으로 돌려놓으면
          빠집니다. 항목을 누르면 추가/제거됩니다. 완료 응답만 내보내며 그룹(A → B), 출생연도 순으로 정렬됩니다.
        </p>

        <div className="export-builder">
          <div
            className="export-pane"
            onDragOver={(e) => dragging?.from === 'selected' && e.preventDefault()}
            onDrop={handleDropOnPool}
          >
            <div className="export-pane__title">사용 가능한 열 ({pool.length})</div>
            {pool.length === 0 && <div className="export-pane__empty">모든 열이 선택되었습니다.</div>}
            {pool.map((c) => (
              <button
                key={c.key}
                type="button"
                className="export-chip"
                {...dragProps('pool', c.key)}
                onClick={() => persist([...selected, c.key])}
              >
                <span className="export-chip__label">{c.label}</span>
                <span className="export-chip__hint">{c.hint}</span>
              </button>
            ))}
          </div>

          <div
            className="export-pane export-pane--selected"
            onDragOver={(e) => {
              if (!dragging) return;
              e.preventDefault();
              if (e.target === e.currentTarget) setOverIndex(selected.length);
            }}
            onDrop={() => handleDropOnList(overIndex ?? selected.length)}
          >
            <div className="export-pane__title">내보낼 열 순서 ({selected.length})</div>
            {selected.length === 0 && (
              <div className="export-pane__empty">열을 끌어다 놓으세요. 비워 두면 기본 구성이 쓰입니다.</div>
            )}
            {selected.map((key, i) => {
              const c = BY_KEY.get(key);
              if (!c) return null;
              return (
                <div
                  key={key}
                  className={`export-chip export-chip--selected${
                    dragging?.key === key ? ' export-chip--dragging' : ''
                  }${overIndex === i && dragging?.key !== key ? ' export-chip--over' : ''}`}
                  {...dragProps('selected', key)}
                  onDragOver={(e) => {
                    if (!dragging) return;
                    e.preventDefault();
                    e.stopPropagation();
                    setOverIndex(i);
                  }}
                  onDrop={(e) => {
                    e.stopPropagation();
                    handleDropOnList(i);
                  }}
                >
                  <span className="export-chip__no">{i + 1}</span>
                  <span className="export-chip__body">
                    <span className="export-chip__label">{c.label}</span>
                    <span className="export-chip__hint">{c.hint}</span>
                  </span>
                  <button
                    type="button"
                    className="export-chip__remove"
                    aria-label={`${c.label} 열 제거`}
                    onClick={() => remove(key)}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="admin-actions">
          <button
            className="admin-action-btn admin-action-btn--primary"
            onClick={handleDownload}
            disabled={loading}
          >
            {loading ? '내보내는 중…' : '↓ 엑셀 내보내기'}
          </button>
          <button
            className="admin-action-btn"
            onClick={() => persist(DEFAULT_SELECTED)}
            disabled={loading}
          >
            기본 구성으로
          </button>
        </div>
      </div>
    </div>
  );
}
