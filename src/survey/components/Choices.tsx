import type { QuestionDto } from '../api/types';

interface ChoiceProps {
  question: QuestionDto;
  value: number | undefined; // 선택된 optionId
  onChange: (optionId: number) => void;
}

export function Likert7({ question, value, onChange }: ChoiceProps) {
  const opts = question.options;
  return (
    <div className="likert">
      <div className="likert__row" role="radiogroup" aria-label={question.text}>
        {opts.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            aria-label={`${o.value}점 ${o.label}`}
            className="likert__btn"
            data-selected={value === o.id}
            onClick={() => onChange(o.id)}
          >
            {o.value}
          </button>
        ))}
      </div>
      <div className="likert__labels" aria-hidden="true">
        <span>{opts[0]?.label}</span>
        <span>보통</span>
        <span>{opts[opts.length - 1]?.label}</span>
      </div>
    </div>
  );
}

export function SingleChoice({ question, value, onChange }: ChoiceProps) {
  const name = `q-${question.id}`;
  return (
    <div className="choice-list" role="radiogroup" aria-label={question.text}>
      {question.options.map((o) => {
        const selected = value === o.id;
        return (
          <label key={o.id} className="choice" data-selected={selected} data-disabled={!o.available}>
            <input
              type="radio"
              name={name}
              checked={selected}
              disabled={!o.available}
              onChange={() => onChange(o.id)}
            />
            <span className="choice__label">{o.label}</span>
            {!o.available && <span className="badge">모집 마감</span>}
          </label>
        );
      })}
    </div>
  );
}

export function SelectChoice({ question, value, onChange }: ChoiceProps) {
  return (
    <label className="select-field">
      <span className="select-field__label">선택</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={question.text}
      >
        <option value="" disabled>
          선택해 주세요
        </option>
        {question.options.map((o) => (
          <option key={o.id} value={o.id} disabled={!o.available}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function QuotaNotice() {
  return (
    <div className="notice notice--warn" role="note">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </svg>
      <span>일부 보기는 목표 인원이 모두 모여 선택할 수 없어요. 해당되는 분은 설문이 여기서 종료됩니다.</span>
    </div>
  );
}
