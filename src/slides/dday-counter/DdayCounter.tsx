import { useState, useEffect } from "react";
import type { SlideProps } from "../SlideProps";
import { useSlideComplete } from "../useSlideComplete";

interface DdayCounterData {
  eventName: string;
  targetDate: string;
  message: string;
  accentColor: string;
  backgroundColor: string;
}

function pad(n: number) { return n < 10 ? "0" + n : "" + n; }

function calcDiff(targetDate: string) {
  let target = new Date(targetDate + "T00:00:00");
  const now = new Date();
  if (isNaN(target.getTime())) return { days: 0, hrs: 0, mins: 0, secs: 0, dateStr: "" };
  if (target.getTime() <= now.getTime()) {
    target = new Date(target.getFullYear() + 1, target.getMonth(), target.getDate());
  }
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  const dateStr = `${target.getFullYear()}. ${pad(target.getMonth() + 1)}. ${pad(target.getDate())}`;
  return { days, hrs, mins, secs, dateStr };
}

export default function DdayCounter({ data, onComplete, isPreview }: SlideProps<DdayCounterData>) {
  const { eventName, targetDate, message, accentColor, backgroundColor } = data;
  const complete = useSlideComplete(onComplete, isPreview);
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const { days, hrs, mins, secs, dateStr } = calcDiff(targetDate);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", background: backgroundColor, fontFamily: "'Space Grotesk', sans-serif", color: "#1A1A1A", padding: "54px 26px 32px" }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: "0 0 4px" }}>{eventName}까지</p>
      <p style={{ fontSize: 13, color: "#1A1A1A", margin: "0 0 26px", fontWeight: 600, background: "#FFE66D", padding: "4px 12px", borderRadius: 6, border: "2px solid #1A1A1A", boxShadow: "2px 2px 0 #1A1A1A" }}>{dateStr}</p>

      <div style={{ fontSize: 80, fontWeight: 900, color: accentColor, lineHeight: 1, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums", textShadow: "3px 3px 0 #1A1A1A" }}>
        D-{days}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 30 }}>
        {[{ label: "시간", value: pad(hrs) }, { label: "분", value: pad(mins) }, { label: "초", value: pad(secs) }].map((u) => (
          <div key={u.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#FDF2E9", borderRadius: 8, padding: "14px 16px", minWidth: 66, border: "2px solid #1A1A1A", boxShadow: "4px 4px 0 #1A1A1A" }}>
            <span style={{ fontSize: 30, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "#1A1A1A" }}>{u.value}</span>
            <span style={{ fontSize: 11, color: "#1A1A1A", marginTop: 2, fontWeight: 700 }}>{u.label}</span>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: "#1A1A1A", margin: "auto 0 0", textAlign: "center", lineHeight: 1.4, whiteSpace: "pre-line" }}>{message}</p>

      <button onClick={complete} style={{ marginTop: 20, padding: "11px 30px", borderRadius: 8, border: "2px solid #1A1A1A", background: "#4ECDC4", color: "#1A1A1A", fontSize: 14, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer", boxShadow: "4px 4px 0 #1A1A1A" }}>
        다음으로 →
      </button>
    </div>
  );
}
