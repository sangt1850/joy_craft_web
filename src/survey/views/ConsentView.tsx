import { useState } from 'react';
import { Body, BottomBar, Card, Screen } from '../components/Layout';
import { useDwellTracker } from '../hooks/useDwellTracker';
import type { ViewProps } from './types';

export function ConsentView({ page, submitting, onSubmit }: ViewProps) {
  const [agreed, setAgreed] = useState(false);
  const [shake, setShake] = useState(false);
  const { snapshot } = useDwellTracker(true);
  const c = page.consent;

  return (
    <Screen>
      <div className="accent-strip" />
      <Body>
        <Card className="card--hero">
          <div className="eyebrow">{c?.eyebrow}</div>
          <h1 className="hero-title">{c?.headline}</h1>
          <p className="muted">{c?.summary}</p>
          <div className="chips">
            {c?.chips.map((chip) => (
              <span key={chip} className="chip">
                {chip}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="card-title">{page.title}</h2>
          <dl className="info-list">
            {c?.sections.map((s) => (
              <div key={s.heading}>
                <dt>{s.heading}</dt>
                <dd>{s.body}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <label className={`card consent-check ${shake ? 'is-error' : ''}`}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>{c?.agreeLabel}</span>
        </label>
      </Body>
      <BottomBar
        label="동의하고 시작하기"
        enabled={agreed}
        loading={submitting}
        onClick={() => {
          if (!agreed) {
            setShake(true);
            window.setTimeout(() => setShake(false), 600);
            return;
          }
          onSubmit([], snapshot());
        }}
      />
    </Screen>
  );
}
