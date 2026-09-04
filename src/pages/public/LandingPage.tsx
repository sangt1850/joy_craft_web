// JoyCraft 랜딩 페이지 — Neo Brutalism UI 컴포넌트 기반
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import NeoButton from "../../components/ui/NeoButton";
import LoginModal from "../../components/ui/LoginModal";
import RegisterModal from "../../components/ui/RegisterModal";
import RunAwayButton from "../../components/ui/RunAwayButton";
import {
  NbButton,
  NbBadge,
  NbCard,
  NbAccordion,
  NbSeparator,
} from "../../components/nb";
import { useAuthStore } from "../../store/authStore";

/* ─── 상수 ─────────────────────────────────────────── */
const TICKER_TEXT =
  "코딩 0 · 드래그로 조합 ✦ 받는 사람이 직접 눌러보는 선물 ✦ 30일 무료 ✦ " +
  "코딩 0 · 드래그로 조합 ✦ 받는 사람이 직접 눌러보는 선물 ✦ 30일 무료 ✦ ";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "페이지 골라 담기",
    desc: "마음에 드는 인터랙티브 페이지를 선택해 사이트에 추가하세요.",
    bg: "#9fd3f5",
    emoji: "🗂️",
  },
  {
    step: "02",
    title: "내 마음대로 커스텀",
    desc: "색상, 텍스트, 이미지를 바꿔 세상에 하나뿐인 선물을 만드세요.",
    bg: "#FFE66D",
    emoji: "✏️",
  },
  {
    step: "03",
    title: "링크 하나로 공유",
    desc: "완성된 사이트 링크를 복사해 카톡으로 전송하면 끝!",
    bg: "#FF6B6B",
    emoji: "🔗",
  },
];

const COMPONENTS = [
  { title: "O/X 질문 카드",    emoji: "💬", bg: "#FFE66D" },
  { title: "펼쳐지는 꽃다발",  emoji: "🌸", bg: "#FF6B6B" },
  { title: "열리는 편지지",    emoji: "💌", bg: "#4ECDC4" },
  { title: "사진 갤러리",      emoji: "🖼️", bg: "#9fd3f5" },
  { title: "날짜별 타임라인",  emoji: "📅", bg: "#F7A072" },
  { title: "더 많은 컴포넌트", emoji: "+",  bg: "#FFFFFF" },
];

const GALLERY = [
  { id: "g1", title: "친구 생일 파티 🎂",   pages: 4,  bg: "#FFE66D" },
  { id: "g2", title: "감사 인사 전하기 🙏",  pages: 6,  bg: "#4ECDC4" },
  { id: "g3", title: "특별한 기념일 🎊",     pages: 5,  bg: "#FF6B6B" },
];

const STATS = [
  { value: "12,000+", label: "사이트 생성" },
  { value: "98%",     label: "재방문율"    },
  { value: "4.9 ★",  label: "평균 평점"   },
  { value: "30일",    label: "무료 체험"   },
];

const FAQ_ITEMS = [
  { id: "f1", question: "코딩 지식이 없어도 만들 수 있나요?",       answer: "네! 드래그 앤 드롭으로 블록을 조합하기만 하면 됩니다. 코딩은 전혀 필요 없습니다." },
  { id: "f2", question: "무료 플랜에서 몇 개의 사이트를 만들 수 있나요?", answer: "무료 플랜에서는 최대 3개의 사이트를 만들 수 있습니다. 더 많은 사이트가 필요하면 Pro 플랜을 이용해 주세요." },
  { id: "f3", question: "만든 사이트는 얼마나 오래 유지되나요?",    answer: "무료 플랜은 30일, Pro 플랜은 무기한 유지됩니다. 만료 전 알림을 보내드립니다." },
  { id: "f4", question: "받는 사람도 앱을 설치해야 하나요?",        answer: "아니요. 링크만 클릭하면 바로 열립니다. 어떤 기기·어떤 브라우저에서도 동작합니다." },
];

/* ─── 컴포넌트 ─────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  function handleLoginSuccess() {
    setLoginOpen(false);
    setRegisterOpen(false);
    navigate("/dashboard");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <div className="font-pixel text-[12px] text-ink animate-pulse">LOADING...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif", background: "#FDF2E9", minHeight: "100vh", color: "#1A1A1A" }}>

      {/* ── 구글 폰트 로드 ─────────────────── */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap"
        rel="stylesheet"
      />

      {/* ── 티커 바 ───────────────────────── */}
      <div style={{
        background: "#1A1A1A", color: "#FFE66D", fontSize: "12px",
        padding: "8px 0", overflow: "hidden", whiteSpace: "nowrap",
        borderBottom: "2px solid #1A1A1A",
      }}>
        <div style={{ display: "inline-block", animation: "ticker 20s linear infinite" }}>
          {TICKER_TEXT}
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className="flex items-center justify-between px-8 py-4 border-b-[3px] border-ink bg-bg sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <span className="font-pixel text-[22px]">JoyCraft</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#how"        className="font-sub text-[14px] text-ink no-underline">작동방식</a>
          <a href="#components" className="font-sub text-[14px] text-ink no-underline">컴포넌트</a>
          <a href="#gallery"    className="font-sub text-[14px] text-ink no-underline">예시</a>
          <NeoButton bg="var(--color-bg)" color="#111" size="sm" onClick={() => setLoginOpen(true)}>
            로그인
          </NeoButton>
          <NeoButton bg="var(--color-secondary)" color="#111" size="sm" onClick={() => setRegisterOpen(true)}>
            시작하기
          </NeoButton>
        </div>
      </nav>

      {/* ── 히어로 ────────────────────────── */}
      <section style={{
        background: "linear-gradient(135deg, #FFE66D 0%, #F7A072 50%, #FF6B6B 100%)",
        borderBottom: "4px solid #1A1A1A",
        padding: "80px 24px",
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: "64px", flexWrap: "wrap",
      }}>
        {/* 좌측 텍스트 */}
        <div style={{ maxWidth: "520px" }}>
          <div style={{ marginBottom: "20px" }}>
            <NbBadge variant="secondary">✦ NEW — 인터랙티브 선물 빌더</NbBadge>
          </div>
          <h1 style={{
            margin: "0 0 20px",
            fontSize: "clamp(36px, 5vw, 52px)",
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: "-1px",
            color: "#1A1A1A",
          }}>
            받는 사람이 직접 눌러보는,<br />
            세상에 하나뿐인 선물
          </h1>
          <p style={{ margin: "0 0 36px", fontSize: "17px", lineHeight: 1.7, color: "#333" }}>
            코딩 없이 드래그만으로 인터랙티브 선물 사이트를 만드세요.
            생일, 기념일, 감사… 어떤 순간도 특별하게.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <NbButton variant="destructive" size="lg" onClick={() => setRegisterOpen(true)}>
              무료로 시작하기 →
            </NbButton>
            <NbButton variant="outline" size="lg" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>
              어떻게 작동하나요?
            </NbButton>
          </div>
          <p style={{ marginTop: "16px", fontSize: "12.8px", color: "#555" }}>
            신용카드 불필요 · 30일 무료
          </p>
        </div>

        {/* 우측 데모 카드 */}
        <NbCard bg="#1A1A1A" shadow="lg" padding={0} style={{ overflow: "hidden", minWidth: "300px" }}>
          {/* 브라우저 상단 */}
          <div style={{
            padding: "10px 14px", background: "#1A1A1A",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: "10px", color: "#FFE66D", fontWeight: 600 }}>preview.joycraft</span>
            <div style={{ display: "flex", gap: "6px" }}>
              {["#FFE66D", "#4ECDC4", "#FF6B6B"].map((c, i) => (
                <div key={i} style={{ width: 10, height: 10, background: c, border: "2px solid #555" }} />
              ))}
            </div>
          </div>
          {/* 미리보기 */}
          <div style={{
            width: 300, padding: "32px 24px",
            background: "linear-gradient(160deg, #F7A072 0%, #FF6B6B 100%)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "20px",
          }}>
            <div style={{ fontSize: "40px" }}>🌟</div>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#fff", textAlign: "center" }}>
              오늘 하루 즐거웠나요? 🎉
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <NbButton variant="accent" size="sm">좋았어요!</NbButton>
              <RunAwayButton bg="var(--color-bg)" color="#111" size="sm">아니요</RunAwayButton>
            </div>
          </div>
        </NbCard>
      </section>

      {/* ── 통계 바 ───────────────────────── */}
      <section style={{
        background: "#1A1A1A", borderBottom: "4px solid #1A1A1A",
        padding: "28px 24px",
        display: "flex", justifyContent: "center", gap: "0", flexWrap: "wrap",
      }}>
        {STATS.map(({ value, label }, i) => (
          <div key={label} style={{
            flex: "1 1 140px", textAlign: "center", padding: "8px 24px",
            borderRight: i < STATS.length - 1 ? "2px solid #333" : "none",
          }}>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#FFE66D", letterSpacing: "-0.5px" }}>{value}</div>
            <div style={{ fontSize: "12.8px", color: "#999", marginTop: "2px" }}>{label}</div>
          </div>
        ))}
      </section>

      {/* ── HOW IT WORKS ─────────────────── */}
      <section id="how" style={{ padding: "80px 24px", borderBottom: "4px solid #1A1A1A" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <NbBadge variant="accent">작동 방식</NbBadge>
            <h2 style={{ margin: "12px 0 0", fontSize: "36px", fontWeight: 700, letterSpacing: "-0.8px" }}>
              3단계면 충분해요
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
            {HOW_IT_WORKS.map(({ step, title, desc, bg, emoji }) => (
              <NbCard key={step} bg={bg} shadow="lg" padding={28} hover>
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>{emoji}</div>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px", opacity: 0.6 }}>
                  STEP {step}
                </div>
                <h3 style={{ margin: "0 0 12px", fontSize: "20px", fontWeight: 700 }}>{title}</h3>
                <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.7, color: "#333" }}>{desc}</p>
              </NbCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── 컴포넌트 쇼케이스 ────────────── */}
      <section id="components" style={{ padding: "80px 24px", borderBottom: "4px solid #1A1A1A", background: "#fff" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <NbBadge variant="default">컴포넌트</NbBadge>
            <h2 style={{ margin: "12px 0 8px", fontSize: "36px", fontWeight: 700, letterSpacing: "-0.8px" }}>
              인기 인터랙티브 블록
            </h2>
            <p style={{ margin: 0, fontSize: "15px", color: "#6B6B6B" }}>
              골라 담으면 끝 — 모두 인터랙티브하게 작동합니다
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "16px" }}>
            {COMPONENTS.map(({ title, emoji, bg }) => (
              <NbCard key={title} bg={bg} shadow="md" padding={20} hover style={{ cursor: "pointer" }}>
                <div style={{ fontSize: "30px", marginBottom: "12px" }}>{emoji}</div>
                <div style={{ fontSize: "13px", fontWeight: 600, lineHeight: 1.4 }}>{title}</div>
              </NbCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── 갤러리 ───────────────────────── */}
      <section id="gallery" style={{ padding: "80px 24px", borderBottom: "4px solid #1A1A1A" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <NbBadge variant="secondary">실제 예시</NbBadge>
            <h2 style={{ margin: "12px 0 0", fontSize: "36px", fontWeight: 700, letterSpacing: "-0.8px" }}>
              이런 선물을 만들었어요
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "24px" }}>
            {GALLERY.map(({ id, title, pages, bg }) => (
              <NbCard key={id} bg={bg} shadow="md" padding={0} hover style={{ overflow: "hidden" }}>
                {/* 썸네일 영역 */}
                <div style={{
                  height: "160px", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "48px", borderBottom: "2px solid #1A1A1A",
                }}>
                  🎁
                </div>
                {/* 정보 */}
                <div style={{ padding: "16px 18px", background: "#fff" }}>
                  <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "6px" }}>{title}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12.8px", color: "#6B6B6B" }}>{pages}페이지 · 인터랙티브</span>
                    <NbBadge variant="accent">미리보기</NbBadge>
                  </div>
                </div>
              </NbCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────── */}
      <section id="faq" style={{ padding: "80px 24px", borderBottom: "4px solid #1A1A1A", background: "#fff" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <NbBadge variant="outline">FAQ</NbBadge>
            <h2 style={{ margin: "12px 0 0", fontSize: "36px", fontWeight: 700, letterSpacing: "-0.8px" }}>
              자주 묻는 질문
            </h2>
          </div>
          <NbAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* ── CTA 푸터 ─────────────────────── */}
      <section style={{
        background: "#FFE66D",
        borderTop: "4px solid #1A1A1A",
        padding: "80px 24px",
        textAlign: "center",
      }}>
        <NbBadge variant="default">30일 무료 · 카드 등록 불필요</NbBadge>
        <h2 style={{ margin: "16px 0 12px", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, letterSpacing: "-1px" }}>
          지금 바로 만들어보세요 🎁
        </h2>
        <p style={{ margin: "0 0 36px", fontSize: "16px", color: "#555" }}>
          이미 12,000명이 JoyCraft로 특별한 선물을 만들었어요
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <NbButton variant="destructive" size="lg" onClick={() => setRegisterOpen(true)}>
            무료로 시작하기 →
          </NbButton>
          <NbButton variant="ghost" size="lg" onClick={() => setLoginOpen(true)}>
            이미 계정이 있어요
          </NbButton>
        </div>
      </section>

      {/* ── 푸터 ─────────────────────────── */}
      <footer style={{
        background: "#1A1A1A", color: "#999",
        padding: "32px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "12px",
        fontSize: "13.6px",
      }}>
        <div>
          <NbSeparator />
        </div>
        <span style={{ color: "#FFE66D", fontWeight: 700, fontSize: "16px" }}>JoyCraft</span>
        <span>© 2025 JoyCraft. All rights reserved.</span>
        <div style={{ display: "flex", gap: "20px" }}>
          <a href="#" style={{ color: "#999", textDecoration: "none" }}>이용약관</a>
          <a href="#" style={{ color: "#999", textDecoration: "none" }}>개인정보처리방침</a>
        </div>
      </footer>

      {/* ── 모달 ─────────────────────────── */}
      {loginOpen && (
        <LoginModal
          onClose={() => setLoginOpen(false)}
          onSuccess={handleLoginSuccess}
          onSwitchToRegister={() => { setLoginOpen(false); setRegisterOpen(true); }}
        />
      )}
      {registerOpen && (
        <RegisterModal
          onClose={() => setRegisterOpen(false)}
          onSuccess={handleLoginSuccess}
          onSwitchToLogin={() => { setRegisterOpen(false); setLoginOpen(true); }}
        />
      )}
    </div>
  );
}
