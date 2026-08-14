import { useRef, useCallback, useEffect } from "react";

export function useAudio() {
  const acRef = useRef<AudioContext | null>(null);

  const getAc = useCallback(() => {
    if (!acRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      acRef.current = new AC();
    }
    if (acRef.current.state === "suspended") acRef.current.resume();
    return acRef.current;
  }, []);

  const blip = useCallback((
    freq = 440,
    dur = 0.06,
    type: OscillatorType = "square",
    gain = 0.15,
  ) => {
    try {
      const ac = getAc();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, ac.currentTime);
      g.gain.linearRampToValueAtTime(gain, ac.currentTime + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
      o.connect(g);
      g.connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + dur);
    } catch {}
  }, [getAc]);

  useEffect(() => {
    return () => { acRef.current?.close().catch(() => {}); };
  }, []);

  return { getAc, blip };
}
