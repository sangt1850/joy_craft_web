import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import type {CSSProperties, PointerEvent as ReactPointerEvent, ReactNode} from "react";
import type {SlideProps} from "../SlideProps";
import {useVibrate} from "../useVibrate";
import {useSlideComplete} from "../useSlideComplete";
import {useSlideTimeout} from "../useSlideTimeout";
import "./instagram.css";
import "../slide-animations.css";

interface StoryItem {
    name: string;
    caption: string;
    images: string[];
}

interface PostItem {
    user: string;
    place: string;
    caption: string;
    images: string[];
}

export interface InstagramData {
    appTitle: string;
    stories: unknown;
    posts: unknown;
    accentColor: string;
}

type IconName =
    "camera"
    | "heart"
    | "comment"
    | "send"
    | "bookmark"
    | "home"
    | "search"
    | "reels"
    | "plus"
    | "close"
    | "more"
    | "down"
    | "left"
    | "right"
    | "pause"
    | "play"
    | "check";
const PATHS: Partial<Record<IconName, ReactNode>> = {
    camera: <>
        <rect x="3" y="3" width="18" height="18" rx="5"/>
        <circle cx="12" cy="12" r="4.2"/>
        <circle cx="17.5" cy="6.5" r=".9" fill="currentColor" stroke="none"/>
    </>,
    heart: <path
        d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z"/>,
    comment: <path d="M21 11.5a9 9 0 1 0-5 8L21 21l-1.5-5a9 9 0 0 0 1.5-4.5Z"/>,
    send: <>
        <path d="m22 3-8 19-4-9-9-4 21-6Z"/>
        <path d="m10 13 12-10"/>
    </>,
    bookmark: <path d="M5 3h14v18l-7-5-7 5V3Z"/>,
    home: <path d="m3 10 9-8 9 8v11h-6v-7H9v7H3V10Z"/>,
    search: <>
        <circle cx="10.8" cy="10.8" r="7.5"/>
        <path d="m16.3 16.3 5 5"/>
    </>,
    reels: <>
        <rect x="3" y="3" width="18" height="18" rx="4"/>
        <path d="M3 8h18M7 3l4 5m3-5 4 5"/>
        <path d="m10 11 5 3-5 3Z"/>
    </>,
    plus: <path d="M12 4v16M4 12h16"/>,
    close: <path d="m5 5 14 14M19 5 5 19"/>,
    more: <>
        <circle cx="5" cy="12" r="1" fill="currentColor"/>
        <circle cx="12" cy="12" r="1" fill="currentColor"/>
        <circle cx="19" cy="12" r="1" fill="currentColor"/>
    </>,
    down: <path d="m7 10 5 5 5-5"/>,
    left: <path d="m15 5-7 7 7 7"/>,
    right: <path d="m9 5 7 7-7 7"/>,
    pause: <>
        <path d="M9 5v14M15 5v14" strokeWidth="3"/>
    </>,
    play: <path d="m8 4 12 8-12 8Z"/>,
    check: <path d="m5 12 4 4L19 6"/>,
};

function Icon({name, size = 24, filled = false}: { name: IconName; size?: number; filled?: boolean }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"}
                stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true">{PATHS[name]}</svg>;
}

function IconButton({name, label, onClick, active, size = 24, className = ""}: {
    name: IconName;
    label: string;
    onClick: () => void;
    active?: boolean;
    size?: number;
    className?: string
}) {
    return <button type="button" className={`jc-ig-icon ${className}`} aria-label={label} aria-pressed={active}
                   onClick={onClick}><Icon name={name} size={size} filled={active}/></button>;
}

const RING = "linear-gradient(35deg,#ffd776 4%,#fb8532 24%,#ee2a7b 52%,#b92bba 76%,#6545d8 100%)";
const BACKGROUNDS = ["#ad8976", "#839b92", "#9b94ac", "#9aafb8", "#b6a185", "#b68f98"];
const DEFAULT_STORIES: StoryItem[] = [
    {name: "내 스토리", caption: "오늘의 한 컷", images: []},
    {name: "민지", caption: "주말 나들이!\n날씨가 너무 좋았어요", images: []},
    {name: "준호", caption: "오랜만에 러닝\n5km 완주", images: []},
    {name: "수빈", caption: "카페 발견\n여기 디저트 진짜 맛있다", images: []},
    {name: "해나", caption: "작업실 정리 완료", images: []},
    {name: "태윤", caption: "고양이는 오늘도 평화롭다", images: []},
];
const DEFAULT_POSTS: PostItem[] = [
    {user: "minji_kim", place: "성수동", caption: "주말 성수 나들이\n골목마다 예쁜 카페가 숨어 있어서 하루 종일 걸었어요.", images: []},
    {user: "junho.log", place: "양양 해변", caption: "파도 소리 들으면서 아무 생각 없이 앉아 있던 시간", images: []},
    {user: "subin_daily", place: "집", caption: "요즘 빠진 홈카페 세팅\n원두 바꿨더니 확실히 다르네요.", images: []},
];

function parseArray(value: unknown): unknown[] | null {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
        try {
            const parsed: unknown = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : null;
        } catch {
            return null;
        }
    }
    return null;
}

function record(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function string(value: unknown, fallback = ""): string {
    return typeof value === "string" ? value : fallback;
}

function parseImages(value: unknown): string[] {
    return (parseArray(value) ?? []).filter((v): v is string => typeof v === "string" && !!v.trim());
}

function Photo({src, alt = "", className = "", style, onReady}: {
    src?: string;
    alt?: string;
    className?: string;
    style?: CSSProperties;
    onReady?: () => void
}) {
    const [failed, setFailed] = useState(false);
    useEffect(() => setFailed(false), [src]);
    return src && !failed ?
        <img className={className} src={src} alt={alt} draggable={false} style={style} onLoad={onReady} onError={() => {
            setFailed(true);
            onReady?.();
        }}/> :
        <span className={`jc-ig-placeholder ${className}`} style={style} role="img" aria-label={alt || "이미지 없음"}><Icon
            name="camera" size={32}/></span>;
}

function Avatar({name, image, index = 0, size = 32}: { name: string; image?: string; index?: number; size?: number }) {
    return <span className="jc-ig-avatar"
                 style={{width: size, height: size, background: BACKGROUNDS[index % BACKGROUNDS.length]}}>{image ?
        <Photo src={image} alt={`${name} 프로필`}/> : <span>{name.charAt(0).toUpperCase() || "·"}</span>}</span>;
}

/** Local dialog: focus stays inside the slide, and returns to its opener on close. */
function Sheet({title, children, onClose}: { title: string; children: ReactNode; onClose: () => void }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        ref.current?.focus();
        return () => {
            if (previous?.isConnected) previous.focus();
        };
    }, []);
    return <div className="jc-ig-sheet-backdrop" onClick={onClose}>
        <div ref={ref} className="jc-ig-sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
             onClick={e => e.stopPropagation()} onKeyDown={e => {
            e.stopPropagation();
            if (e.key === "Escape") onClose();
            if (e.key === "Tab") {
                const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('button, input, textarea, [tabindex="0"]') ?? []);
                const first = items[0], last = items[items.length - 1];
                if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
                    e.preventDefault();
                    last?.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first?.focus();
                }
            }
        }}>
            <span className="jc-ig-sheet-handle"/>
            <header><strong>{title}</strong><IconButton name="close" label="닫기" onClick={onClose} size={20}/></header>
            <div className="jc-ig-sheet-content">{children}</div>
        </div>
    </div>;
}

function Post({post, index, accent, liked, saved, onLike, onSave, onShare, height}: {
    post: PostItem;
    index: number;
    accent: string;
    liked: boolean;
    saved: boolean;
    onLike: (value: boolean) => void;
    onSave: () => void;
    onShare: () => void;
    height: number
}) {
    const [imageIndex, setImageIndex] = useState(0);
    const [dx, setDx] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [burst, setBurst] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [panel, setPanel] = useState<"comments" | "menu" | null>(null);
    const [comments, setComments] = useState<string[]>([]);
    const [comment, setComment] = useState("");
    const gesture = useRef<{
        id: number;
        x: number;
        y: number;
        dx: number;
        horizontal: boolean;
        started: number
    } | null>(null);
    const lastTap = useRef(0);
    const burstTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const total = Math.max(1, post.images.length);
    const current = Math.min(imageIndex, total - 1);
    useEffect(() => () => {
        if (burstTimer.current) clearTimeout(burstTimer.current);
    }, []);
    const showHeart = () => {
        onLike(true);
        setBurst(true);
        if (burstTimer.current) clearTimeout(burstTimer.current);
        burstTimer.current = setTimeout(() => setBurst(false), 850);
    };
    const move = (direction: number) => setImageIndex(Math.max(0, Math.min(total - 1, current + direction)));
    const release = (e: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
        const g = gesture.current;
        if (!g || g.id !== e.pointerId) return;
        gesture.current = null;
        setDragging(false);
        setDx(0);
        if (cancelled) {
            lastTap.current = 0;
            return;
        }
        if (g.horizontal && Math.abs(g.dx) > 40) move(g.dx < 0 ? 1 : -1);
        const tap = Math.abs(e.clientX - g.x) < 8 && Math.abs(e.clientY - g.y) < 8 && performance.now() - g.started < 300;
        if (tap) {
            const now = performance.now();
            if (lastTap.current && now - lastTap.current < 320) {
                showHeart();
                lastTap.current = 0;
            } else lastTap.current = now;
        } else lastTap.current = 0;
    };
    return <article className="jc-ig-post">
        <header className="jc-ig-post-header">
            <span className="jc-ig-mini-ring" style={{background: RING}}><Avatar name={post.user} image={post.images[0]}
                                                                                 index={index} size={32}/></span>
            <div className="jc-ig-user"><strong>{post.user}</strong>{post.place && <span>{post.place}</span>}</div>
            <IconButton name="more" label={`${post.user} 게시물 메뉴`} onClick={() => setPanel("menu")} size={22}/>
        </header>
        <div className="jc-ig-media" role="group" aria-label={`${post.user} 사진 ${current + 1}/${total}`} tabIndex={0}
             style={{maxHeight: Math.max(220, height * .64), background: BACKGROUNDS[index % BACKGROUNDS.length]}}
             onKeyDown={e => {
                 if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                     e.preventDefault();
                     e.stopPropagation();
                     move(e.key === "ArrowLeft" ? -1 : 1);
                 }
             }}
             onPointerDown={e => {
                 if (!e.isPrimary || e.button !== 0) return;
                 gesture.current = {
                     id: e.pointerId,
                     x: e.clientX,
                     y: e.clientY,
                     dx: 0,
                     horizontal: false,
                     started: performance.now()
                 };
             }}
             onPointerMove={e => {
                 const g = gesture.current;
                 if (!g || g.id !== e.pointerId) return;
                 const x = e.clientX - g.x, y = e.clientY - g.y;
                 if (!g.horizontal && Math.abs(y) > Math.max(8, Math.abs(x))) {
                     gesture.current = null;
                     return;
                 }
                 if (!g.horizontal && Math.abs(x) > 8) {
                     g.horizontal = true;
                     setDragging(true);
                     try {
                         e.currentTarget.setPointerCapture(e.pointerId);
                     } catch { /* detached preview */
                     }
                 }
                 g.dx = x;
                 if (g.horizontal) setDx((current === 0 && x > 0) || (current === total - 1 && x < 0) ? x * .2 : x);
             }}
             onPointerUp={e => release(e)} onPointerCancel={e => release(e, true)}
             onLostPointerCapture={e => release(e, true)}
             onPointerLeave={e => {
                 if (gesture.current && !gesture.current.horizontal) release(e, true);
             }}>
            <div className="jc-ig-track" style={{
                transform: `translateX(calc(${-current * 100}% + ${dx}px))`,
                transition: dragging ? "none" : "transform 300ms cubic-bezier(.22,.8,.25,1)"
            }}>
                {(post.images.length ? post.images : [""]).map((src, i) => <Photo key={`${i}:${src}`} src={src}
                                                                                  alt={`${post.user} 게시물 사진 ${i + 1}`}
                                                                                  className="jc-ig-post-photo"/>)}
            </div>
            {total > 1 && <span className="jc-ig-count">{current + 1}/{total}</span>}
            {current > 0 && <button className="jc-ig-media-arrow jc-ig-media-prev" aria-label="이전 사진"
                                    onPointerDown={e => e.stopPropagation()} onClick={() => move(-1)}><Icon name="left"
                                                                                                            size={17}/>
            </button>}
            {current < total - 1 && <button className="jc-ig-media-arrow jc-ig-media-next" aria-label="다음 사진"
                                            onPointerDown={e => e.stopPropagation()} onClick={() => move(1)}><Icon
                name="right" size={17}/></button>}
            {burst && <span className="jc-ig-heart-burst"><Icon name="heart" size={92} filled/></span>}
        </div>
        <div className="jc-ig-actions">
            <div className="jc-ig-action-group"><span style={{color: liked ? accent : undefined}}><IconButton
                name="heart" label={liked ? "좋아요 취소" : "좋아요"} active={liked}
                onClick={() => onLike(!liked)}/></span><IconButton name="comment" label="댓글 보기"
                                                                   onClick={() => setPanel("comments")}/><IconButton
                name="send" label="게시물 문구 복사" onClick={onShare}/></div>
            {total > 1 &&
                <div className="jc-ig-dots" aria-label="사진 선택">{Array.from({length: total}, (_, i) => <button key={i}
                                                                                                              aria-label={`${i + 1}번째 사진`}
                                                                                                              aria-current={i === current ? "true" : undefined}
                                                                                                              onClick={() => setImageIndex(i)}>
                    <span style={{background: i === current ? "#0095f6" : "#d6d6d6"}}/></button>)}</div>}
            <IconButton name="bookmark" label={saved ? "저장 취소" : "게시물 저장"} active={saved} onClick={onSave}/>
        </div>
        <div className="jc-ig-post-body">
            <p className="jc-ig-like-count">좋아요 {(128 + index * 137 + (liked ? 1 : 0)).toLocaleString("ko-KR")}개</p>
            <p className={expanded ? "jc-ig-caption" : "jc-ig-caption jc-ig-caption-clamp"}>
                <strong>{post.user}</strong>{" "}{post.caption}</p>
            {!expanded && (post.caption.length > 60 || post.caption.split("\n").length > 2) &&
                <button className="jc-ig-text-button" onClick={() => setExpanded(true)}>더 보기</button>}
            <button className="jc-ig-text-button jc-ig-comments-link"
                    onClick={() => setPanel("comments")}>{comments.length ? `댓글 ${comments.length}개 모두 보기` : "댓글 달기…"}</button>
            <span className="jc-ig-time">{["3시간 전", "6시간 전", "어제"][index % 3]}</span>
        </div>
        {panel && <Sheet title={panel === "comments" ? "댓글" : "게시물"} onClose={() => setPanel(null)}>
            {panel === "menu" ? <>
                <button className="jc-ig-menu-row" onClick={() => {
                    onSave();
                    setPanel(null);
                }}><Icon name="bookmark"/>{saved ? "저장 취소" : "저장"}</button>
                <button className="jc-ig-menu-row" onClick={() => {
                    onShare();
                    setPanel(null);
                }}><Icon name="send"/>문구 복사
                </button>
            </> : <>
                <p className="jc-ig-sheet-caption"><strong>{post.user}</strong> {post.caption}</p>
                {comments.length ? comments.map((text, i) => <p className="jc-ig-local-comment" key={i}>
                        <strong>나</strong> {text}</p>) :
                    <div className="jc-ig-empty"><Icon name="comment" size={36}/><strong>첫 댓글을 남겨보세요</strong></div>}
                <form className="jc-ig-reply-form" onSubmit={e => {
                    e.preventDefault();
                    if (comment.trim()) {
                        setComments(prev => [...prev, comment.trim()]);
                        setComment("");
                    }
                }}><input aria-label="댓글 입력" placeholder="댓글 달기…" maxLength={500} value={comment}
                          onChange={e => setComment(e.target.value)}/>
                    <button disabled={!comment.trim()}>게시</button>
                </form>
                <p className="jc-ig-local-note">댓글은 이 화면에서만 표시돼요.</p>
            </>}
        </Sheet>}
    </article>;
}

function StoryViewer({stories, start, onClose, onSeen, accent}: {
    stories: StoryItem[];
    start: number;
    onClose: () => void;
    onSeen: (index: number) => void;
    accent: string
}) {
    const [userIndex, setUserIndex] = useState(start);
    const [frame, setFrame] = useState(0);
    const [progress, setProgress] = useState(0);
    const [paused, setPaused] = useState(false);
    const [holding, setHolding] = useState(false);
    const [hidden, setHidden] = useState(document.hidden);
    const [sheet, setSheet] = useState<"caption" | "reply" | null>(null);
    const [liked, setLiked] = useState<Record<number, boolean>>({});
    const [reply, setReply] = useState("");
    const [replied, setReplied] = useState(false);
    const [readyImage, setReadyImage] = useState<string | null>(null);
    const elapsed = useRef(0);
    const press = useRef<{ id: number; x: number; y: number; time: number } | null>(null);
    const ref = useRef<HTMLDivElement>(null);
    const current = stories[userIndex];
    const count = Math.max(1, current?.images.length ?? 0);
    const currentFrame = Math.min(frame, count - 1);
    const currentImage = current?.images[currentFrame];
    const loadingImage = !!currentImage && readyImage !== currentImage;
    const onSeenRef = useRef(onSeen);
    onSeenRef.current = onSeen;
    const reset = useCallback(() => {
        elapsed.current = 0;
        setProgress(0);
    }, []);
    const next = useCallback(() => {
        reset();
        if (currentFrame < count - 1) setFrame(currentFrame + 1);
        else if (userIndex < stories.length - 1) {
            setUserIndex(userIndex + 1);
            setFrame(0);
        } else onClose();
    }, [count, currentFrame, onClose, reset, stories.length, userIndex]);
    const previous = () => {
        reset();
        if (currentFrame > 0) setFrame(currentFrame - 1);
        else if (userIndex > 0) {
            setUserIndex(userIndex - 1);
            setFrame(Math.max(0, stories[userIndex - 1].images.length - 1));
        }
    };
    useEffect(() => {
        const previousElement = document.activeElement as HTMLElement | null;
        ref.current?.focus();
        const visibility = () => {
            setHidden(document.hidden);
            setHolding(false);
            press.current = null;
        };
        document.addEventListener("visibilitychange", visibility);
        return () => {
            document.removeEventListener("visibilitychange", visibility);
            if (previousElement?.isConnected) previousElement.focus();
        };
    }, []);
    useEffect(() => {
        if (!current) onClose();
    }, [current, onClose]);
    useEffect(() => {
        onSeenRef.current(userIndex);
        reset();
    }, [userIndex, currentFrame, reset]);
    useEffect(() => {
        if (!current || paused || holding || hidden || sheet || loadingImage) return;
        let raf = 0, last = performance.now();
        const tick = (now: number) => {
            elapsed.current += Math.min(now - last, 100);
            last = now;
            const value = Math.min(1, elapsed.current / 5000);
            setProgress(value);
            if (value >= 1) next(); else raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [current, userIndex, currentFrame, paused, holding, hidden, sheet, loadingImage, next]);
    if (!current) return null;
    return <div className="jc-ig-story-viewer" ref={ref} tabIndex={-1} role="dialog" aria-modal="true"
                aria-label={`${current.name} 스토리`} onKeyDown={e => {
        if (sheet) return;
        if (["Escape", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") previous();
            if (e.key === "ArrowRight") next();
            if (e.key === " ") setPaused(v => !v);
        }
        if (e.key === "Tab") {
            const items = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
            if (e.shiftKey && (document.activeElement === items[0] || document.activeElement === ref.current)) {
                e.preventDefault();
                items[items.length - 1]?.focus();
            } else if (!e.shiftKey && document.activeElement === items[items.length - 1]) {
                e.preventDefault();
                items[0]?.focus();
            }
        }
    }}>
        <div className="jc-ig-story-media"
             style={{background: current.images.length ? "#111" : `linear-gradient(155deg,${BACKGROUNDS[userIndex % BACKGROUNDS.length]},#342b3e)`}}>
            {current.images.length > 0 &&
                <Photo src={current.images[currentFrame]} alt={`${current.name} 스토리 사진 ${currentFrame + 1}`}
                       className="jc-ig-story-photo" onReady={() => setReadyImage(currentImage ?? null)}/>}
            <div className="jc-ig-story-shade"/>
            <div className="jc-ig-story-tap" aria-hidden="true" onPointerDown={e => {
                if (!e.isPrimary || e.button !== 0) return;
                press.current = {id: e.pointerId, x: e.clientX, y: e.clientY, time: performance.now()};
                setHolding(true);
                try {
                    e.currentTarget.setPointerCapture(e.pointerId);
                } catch { /* detached preview */
                }
            }} onPointerUp={e => {
                const p = press.current;
                press.current = null;
                setHolding(false);
                if (!p || p.id !== e.pointerId) return;
                if (performance.now() - p.time < 250 && Math.abs(e.clientX - p.x) < 12 && Math.abs(e.clientY - p.y) < 12) {
                    const box = e.currentTarget.getBoundingClientRect();
                    if (e.clientX - box.left < box.width * .35) previous(); else next();
                }
            }} onPointerCancel={() => {
                press.current = null;
                setHolding(false);
            }} onLostPointerCapture={() => {
                press.current = null;
                setHolding(false);
            }}/>
            <div className="jc-ig-story-top">
                <div className="jc-ig-progress"
                     aria-label={`사진 ${currentFrame + 1}/${count}`}>{Array.from({length: count}, (_, i) => <span
                    key={i}><i
                    style={{transform: `scaleX(${i < currentFrame ? 1 : i === currentFrame ? progress : 0})`}}/></span>)}</div>
                <header className="jc-ig-story-header"><Avatar name={current.name} image={current.images[0]}
                                                               index={userIndex}
                                                               size={32}/><strong>{current.name}</strong><span>3시간</span>
                    <div className="jc-ig-story-controls"><IconButton name={paused ? "play" : "pause"}
                                                                      label={paused ? "스토리 재생" : "스토리 일시정지"}
                                                                      onClick={() => setPaused(v => !v)}
                                                                      size={19}/><IconButton name="more"
                                                                                             label="스토리 문구 보기"
                                                                                             onClick={() => setSheet("caption")}
                                                                                             size={21}/><IconButton
                        name="close" label="스토리 닫기" onClick={onClose} size={26}/></div>
                </header>
            </div>
            {current.caption &&
                <button className="jc-ig-story-caption" onClick={() => setSheet("caption")}>{current.caption}</button>}
            <button className="jc-ig-sr" onClick={previous}>이전 스토리 사진</button>
            <button className="jc-ig-sr" onClick={next}>다음 스토리 사진</button>
        </div>
        <footer className="jc-ig-story-footer">
            <button className="jc-ig-message" onClick={() => {
                setReplied(false);
                setSheet("reply");
            }}>메시지 보내기…
            </button>
            <span style={{color: liked[userIndex] ? accent : "#fff"}}><IconButton name="heart" label="스토리 좋아요"
                                                                                  active={!!liked[userIndex]}
                                                                                  onClick={() => setLiked(v => ({
                                                                                      ...v,
                                                                                      [userIndex]: !v[userIndex]
                                                                                  }))} size={25}/></span><IconButton
            name="send" label="스토리 답장 작성" onClick={() => {
            setReplied(false);
            setSheet("reply");
        }} size={24}/></footer>
        {sheet &&
            <Sheet title={sheet === "caption" ? "스토리 문구" : `${current.name}님에게 답장`} onClose={() => setSheet(null)}>
                {sheet === "caption" ?
                    <p className="jc-ig-sheet-caption">{current.caption || "등록된 문구가 없어요."}</p> : replied ?
                        <div className="jc-ig-empty"><Icon name="check" size={36}/><strong>답장을 남겼어요</strong><p>이 화면에서만
                            표시되는 메시지예요.</p></div> : <form onSubmit={e => {
                            e.preventDefault();
                            if (reply.trim()) {
                                setReply("");
                                setReplied(true);
                            }
                        }}><textarea aria-label="스토리 답장" value={reply} onChange={e => setReply(e.target.value)}
                                     placeholder="메시지를 입력하세요…" maxLength={500} rows={3}/>
                            <button className="jc-ig-primary" disabled={!reply.trim()}>답장 남기기</button>
                            <p className="jc-ig-local-note">실제 인스타그램으로 전송되지 않아요.</p></form>}
            </Sheet>}
    </div>;
}

export default function Instagram({data, onComplete, isPreview}: SlideProps<InstagramData>) {
    const appTitle = data.appTitle || "Instagram", accent = data.accentColor || "#ff3040";
    const stories = useMemo<StoryItem[]>(() => (parseArray(data.stories) ?? DEFAULT_STORIES).map(value => {
        const item = record(value);
        return {name: string(item.name, "사용자"), caption: string(item.caption), images: parseImages(item.images)};
    }), [data.stories]);
    const posts = useMemo<PostItem[]>(() => (parseArray(data.posts) ?? DEFAULT_POSTS).map(value => {
        const item = record(value);
        return {
            user: string(item.user, "user"),
            place: string(item.place),
            caption: string(item.caption),
            images: parseImages(item.images)
        };
    }), [data.posts]);
    const [screen, setScreen] = useState<"home" | "feed">("home");
    const [tab, setTab] = useState<"feed" | "search" | "saved" | "liked" | "profile">("feed");
    const [menu, setMenu] = useState(false);
    const [story, setStory] = useState<number | null>(null);
    const [seen, setSeen] = useState<Record<number, boolean>>({});
    const [liked, setLiked] = useState<Record<number, boolean>>({});
    const [saved, setSaved] = useState<Record<number, boolean>>({});
    const [query, setQuery] = useState("");
    const [toast, setToast] = useState("");
    const [size, setSize] = useState({width: 390, height: 844});
    const rootRef = useRef<HTMLDivElement>(null), scrollRef = useRef<HTMLDivElement>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const completing = useRef(false);
    const complete = useSlideComplete(onComplete, isPreview), later = useSlideTimeout(), vibrate = useVibrate();
    const closeStory = useCallback(() => setStory(null), []);
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const observer = new ResizeObserver(([entry]) => setSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height
        }));
        observer.observe(root);
        return () => observer.disconnect();
    }, []);
    useEffect(() => () => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
    }, []);
    const notice = (text: string) => {
        setToast(text);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(""), 2200);
    };
    const share = async (post: PostItem) => {
        try {
            if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
            await navigator.clipboard.writeText(`${post.user}\n${post.place ? `${post.place}\n` : ""}${post.caption}`);
            notice("게시물 문구를 복사했어요");
        } catch {
            notice("이 브라우저에서는 복사할 수 없어요");
        }
    };
    const goHome = () => {
        if (completing.current) return;
        completing.current = true;
        setMenu(false);
        setScreen("home");
        later(() => {
            complete();
            completing.current = false;
        }, 1000);
    };
    const changeTab = (next: typeof tab) => {
        setTab(next);
        scrollRef.current?.scrollTo({top: 0});
    };
    const openStory = (index: number) => {
        if (stories[index]) {
            vibrate(10);
            setStory(index);
        }
    };
    const visible = posts.map((post, index) => ({post, index})).filter(({post, index}) => {
        if (tab === "saved") return !!saved[index];
        if (tab === "liked") return !!liked[index];
        if (tab === "profile") return post.user === posts[0]?.user;
        return tab !== "search" || `${post.user} ${post.place} ${post.caption}`.toLowerCase().includes(query.toLowerCase());
    });
    const profile = posts[0];
    return <div ref={rootRef} className="jc-ig-root" style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background: size.width >= 600 ? "#f5f5f5" : "#fff"
    }}>
        <div className={`jc-ig-frame ${size.width >= 600 ? "jc-ig-wide" : ""}`}>
            {screen === "home" ? <div className="jc-ig-launch">
                <button className="jc-ig-launch-icon" aria-label={`${appTitle} 열기`} onClick={() => {
                    if (!completing.current) {
                        vibrate(12);
                        setScreen("feed");
                    }
                }} style={{background: RING}}><Icon name="camera" size={62}/></button>
                <h1 className="jc-ig-wordmark">{appTitle}</h1><p>아이콘을 눌러 우리의 순간을 열어보세요</p>
            </div> : <div className="jc-ig-feed" aria-hidden={story !== null || menu ? true : undefined}>
                <header className="jc-ig-header">
                    <button className="jc-ig-brand" onClick={() => setMenu(true)} aria-label="앱 메뉴"><span
                        className="jc-ig-wordmark">{appTitle}</span><Icon name="down" size={15}/></button>
                    <div className="jc-ig-action-group"><IconButton name="plus" label="스토리 열기"
                                                                    onClick={() => stories.length ? openStory(0) : notice("등록된 스토리가 없어요")}/><IconButton
                        name="heart" label="좋아요한 게시물" onClick={() => changeTab("liked")} active={tab === "liked"}/>
                    </div>
                </header>
                <main ref={scrollRef} className="jc-ig-scroll">
                    {tab === "feed" && stories.length > 0 &&
                        <div className="jc-ig-stories" aria-label="스토리 목록">{stories.map((item, index) => <button
                            className="jc-ig-story-item" key={index} onClick={() => openStory(index)}><span
                            className="jc-ig-ring"
                            style={{background: seen[index] ? "transparent" : RING}}><span
                            className="jc-ig-ring-inner">
                          <Avatar name={item.name} image={item.images[0]} index={index}
                                  size={64}/>
                            </span>
                            {/*{index === 0 &&*/}
                            {/*  <span className="jc-ig-story-add"><Icon name="plus" size={14}/></span>}*/}
                        </span><span
                            className="jc-ig-story-name"
                            style={{color: index === 0 || seen[index] ? "#737373" : "#171717"}}>{item.name}</span>
                        </button>)}</div>}
                    {tab === "search" &&
                        <div className="jc-ig-search"><Icon name="search" size={18}/><input value={query}
                                                                                            onChange={e => setQuery(e.target.value)}
                                                                                            placeholder="검색"
                                                                                            aria-label="게시물 검색"/></div>}
                    {(tab === "saved" || tab === "liked") &&
                        <h2 className="jc-ig-section-title">{tab === "saved" ? "저장됨" : "좋아요한 게시물"}</h2>}
                    {tab === "profile" &&
                        <div className="jc-ig-profile"><Avatar name={profile?.user ?? "나"} image={profile?.images[0]}
                                                               size={74}/>
                            <div><strong>{profile?.user ?? "나"}</strong><p>게시물 <b>{visible.length}</b> ·
                                저장 <b>{Object.values(saved).filter(Boolean).length}</b></p></div>
                        </div>}
                    {visible.map(({post, index}) => <Post key={index} post={post} index={index} accent={accent}
                                                          height={size.height} liked={!!liked[index]}
                                                          saved={!!saved[index]} onLike={value => {
                        vibrate(10);
                        setLiked(prev => ({...prev, [index]: value}));
                    }} onSave={() => setSaved(prev => ({...prev, [index]: !prev[index]}))} onShare={() => {
                        void share(post);
                    }}/>)}
                    {!visible.length &&
                        <div className="jc-ig-empty"><Icon name={tab === "saved" ? "bookmark" : "camera"}
                                                           size={40}/><strong>{tab === "search" ? "검색 결과가 없어요" : tab === "saved" ? "저장한 게시물이 없어요" : tab === "liked" ? "좋아요한 게시물이 없어요" : "아직 게시물이 없어요"}</strong>
                        </div>}
                    {tab === "feed" && !!visible.length &&
                        <div className="jc-ig-feed-end"><span><Icon name="check" size={22}/></span><strong>모든 순간을
                            확인했어요</strong>
                            <button onClick={goHome}>닫고 다음으로</button>
                        </div>}
                </main>
                <nav className="jc-ig-nav" aria-label="피드 메뉴"><IconButton name="home" label="홈 피드"
                                                                          active={tab === "feed"}
                                                                          onClick={() => changeTab("feed")}/><IconButton
                    name="reels" label="스토리 모아보기"
                    onClick={() => stories.length ? openStory(0) : notice("등록된 스토리가 없어요")}/><IconButton name="bookmark"
                                                                                                        label="저장한 게시물"
                                                                                                        active={tab === "saved"}
                                                                                                        onClick={() => changeTab("saved")}/><IconButton
                    name="search" label="검색" onClick={() => changeTab("search")}/>
                    <button className="jc-ig-icon" aria-label="프로필" aria-pressed={tab === "profile"}
                            onClick={() => changeTab("profile")}><span
                        className={tab === "profile" ? "jc-ig-profile-active" : ""}><Avatar name={profile?.user ?? "나"}
                                                                                            image={profile?.images[0]}
                                                                                            size={25}/></span></button>
                </nav>
            </div>}
            {menu && <Sheet title={appTitle} onClose={() => setMenu(false)}>
                <button className="jc-ig-menu-row" onClick={goHome}><Icon name="home"/>앱 닫고 다음으로</button>
                <button className="jc-ig-menu-row" onClick={() => setMenu(false)}>계속 보기</button>
            </Sheet>}
            {story !== null && <StoryViewer stories={stories} start={story} onClose={closeStory}
                                            onSeen={index => setSeen(prev => prev[index] ? prev : {
                                                ...prev,
                                                [index]: true
                                            })} accent={accent}/>}
            {toast && <div className="jc-ig-toast" role="status">{toast}</div>}
        </div>
    </div>;
}
