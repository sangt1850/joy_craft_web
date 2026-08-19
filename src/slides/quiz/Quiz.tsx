import { useState, useMemo, useCallback } from "react";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";
import { useSlideTimeout } from "../useSlideTimeout";

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
  const later = useSlideTimeout();

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
      if (!isPreview) later(() => onComplete?.(), 800);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    }
  }, [index, total, isPreview, onComplete, later]);

  const retry = useCallback(() => {
    setIndex(0); setSelected(null); setAnswered(false); setCorrect(0); setFinished(false);
  }, []);

  if (!cur && !finished) return null;
  const ratio = total ? correct / total : 0;

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: backgroundColor, fontFamily: "'Space Grotesk', sans-serif", padding: "56px 24px 28px" }}>
      {!finished && cur && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A", background: "#FFE66D", padding: "4px 12px", borderRadius: 6, border: "2px solid #1A1A1A", boxShadow: "2px 2px 0 #1A1A1A" }}>{index + 1} / {total}</span>
            <span style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 700 }}>{intro}</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "#FDF2E9", overflow: "hidden", marginBottom: 26, border: "2px solid #1A1A1A" }}>
            <div style={{ height: "100%", background: accentColor, transition: "width .3s", width: `${((index + (answered ? 1 : 0)) / total) * 100}%` }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: accentColor, margin: "0 0 8px" }}>Q{index + 1}</p>
          <p style={{ fontSize: 21, fontWeight: 800, color: "#1A1A1A", lineHeight: 1.4, margin: "0 0 26px" }}>{cur.q}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {cur.choices.map((c, i) => {
              let bg = "#FDF2E9", border = "2px solid #1A1A1A", color = "#1A1A1A";
              let mark = ""; let showMark = false; let anim = "none";
              let shadow = "4px 4px 0 #1A1A1A";
              if (answered) {
                if (c.isCorrect) { bg = "#4ECDC4"; border = "2px solid #1A1A1A"; color = "#1A1A1A"; mark = "✓"; showMark = true; }
                else if (i === selected) { bg = "#FF4757"; border = "2px solid #1A1A1A"; color = "#FDF2E9"; mark = "✕"; showMark = true; anim = "jc-shake .4s"; }
                else { color = "#888"; shadow = "3px 3px 0 #1A1A1A"; }
              }
              return (
                <button key={i} onClick={() => select(i)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, width: "100%", padding: "17px 18px", borderRadius: 8, background: bg, border, color, fontSize: 16, fontWeight: 700, textAlign: "left", cursor: answered ? "default" : "pointer", animation: anim, transition: "all .15s", boxShadow: shadow, fontFamily: "'Space Grotesk', sans-serif" }}>
                  <span>{c.text}</span>
                  {showMark && <span style={{ fontSize: 18, fontWeight: 800 }}>{mark}</span>}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: "auto" }}>
            {answered && (
              <div style={{ animation: "jc-fadeup .3s" }}>
                {cur.explain && (
                  <p style={{ fontSize: 14, color: "#1A1A1A", background: "#FFE66D", padding: "14px 16px", borderRadius: 8, lineHeight: 1.5, margin: "0 0 14px", border: "2px solid #1A1A1A", boxShadow: "3px 3px 0 #1A1A1A", fontWeight: 600 }}>💡 {cur.explain}</p>
                )}
                <button onClick={next} style={{ width: "100%", padding: 16, borderRadius: 8, border: "2px solid #1A1A1A", background: "#1A1A1A", color: "#FDF2E9", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", boxShadow: "4px 4px 0 #A388EE" }}>
                  {index >= total - 1 ? "결과 보기" : "다음 문제"}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {finished && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: "40px 30px", textAlign: "center", animation: "jc-fadeup .4s", background: backgroundColor }}>
          <div style={{ fontSize: 60, animation: "jc-pop .5s" }}>{ratio >= 0.7 ? "💯" : "😅"}</div>
          <div style={{ fontSize: 15, color: "#1A1A1A", fontWeight: 700, background: "#FFE66D", padding: "4px 12px", borderRadius: 6, border: "2px solid #1A1A1A", boxShadow: "2px 2px 0 #1A1A1A" }}>내 점수</div>
          <div style={{ fontSize: 52, fontWeight: 900, color: accentColor, letterSpacing: "-.02em", textShadow: "3px 3px 0 #1A1A1A" }}>{correct} / {total}</div>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.5, margin: "4px 0 8px" }}>{ratio >= 0.7 ? highScoreMessage : lowScoreMessage}</p>
          <button onClick={retry} style={{ padding: "14px 30px", borderRadius: 8, border: "2px solid #1A1A1A", background: "#FDF2E9", color: "#1A1A1A", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", boxShadow: "4px 4px 0 #1A1A1A" }}>
            다시 풀어보기
          </button>
        </div>
      )}
    </div>
  );
}
