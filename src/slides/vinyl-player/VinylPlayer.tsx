import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { SlideProps } from "../SlideProps";

// ──────────────────────────────────────────────────────────
// 타입
// ──────────────────────────────────────────────────────────

interface Track {
  youtubeUrl: string;
  title: string;
}

interface VinylPlayerData {
  tracks: Track[] | string;
  textColor: string;
  backgroundColor: string;
  spinSpeed: number;
  scrollSpeed: number;
}

const DEFAULT_TRACKS: Track[] = [{ youtubeUrl: "", title: "Our Song" }];

// ──────────────────────────────────────────────────────────
// 유틸
// ──────────────────────────────────────────────────────────

function extractVideoId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const patterns = [
    /[?&]v=([^&#/\s]+)/,
    /youtu\.be\/([^?&#/\s]+)/,
    /\/shorts\/([^?&#/\s]+)/,
    /\/embed\/([^?&#/\s]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

function fmtTime(sec: number): string {
  if (!sec || sec <= 0) return "--:--";
  const s = Math.floor(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** hex 색상 → rgba(r,g,b,alpha). 잘못된 형식이면 흰색 폴백 */
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(255,255,255,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

// ──────────────────────────────────────────────────────────
// YouTube IFrame API 전역 타입
// ──────────────────────────────────────────────────────────

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

// ──────────────────────────────────────────────────────────
// 컴포넌트
// ──────────────────────────────────────────────────────────

export default function VinylPlayer({ data }: SlideProps<VinylPlayerData>) {
  const {
    textColor = "#ffffff",
    backgroundColor = "#0d1117",
    spinSpeed = 12,
    scrollSpeed = 12,
  } = data;

  const tracks = useMemo<Track[]>(() => {
    if (Array.isArray(data.tracks)) return data.tracks as Track[];
    try { return JSON.parse(data.tracks as string) as Track[]; }
    catch { return DEFAULT_TRACKS; }
  }, [data.tracks]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [ytDuration, setYtDuration] = useState(0);
  const [queueOpen, setQueueOpen] = useState(false);
  const [thumbLevel, setThumbLevel] = useState<Record<number, number>>({});
  const [fetchedTitles, setFetchedTitles] = useState<Record<string, string>>({});

  // 컨테이너 크기 감지 → 레이아웃 분기
  const rootRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const repeatRef = useRef(repeat);
  const shuffleRef = useRef(shuffle);
  const currentIdxRef = useRef(currentIdx);
  const tracksRef = useRef(tracks);
  repeatRef.current = repeat;
  shuffleRef.current = shuffle;
  currentIdxRef.current = currentIdx;
  tracksRef.current = tracks;

  const safeIdx = Math.min(currentIdx, Math.max(0, tracks.length - 1));
  const currentTrack = tracks[safeIdx] ?? DEFAULT_TRACKS[0];
  const videoId = extractVideoId(currentTrack.youtubeUrl);

  const currentThumbLevel = thumbLevel[safeIdx] ?? 0;
  const thumbnailUrl =
    videoId && currentThumbLevel < 2
      ? currentThumbLevel === 0
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      : null;

  // ── oEmbed 제목 조회 ────────────────────────────────────

  useEffect(() => {
    tracks.forEach((t) => {
      const vid = extractVideoId(t.youtubeUrl);
      if (!vid) return;
      setFetchedTitles((prev) => {
        if (vid in prev) return prev;
        return { ...prev, [vid]: "" };
      });
      fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vid}&format=json`
      )
        .then((r) => r.json())
        .then((d) => {
          if (d.title) setFetchedTitles((prev) => ({ ...prev, [vid]: d.title }));
        })
        .catch(() => {});
    });
  }, [tracks]);

  // ── 프로그레스 타이머 ────────────────────────────────────

  const stopProgressTimer = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const startProgressTimer = useCallback(() => {
    stopProgressTimer();
    progressTimerRef.current = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      try {
        const cur: number = player.getCurrentTime?.() ?? 0;
        const dur: number = player.getDuration?.() ?? 0;
        setCurrentTime(cur);
        setYtDuration(dur);
        if (dur > 0) setProgress(cur / dur);
      } catch { /* player not ready */ }
    }, 500);
  }, [stopProgressTimer]);

  // ── 트랙 전환 ───────────────────────────────────────────

  const goNext = useCallback(() => {
    const ts = tracksRef.current;
    if (ts.length <= 1) {
      playerRef.current?.seekTo(0, true);
      playerRef.current?.playVideo();
      return;
    }
    let next: number;
    if (shuffleRef.current) {
      do { next = Math.floor(Math.random() * ts.length); }
      while (next === currentIdxRef.current && ts.length > 1);
    } else {
      next = (currentIdxRef.current + 1) % ts.length;
    }
    setCurrentIdx(next);
    setProgress(0);
    setCurrentTime(0);
    setYtDuration(0);
  }, []);

  const goPrev = useCallback(() => {
    const ts = tracksRef.current;
    try {
      const cur: number = playerRef.current?.getCurrentTime?.() ?? 0;
      if (cur > 3) {
        playerRef.current?.seekTo(0, true);
        setProgress(0);
        setCurrentTime(0);
        return;
      }
    } catch { /* ignore */ }
    setCurrentIdx((i) => (i - 1 + ts.length) % ts.length);
    setProgress(0);
    setCurrentTime(0);
    setYtDuration(0);
  }, []);

  // ── YouTube 플레이어 생성 ─────────────────────────────────

  const trackKey = `${safeIdx}:${videoId ?? ""}`;

  useEffect(() => {
    const vid = extractVideoId(tracksRef.current[safeIdx]?.youtubeUrl ?? "");
    if (!vid) return;

    let destroyed = false;
    const container = playerContainerRef.current;
    if (!container) return;

    const target = document.createElement("div");
    container.appendChild(target);

    const initPlayer = () => {
      if (destroyed) {
        try { container.removeChild(target); } catch { /* ignore */ }
        return;
      }
      playerRef.current = new window.YT.Player(target, {
        videoId: vid,
        playerVars: { autoplay: 1, controls: 0, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => { if (!destroyed) startProgressTimer(); },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onStateChange: (e: any) => {
            if (destroyed) return;
            const s: number = e.data;
            // PLAYING=1, BUFFERING=3 → LP판 계속 회전
            // PAUSED=2, ENDED=0, UNSTARTED=-1, CUED=5 → 정지
            if (s === 1) {
              setPlaying(true);
              startProgressTimer();
            } else if (s === 2) {
              setPlaying(false);
              stopProgressTimer();
            }
            // buffering(3)은 playing 상태 그대로 유지
            if (s === 0) {
              if (repeatRef.current) {
                playerRef.current?.seekTo(0, true);
                playerRef.current?.playVideo();
              } else {
                goNext();
              }
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); initPlayer(); };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }

    return () => {
      destroyed = true;
      stopProgressTimer();
      setPlaying(false);
      try { playerRef.current?.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
      try { container.removeChild(target); } catch { /* already removed by YT */ }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackKey]);

  // ── 플레이/퍼즈 / 시크 ──────────────────────────────────

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    try {
      const state: number = player.getPlayerState?.() ?? -1;
      if (state === 1) player.pauseVideo();
      else player.playVideo();
    } catch { /* ignore */ }
  }, []);

  const seekTo = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const dur: number = playerRef.current?.getDuration?.() ?? 0;
    if (dur > 0) {
      playerRef.current?.seekTo(ratio * dur, true);
      setProgress(ratio);
    }
  }, []);

  // ── 파생값 & 레이아웃 수치 ────────────────────────────────

  const progressPct = `${(progress * 100).toFixed(2)}%`;
  const noVideo = !videoId;
  const displayDuration = ytDuration > 0 ? fmtTime(ytDuration) : "--:--";
  const titleText =
    currentTrack.title || (videoId ? fetchedTitles[videoId] : "") || "곡 제목 없음";

  const isWide = containerSize.w >= 600;

  // 모바일 스케일 — 390px 기준, 컨테이너 너비에 비례
  const mobileScale = !isWide && containerSize.w > 0 ? containerSize.w / 390 : 1;

  // 디스크 지름 — 컨테이너 크기에 비례, 상하단 여백 고려
  const discSize = Math.max(
    80,
    isWide
      ? Math.min(containerSize.h - 88, Math.floor(containerSize.w * 0.38), 320)
      : Math.min(
          Math.floor(containerSize.w - 60),
          Math.floor(containerSize.h * 0.42),
          Math.round(250 * mobileScale)
        )
  );
  const albumArtSize = Math.max(50, Math.round(discSize * 0.632));
  const holeSize     = Math.max(8,  Math.round(discSize * 0.104));
  const grooveInset  = Math.max(4,  Math.round(discSize * 0.032));

  // ── 공유 JSX 조각 ─────────────────────────────────────────

  const discJsx = (
    <div
      style={{
        position: "relative",
        width: discSize,
        height: discSize,
        borderRadius: "50%",
        background:
          "radial-gradient(circle at 50% 50%, #1c1c1c 0 30%, #191919 30% 100%)",
        boxShadow:
          "0 10px 30px rgba(0,0,0,.6), inset 0 0 0 1px rgba(255,255,255,.04)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {/* 레코드 홈 무늬 */}
      <div
        style={{
          position: "absolute",
          inset: grooveInset,
          borderRadius: "50%",
          background:
            "repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,.035) 0 1px, rgba(0,0,0,0) 1px 4px)",
        }}
      />
      {/* 앨범 아트 */}
      <div
        style={{
          position: "relative",
          width: albumArtSize,
          height: albumArtSize,
          borderRadius: "50%",
          overflow: "hidden",
          boxShadow: "0 0 0 1px rgba(255,255,255,.06)",
          animation: `vp-spin ${spinSpeed}s linear infinite`,
        animationPlayState: playing ? "running" : "paused",
        }}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt="album art"
            onError={() =>
              setThumbLevel((prev) => ({
                ...prev,
                [safeIdx]: (prev[safeIdx] ?? 0) + 1,
              }))
            }
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: `radial-gradient(circle at 50% 50%, ${textColor}33 0%, #1a1a1a 70%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: Math.round(albumArtSize * 0.28),
            }}
          >
            🎵
          </div>
        )}
      </div>
      {/* 중심 구멍 */}
      <div
        style={{
          position: "absolute",
          width: holeSize,
          height: holeSize,
          borderRadius: "50%",
          background: "#0b0b0b",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)",
        }}
      />
    </div>
  );

  const progressBar = (
    <div
      role="slider"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      onPointerDown={seekTo}
      style={{
        position: "relative",
        height: 14,
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 2,
          background: hexToRgba(textColor, 0.2),
          borderRadius: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          width: progressPct,
          height: 2,
          background: textColor,
          borderRadius: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: progressPct,
          width: 9,
          height: 9,
          marginLeft: -4.5,
          borderRadius: "50%",
          background: textColor,
        }}
      />
    </div>
  );

  const timeRow = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: isWide ? 12 : Math.round(9 * mobileScale),
        color: hexToRgba(textColor, 0.5),
        letterSpacing: ".5px",
      }}
    >
      <span>{fmtTime(currentTime)}</span>
      <span>{displayDuration}</span>
    </div>
  );

  const smIcon      = isWide ? 26 : Math.round(20 * mobileScale);
  const lgIcon      = isWide ? 28 : Math.round(22 * mobileScale);
  const playBtnSize = isWide ? 70 : Math.round(56 * mobileScale);
  const ctrlBtnSize = isWide ? 44 : Math.round(34 * mobileScale);

  const controlsRow = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 4px",
      }}
    >
      <CtrlBtn
        onClick={() => setShuffle((s) => !s)}
        color={shuffle ? textColor : hexToRgba(textColor, 0.45)}
        size={ctrlBtnSize}
      >
        <svg width={smIcon} height={smIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 3h5v5" /><path d="M4 20 21 3" />
          <path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" />
        </svg>
      </CtrlBtn>

      <CtrlBtn onClick={goPrev} color={textColor} size={ctrlBtnSize}>
        <svg width={lgIcon} height={lgIcon} viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 5h2v14H7z" /><path d="M20 5v14L9.5 12z" />
        </svg>
      </CtrlBtn>

      <button
        onClick={noVideo ? undefined : togglePlay}
        disabled={noVideo}
        style={{
          width: playBtnSize,
          height: playBtnSize,
          borderRadius: "50%",
          background: noVideo ? hexToRgba(textColor, 0.2) : textColor,
          color: backgroundColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: noVideo ? "not-allowed" : "pointer",
          border: "none",
          flexShrink: 0,
          transition: "transform .15s",
          fontFamily: "inherit",
        }}
        onPointerDown={(e) => {
          if (!noVideo)
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.04)";
        }}
        onPointerUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
      >
        {playing ? (
          <svg width={lgIcon} height={lgIcon} viewBox="0 0 24 24" fill="currentColor">
            <rect x="6.5" y="4.5" width="3.6" height="15" rx="1" />
            <rect x="13.9" y="4.5" width="3.6" height="15" rx="1" />
          </svg>
        ) : (
          <svg width={lgIcon} height={lgIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5l12 7-12 7z" />
          </svg>
        )}
      </button>

      <CtrlBtn onClick={goNext} color={textColor} size={ctrlBtnSize}>
        <svg width={lgIcon} height={lgIcon} viewBox="0 0 24 24" fill="currentColor">
          <path d="M15 5h2v14h-2z" /><path d="M4 5v14l10.5-7z" />
        </svg>
      </CtrlBtn>

      <CtrlBtn
        onClick={() => setRepeat((r) => !r)}
        color={repeat ? textColor : hexToRgba(textColor, 0.45)}
        size={ctrlBtnSize}
      >
        <svg width={smIcon} height={smIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      </CtrlBtn>
    </div>
  );

  const noVideoHint = noVideo ? (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        background: "rgba(255,255,255,.06)",
        fontSize: 10,
        color: hexToRgba(textColor, 0.5),
        textAlign: "center",
        lineHeight: 1.6,
      }}
    >
      에디터에서 YouTube URL을 입력하면<br />
      앨범 아트와 음악이 자동으로 연결돼요.
    </div>
  ) : null;

  // ── 재생목록 패널 (루트 기준 absolute) ──────────────────────

  const queuePanel = (
    <>
      {/* 백드롭 */}
      <div
        onClick={() => setQueueOpen(false)}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,.55)",
          opacity: queueOpen ? 1 : 0,
          pointerEvents: queueOpen ? "auto" : "none",
          transition: "opacity .22s",
          zIndex: 10,
        }}
      />

      {/* 패널 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "78%",
          background: "#1b1b1b",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -18px 40px rgba(0,0,0,.5)",
          transform: queueOpen ? "translateY(0)" : "translateY(104%)",
          transition: "transform .28s cubic-bezier(.2,.8,.25,1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          zIndex: 11,
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px 10px",
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-.2px", color: textColor }}>
              재생목록
            </div>
            <div style={{ fontSize: 9.5, color: hexToRgba(textColor, 0.5), marginTop: 3 }}>
              {tracks.length}곡 · {safeIdx + 1}번째 재생 중
            </div>
          </div>
          <button
            onClick={() => setQueueOpen(false)}
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "rgba(255,255,255,.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: hexToRgba(textColor, 0.7),
              border: "none",
              fontFamily: "inherit",
              transition: "background .15s, color .15s",
            }}
            onPointerEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                hexToRgba(textColor, 0.18);
              (e.currentTarget as HTMLButtonElement).style.color = textColor;
            }}
            onPointerLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,.08)";
              (e.currentTarget as HTMLButtonElement).style.color =
                hexToRgba(textColor, 0.7);
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M5 5l14 14" /><path d="M19 5L5 19" />
            </svg>
          </button>
        </div>

        {/* 트랙 목록 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 10px 16px" }}>
          {tracks.map((t, i) => {
            const isCurrent = i === safeIdx;
            const lenDisplay = isCurrent && ytDuration > 0 ? fmtTime(ytDuration) : "";
            const vid = extractVideoId(t.youtubeUrl);
            const trackTitle =
              t.title || (vid ? fetchedTitles[vid] : "") || "(제목 없음)";
            return (
              <div
                key={i}
                onClick={() => {
                  setCurrentIdx(i);
                  setProgress(0);
                  setCurrentTime(0);
                  setYtDuration(0);
                  setQueueOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 8px",
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "background .14s",
                  background: isCurrent ? "rgba(255,255,255,.06)" : "transparent",
                }}
                onPointerEnter={(e) => {
                  if (!isCurrent)
                    (e.currentTarget as HTMLDivElement).style.background =
                      "rgba(255,255,255,.07)";
                }}
                onPointerLeave={(e) => {
                  if (!isCurrent)
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                }}
              >
                <div
                  style={{
                    width: 18,
                    textAlign: "right",
                    fontSize: 9.5,
                    color: isCurrent ? textColor : hexToRgba(textColor, 0.4),
                    flexShrink: 0,
                  }}
                >
                  {isCurrent ? "▶" : String(i + 1)}
                </div>
                <OverflowMarquee
                  animDuration={scrollSpeed}
                  containerStyle={{ minWidth: 0, flex: 1 }}
                  spanStyle={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isCurrent ? textColor : hexToRgba(textColor, 0.85),
                  }}
                >
                  {trackTitle}
                </OverflowMarquee>
                <div
                  style={{
                    fontSize: 9,
                    color: hexToRgba(textColor, 0.4),
                    flexShrink: 0,
                  }}
                >
                  {lenDisplay}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  // ──────────────────────────────────────────────────────────
  // 렌더
  // ──────────────────────────────────────────────────────────

  return (
    <div
      ref={rootRef}
      style={{
        position: "absolute",
        inset: 0,
        background: backgroundColor,
        fontFamily: "'Noto Sans KR', 'Noto Sans', sans-serif",
        color: textColor,
        overflow: "hidden",
      }}
    >
      {/* 숨겨진 YouTube 플레이어 */}
      <div
        ref={playerContainerRef}
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          opacity: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
      />

      {/* 앰비언트 글로우 — 디스크 뒤 textColor 기반 */}
      {videoId && (
        <div
          style={{
            position: "absolute",
            pointerEvents: "none",
            ...(isWide
              ? {
                  left: "0%",
                  top: "50%",
                  width: "55%",
                  height: "140%",
                  transform: "translateY(-50%)",
                  background: `radial-gradient(ellipse at 55% 50%, ${textColor}1a 0%, transparent 65%)`,
                }
              : {
                  left: "50%",
                  top: "38%",
                  width: "100%",
                  height: "70%",
                  transform: "translate(-50%, -50%)",
                  background: `radial-gradient(ellipse at 50% 50%, ${textColor}14 0%, transparent 65%)`,
                }),
          }}
        />
      )}

      {isWide ? (
        /* ═══════════════════════════════════════════════════
           PC 와이드 — 좌: 디스크  /  우: 정보 + 컨트롤
           ═══════════════════════════════════════════════════ */
        <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
          {/* 좌측 — 디스크 */}
          <div
            style={{
              flex: "0 0 48%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 0 40px 56px",
            }}
          >
            {discJsx}
          </div>

          {/* 우측 — 정보 + 컨트롤 */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "40px 56px 40px 44px",
              minWidth: 0,
            }}
          >
            {/* NOW PLAYING + 재생목록 버튼 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 28,
              }}
            >
              <span
                style={{ fontSize: 12, letterSpacing: 1.6, color: hexToRgba(textColor, 0.5) }}
              >
                NOW PLAYING
              </span>
              <QueueBtn onClick={() => setQueueOpen(true)} count={tracks.length} textColor={textColor} />
            </div>

            {/* 곡 제목 */}
            <OverflowMarquee
              animDuration={scrollSpeed}
              containerStyle={{ marginBottom: 32 }}
              spanStyle={{ fontSize: 32, fontWeight: 700, letterSpacing: "-.5px" }}
            >
              {titleText}
            </OverflowMarquee>

            {/* 프로그레스 */}
            <div style={{ marginBottom: 8 }}>{progressBar}</div>

            {/* 시간 */}
            <div style={{ marginBottom: 32 }}>{timeRow}</div>

            {/* 컨트롤 */}
            {controlsRow}

            {noVideo && <div style={{ marginTop: 24 }}>{noVideoHint}</div>}
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════
           내로우 — 세로 스택, 컨테이너 전체 채움
           ═══════════════════════════════════════════════════ */
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            padding: "22px 20px 48px",
            boxSizing: "border-box",
          }}
        >
          {/* 상단 바 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: 26,
              flexShrink: 0,
            }}
          >
            <div
              style={{ fontSize: Math.round(9.5 * mobileScale), letterSpacing: 1.6, color: hexToRgba(textColor, 0.5) }}
            >
              NOW PLAYING
            </div>
            <QueueBtn onClick={() => setQueueOpen(true)} count={tracks.length} textColor={textColor} />
          </div>

          {/* 디스크 (남은 세로 공간 채움) */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 0,
              padding: "12px 0",
            }}
          >
            {discJsx}
          </div>

          {/* 곡 제목 */}
          <OverflowMarquee
            animDuration={scrollSpeed}
            containerStyle={{ marginBottom: Math.round(16 * mobileScale), flexShrink: 0 }}
            spanStyle={{ fontSize: Math.round(17 * mobileScale), fontWeight: 700, letterSpacing: "-.3px" }}
          >
            {titleText}
          </OverflowMarquee>

          {/* 프로그레스 */}
          <div style={{ marginBottom: Math.round(8 * mobileScale), flexShrink: 0 }}>{progressBar}</div>

          {/* 시간 */}
          <div style={{ marginBottom: Math.round(20 * mobileScale), flexShrink: 0 }}>{timeRow}</div>

          {/* 컨트롤 */}
          <div style={{ flexShrink: 0 }}>{controlsRow}</div>

          {noVideo && <div style={{ marginTop: 14, flexShrink: 0 }}>{noVideoHint}</div>}
        </div>
      )}

      {/* 재생목록 패널 */}
      {queuePanel}

      <style>{`
        @keyframes vp-spin { to { transform: rotate(360deg); } }
        @keyframes vp-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// 서브 컴포넌트
// ──────────────────────────────────────────────────────────

function OverflowMarquee({
  children,
  animDuration,
  containerStyle,
  spanStyle,
}: {
  children: string;
  animDuration: number;
  containerStyle?: React.CSSProperties;
  spanStyle?: React.CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const check = () => {
      const c = containerRef.current;
      const s = measureRef.current;
      if (c && s) setOverflow(s.scrollWidth > c.clientWidth);
    };
    check();
    const ro = new ResizeObserver(check);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [children]);

  return (
    <div ref={containerRef} style={{ overflow: "hidden", position: "relative", ...containerStyle }}>
      {/* 텍스트 폭 측정용 — 항상 존재, 화면에 보이지 않음 */}
      <span
        ref={measureRef}
        style={{
          whiteSpace: "nowrap",
          visibility: "hidden",
          position: "absolute",
          pointerEvents: "none",
          ...spanStyle,
        }}
      >
        {children}
      </span>

      {overflow ? (
        /* seamless 루프: 텍스트 두 벌 → translateX(-50%) 무한 반복 */
        /* key: animDuration이 바뀌면 span을 리마운트해 CSS 애니메이션을 즉시 재시작 */
        <span
          key={animDuration}
          style={{
            whiteSpace: "nowrap",
            display: "inline-flex",
            gap: "3em",
            animation: `vp-marquee ${animDuration}s linear infinite`,
            ...spanStyle,
          }}
        >
          <span>{children}</span>
          <span>{children}</span>
        </span>
      ) : (
        <span style={{ whiteSpace: "nowrap", display: "inline-block", ...spanStyle }}>
          {children}
        </span>
      )}
    </div>
  );
}

function QueueBtn({ onClick, count, textColor }: { onClick: () => void; count: number; textColor: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        height: 26,
        padding: "0 10px",
        borderRadius: 13,
        background: hexToRgba(textColor, 0.07),
        color: hexToRgba(textColor, 0.72),
        cursor: "pointer",
        border: "none",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: ".4px",
        fontFamily: "inherit",
        transition: "background .15s, color .15s",
      }}
      onPointerEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = hexToRgba(textColor, 0.16);
        (e.currentTarget as HTMLButtonElement).style.color = textColor;
      }}
      onPointerLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = hexToRgba(textColor, 0.07);
        (e.currentTarget as HTMLButtonElement).style.color = hexToRgba(textColor, 0.72);
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 6h11" /><path d="M4 12h11" /><path d="M4 18h7" />
        <path d="M19 10v8" /><circle cx="17" cy="18" r="2" />
      </svg>
      <span>{count}</span>
    </button>
  );
}

function CtrlBtn({
  children,
  onClick,
  color,
  size = 34,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  color: string;
  size?: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color,
        background: "transparent",
        border: "none",
        borderRadius: 8,
        padding: 0,
        transition: "opacity .15s",
        flexShrink: 0,
        fontFamily: "inherit",
      }}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLButtonElement).style.opacity = ".6";
      }}
      onPointerUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.opacity = "1";
      }}
    >
      {children}
    </button>
  );
}
