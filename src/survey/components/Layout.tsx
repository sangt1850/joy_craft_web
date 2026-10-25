import type { ReactNode } from 'react';
import { RichText } from './RichText';

export function ProgressHeader({ title, index, total }: { title: string; index: number; total: number }) {
  const pct = Math.min(100, Math.round((index / total) * 100));
  return (
    <header className="progress-header">
      <div className="progress-header__row">
        <span className="progress-header__title">
          <RichText text={title} />
        </span>
        <span className="progress-header__count">
          {index} / {total}
        </span>
      </div>
      <div
        className="progress-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={index}
        aria-label="설문 진행률"
      >
        <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </header>
  );
}

export function Screen({ children }: { children: ReactNode }) {
  return <div className="screen">{children}</div>;
}

export function Body({ children }: { children: ReactNode }) {
  return <main className="screen__body">{children}</main>;
}

interface BottomBarProps {
  label: string;
  hint?: ReactNode;
  enabled: boolean;
  loading?: boolean;
  onClick: () => void;
  variant?: 'plain' | 'raised';
  children?: ReactNode; // 버튼 위 추가 영역 (타이머 등)
}

/** 하단 고정 버튼. enabled=false여도 클릭은 받아서 미응답 문항으로 안내할 수 있게 aria-disabled 사용 */
export function BottomBar({ label, hint, enabled, loading, onClick, variant = 'plain', children }: BottomBarProps) {
  return (
    <footer className={`bottom-bar bottom-bar--${variant}`}>
      {children}
      {hint && <div className="bottom-bar__hint">{hint}</div>}
      <button
        type="button"
        className="btn-primary"
        aria-disabled={!enabled || loading}
        data-enabled={enabled && !loading}
        onClick={() => {
          if (!loading) onClick();
        }}
      >
        {loading ? '저장 중…' : label}
      </button>
    </footer>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}
