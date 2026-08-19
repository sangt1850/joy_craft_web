import { useState, useCallback } from "react";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";
import { useSlideTimeout } from "../useSlideTimeout";

interface PhotoPuzzleData {
  clearText: string;
  puzzleImage: string | null;
  gridSize: number;
}

const SCENE = "radial-gradient(circle at 20% 24%,#FFE66D 0 20%,transparent 42%),radial-gradient(circle at 80% 20%,#4ECDC4 0 17%,transparent 38%),radial-gradient(circle at 28% 78%,#A388EE 0 22%,transparent 44%),radial-gradient(circle at 76% 74%,#FF6B6B 0 19%,transparent 40%),linear-gradient(135deg,#FF6B6B,#F7A072)";

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
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", background: "#1A1A1A", fontFamily: "'Space Grotesk', sans-serif", padding: "50px 22px 30px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div style={{ width: 52, height: 52, borderRadius: 8, backgroundImage: bgImage, backgroundSize: "52px 52px", border: "2px solid #1A1A1A", boxShadow: "3px 3px 0 #FFE66D" }} />
        <div style={{ textAlign: "left" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#FDF2E9", margin: "0 0 2px" }}>사진 퍼즐</p>
          <p style={{ fontSize: 12, color: "#888", fontWeight: 600, margin: 0 }}>조각을 탭해서 자리를 바꿔요</p>
        </div>
      </div>

      <div style={{ position: "relative", width: cellPx * N, height: cellPx * N, borderRadius: 8, overflow: "hidden", background: "#111", border: "2px solid #1A1A1A", boxShadow: "6px 6px 0 #1A1A1A" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${N},${cellPx}px)`, gridTemplateRows: `repeat(${N},${cellPx}px)` }}>
          {order.map((home, cell) => {
            const col = home % N, row = Math.floor(home / N);
            const isCorrect = home === cell;
            const isSel = sel === cell;
            return (
              <button
                key={cell}
                onClick={() => tap(cell)}
                style={{ width: cellPx, height: cellPx, padding: 0, cursor: done ? "default" : "pointer", position: "relative", backgroundImage: bgImage, backgroundSize: bgSize, backgroundPosition: `-${col * cellPx}px -${row * cellPx}px`, border: isSel ? "3px solid #FFE66D" : (done ? "1px solid transparent" : "1px solid rgba(0,0,0,.15)"), boxShadow: isCorrect && !done ? "inset 0 0 0 3px #4ECDC4" : (isSel ? "0 0 0 3px #FFE66D" : "none"), outline: "none", transition: "box-shadow .2s, border .2s" }}
              >
                <span style={{ position: "absolute", left: 5, top: 3, fontSize: 12, fontWeight: 800, color: "#FDF2E9", textShadow: "1px 1px 0 #1A1A1A" }}>{home + 1}</span>
              </button>
            );
          })}
        </div>
        {done && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(26,26,26,.7)", animation: "jc-fadeup .4s" }}>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: "#FDF2E9", textAlign: "center", lineHeight: 1.3, margin: 0, padding: 20, whiteSpace: "pre-line" }}>{clearText}</p>
          </div>
        )}
      </div>

      <p style={{ fontSize: 13, color: done ? "#FFE66D" : "#888", margin: "18px 0 0", fontWeight: 700, minHeight: 18 }}>
        {done ? "🎉 완성했어요!" : sel !== null ? "바꿀 조각을 하나 더 탭하세요" : `조각 ${moves}번 이동`}
      </p>
      <button onClick={shuffle} style={{ marginTop: 10, padding: "10px 22px", borderRadius: 8, border: "2px solid #1A1A1A", background: "#A388EE", color: "#1A1A1A", fontSize: 13, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer", boxShadow: "4px 4px 0 #1A1A1A" }}>다시 섞기</button>
    </div>
  );
}
