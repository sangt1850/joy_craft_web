import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";
import { useSlideComplete } from "../useSlideComplete";
import { useSlideTimeout } from "../useSlideTimeout";

interface StoryItem { name: string; caption: string; images: unknown; }
interface PostItem  { user: string; place: string; caption: string; images: unknown; }

interface InstagramData {
  appTitle: string;
  stories: unknown;
  posts: unknown;
  accentColor: string;
}

const AVATAR_BG = [
  "linear-gradient(140deg,#FFB26B,#E94F6A 45%,#A78BCE)",
  "linear-gradient(140deg,#E94F6A,#A78BCE)",
  "linear-gradient(140deg,#7EC8B1,#3a7ec0)",
  "linear-gradient(140deg,#A78BCE,#7FB3E8)",
  "linear-gradient(140deg,#FFD97D,#FFB26B)",
  "linear-gradient(140deg,#F4A7C0,#E94F6A)",
];
const IMG_BG = ["#b5bec9", "#9fb5c9", "#b9c9b5", "#c9b9b5", "#c9c4b5", "#b5b9c9"];

function parseArr<T>(v: unknown, fallback: T[]): T[] {
  if (Array.isArray(v)) return v as T[];
  if (typeof v === "string" && v.trim()) {
    try { const p = JSON.parse(v); if (Array.isArray(p)) return p as T[]; } catch { /* ignore */ }
  }
  return fallback;
}

function parseImages(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((s) => typeof s === "string") as string[];
  return [];
}

const DEFAULT_STORIES: StoryItem[] = [
  { name: "내 스토리", caption: "오늘의 한 컷", images: [] },
  { name: "민지",    caption: "주말 나들이!\n날씨가 너무 좋았어요", images: [] },
  { name: "준호",    caption: "오랜만에 러닝\n5km 완주", images: [] },
  { name: "수빈",    caption: "카페 발견\n여기 디저트 진짜 맛있다", images: [] },
  { name: "해나",    caption: "작업실 정리 완료", images: [] },
  { name: "태윤",    caption: "고양이는 오늘도 평화롭다", images: [] },
];
const DEFAULT_POSTS: PostItem[] = [
  { user: "minji_kim",    place: "성수동",    caption: "주말 성수 나들이\n골목마다 예쁜 카페가 숨어 있어서 하루 종일 걸었어요.", images: [] },
  { user: "junho.log",    place: "양양 해변", caption: "파도 소리 들으면서 아무 생각 없이 앉아 있던 시간", images: [] },
  { user: "subin_daily",  place: "집",        caption: "요즘 빠진 홈카페 세팅\n원두 바꿨더니 확실히 다르네요.", images: [] },
];

export default function Instagram({ data, onComplete, isPreview }: SlideProps<InstagramData>) {
  const { appTitle, accentColor } = data;

  const stories = useMemo(() => parseArr<StoryItem>(data.stories, DEFAULT_STORIES), [data.stories]);
  const posts    = useMemo(() => parseArr<PostItem>(data.posts, DEFAULT_POSTS),     [data.posts]);

  type Screen = "home" | "feed";
  const [screen, setScreen]           = useState<Screen>("home");
  const [storyIdx, setStoryIdx]       = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [postImgIdx, setPostImgIdx]   = useState<Record<number, number>>({});
  const [liked, setLiked]             = useState<Record<number, boolean>>({});
  const [burst, setBurst]             = useState<number | null>(null);
  const [dragPost, setDragPost]       = useState<number | null>(null);
  const [dragDx, setDragDx]           = useState(0);
  const [baseLikes]                   = useState<number[]>(() => posts.map(() => Math.floor(50 + Math.random() * 400)));

  const rafRef        = useRef<number>(0);
  const lastRef       = useRef(0);
  const storyIdxRef   = useRef<number | null>(null);
  const sxRef         = useRef<number | null>(null);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storyDur      = 5;

  const vibe     = useVibrate();
  const complete = useSlideComplete(onComplete, isPreview);
  const later    = useSlideTimeout();

  useEffect(() => { storyIdxRef.current = storyIdx; }, [storyIdx]);
  useEffect(() => () => { cancelAnimationFrame(rafRef.current); }, []);

  const storyLoop = useCallback((t: number) => {
    if (storyIdxRef.current === null) return;
    const dt = (t - lastRef.current) / 1000;
    lastRef.current = t;
    setStoryProgress((prev) => {
      const next = prev + dt / storyDur;
      if (next >= 1) return 1;
      rafRef.current = requestAnimationFrame(storyLoop);
      return next;
    });
  }, []);

  useEffect(() => {
    if (storyProgress < 1 || storyIdx === null) return;
    if (storyIdx >= stories.length - 1) {
      setStoryIdx(null); setStoryProgress(0); storyIdxRef.current = null;
    } else {
      const ni = storyIdx + 1;
      setStoryIdx(ni); setStoryProgress(0); storyIdxRef.current = ni;
      lastRef.current = performance.now();
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(storyLoop);
    }
  }, [storyProgress, storyIdx, stories.length, storyLoop]);

  const openStory = useCallback((i: number) => {
    vibe(10);
    setStoryIdx(i); setStoryProgress(0); storyIdxRef.current = i;
    cancelAnimationFrame(rafRef.current);
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(storyLoop);
  }, [vibe, storyLoop]);

  const closeStory = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setStoryIdx(null); setStoryProgress(0); storyIdxRef.current = null;
  }, []);

  const nextStory = useCallback(() => {
    const i = storyIdxRef.current;
    if (i === null) return;
    if (i >= stories.length - 1) { closeStory(); return; }
    const ni = i + 1;
    setStoryIdx(ni); setStoryProgress(0); storyIdxRef.current = ni;
    cancelAnimationFrame(rafRef.current);
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(storyLoop);
  }, [stories.length, closeStory, storyLoop]);

  const prevStory = useCallback(() => {
    const i = storyIdxRef.current;
    if (i === null) return;
    if (i <= 0) { setStoryProgress(0); lastRef.current = performance.now(); return; }
    const ni = i - 1;
    setStoryIdx(ni); setStoryProgress(0); storyIdxRef.current = ni;
    cancelAnimationFrame(rafRef.current);
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(storyLoop);
  }, [storyLoop]);

  const openApp = useCallback(() => { vibe(12); setScreen("feed"); }, [vibe]);
  const goHome  = useCallback(() => {
    closeStory();
    setScreen("home");
    later(() => complete(), 1000);
  }, [closeStory, later, complete]);

  const idxOf = useCallback((p: number) => postImgIdx[p] ?? 0, [postImgIdx]);
  const goTo  = useCallback((p: number, i: number, imgs: string[]) => {
    const n = Math.max(1, imgs.length || 1);
    const next = Math.max(0, Math.min(n - 1, i));
    if (next !== (postImgIdx[p] ?? 0)) vibe(8);
    setPostImgIdx((prev) => ({ ...prev, [p]: next }));
  }, [postImgIdx, vibe]);

  const onPointerDown = useCallback((p: number, e: React.PointerEvent) => {
    sxRef.current = e.clientX;
    setDragPost(p); setDragDx(0);
  }, []);
  const onPointerMoveHandler = useCallback((p: number, e: React.PointerEvent) => {
    if (dragPost !== p || sxRef.current == null) return;
    const dx = e.clientX - sxRef.current;
    if (Math.abs(dx) > 4) setDragDx(dx);
  }, [dragPost]);
  const onPointerUp = useCallback((p: number, imgs: string[]) => {
    if (dragPost !== p) return;
    const dx = dragDx;
    sxRef.current = null;
    setDragPost(null); setDragDx(0);
    if (dx < -45) goTo(p, idxOf(p) + 1, imgs);
    else if (dx > 45) goTo(p, idxOf(p) - 1, imgs);
  }, [dragPost, dragDx, goTo, idxOf]);

  const toggleLike = useCallback((p: number) => {
    const on = !liked[p];
    vibe(on ? [10, 30] : 8);
    setLiked((prev) => ({ ...prev, [p]: on }));
  }, [liked, vibe]);

  const doubleLike = useCallback((p: number) => {
    vibe([10, 30, 60]);
    setLiked((prev) => ({ ...prev, [p]: true }));
    setBurst(p);
    if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    burstTimerRef.current = setTimeout(() => setBurst(null), 900);
  }, [vibe]);

  const curStory     = storyIdx !== null ? stories[storyIdx] : stories[0];
  const storyImages  = curStory ? parseImages(curStory.images) : [];
  const storyImgIdx  = storyImages.length > 0
    ? Math.min(Math.floor(storyProgress * storyImages.length), storyImages.length - 1)
    : -1;

  return (
    <div style={{ position: "absolute", inset: 0, background: "#000", overflow: "hidden" }}>

      {/* ── 홈 화면 ── */}
      {screen === "home" && (
        <div style={{ position: "absolute", inset: 0, background: "#0d0b12", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22 }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 340, height: 340, borderRadius: "50%", background: `radial-gradient(circle,${accentColor}6a,${accentColor}28 45%,transparent 70%)`, animation: "mo-glow 3.4s ease-in-out infinite", pointerEvents: "none" }} />
          <button
            onClick={openApp}
            style={{ position: "relative", width: 112, height: 112, borderRadius: 28, border: "none", cursor: "pointer", padding: 0, background: "linear-gradient(135deg,#FCAF45 0%,#F77737 25%,#E94F6A 50%,#C13584 70%,#833AB4 100%)", boxShadow: "0 16px 40px rgba(233,79,106,.42)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5.5" />
              <circle cx="12" cy="12" r="4.8" />
              <circle cx="17.5" cy="6.5" r="1.1" fill="#fff" stroke="none" />
            </svg>
          </button>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontStyle: "italic", letterSpacing: "-.01em", margin: 0 }}>{appTitle}</p>
            <p style={{ fontSize: 12, color: "#7a7488", margin: "6px 0 0" }}>아이콘을 눌러 열어보세요</p>
          </div>
        </div>
      )}

      {/* ── 피드 화면 ── */}
      {screen === "feed" && (
        <div style={{ position: "absolute", inset: 0, background: "#fff", display: "flex", flexDirection: "column", animation: "mo-fadein .35s" }}>

          {/* 헤더 */}
          <div style={{ flexShrink: 0, padding: "52px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #efefef", background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <button onClick={goHome} style={{ width: 28, height: 28, borderRadius: 8, border: "none", padding: 0, cursor: "pointer", background: "linear-gradient(135deg,#FCAF45,#E94F6A 50%,#833AB4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5.5" /><circle cx="12" cy="12" r="4.8" />
                </svg>
              </button>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#171719", fontStyle: "italic" }}>{appTitle}</span>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#171719" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" /></svg>
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#171719" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 20.5l1.6-4.9A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z" /></svg>
            </div>
          </div>

          {/* 스크롤 영역 */}
          <div className="ig-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>

            {/* 스토리 행 */}
            <div className="ig-scroll" style={{ display: "flex", gap: 14, padding: "14px 16px", overflowX: "auto", borderBottom: "1px solid #efefef" }}>
              {stories.map((st, i) => {
                const seen     = i === 0 || i >= stories.length - 2;
                const hasImage = parseImages(st.images).length > 0;
                return (
                  <button key={i} onClick={() => openStory(i)} style={{ flexShrink: 0, width: 66, background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 62, height: 62, borderRadius: "50%", padding: 2.5, background: seen ? "#dbdbdb" : "linear-gradient(135deg,#FCAF45,#E94F6A 50%,#833AB4)" }}>
                      <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: "2.5px solid #fff", overflow: "hidden", background: AVATAR_BG[i % AVATAR_BG.length], display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {hasImage
                          ? <img src={parseImages(st.images)[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <span style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{st.name[0]}</span>
                        }
                      </div>
                    </div>
                    <span style={{ fontSize: 10.5, color: seen ? "#8e8e93" : "#171719", width: "100%", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{st.name}</span>
                  </button>
                );
              })}
            </div>

            {/* 게시글 목록 */}
            {posts.map((po, p) => {
              const postImages = parseImages(po.images);
              const n         = Math.max(1, postImages.length);
              const idx       = Math.min(idxOf(p), n - 1);
              const isLiked   = !!liked[p];
              const dragging  = dragPost === p;
              const likeCount = (baseLikes[p] ?? 100) + (isLiked ? 1 : 0);
              const times     = ["3시간 전", "6시간 전", "어제"][p % 3];
              return (
                <div key={p} style={{ borderBottom: "1px solid #efefef", paddingBottom: 6 }}>
                  {/* 게시글 헤더 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px" }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: AVATAR_BG[(p + 1) % AVATAR_BG.length], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                      {postImages.length > 0
                        ? <img src={postImages[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{po.user[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: "#171719", margin: 0 }}>{po.user}</p>
                      {po.place && <p style={{ fontSize: 11.5, color: "#8e8e93", margin: "1px 0 0" }}>{po.place}</p>}
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#171719"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></svg>
                  </div>

                  {/* 이미지 슬라이더 */}
                  <div
                    onPointerDown={(e) => onPointerDown(p, e)}
                    onPointerMove={(e) => onPointerMoveHandler(p, e)}
                    onPointerUp={() => onPointerUp(p, postImages)}
                    onPointerCancel={() => onPointerUp(p, postImages)}
                    onDoubleClick={() => doubleLike(p)}
                    style={{ position: "relative", width: "100%", height: 375, overflow: "hidden", background: IMG_BG[p % IMG_BG.length], touchAction: "pan-y" }}
                  >
                    <div style={{ display: "flex", width: "100%", height: "100%", transform: `translateX(calc(${-idx * 100}% + ${dragging ? dragDx : 0}px))`, transition: dragging ? "none" : "transform .3s cubic-bezier(.25,.9,.3,1)" }}>
                      {postImages.length > 0
                        ? postImages.map((imgUrl, i) => (
                            <div key={i} style={{ flex: "0 0 100%", height: "100%", overflow: "hidden" }}>
                              <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            </div>
                          ))
                        : (
                            <div style={{ flex: "0 0 100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" fill="rgba(255,255,255,.4)" stroke="none" /><path d="M21 15l-5-5L5 21" />
                              </svg>
                            </div>
                          )
                      }
                    </div>
                    {n > 1 && (
                      <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,.6)", color: "#fff", fontSize: 11.5, fontWeight: 700, padding: "4px 9px", borderRadius: 12, pointerEvents: "none" }}>{`${idx + 1}/${n}`}</div>
                    )}
                    {burst === p && (
                      <div style={{ position: "absolute", left: "50%", top: "50%", pointerEvents: "none", animation: "mo-heart .9s ease-out forwards" }}>
                        <svg width="86" height="86" viewBox="0 0 24 24" fill="#fff" style={{ filter: "drop-shadow(0 3px 12px rgba(0,0,0,.5))" }}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" /></svg>
                      </div>
                    )}
                  </div>

                  {/* 액션 바 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 15, padding: "11px 14px 5px" }}>
                    <button onClick={() => toggleLike(p)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" }}>
                      <svg width="25" height="25" viewBox="0 0 24 24" fill={isLiked ? accentColor : "none"} stroke={isLiked ? accentColor : "#171719"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" /></svg>
                    </button>
                    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#171719" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 20.5l1.6-4.9A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z" /></svg>
                    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#171719" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                    <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 5 }}>
                      {n > 1 && Array.from({ length: n }, (_, i) => (
                        <div key={i} style={{ width: i === idx ? 6 : 5, height: i === idx ? 6 : 5, borderRadius: "50%", background: i === idx ? "#3897f0" : "#c7c7cc", transition: "all .2s" }} />
                      ))}
                    </div>
                    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#171719" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                  </div>

                  {/* 좋아요 / 캡션 */}
                  <div style={{ padding: "0 14px 12px" }}>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: "#171719", margin: "0 0 5px" }}>좋아요 {likeCount.toLocaleString("ko-KR")}개</p>
                    <p style={{ fontSize: 13.5, color: "#171719", lineHeight: 1.5, margin: 0, whiteSpace: "pre-line" }}>
                      <span style={{ fontWeight: 700 }}>{po.user}</span>{" "}{po.caption}
                    </p>
                    <p style={{ fontSize: 11.5, color: "#8e8e93", margin: "7px 0 0" }}>{times}</p>
                  </div>
                </div>
              );
            })}
            <div style={{ height: 26 }} />
          </div>

          {/* 하단 탭바 */}
          <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-around", alignItems: "center", padding: "11px 0 22px", borderTop: "1px solid #efefef", background: "#fff" }}>
            <svg width="25" height="25" viewBox="0 0 24 24" fill="#171719"><path d="M12 3l9 8h-2.6v9h-5v-6h-2.8v6h-5v-9H3z" /></svg>
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#171719" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.6-3.6" /></svg>
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#171719" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M12 8v8M8 12h8" /></svg>
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#171719" strokeWidth="1.8" strokeLinecap="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" /></svg>
            <div style={{ width: 25, height: 25, borderRadius: "50%", background: "linear-gradient(135deg,#FCAF45,#E94F6A 50%,#833AB4)", border: "1.5px solid #171719" }} />
          </div>
        </div>
      )}

      {/* ── 스토리 뷰어 ── */}
      {storyIdx !== null && (
        <div style={{ position: "absolute", inset: 0, zIndex: 40, background: "#000", animation: "mo-fadein .25s" }}>
          {/* 배경 — 이미지가 있으면 이미지, 없으면 그라데이션 */}
          {storyImgIdx >= 0
            ? <img
                src={storyImages[storyImgIdx]}
                alt=""
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.92 }}
              />
            : <div style={{ position: "absolute", inset: 0, background: AVATAR_BG[storyIdx % AVATAR_BG.length], opacity: 0.6 }} />
          }

          {/* 상단 어둠 그라데이션 */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 180, background: "linear-gradient(rgba(0,0,0,.65),transparent)", pointerEvents: "none" }} />

          {/* 프로그레스 바 */}
          <div style={{ position: "absolute", top: 48, left: 12, right: 12, display: "flex", gap: 4 }}>
            {stories.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 2.5, borderRadius: 2, background: "rgba(255,255,255,.35)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 2, background: "#fff", width: i < storyIdx ? "100%" : i === storyIdx ? `${storyProgress * 100}%` : "0%" }} />
              </div>
            ))}
          </div>

          {/* 스토리 헤더 */}
          <div style={{ position: "absolute", top: 62, left: 14, right: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: AVATAR_BG[storyIdx % AVATAR_BG.length], display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,.9)", overflow: "hidden", flexShrink: 0 }}>
              {storyImages.length > 0
                ? <img src={storyImages[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{curStory.name[0]}</span>
              }
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{curStory.name}</span>
            <button onClick={closeStory} style={{ marginLeft: "auto", background: "none", border: "none", padding: 6, cursor: "pointer", color: "#fff", fontSize: 22, lineHeight: 1 }}>✕</button>
          </div>

          {/* 이전/다음 탭 영역 */}
          <button onClick={prevStory} style={{ position: "absolute", left: 0, top: 110, bottom: 96, width: "32%", background: "none", border: "none", cursor: "pointer" }} />
          <button onClick={nextStory} style={{ position: "absolute", right: 0, top: 110, bottom: 96, width: "52%", background: "none", border: "none", cursor: "pointer" }} />

          {/* 하단 캡션 */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "26px 16px 30px", background: "linear-gradient(transparent,rgba(0,0,0,.75))", pointerEvents: "none" }}>
            {curStory.caption && (
              <p style={{ fontSize: 16, color: "#fff", lineHeight: 1.5, margin: "0 0 16px", textShadow: "0 2px 10px rgba(0,0,0,.6)", whiteSpace: "pre-line" }}>{curStory.caption}</p>
            )}
            <div style={{ display: "flex", gap: 10, alignItems: "center", pointerEvents: "auto" }}>
              <div style={{ flex: 1, border: "1.5px solid rgba(255,255,255,.6)", borderRadius: 24, padding: "11px 16px", fontSize: 13.5, color: "rgba(255,255,255,.75)" }}>메시지 보내기...</div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" /></svg>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
