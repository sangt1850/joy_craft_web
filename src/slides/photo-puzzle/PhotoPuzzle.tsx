import { useState, useCallback } from "react";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";
import { useSlideTimeout } from "../useSlideTimeout";

interface PhotoPuzzleData {
  clearText: string;
  puzzleImage: string | null;
  gridSize: number;
}

const SCENE = "radial-gradient(circle at 20% 24%,#FFD97D 0 20%,transparent 42%),radial-gradient(circle at 80% 20%,#7EC8B1 0 17%,transparent 38%),radial-gradient(circle at 28% 78%,#F4A7C0 0 22%,transparent 44%),radial-gradient(circle at 76% 74%,#A78BCE 0 19%,transparent 40%),linear-gradient(135deg,#E94F6A,#ff9a5c)";

function doShuffle(n: number): number[] {
  const arr = Array.from({ length: n * n }, (_, i) => i);
  do {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  } while (arr.every((v, i) => v === i));
  return arr;
}

export default function PhotoPuzzle({ data, onComplete, isPreview }: SlideProps<PhotoPuzzleData>) {
  const { clearText, puzzleImage, gridSize } = data;
  const N = Math.max(2, Math.min(4, gridSize || 3));
  const cellPx = Math.floor(300 / N);
  const vibe = useVibrate();
  const later = useSlideTimeout();

  const [order, setOrder] = useState(() => doShuffle(N));
  const [sel, setSel] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [moves, setMoves] = useState(0);

  const bgImage = puzzleImage || SCENE;
  const bgSize = `${cellPx * N}px ${cellPx * N}px`;

  const tap = useCallback((cell: number) => {
    if (done) return;
    if (sel === null) { vibe(8); setSel(cell); return; }
    if (sel === cell) { setSel(null); return; }
    const next = [...order];
    [next[sel], next[cell]] = [next[cell], next[sel]];
    const isDone = next.every((v, i) => v === i);
    vibe(isDone ? [12, 40, 90] : 14);
    setOrder(next);
    setSel(null);
    setMoves((m) => m + 1);
    if (isDone) {
      setDone(true);
      if (!isPreview) later(() => onComplete?.(), 1500);
    }
  }, [done, sel, order, vibe, isPreview, onComplete, later]);

  const shuffle = useCallback(() => {
    setOrder(doShuffle(N));
    setSel(null);
    setDone(false);
    setMoves(0);
  }, [N]);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", background: "#1e1e24", padding: "50px 22px 30px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div style={{ width: 52, height: 52, borderRadius: 8, backgroundImage: bgImage, backgroundSize: "52px 52px", opacity: 0.85, border: "1px solid #3a3a44" }} />
        <div style={{ textAlign: "left" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "0 0 2px" }}>사진 퍼즐</p>
          <p style={{ fontSize: 12, color: "#8a8a96", margin: 0 }}>조각을 탭해서 자리를 바꿔요</p>
        </div>
      </div>

      <div style={{ position: "relative", width: cellPx * N, height: cellPx * N, borderRadius: 14, overflow: "hidden", background: "#111" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${N},${cellPx}px)`, gridTemplateRows: `repeat(${N},${cellPx}px)` }}>
          {order.map((home, cell) => {
            const col = home % N, row = Math.floor(home / N);
            const isCorrect = home === cell;
            const isSel = sel === cell;
            return (
              <button
                key={cell}
                onClick={() => tap(cell)}
                style={{ width: cellPx, height: cellPx, padding: 0, cursor: done ? "default" : "pointer", position: "relative", backgroundImage: bgImage, backgroundSize: bgSize, backgroundPosition: `-${col * cellPx}px -${row * cellPx}px`, border: isSel ? "3px solid #FFD97D" : (done ? "1px solid transparent" : "1px solid rgba(0,0,0,.15)"), boxShadow: isCorrect && !done ? "inset 0 0 0 3px rgba(74,222,128,.85)" : (isSel ? "0 0 16px rgba(255,217,125,.7)" : "none"), outline: "none", transition: "box-shadow .2s, border .2s" }}
              >
                <span style={{ position: "absolute", left: 5, top: 3, fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,.7)", textShadow: "0 1px 2px rgba(0,0,0,.5)" }}>{home + 1}</span>
              </button>
            );
          })}
        </div>
        {done && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,10,20,.55)", backdropFilter: "blur(2px)", animation: "jc-fadeup .4s" }}>
            <p style={{ fontFamily: "'Nanum Pen Script',cursive", fontSize: 30, color: "#fff", textAlign: "center", lineHeight: 1.3, margin: 0, padding: 20, whiteSpace: "pre-line" }}>{clearText}</p>
          </div>
        )}
      </div>

      <p style={{ fontSize: 13, color: done ? "#FFD97D" : "#9a9aa6", margin: "18px 0 0", fontWeight: 600, minHeight: 18 }}>
        {done ? "🎉 완성했어요!" : sel !== null ? "바꿀 조각을 하나 더 탭하세요" : `조각 ${moves}번 이동`}
      </p>
      <button onClick={shuffle} style={{ marginTop: 10, padding: "10px 22px", borderRadius: 12, border: "1px solid #3a3a44", background: "#2a2a32", color: "#b8b8c2", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>다시 섞기</button>
    </div>
  );
}
