import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import type { SlideProps } from "../SlideProps";
import { useAudio } from "../useAudio";
import { useSlideComplete } from "../useSlideComplete";

interface Note { text: string; from: string; color: string; id?: string; mine?: boolean; }

interface RollingPaperData {
  title: string;
  seedNotes: string | Note[];
  allowUserInput: boolean;
  backgroundColor: string;
}

const ROTS = [-2.2, 1.6, -1.2, 2.4, -1.8, 1.1];
const BGS = ["#FFE66D", "#FF6B6B", "#4ECDC4", "#A388EE", "#F7A072", "#FF6B6B"];
const COLS = ["#FF6B6B", "#4ECDC4", "#A388EE", "#FFE66D", "#F7A072", "#FF6B6B"];

export default function RollingPaper({ data, onComplete, isPreview }: SlideProps<RollingPaperData>) {
  const { title, allowUserInput, backgroundColor } = data;
  const { blip } = useAudio();
  const complete = useSlideComplete(onComplete, isPreview);

  const seed = useMemo<Note[]>(() => {
    if (Array.isArray(data.seedNotes)) return data.seedNotes;
    try { return JSON.parse(data.seedNotes as string); } catch { return []; }
  }, [data.seedNotes]);

  const [notes, setNotes] = useState<(Note & { id: string })[]>(() =>
    seed.map((n, i) => ({ ...n, id: "seed" + i }))
  );
  const [draft, setDraft] = useState("");
  const [posted, setPosted] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const add = useCallback(() => {
    const t = draft.trim(); if (!t) return;
    blip(600, 0.05, "sine", 0.08);
    const note = { id: "u" + Date.now(), text: t, from: "나", color: COLS[notes.length % COLS.length], mine: true };
    setNotes((prev) => [...prev, note]);
    setDraft("");
    setPosted(true);
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, 50);
  }, [draft, notes.length, blip]);

  useEffect(() => () => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: backgroundColor, fontFamily: "'Space Grotesk', sans-serif", padding: "50px 20px 20px" }}>
      <p style={{ fontSize: 19, fontWeight: 800, color: "#1A1A1A", textAlign: "center", margin: "0 0 2px" }}>💌 {title}</p>
      <p style={{ fontSize: 12, color: "#1A1A1A", textAlign: "center", margin: "0 0 16px", fontWeight: 700 }}>{notes.length}개의 마음이 모였어요</p>

      <div ref={listRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, padding: "2px 2px 8px" }}>
        {notes.map((n, i) => (
          <div key={n.id} style={{ background: BGS[i % BGS.length], borderRadius: 8, padding: "14px 16px 12px", border: "2px solid #1A1A1A", boxShadow: "4px 4px 0 #1A1A1A", transform: `rotate(${ROTS[i % ROTS.length]}deg)`, animation: n.mine ? "jc-pop .4s" : "none" }}>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, color: "#1A1A1A", lineHeight: 1.45, margin: "0 0 8px", whiteSpace: "pre-line", fontWeight: 600 }}>{n.text}</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", margin: 0, textAlign: "right" }}>— {n.from}</p>
          </div>
        ))}
      </div>

      {allowUserInput && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, background: "#FDF2E9", borderRadius: 8, padding: 8, border: "2px solid #1A1A1A", boxShadow: "4px 4px 0 #1A1A1A" }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="한마디 남겨보세요..."
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14, fontFamily: "'Space Grotesk', sans-serif", background: "none", padding: "8px 10px", color: "#1A1A1A", fontWeight: 600 }}
          />
          <button onClick={add} style={{ padding: "8px 18px", borderRadius: 8, border: "2px solid #1A1A1A", background: "#FF6B6B", color: "#1A1A1A", fontSize: 14, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer", boxShadow: "3px 3px 0 #1A1A1A" }}>붙이기</button>
        </div>
      )}

      <button
        onClick={complete}
        style={{ marginTop: 12, padding: "11px 0", borderRadius: 8, border: "2px solid #1A1A1A", background: posted || !allowUserInput ? "#FF6B6B" : "#FDF2E9", color: "#1A1A1A", fontSize: 14, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer", boxShadow: "4px 4px 0 #1A1A1A" }}
      >
        {posted ? "마음 전하고 다음으로 →" : "다 읽었어요 →"}
      </button>
    </div>
  );
}
