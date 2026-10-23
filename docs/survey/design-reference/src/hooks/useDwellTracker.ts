import { useCallback, useEffect, useRef, useState } from 'react';
import type { DwellMetrics } from '../api/types';

/**
 * 페이지 체류 시간 측정.
 * - activeMs: 탭이 화면에 보이는 동안만 누적된 시간 (자극물 타이머에 사용)
 * - hiddenCount / blurCount: 다른 탭·앱으로 이탈한 횟수
 * running=false 동안은 측정하지 않는다 (예: 자극물 이미지 로딩 중).
 */
export function useDwellTracker(running: boolean) {
  const acc = useRef(0);
  const since = useRef<number | null>(null);
  const hidden = useRef(0);
  const blur = useRef(0);
  const [activeMs, setActiveMs] = useState(0);

  const read = useCallback(
    () => acc.current + (since.current != null ? performance.now() - since.current : 0),
    [],
  );

  useEffect(() => {
    if (!running) return;
    since.current = document.visibilityState === 'visible' ? performance.now() : null;

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hidden.current += 1;
        if (since.current != null) {
          acc.current += performance.now() - since.current;
          since.current = null;
        }
      } else if (since.current == null) {
        since.current = performance.now();
      }
    };
    const onBlur = () => {
      blur.current += 1;
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    const tick = window.setInterval(() => setActiveMs(read()), 250);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.clearInterval(tick);
      if (since.current != null) {
        acc.current += performance.now() - since.current;
        since.current = null;
      }
    };
  }, [running, read]);

  const snapshot = useCallback(
    (): DwellMetrics => ({
      clientActiveMs: Math.round(read()),
      hiddenCount: hidden.current,
      blurCount: blur.current,
    }),
    [read],
  );

  return { activeMs, snapshot };
}
