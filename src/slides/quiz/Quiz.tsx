import { useState, useMemo, useCallback } from "react";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";

interface Question {
  q: string;
  choices: string[];
  explain?: string;
}

interface ShuffledQuestion {
  q: string;
  explain?: string;
  choices: { text: string; isCorrect: boolean }[];
}

interface QuizData {
  intro: string;
  highScoreMessage: string;
  lowScoreMessage: string;
  questions: string | Question[];
  backgroundColor: string;
  accentColor: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Quiz({ data, onComplete, isPreview }: SlideProps<QuizData>) {
  const { intro, highScoreMessage, lowScoreMessage, backgroundColor, accentColor } = data;
  const vibe = useVibrate();

  const questions = useMemo<Question[]>(() => {
    if (Array.isArray(data.questions)) return data.questions;
    try { return JSON.parse(data.questions as string); } catch { return []; }
  }, [data.questions]);

  const shuffled = useMemo<ShuffledQuestion[]>(() => {
    return questions.map((q) => ({
      q: q.q,
      explain: q.explain,
      choices: shuffle(q.choices.map((t, i) => ({ text: t, isCorrect: i === 0 }))),
    }));
  }, [questions]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  const cur = shuffled[index];
  const total = shuffled.length;

  const select = useCallback((i: number) => {
    if (answered || !cur) return;
    const isCorrect = cur.choices[i].isCorrect;
    vibe(isCorrect ? [10, 30, 10] : 65);
    setSelected(i);
    setAnswered(true);
    if (isCorrect) setCorrect((c) => c + 1);
  }, [answered, cur, vibe]);

  const next = useCallback(() => {
    if (index >= total - 1) {
      setFinished(true);
      if (!isPreview) setTimeout(() => onComplete?.(), 800);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    }
  }, [index, total, isPreview, onComplete]);

  const retry = useCallback(() => {
    setIndex(0); setSelected(null); setAnswered(false); setCorrect(0); setFinished(false);
  }, []);

  if (!cur && !finished) return null;
  const ratio = total ? correct / total : 0;

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: backgroundColor, padding: "56px 24px 28px" }}>
      {!finished && cur && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: accentColor, background: "#fdeaef", padding: "5px 12px", borderRadius: 20 }}>{index + 1} / {total}</span>
            <span style={{ fontSize: 13, color: "#b3a596" }}>{intro}</span>
          </div>
          <div style={{ height: 6, borderRadius: 6, background: "#efe6d8", overflow: "hidden", marginBottom: 26 }}>
            <div style={{ height: "100%", background: accentColor, borderRadius: 6, transition: "width .3s", width: `${((index + (answered ? 1 : 0)) / total) * 100}%` }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#d4a13a", margin: "0 0 8px" }}>Q{index + 1}</p>
          <p style={{ fontSize: 21, fontWeight: 800, color: "#2A2320", lineHeight: 1.4, margin: "0 0 26px" }}>{cur.q}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {cur.choices.map((c, i) => {
              let bg = "#ffffff", border = "2px solid #ece2d3", color = "#2A2320";
              let mark = ""; let showMark = false; let anim = "none";
              if (answered) {
                if (c.isCorrect) { bg = "#e9f9ef"; border = "2px solid #4ade80"; color = "#177a3d"; mark = "✓"; showMark = true; }
                else if (i === selected) { bg = "#fdecec"; border = "2px solid #f26a6a"; color = "#c0392b"; mark = "✕"; showMark = true; anim = "jc-shake .4s"; }
                else { color = "#b3a596"; }
              }
              return (
                <button key={i} onClick={() => select(i)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, width: "100%", padding: "17px 18px", borderRadius: 14, background: bg, border, color, fontSize: 16, fontWeight: 600, textAlign: "left", cursor: answered ? "default" : "pointer", animation: anim, transition: "all .15s" }}>
                  <span>{c.text}</span>
                  {showMark && <span style={{ fontSize: 18 }}>{mark}</span>}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: "auto" }}>
            {answered && (
              <div style={{ animation: "jc-fadeup .3s" }}>
                {cur.explain && (
                  <p style={{ fontSize: 14, color: "#7a6f60", background: "#f4ecdf", padding: "14px 16px", borderRadius: 12, lineHeight: 1.5, margin: "0 0 14px" }}>💡 {cur.explain}</p>
                )}
                <button onClick={next} style={{ width: "100%", padding: 16, borderRadius: 14, border: "none", background: "#2A2320", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                  {index >= total - 1 ? "결과 보기" : "다음 문제"}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {finished && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: "40px 30px", textAlign: "center", animation: "jc-fadeup .4s" }}>
          <div style={{ fontSize: 60, animation: "jc-pop .5s" }}>{ratio >= 0.7 ? "💯" : "😅"}</div>
          <div style={{ fontSize: 15, color: "#b3a596", fontWeight: 600 }}>내 점수</div>
          <div style={{ fontSize: 52, fontWeight: 900, color: accentColor, letterSpacing: "-.02em" }}>{correct} / {total}</div>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#2A2320", lineHeight: 1.5, margin: "4px 0 8px" }}>{ratio >= 0.7 ? highScoreMessage : lowScoreMessage}</p>
          <button onClick={retry} style={{ padding: "14px 30px", borderRadius: 14, border: `2px solid ${accentColor}`, background: "#fff", color: accentColor, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            다시 풀어보기
          </button>
        </div>
      )}
    </div>
  );
}
