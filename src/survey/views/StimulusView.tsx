import { useEffect, useState } from 'react';
import { Body, BottomBar, ProgressHeader, Screen } from '../components/Layout';
import { useDwellTracker } from '../hooks/useDwellTracker';
import type { ViewProps } from './types';

/** 이미지를 모두 받은 뒤에 타이머를 시작해 로딩 시간이 노출 시간에 섞이지 않게 한다 */
function useImagesReady(urls: string[]) {
  const [ready, setReady] = useState(urls.length === 0);
  useEffect(() => {
    if (urls.length === 0) {
      setReady(true);
      return;
    }
    let left = urls.length;
    let cancelled = false;
    const done = () => {
      left -= 1;
      if (left === 0 && !cancelled) setReady(true);
    };
    urls.forEach((u) => {
      const img = new Image();
      img.onload = done;
      img.onerror = done;
      img.src = u;
    });
    return () => {
      cancelled = true;
    };
  }, [urls.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  return ready;
}

export function StimulusView({ page, submitting, onSubmit }: ViewProps) {
  const imageUrls = page.stimulus.filter((b) => b.kind === 'IMAGE' && b.content).map((b) => b.content);
  const ready = useImagesReady(imageUrls);
  const { activeMs, snapshot } = useDwellTracker(ready);

  const totalMs = page.minSeconds * 1000;
  const remaining = Math.max(0, Math.ceil((totalMs - activeMs) / 1000));
  const done = ready && activeMs >= totalMs;
  const pct = totalMs === 0 ? 100 : Math.min(100, (activeMs / totalMs) * 100);

  return (
    <Screen>
      <ProgressHeader title={page.title} index={page.progressIndex} total={page.totalPages} />
      <Body>
        {page.instruction && <div className="notice notice--info">{page.instruction}</div>}
        <article className="card card--flush stimulus">
          {/* 제목·본문이 모두 비어 있는 텍스트 블록(아직 채우지 않은 자극물 문구)은 빈 칸으로 보이지 않게 건너뛴다 */}
          {page.stimulus.filter((b) => b.kind === 'IMAGE' || b.content || b.caption).map((b) =>
            b.kind === 'IMAGE' ? (
              b.content ? (
                <img key={b.id} src={b.content} alt={b.caption ?? '관광 홍보 이미지'} className="stimulus__img" />
              ) : (
                <div key={b.id} className="stimulus__placeholder">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <circle cx="9" cy="10" r="2" />
                    <path d="M21 17l-5-5-9 8" />
                  </svg>
                  <span>{b.caption}</span>
                </div>
              )
            ) : (
              <div key={b.id} className="stimulus__text">
                {b.caption && <h2>{b.caption}</h2>}
                <p>{b.content}</p>
              </div>
            ),
          )}
        </article>
      </Body>
      <BottomBar
        variant="raised"
        label={done ? '다음' : '잠시 후 다음으로 이동할 수 있어요'}
        enabled={done}
        loading={submitting}
        hint={done ? '충분히 살펴보셨다면 다음으로 넘어가 주세요' : undefined}
        onClick={() => {
          if (done) onSubmit([], snapshot());
        }}
      >
        {!done && (
          <div className="timer">
            <div className="timer__row">
              <span className="muted-sm">{ready ? '다음 문항까지' : '홍보물을 불러오는 중'}</span>
              <span className="timer__sec" aria-live="off">
                {remaining}초
              </span>
            </div>
            <div className="timer__bar">
              <div className="timer__fill" style={{ width: `${pct}%` }} />
            </div>
            <p className="muted-xs">다른 화면으로 이동하면 시간이 멈춰요</p>
          </div>
        )}
      </BottomBar>
    </Screen>
  );
}
