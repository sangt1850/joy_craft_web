import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { CSSProperties } from 'react';
import { createFireworks } from './fireworks.js';

export interface FireworksOverlayHandle {
  play(): void;
  pause(): void;
  restart(): void;
  seek(seconds: number): void;
}
export interface FireworksOverlayProps {
  loop?: boolean;
  autoplay?: boolean;
  density?: number;
  speed?: number;
  className?: string;
  style?: CSSProperties;
  onComplete?: () => void;
}
const FireworksOverlay = forwardRef<FireworksOverlayHandle, FireworksOverlayProps>(function FireworksOverlay(
  { loop = false, autoplay = true, density = 1, speed = 2, className, style, onComplete }, ref,
) {
  const host = useRef<HTMLDivElement>(null);
  const engine = useRef<ReturnType<typeof createFireworks> | null>(null);
  const complete = useRef(onComplete);
  complete.current = onComplete;
  useImperativeHandle(ref, () => ({
    play: () => engine.current?.play(),
    pause: () => engine.current?.pause(),
    restart: () => engine.current?.restart(),
    seek: (seconds: number) => engine.current?.seek(seconds),
  }), []);
  useEffect(() => {
    if (!host.current) return;
    engine.current = createFireworks(host.current, { loop, autoplay, density, onComplete: () => complete.current?.() });
    return () => { engine.current?.dispose(); engine.current = null; };
  }, [loop, autoplay, density]);
  useEffect(() => { engine.current?.setSpeed(speed); }, [speed, loop, autoplay, density]);
  return <div ref={host} className={className} aria-hidden="true"
    style={{ width: '100%', height: '100%', pointerEvents: 'none', ...style }} />;
});
export default FireworksOverlay;
