import { useCallback, useEffect, useRef, useState } from 'react';
import type { DwellMetrics } from '../api/types';
import { DwellAccumulator } from './dwellAccumulator';

/**
 * 페이지 체류 시간 측정.
 * - activeMs: 탭이 화면에 보이는 동안만 누적된 시간 (자극물 타이머에 사용)
 * - hiddenCount / blurCount: 다른 탭·앱으로 이탈한 횟수
 * running=false 동안은 측정하지 않는다 (예: 자극물 이미지 로딩 중).
 */
export function useDwellTracker(running: boolean) {
  const acc = useRef<DwellAccumulator | null>(null);
  if (acc.current === null) acc.current = new DwellAccumulator(() => performance.now());
  const tracker = acc.current;
  const [activeMs, setActiveMs] = useState(0);

  useEffect(() => {
    if (!running) return;
    tracker.start(document.visibilityState === 'visible');

    const onVisibility = () => tracker.onVisibilityChange(document.visibilityState === 'visible');
    const onBlur = () => tracker.onBlur();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    const tick = window.setInterval(() => setActiveMs(tracker.read()), 250);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.clearInterval(tick);
      tracker.stop();
    };
  }, [running, tracker]);

  const snapshot = useCallback(
    (): DwellMetrics => ({
      clientActiveMs: Math.round(tracker.read()),
      hiddenCount: tracker.hidden,
      blurCount: tracker.blur,
    }),
    [tracker],
  );

  return { activeMs, snapshot };
}
