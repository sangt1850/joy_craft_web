import { useState, useMemo, useCallback, useRef } from "react";
import type { SlideProps } from "../SlideProps";
import { useAudio } from "../useAudio";

interface Note { text: string; from: string; color: string; id?: string; mine?: boolean; }

interface RollingPaperData {
  title: string;
  seedNotes: string | Note[];
  allowUserInput: boolean;
  backgroundColor: string;
}

const ROTS = [-2.2, 1.6, -1.2, 2.4, -1.8, 1.1];
const BGS = ["#fff6c9", "#ffe0e6", "#d8f3ea", "#e7dcff", "#ffe6cc", "#ffd9ec"];

export default function RollingPaper({ data }: SlideProps<RollingPaperData>) {
  const { title, allowUserInput, backgroundColor } = data;
  const { blip } = useAudio();

  const seed = useMemo<Note[]>(() => {
    if (Array.isArray(data.seedNotes)) return data.seedNotes;
    try { return JSON.parse(data.seedNotes as string); } catch { return []; }
  }, [data.seedNotes]);

  const [notes, setNotes] = useState<(Note & { id: string })[]>(() =>
    seed.map((n, i) => ({ ...n, id: "seed" + i }))
  );
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const COLS = ["#E94F6A", "#3a7ec0", "#7EC8B1", "#A78BCE", "#FFB26B", "#F4A7C0"];

  const add = useCallback(() => {
    const t = draft.trim(); if (!t) return;
    blip(600, 0.05, "sine", 0.08);
    const note = { id: "u" + Date.now(), text: t, from: "나", color: COLS[notes.length % COLS.length], mine: true };
    setNotes((prev) => [...prev, note]);
    setDraft("");
    setTimeout(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, 50);
  }, [draft, notes.length, blip]);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: backgroundColor, padding: "50px 20px 20px" }}>
      <p style={{ fontSize: 19, fontWeight: 800, color: "#2A2320", textAlign: "center", margin: "0 0 2px" }}>💌 {title}</p>
      <p style={{ fontSize: 12, color: "#b3a596", textAlign: "center", margin: "0 0 16px" }}>{notes.length}개의 마음이 모였어요</p>

      <div ref={listRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, padding: "2px 2px 8px" }}>
        {notes.map((n, i) => (
          <div key={n.id} style={{ background: BGS[i % BGS.length], borderRadius: 4, padding: "14px 16px 12px", boxShadow: "0 4px 10px rgba(0,0,0,.1)", transform: `rotate(${ROTS[i % ROTS.length]}deg)`, animation: n.mine ? "jc-pop .4s" : "none" }}>
            <p style={{ fontFamily: "'Gaegu',cursive", fontSize: 17, color: "#2A2320", lineHeight: 1.45, margin: "0 0 8px", whiteSpace: "pre-line" }}>{n.text}</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: n.color, margin: 0, textAlign: "right" }}>— {n.from}</p>
          </div>
        ))}
      </div>

      {allowUserInput && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, background: "#fff", borderRadius: 16, padding: 8, boxShadow: "0 4px 14px rgba(0,0,0,.06)" }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="한마디 남겨보세요..."
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14, fontFamily: "Pretendard", background: "none", padding: "8px 10px", color: "#2A2320" }}
          />
          <button onClick={add} style={{ padding: "8px 18px", borderRadius: 12, border: "none", background: "#E94F6A", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>붙이기</button>
        </div>
      )}
    </div>
  );
}
