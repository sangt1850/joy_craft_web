import { useRef, useState } from 'react';
import { Body, Card, Screen } from '../components/Layout';
import { api } from '../api/client';
import type { PhoneCheckStatus } from '../api/types';

function formatPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

function isValidPhone(digits: string): boolean {
  return /^01[016789]\d{7,8}$/.test(digits);
}

interface PhoneEntryViewProps {
  surveyCode: string;
  onProceed: (phone: string) => void;
}

type Phase = 'input' | 'checking' | 'resume-confirm' | 'blocked';

export function PhoneEntryView({ surveyCode, onProceed }: PhoneEntryViewProps) {
  const [phase, setPhase] = useState<Phase>('input');
  const [agreed, setAgreed] = useState(false);
  const [phone, setPhone] = useState('');
  const [blockReason, setBlockReason] = useState<'COMPLETE' | 'NOT_ELIGIBLE' | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const digits = phone.replace(/\D/g, '');
  const canProceed = agreed && isValidPhone(digits) && phase === 'input';

  const handleAgreement = (checked: boolean) => {
    setAgreed(checked);
    if (checked) {
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
    if (error) setError('');
  };

  const handleNext = async () => {
    if (!canProceed) return;
    setPhase('checking');
    try {
      const res = await api.checkPhone(surveyCode, { phone: digits });
      const status: PhoneCheckStatus = res.checkStatus;
      if (status === 'NEW') {
        onProceed(digits);
      } else if (status === 'IN_PROGRESS') {
        setPhase('resume-confirm');
      } else if (status === 'COMPLETE') {
        setBlockReason('COMPLETE');
        setPhase('blocked');
      } else {
        setBlockReason('NOT_ELIGIBLE');
        setPhase('blocked');
      }
    } catch {
      setPhase('input');
      setError('확인 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
  };

  // ── 재개 확인 ─────────────────────────────────────────────────────────────
  if (phase === 'resume-confirm') {
    return (
      <Screen>
        <div className="accent-strip" />
        <Body>
          <Card className="end__card">
            <h1 className="end__title">이전 참여 이력</h1>
            <p className="end__body">
              이전에 참여를 시작하신 이력이 있습니다.{'\n'}이어서 진행하시겠습니까?
            </p>
          </Card>
        </Body>
        <footer className="bottom-bar">
          <button type="button" className="btn-primary" onClick={() => onProceed(digits)}>
            이어서 하기
          </button>
          <button
            type="button"
            className="gift-skip-btn"
            onClick={() => {
              setPhone('');
              setAgreed(false);
              setPhase('input');
            }}
          >
            아니요
          </button>
        </footer>
      </Screen>
    );
  }

  // ── 차단 화면 ─────────────────────────────────────────────────────────────
  if (phase === 'blocked') {
    const message =
      blockReason === 'COMPLETE'
        ? '이미 설문을 완료하셨습니다.\n참여해 주셔서 감사합니다.'
        : '이번 조사는 정해진 조건에 맞는 분만 참여할 수 있어요.\n관심 가져 주셔서 감사합니다.';
    return (
      <Screen>
        <div className="accent-strip" />
        <Body>
          <Card className="end__card">
            <p className="end__body">{message}</p>
          </Card>
        </Body>
      </Screen>
    );
  }

  // ── 입력 화면 ─────────────────────────────────────────────────────────────
  const checking = phase === 'checking';
  return (
    <Screen>
      <div className="accent-strip" />
      <Body>
        <Card className="card--hero">
          <div className="gift-icon" aria-hidden="true">☕</div>
          <div className="eyebrow">이벤트 안내</div>
          <h1 className="hero-title">커피 기프트콘 증정</h1>
          <p className="muted">
            설문에 참여해 주시면 커피 기프트콘을 보내드려요.
            전화번호를 먼저 확인하고 설문을 시작합니다.
          </p>
        </Card>

        <Card>
          <h2 className="card-title">개인정보 수집·이용 동의</h2>
          <dl className="info-list">
            <div>
              <dt>수집 항목</dt>
              <dd>휴대폰 번호</dd>
            </div>
            <div>
              <dt>수집·이용 목적</dt>
              <dd>경품(커피 기프트콘) 발송에만 사용</dd>
            </div>
            <div>
              <dt>보유 및 파기</dt>
              <dd>이벤트 종료일(2025년 12월 31일)까지 보유 후 즉시 파기</dd>
            </div>
          </dl>
          <p className="muted-xs">
            ※ 동의는 선택사항입니다. 동의하지 않으셔도 설문 참여에 불이익이 없습니다.
          </p>
          <label className="consent-check" style={{ marginTop: 4 }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => handleAgreement(e.target.checked)}
            />
            <span>
              개인정보 수집 및 이용에 동의합니다{' '}
              <span className="gift-optional">(선택)</span>
            </span>
          </label>
        </Card>

        {agreed && (
          <Card>
            <label className="gift-phone-label" htmlFor="entry-phone">
              휴대폰 번호
            </label>
            <input
              ref={inputRef}
              id="entry-phone"
              className={`gift-phone-input${error ? ' is-error' : ''}`}
              type="tel"
              inputMode="numeric"
              placeholder="010-0000-0000"
              value={phone}
              onChange={handleChange}
              autoComplete="tel-national"
              disabled={checking}
            />
            {error && (
              <p className="gift-phone-error" role="alert">
                {error}
              </p>
            )}
          </Card>
        )}
      </Body>

      <footer className="bottom-bar">
        <button
          type="button"
          className="btn-primary"
          data-enabled={String(canProceed)}
          aria-disabled={!canProceed || checking}
          onClick={handleNext}
          disabled={checking}
        >
          {checking ? '확인 중…' : '다음'}
        </button>
      </footer>
    </Screen>
  );
}
