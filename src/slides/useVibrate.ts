export function useVibrate() {
  return (pattern: number | number[]) => {
    try { navigator.vibrate?.(pattern); } catch {}
  };
}
