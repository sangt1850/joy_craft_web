import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { SlideProps } from "../SlideProps";
import { useSlideComplete } from "../useSlideComplete";

interface ProfileItem {
  name: string;
  image: string;
}

interface RankingItem {
  title: string;
  image: string;
}

interface LoveflixIntroData {
  brandText: string;
  profileTitle: string;
  addProfileText: string;
  manageProfileText: string;
  profiles: string | ProfileItem[];

  heroImage: string;
  heroEyebrow: string;
  heroTitle: string;
  heroBadgeText: string;
  heroDescription: string;
  playText: string;
  detailText: string;
  rankingTitle: string;
  rankingItems: string | RankingItem[];

  detailImage: string;
  detailTitle: string;
  detailBadgeText: string;
  detailDescription: string;
  detailMetaLeft: string;
  detailMetaRight: string;

  accentColor: string;
  introDuration: number;
  autoOpenProfile: boolean;
}

const FALLBACK_PROFILES: ProfileItem[] = [
  { name: "우리", image: "" },
  { name: "데이트", image: "" },
  { name: "일상", image: "" },
];

const FALLBACK_RANKING: RankingItem[] = [
  { title: "첫 번째 추억", image: "" },
  { title: "두 번째 추억", image: "" },
  { title: "세 번째 추억", image: "" },
  { title: "네 번째 추억", image: "" },
];

function parseList<T>(value: string | T[], fallback: T[]): T[] {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value) as T[];
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function imageStyle(src?: string): CSSProperties {
  if (!src) {
    return {
      background:
        "linear-gradient(135deg, rgba(255,255,255,.16), rgba(255,255,255,.035)), linear-gradient(145deg,#343434,#111)",
    };
  }
  return {
    backgroundImage: `url(${src})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 6 2.2 6.1 2.2 7.5H4.3c0-1.4 2.2-1.5 2.2-7.5Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 19c.4 1.1 1 1.6 2 1.6s1.6-.5 2-1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function LoveflixIntro({ data, onComplete, isPreview }: SlideProps<LoveflixIntroData>) {
  const complete = useSlideComplete(onComplete, isPreview);
  const rootRef = useRef<HTMLDivElement>(null);
  const [vw, setVw] = useState(0);
  const [stage, setStage] = useState<"intro" | "profiles" | "home">("intro");
  const [selectedProfile, setSelectedProfile] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeRank, setActiveRank] = useState(0);

  const profiles = useMemo(
    () => parseList<ProfileItem>(data.profiles, FALLBACK_PROFILES),
    [data.profiles]
  );
  const rankings = useMemo(
    () => parseList<RankingItem>(data.rankingItems, FALLBACK_RANKING),
    [data.rankingItems]
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setVw(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const ms = Math.max(900, Math.min(6000, Number(data.introDuration || 2200)));
    const timer = window.setTimeout(() => {
      setStage(data.autoOpenProfile === false ? "home" : "profiles");
    }, ms);
    return () => window.clearTimeout(timer);
  }, [data.introDuration, data.autoOpenProfile]);

  const compact = vw > 0 && vw < 600;
  const tiny = vw > 0 && vw < 430;
  const brand = data.brandText || "LOVEFLIX";

  const chooseProfile = (index: number) => {
    setSelectedProfile(index);
    setStage("home");
  };

  const rootStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    color: "#fff",
    background: "#000",
    fontFamily: "Pretendard, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    touchAction: "manipulation",
    userSelect: "none",
  };

  if (stage === "intro") {
    return (
      <div ref={rootRef} style={{ ...rootStyle, display: "grid", placeItems: "center" }}>
        <div
          className="jc-loveflix-logo"
          style={{
            color: data.accentColor || "#e50914",
            fontWeight: 950,
            letterSpacing: compact ? -2 : -4,
            fontSize: compact ? "clamp(44px, 16vw, 72px)" : "clamp(72px, 9vw, 138px)",
            transform: "scaleY(1.08)",
            textShadow: "0 0 34px rgba(229,9,20,.22)",
          }}
        >
          {brand}
        </div>
      </div>
    );
  }

  if (stage === "profiles") {
    return (
      <div
        ref={rootRef}
        style={{
          ...rootStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: compact ? 20 : 36,
        }}
      >
        <div style={{ width: "min(900px, 94%)", textAlign: "center" }}>
          <div
            style={{
              fontSize: compact ? 23 : 34,
              fontWeight: 650,
              letterSpacing: -0.8,
              marginBottom: compact ? 28 : 38,
            }}
          >
            {data.profileTitle || "LOVEFLIX를 시청할 프로필을 선택하세요."}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: compact ? 14 : 24,
              flexWrap: compact ? "wrap" : "nowrap",
            }}
          >
            {profiles.map((profile, index) => (
              <button
                key={`${profile.name}-${index}`}
                type="button"
                onClick={() => chooseProfile(index)}
                style={{
                  appearance: "none",
                  border: 0,
                  padding: 0,
                  background: "transparent",
                  color: "#cfcfcf",
                  cursor: "pointer",
                  width: compact ? 76 : 106,
                }}
              >
                <div
                  style={{
                    ...imageStyle(profile.image),
                    aspectRatio: "1 / 1",
                    width: "100%",
                    borderRadius: 5,
                    border: "2px solid transparent",
                    boxShadow: "0 10px 30px rgba(0,0,0,.22)",
                  }}
                />
                <div style={{ marginTop: 8, fontSize: compact ? 11 : 13 }}>{profile.name}</div>
              </button>
            ))}

            <button
              type="button"
              onClick={() => chooseProfile(0)}
              style={{
                appearance: "none",
                border: 0,
                padding: 0,
                background: "transparent",
                color: "#aaa",
                cursor: "pointer",
                width: compact ? 76 : 106,
              }}
            >
              <div
                style={{
                  aspectRatio: "1 / 1",
                  width: "100%",
                  display: "grid",
                  placeItems: "center",
                  fontSize: compact ? 48 : 64,
                  fontWeight: 300,
                  color: "#bdbdbd",
                }}
              >
                +
              </div>
              <div style={{ marginTop: 8, fontSize: compact ? 11 : 13 }}>{data.addProfileText || "프로필 추가"}</div>
            </button>
          </div>

          <button
            type="button"
            style={{
              marginTop: compact ? 28 : 38,
              padding: compact ? "8px 17px" : "10px 22px",
              border: "1px solid #777",
              background: "transparent",
              color: "#aaa",
              fontSize: compact ? 11 : 12,
              letterSpacing: 1.5,
              cursor: "pointer",
            }}
          >
            {data.manageProfileText || "프로필 관리"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} style={rootStyle}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          ...imageStyle(data.heroImage),
          transform: "scale(1.01)",
          transition: "background-image .35s ease",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: compact
            ? "linear-gradient(90deg,rgba(0,0,0,.82) 0%,rgba(0,0,0,.44) 55%,rgba(0,0,0,.16) 100%),linear-gradient(0deg,#000 0%,transparent 50%)"
            : "linear-gradient(90deg,rgba(0,0,0,.80) 0%,rgba(0,0,0,.35) 48%,rgba(0,0,0,.06) 72%),linear-gradient(0deg,#000 0%,transparent 44%)",
        }}
      />

      <header
        style={{
          position: "relative",
          zIndex: 4,
          height: compact ? 48 : 64,
          padding: compact ? "0 14px" : "0 34px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: compact ? 14 : 26 }}>
          <div
            style={{
              color: data.accentColor || "#e50914",
              fontWeight: 950,
              letterSpacing: -1.6,
              fontSize: compact ? 19 : 27,
            }}
          >
            {brand}
          </div>
          {!tiny && (
            <nav style={{ display: "flex", gap: 16, fontSize: 12, color: "#e9e9e9" }}>
              <span>홈</span>
              <span>시리즈</span>
              <span>영화</span>
            </nav>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: compact ? 11 : 16, color: "#eee" }}>
          <SearchIcon />
          {!tiny && <span style={{ fontSize: 11 }}>키즈</span>}
          <BellIcon />
          <div
            style={{
              ...imageStyle(profiles[selectedProfile]?.image),
              width: compact ? 24 : 30,
              height: compact ? 24 : 30,
              borderRadius: 3,
            }}
          />
          <span style={{ fontSize: 9, opacity: 0.8 }}>▼</span>
        </div>
      </header>

      <main
        style={{
          position: "absolute",
          zIndex: 3,
          left: compact ? 18 : 36,
          right: compact ? 16 : "46%",
          top: compact ? "19%" : "19%",
        }}
      >
        <div style={{ fontSize: compact ? 10 : 12, color: "#ddd", marginBottom: 6 }}>
          {data.heroEyebrow || "N  영화"}
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: compact ? "clamp(31px, 9vw, 48px)" : "clamp(44px, 5.7vw, 82px)",
            fontWeight: 780,
            letterSpacing: -2.2,
            lineHeight: 1.03,
            textShadow: "0 5px 24px rgba(0,0,0,.35)",
          }}
        >
          {data.heroTitle || "우리 결혼해요! ♡"}
        </h1>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: compact ? 12 : 15,
            fontSize: compact ? 11 : 13,
            fontWeight: 750,
          }}
        >
          <span
            style={{
              background: data.accentColor || "#e50914",
              color: "#fff",
              fontSize: 9,
              lineHeight: 1,
              padding: "5px 4px 4px",
              borderRadius: 2,
            }}
          >
            TOP<br />10
          </span>
          {data.heroBadgeText || "오늘 가장 빛나는 커플 1위"}
        </div>

        <p
          style={{
            margin: compact ? "10px 0 14px" : "12px 0 17px",
            maxWidth: 560,
            fontSize: compact ? 10.5 : 13,
            lineHeight: 1.55,
            color: "rgba(255,255,255,.9)",
            textShadow: "0 2px 6px rgba(0,0,0,.5)",
          }}
        >
          {data.heroDescription || "우리의 장면들을 한 편의 작품처럼. 가장 빛나는 순간들을 모아 만든 특별한 이야기입니다."}
        </p>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={complete}
            style={{
              border: 0,
              borderRadius: 3,
              padding: compact ? "7px 14px" : "9px 20px",
              background: "#fff",
              color: "#111",
              fontWeight: 750,
              fontSize: compact ? 11 : 13,
              cursor: "pointer",
            }}
          >
            ▶&nbsp;&nbsp;{data.playText || "재생"}
          </button>
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            style={{
              border: 0,
              borderRadius: 3,
              padding: compact ? "7px 14px" : "9px 18px",
              background: "rgba(90,90,90,.72)",
              color: "#fff",
              fontWeight: 650,
              fontSize: compact ? 11 : 13,
              cursor: "pointer",
              backdropFilter: "blur(3px)",
            }}
          >
            ⓘ&nbsp;&nbsp;{data.detailText || "상세 정보"}
          </button>
        </div>
      </main>

      <section
        style={{
          position: "absolute",
          zIndex: 3,
          left: compact ? 14 : 34,
          right: compact ? 8 : 20,
          bottom: compact ? 12 : 20,
        }}
      >
        <div style={{ fontWeight: 650, fontSize: compact ? 11 : 14, marginBottom: compact ? 6 : 9 }}>
          {data.rankingTitle || "우리의 결혼 여행기 TOP 10 시리즈"}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(rankings.length, compact ? 4 : 5)}, minmax(0, 1fr))`,
            gap: compact ? 5 : 9,
            maxWidth: compact ? "100%" : 900,
          }}
        >
          {rankings.slice(0, compact ? 4 : 5).map((item, index) => (
            <button
              key={`${item.title}-${index}`}
              type="button"
              onClick={() => setActiveRank(index)}
              style={{
                position: "relative",
                minWidth: 0,
                height: compact ? 82 : 122,
                padding: 0,
                border: 0,
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: compact ? -10 : -17,
                  zIndex: 0,
                  fontSize: compact ? 84 : 130,
                  lineHeight: 1,
                  fontWeight: 950,
                  letterSpacing: -8,
                  color: "#070707",
                  WebkitTextStroke: compact ? "1.1px #a4a4a4" : "1.5px #a4a4a4",
                }}
              >
                {index + 1}
              </span>
              <span
                style={{
                  position: "absolute",
                  zIndex: 1,
                  top: 0,
                  right: 0,
                  width: compact ? "72%" : "70%",
                  height: "100%",
                  borderRadius: 3,
                  overflow: "hidden",
                  ...imageStyle(item.image),
                  boxShadow: activeRank === index ? "0 0 0 2px rgba(255,255,255,.9)" : "0 5px 18px rgba(0,0,0,.4)",
                  transform: activeRank === index ? "translateY(-3px) scale(1.02)" : "none",
                  transition: "transform .18s ease, box-shadow .18s ease",
                }}
              />
            </button>
          ))}
        </div>
      </section>

      {detailOpen && (
        <div
          role="presentation"
          onClick={() => setDetailOpen(false)}
          style={{
            position: "absolute",
            zIndex: 20,
            inset: 0,
            background: "rgba(0,0,0,.64)",
            display: "grid",
            placeItems: "center",
            padding: compact ? 14 : 28,
          }}
        >
          <article
            onClick={(e) => e.stopPropagation()}
            className="jc-loveflix-modal"
            style={{
              position: "relative",
              width: compact ? "min(94%, 440px)" : "min(74%, 820px)",
              maxHeight: "88%",
              overflow: "hidden",
              borderRadius: compact ? 8 : 10,
              background: "#181818",
              boxShadow: "0 24px 70px rgba(0,0,0,.65)",
            }}
          >
            <div style={{ position: "relative", height: compact ? 176 : 300, ...imageStyle(data.detailImage || data.heroImage) }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg,#181818 0%,transparent 65%)" }} />
              <button
                type="button"
                aria-label="닫기"
                onClick={() => setDetailOpen(false)}
                style={{
                  position: "absolute",
                  top: 11,
                  right: 11,
                  width: 31,
                  height: 31,
                  borderRadius: "50%",
                  border: 0,
                  background: "#181818",
                  color: "#fff",
                  fontSize: 17,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
              <div style={{ position: "absolute", left: compact ? 16 : 28, bottom: 18, right: 24 }}>
                <div style={{ fontSize: compact ? 27 : 43, fontWeight: 800, letterSpacing: -1.5 }}>
                  {data.detailTitle || data.heroTitle || "우리 결혼해요! ♡"}
                </div>
                <button
                  type="button"
                  onClick={complete}
                  style={{
                    marginTop: 12,
                    border: 0,
                    borderRadius: 3,
                    padding: compact ? "7px 14px" : "9px 18px",
                    background: "#fff",
                    color: "#111",
                    fontWeight: 750,
                    cursor: "pointer",
                  }}
                >
                  ▶&nbsp;&nbsp;{data.playText || "재생"}
                </button>
              </div>
            </div>

            <div
              style={{
                display: compact ? "block" : "grid",
                gridTemplateColumns: "1.5fr .8fr",
                gap: 30,
                padding: compact ? "4px 16px 22px" : "10px 28px 28px",
              }}
            >
              <div>
                <div style={{ color: "#46d369", fontWeight: 750, fontSize: compact ? 11 : 12 }}>
                  {data.detailBadgeText || "오늘 가장 빛나는 커플 1위"}
                </div>
                <p style={{ fontSize: compact ? 11 : 13, lineHeight: 1.6, color: "#e8e8e8", margin: "10px 0 0" }}>
                  {data.detailDescription || data.heroDescription}
                </p>
              </div>
              <div style={{ fontSize: compact ? 10.5 : 11.5, lineHeight: 1.7, color: "#bdbdbd", marginTop: compact ? 15 : 0 }}>
                <div>{data.detailMetaLeft || "출연: 우리 둘"}</div>
                <div>{data.detailMetaRight || "장르: 로맨스, 추억, 결혼"}</div>
              </div>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
