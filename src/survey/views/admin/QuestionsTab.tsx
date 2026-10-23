import { useCallback, useEffect, useState } from 'react';
import type { AdminClient } from '../../api/adminClient';
import type {
  EditableOption,
  EditablePage,
  EditableQuestion,
  QuestionEditData,
  QuestionType,
} from '../../api/adminTypes';

const QTYPE_LABEL: Record<QuestionType, string> = {
  LIKERT7: '7점 척도',
  SINGLE: '단일 선택',
  SELECT: '드롭다운 선택',
};
const QTYPES = Object.keys(QTYPE_LABEL) as QuestionType[];

interface DraftOption {
  key: string;
  id: number | null;
  label: string;
  source: EditableOption | null;
}

let newKeySeq = 0;

function toDraft(q: EditableQuestion): DraftOption[] {
  return q.options
    .filter((o) => o.visible)
    .map((o) => ({ key: `o${o.id}`, id: o.id, label: o.label, source: o }));
}

function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

interface CardProps {
  q: EditableQuestion;
  isFirst: boolean;
  isLast: boolean;
  client: AdminClient;
  onData: (data: QuestionEditData) => void;
}

function QuestionCard({ q, isFirst, isLast, client, onData }: CardProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(q.text);
  const [qtype, setQtype] = useState<QuestionType>(q.qtype);
  const [required, setRequired] = useState(q.required);
  const [options, setOptions] = useState<DraftOption[]>(() => toDraft(q));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // 이 문항의 서버 데이터가 바뀌었을 때만 입력값을 서버 기준으로 되돌린다
  const signature = JSON.stringify(q);
  useEffect(() => {
    setText(q.text);
    setQtype(q.qtype);
    setRequired(q.required);
    setOptions(toDraft(q));
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const isLikert = q.qtype === 'LIKERT7';
  const typeLocked = q.answerCount > 0 || q.attentionValue != null;
  const typeAllowed = (t: QuestionType) =>
    t === q.qtype || !typeLocked || (t !== 'LIKERT7' && q.qtype !== 'LIKERT7');
  const rebuildsLikert = qtype === 'LIKERT7' && q.qtype !== 'LIKERT7';

  const hidden = q.options.filter((o) => !o.visible && !options.some((d) => d.id === o.id));

  const textChanged = text.trim() !== q.text;
  const typeChanged = qtype !== q.qtype;
  const requiredChanged = required !== q.required;
  const original = toDraft(q);
  const optionsChanged =
    !rebuildsLikert &&
    (options.length !== original.length ||
      options.some((o, i) => o.id !== original[i].id || o.label.trim() !== original[i].label));
  const dirty = textChanged || typeChanged || requiredChanged || optionsChanged;

  const validation = !text.trim()
    ? '질문을 입력해 주세요.'
    : !rebuildsLikert && options.some((o) => !o.label.trim())
      ? '비어 있는 보기가 있습니다.'
      : !rebuildsLikert && options.length < 2
        ? '보기는 2개 이상 있어야 합니다.'
        : '';

  const save = async () => {
    if (!dirty || validation) return;
    setBusy(true);
    setError('');
    let latest: QuestionEditData | null = null;
    try {
      if (textChanged || typeChanged || requiredChanged) {
        latest = await client.updateQuestion(q.id, {
          ...(textChanged && { text: text.trim() }),
          ...(typeChanged && { qtype }),
          ...(requiredChanged && { required }),
        });
      }
      if (optionsChanged) {
        latest = await client.replaceOptions(
          q.id,
          options.map((o) => ({ id: o.id, label: o.label.trim() })),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했습니다.');
    } finally {
      // 앞 단계만 저장되고 뒤 단계가 실패해도 화면은 서버 상태를 따른다
      if (latest) onData(latest);
      setBusy(false);
    }
  };

  const reorder = async (direction: 'UP' | 'DOWN') => {
    setBusy(true);
    setError('');
    try {
      onData(await client.moveQuestion(q.id, direction));
    } catch (e) {
      setError(e instanceof Error ? e.message : '순서를 바꾸지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const panelId = `qedit-${q.id}`;

  return (
    <div className="qedit-card">
      <div className="qedit-card__head">
        <button
          type="button"
          className="qedit-card__toggle"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="qedit-code">{q.qNo}</span>
          <span className="qedit-card__text">{q.text}</span>
          <span className="qedit-meta">
            {QTYPE_LABEL[q.qtype]}
            {!isLikert && ` · 보기 ${toDraft(q).length}개`}
            {q.answerCount > 0 && ` · 응답 ${q.answerCount.toLocaleString()}건`}
          </span>
        </button>
        <div className="qedit-card__order">
          <button
            type="button"
            className="admin-page-btn"
            aria-label={`${q.qNo} 위로 이동`}
            disabled={busy || isFirst}
            onClick={() => reorder('UP')}
          >
            ↑
          </button>
          <button
            type="button"
            className="admin-page-btn"
            aria-label={`${q.qNo} 아래로 이동`}
            disabled={busy || isLast}
            onClick={() => reorder('DOWN')}
          >
            ↓
          </button>
        </div>
      </div>

      {open && (
        <div className="qedit-body" id={panelId}>
          <label className="qedit-field">
            <span className="qedit-field__label">질문</span>
            <textarea
              className="admin-search qedit-textarea"
              rows={2}
              value={text}
              disabled={busy}
              onChange={(e) => setText(e.target.value)}
            />
          </label>

          <div className="qedit-row">
            <label className="qedit-field">
              <span className="qedit-field__label">유형</span>
              <select
                className="admin-select"
                value={qtype}
                disabled={busy}
                onChange={(e) => setQtype(e.target.value as QuestionType)}
              >
                {QTYPES.map((t) => (
                  <option key={t} value={t} disabled={!typeAllowed(t)}>
                    {QTYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-toggle">
              <input
                type="checkbox"
                checked={required}
                disabled={busy}
                onChange={(e) => setRequired(e.target.checked)}
              />
              필수 응답
            </label>
          </div>
          {typeLocked && (
            <p className="qedit-hint">
              {q.attentionValue != null
                ? '주의 점검 문항이라 7점 척도 여부는 바꿀 수 없습니다.'
                : '응답이 있어 7점 척도로 또는 7점 척도에서 유형을 바꿀 수 없습니다. 단일 선택과 드롭다운 사이는 바꿀 수 있습니다.'}
            </p>
          )}

          {/* 7점 척도는 보기 문구를 바꾸지 않으므로 목록을 보여주지 않는다 */}
          {!isLikert && <div className="qedit-field__label">보기</div>}
          {isLikert ? null : rebuildsLikert ? (
            <p className="qedit-hint">저장하면 보기가 1~7점 기본 문구(전혀 그렇지 않다 ~ 매우 그렇다)로 새로 만들어집니다.</p>
          ) : (
            <ol className="qedit-options">
              {options.map((o, i) => {
                const src = o.source;
                const protectedOption =
                  isLikert || (src != null && q.attentionValue != null && src.value === q.attentionValue);
                return (
                  <li key={o.key} className="qedit-option">
                    <span className="qedit-option__no">{isLikert && src ? src.value : i + 1}</span>
                    <input
                      className="admin-search qedit-option__input"
                      aria-label={`보기 ${i + 1} 문구`}
                      value={o.label}
                      disabled={busy}
                      onChange={(e) =>
                        setOptions((list) =>
                          list.map((x) => (x.key === o.key ? { ...x, label: e.target.value } : x)),
                        )
                      }
                    />
                    <span className="qedit-option__badges">
                      {src && src.answerCount > 0 && (
                        <span className="qedit-badge">응답 {src.answerCount.toLocaleString()}</span>
                      )}
                      {src?.terminates && <span className="qedit-badge qedit-badge--warn">종료 보기</span>}
                      {src?.hasQuota && <span className="qedit-badge">쿼터</span>}
                    </span>
                    {!isLikert && (
                      <span className="qedit-option__actions">
                        <button
                          type="button"
                          className="admin-page-btn"
                          aria-label={`보기 ${i + 1} 위로`}
                          disabled={busy || i === 0}
                          onClick={() => setOptions((list) => moveItem(list, i, i - 1))}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="admin-page-btn"
                          aria-label={`보기 ${i + 1} 아래로`}
                          disabled={busy || i === options.length - 1}
                          onClick={() => setOptions((list) => moveItem(list, i, i + 1))}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="admin-page-btn"
                          aria-label={`보기 ${i + 1} 삭제`}
                          title={protectedOption ? '주의 점검 정답 보기는 삭제할 수 없습니다' : undefined}
                          disabled={busy || protectedOption}
                          onClick={() => setOptions((list) => list.filter((x) => x.key !== o.key))}
                        >
                          삭제
                        </button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          )}

          {!isLikert && !rebuildsLikert && (
            <button
              type="button"
              className="admin-action-btn qedit-add"
              disabled={busy}
              onClick={() =>
                setOptions((list) => [
                  ...list,
                  { key: `n${++newKeySeq}`, id: null, label: '', source: null },
                ])
              }
            >
              + 보기 추가
            </button>
          )}

          {hidden.length > 0 && (
            <div className="qedit-hidden">
              <div className="qedit-field__label">숨겨진 보기 (응답이 있어 삭제하지 않고 숨김)</div>
              {hidden.map((o) => (
                <div key={o.id} className="qedit-hidden__row">
                  <span>{o.label}</span>
                  <span className="qedit-badge">응답 {o.answerCount.toLocaleString()}</span>
                  <button
                    type="button"
                    className="admin-page-btn"
                    disabled={busy}
                    onClick={() =>
                      setOptions((list) => [
                        ...list,
                        { key: `o${o.id}`, id: o.id, label: o.label, source: o },
                      ])
                    }
                  >
                    다시 표시
                  </button>
                </div>
              ))}
            </div>
          )}

          {(validation || error) && (
            <p className="qedit-error" role="alert">
              {error || validation}
            </p>
          )}
          <div className="qedit-actions">
            <button
              type="button"
              className="admin-action-btn"
              disabled={busy || !dirty}
              onClick={() => {
                setText(q.text);
                setQtype(q.qtype);
                setRequired(q.required);
                setOptions(toDraft(q));
                setError('');
              }}
            >
              되돌리기
            </button>
            <button
              type="button"
              className="admin-action-btn admin-action-btn--primary"
              disabled={busy || !dirty || !!validation}
              onClick={save}
            >
              {busy ? '저장 중…' : '저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface PageHeaderProps {
  page: EditablePage;
  client: AdminClient;
  onData: (data: QuestionEditData) => void;
}

/** 문항들을 감싸는 박스의 제목과 위쪽 안내 문구 */
function PageHeader({ page, client, onData }: PageHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(page.title ?? '');
  const [instruction, setInstruction] = useState(page.instruction ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const open = () => {
    setTitle(page.title ?? '');
    setInstruction(page.instruction ?? '');
    setError('');
    setEditing(true);
  };

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      onData(await client.updatePage(page.pageKey, { title, instruction }));
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <div className="qedit-page">
        <div className="qedit-page__main">
          <div className="admin-card__title">
            {page.title ?? page.pageKey}
            <span className="qedit-meta"> {page.pageKey}</span>
          </div>
          {page.instruction && <p className="qedit-page__instruction">{page.instruction}</p>}
        </div>
        <button type="button" className="admin-action-btn" onClick={open}>
          제목·안내 수정
        </button>
      </div>
    );
  }

  return (
    <div className="qedit-page qedit-page--editing">
      <label className="qedit-field">
        <span className="qedit-field__label">제목 (응답자 화면 위쪽에 표시)</span>
        <input
          className="admin-search"
          value={title}
          maxLength={200}
          disabled={busy}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="qedit-field">
        <span className="qedit-field__label">안내 문구 (비우면 표시하지 않음)</span>
        <textarea
          className="admin-search qedit-textarea"
          rows={2}
          value={instruction}
          disabled={busy}
          onChange={(e) => setInstruction(e.target.value)}
        />
      </label>
      {error && (
        <p className="qedit-error" role="alert">
          {error}
        </p>
      )}
      <div className="qedit-actions">
        <button type="button" className="admin-action-btn" disabled={busy} onClick={() => setEditing(false)}>
          취소
        </button>
        <button
          type="button"
          className="admin-action-btn admin-action-btn--primary"
          disabled={busy || !title.trim()}
          onClick={save}
        >
          {busy ? '저장 중…' : '저장'}
        </button>
      </div>
    </div>
  );
}

interface Props {
  client: AdminClient;
}

export function QuestionsTab({ client }: Props) {
  const [data, setData] = useState<QuestionEditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    client
      .questions()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : '불러오기 실패'))
      .finally(() => setLoading(false));
  }, [client]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="admin-loading">불러오는 중…</div>;
  if (error || !data)
    return (
      <div className="admin-error">
        <p>{error || '문항을 불러오지 못했습니다.'}</p>
        <button className="admin-retry-btn" onClick={load}>
          다시 시도
        </button>
      </div>
    );

  return (
    <div className="admin-section">
      {data.status === 'OPEN' ? (
        <p className="admin-card__help qedit-warn">
          진행 중인 설문입니다. 저장하면 지금 응답 중인 사람에게도 바로 반영되어, 보기를 지우면 제출이 실패할 수 있습니다.
        </p>
      ) : (
        <p className="admin-card__help">
          질문·유형·보기·순서를 고칠 수 있습니다. 응답이 있는 보기는 지우면 숨김 처리되고, 응답이 있는 문항은
          7점 척도 변경이 막힙니다. 순서는 응답자 화면과 CSV 열 순서에 반영됩니다.
        </p>
      )}
      {data.pages.length === 0 && <div className="admin-empty">편집할 문항이 없습니다.</div>}
      {data.pages.map((page) => (
        <div key={page.pageKey} className="admin-card">
          <PageHeader page={page} client={client} onData={setData} />
          <div className="qedit-list">
            {page.questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                q={q}
                isFirst={i === 0}
                isLast={i === page.questions.length - 1}
                client={client}
                onData={setData}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
