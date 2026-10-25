import { useRef } from 'react';
import { RichText } from '../../components/RichText';

const FORMATS = [
  { tag: 'b', label: '굵게', cls: 'rt-b' },
  { tag: 'u', label: '밑줄', cls: 'rt-u' },
  { tag: 'red', label: '빨강', cls: 'rt-red' },
] as const;

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  maxLength?: number;
  disabled?: boolean;
}

/** 선택한 글자를 [b] [u] [red] 태그로 감싸는 버튼이 달린 입력칸. 아래에 응답자 화면과 같은 미리보기를 보여준다 */
export function RichTextField({ label, value, onChange, multiline, maxLength, disabled }: Props) {
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  const wrap = (tag: string) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = `${value.slice(0, start)}[${tag}]${value.slice(start, end)}[/${tag}]${value.slice(end)}`;
    onChange(next);
    // 선택이 없으면 커서를 태그 사이에 둔다
    const caret = start + tag.length + 2 + (end - start);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  return (
    <div className="qedit-field">
      <span className="qedit-field__label">{label}</span>
      <div className="rt-toolbar" role="toolbar" aria-label={`${label} 서식`}>
        {FORMATS.map((f) => (
          <button
            key={f.tag}
            type="button"
            className={`admin-action-btn rt-toolbar__btn ${f.cls}`}
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()} // 버튼을 눌러도 입력칸의 선택이 풀리지 않게
            onClick={() => wrap(f.tag)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {multiline ? (
        <textarea
          ref={ref}
          className="admin-search qedit-textarea"
          rows={3}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          ref={ref}
          className="admin-search"
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {value.trim() && (
        <p className="rt-preview">
          <span className="rt-preview__label">미리보기</span>
          <RichText text={value} />
        </p>
      )}
    </div>
  );
}
