import { useState, useRef, useCallback, useEffect } from "react";

export function useHoldProgress(duration: number, onComplete: () => void) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const holdingRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const loop = useCallback((t: number) => {
    const dt = (t - lastRef.current) / 1000;
    lastRef.current = t;
    if (holdingRef.current) {
      setProgress((prev) => {
        const next = prev + dt / duration;
        if (next >= 1) {
          holdingRef.current = false;
          setHolding(false);
          onCompleteRef.current();
          return 1;
        }
        rafRef.current = requestAnimationFrame(loop);
        return next;
      });
    } else {
      setProgress((prev) => {
        const next = prev - dt * 2;
        if (next <= 0) return 0;
        rafRef.current = requestAnimationFrame(loop);
        return next;
      });
    }
  }, [duration]);

  const down = useCallback(() => {
    holdingRef.current = true;
    lastRef.current = performance.now();
    setHolding(true);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const up = useCallback(() => {
    holdingRef.current = false;
    setHolding(false);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const reset = useCallback(() => {
    holdingRef.current = false;
    setHolding(false);
    setProgress(0);
    cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return { progress, holding, down, up, reset };
}
