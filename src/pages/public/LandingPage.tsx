// JoyCraft 랜딩 페이지
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NeoButton from "../../components/ui/NeoButton";
import NeoCard from "../../components/ui/NeoCard";
import PixelIcon from "../../components/ui/PixelIcon";
import TemplateCard from "../../components/ui/TemplateCard";
import LoginModal from "../../components/ui/LoginModal";
import RegisterModal from "../../components/ui/RegisterModal";
import RunAwayButton from "../../components/ui/RunAwayButton";

const TICKER_TEXT =
  "코딩 0 · 드래그로 조합 ✦ 받는 사람이 직접 눌러보는 선물 ✦ 30일 무료 ✦ " +
  "코딩 0 · 드래그로 조합 ✦ 받는 사람이 직접 눌러보는 선물 ✦ 30일 무료 ✦ ";

const HOW_IT_WORKS = [
  { step: "01", title: "페이지 골라 담기",   desc: "마음에 드는 인터랙티브 페이지를 선택해 사이트에 추가하세요.", bg: "bg-blue" },
  { step: "02", title: "내 마음대로 커스텀", desc: "색상, 텍스트, 이미지를 바꿔 세상에 하나뿐인 선물을 만드세요.", bg: "bg-mustard" },
  { step: "03", title: "링크 하나로 공유",   desc: "완성된 사이트 링크를 복사해 카톡으로 전송하면 끝!",           bg: "bg-pink" },
];

// 인기 컴포넌트 쇼케이스 (간단한 이모지 카드)
const COMPONENTS = [
  { title: "O/X 질문 카드",   emoji: "💬", bg: "bg-mustard" },
  { title: "펼쳐지는 꽃다발", emoji: "🌸", bg: "bg-pink" },
  { title: "열리는 편지지",   emoji: "💌", bg: "bg-mint" },
  { title: "사진 갤러리",     emoji: "🖼️", bg: "bg-blue" },
  { title: "날짜별 타임라인", emoji: "📅", bg: "bg-peach" },
];

// 갤러리 — TemplateCard 재사용 (버튼 없음)
const GALLERY = [
  { id: "g1", title: "친구 생일 파티 🎂",  bg: "bg-mustard", pages: 4, emoji: "🎁" },
  { id: "g2", title: "감사 인사 전하기 🙏", bg: "bg-mint",    pages: 6, emoji: "🎁" },
  { id: "g3", title: "특별한 기념일 🎊",    bg: "bg-pink",    pages: 5, emoji: "🎁" },
];


export default function LandingPage() {
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  function handleLoginSuccess() {
    setLoginOpen(false);
    setRegisterOpen(false);
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen bg-cream">

      {/* 티커 바 */}
      <div className="bg-ink text-cream font-body text-[12px] py-2 overflow-hidden whitespace-nowrap">
        <div className="inline-block" style={{ animation: "ticker 20s linear infinite" }}>
          {TICKER_TEXT}
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className="flex items-center justify-between px-8 py-4 border-b-[3px] border-ink bg-cream sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <span className="font-pixel text-[22px]">JoyCraft</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#how"        className="font-sub text-[14px] text-ink no-underline">작동방식</a>
          <a href="#components" className="font-sub text-[14px] text-ink no-underline">컴포넌트</a>
          <a href="#gallery"    className="font-sub text-[14px] text-ink no-underline">예시</a>
          <NeoButton bg="var(--color-cream)" color="#111" size="sm" onClick={() => setLoginOpen(true)}>
            로그인
          </NeoButton>
          <NeoButton bg="var(--color-mustard)" color="#111" size="sm" onClick={() => setRegisterOpen(true)}>
            시작하기
          </NeoButton>
        </div>
      </nav>

      {/* 히어로 */}
      <section
        className="border-b-[4px] border-ink px-8 py-20 flex items-center justify-center gap-16 flex-wrap"
        style={{ background: "linear-gradient(135deg, var(--color-blue) 0%, var(--color-peach) 50%, var(--color-pink) 100%)" }}
      >
        <div className="max-w-[520px]">
          <div className="inline-block bg-ink text-mustard font-pixel text-[10px] px-[14px] py-[6px] mb-6">
            NEW ✦ 인터랙티브 선물 빌더
          </div>
          <h1 className="font-headline text-[48px] leading-tight text-ink m-0 mb-6">
            받는 사람이 직접 눌러보는,<br />
            세상에 하나뿐인 선물
          </h1>
          <p className="font-body text-[16px] text-[#333] leading-[1.7] mb-9">
            코딩 없이 드래그만으로 인터랙티브 선물 사이트를 만드세요.
            생일, 기념일, 감사... 어떤 순간도 특별하게.
          </p>
          <div className="flex gap-4 flex-wrap">
            <NeoButton bg="var(--color-pink)" size="lg" onClick={() => setLoginOpen(true)}>
              시작하기
            </NeoButton>
            <NeoButton bg="var(--color-cream)" color="#111" size="lg">
              컴포넌트 구경하기
            </NeoButton>
          </div>
        </div>

        {/* 데모 윈도우 */}
        <NeoCard pad={0} shadow={8} clip>
          <div className="bg-ink px-[14px] py-2 flex items-center justify-between">
            <span className="font-pixel text-[9px] text-cream">preview.joycraft</span>
            <div className="flex gap-1.5">
              {["bg-mustard", "bg-mint", "bg-pink"].map((c, i) => (
                <div key={i} className={`w-[10px] h-[10px] ${c}`} style={{ border: "2px solid #111" }} />
              ))}
            </div>
          </div>
          <div
            className="px-8 py-8 flex flex-col items-center gap-5 min-h-[220px]"
            style={{ background: "linear-gradient(160deg, #FFB784 0%, #FF57A6 100%)", width: 300 }}
          >
            <PixelIcon name="star" size={40} fill="#fff" />
            <p className="font-headline text-[18px] text-white text-center m-0">오늘 하루 즐거웠나요? 🎉</p>
            <div className="flex gap-3">
              <NeoButton bg="var(--color-mustard)" color="#111" size="sm">좋았어요!</NeoButton>
              <RunAwayButton bg="var(--color-cream)" color="#111" size="sm">아니요</RunAwayButton>
            </div>
          </div>
        </NeoCard>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="px-8 py-20 border-b-[4px] border-ink">
        <div className="max-w-[960px] mx-auto">
          <h2 className="font-headline text-[36px] mb-12 text-center">HOW IT WORKS</h2>
          <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {HOW_IT_WORKS.map(({ step, title, desc, bg }) => (
              <div key={step} className={`${bg} neo-border p-7 neo-shadow-lg`}>
                <div className="font-pixel text-[20px] text-ink mb-4">{step}</div>
                <h3 className="font-headline text-[20px] m-0 mb-3">{title}</h3>
                <p className="font-body text-[13px] leading-[1.7] m-0">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 인기 컴포넌트 쇼케이스 */}
      <section id="components" className="px-8 py-20 border-b-[4px] border-ink">
        <div className="max-w-[960px] mx-auto">
          <h2 className="font-headline text-[36px] mb-3 text-center">인기 컴포넌트</h2>
          <p className="font-body text-[14px] text-[#555] text-center mb-12">
            골라 담으면 끝 — 모두 인터랙티브하게 작동합니다
          </p>
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
            {COMPONENTS.map(({ title, emoji, bg }) => (
              <div
                key={title}
                className={`${bg} neo-border p-5 cursor-pointer neo-card-lift neo-shadow-md`}
              >
                <div className="text-[32px] mb-3">{emoji}</div>
                <div className="font-sub text-[13px] leading-tight">{title}</div>
              </div>
            ))}
            <div className="neo-border bg-cream p-5 cursor-pointer neo-card-lift neo-shadow-md">
              <div className="text-[32px] mb-3">+</div>
              <div className="font-sub text-[13px] text-[#888]">더 많은 컴포넌트</div>
            </div>
          </div>
        </div>
      </section>

      {/* 갤러리 — TemplateCard 재사용 */}
      <section id="gallery" className="px-8 py-20 border-b-[4px] border-ink">
        <div className="max-w-[960px] mx-auto">
          <h2 className="font-headline text-[36px] mb-12 text-center">실제 사용 예시</h2>
          <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {GALLERY.map((item) => (
              <TemplateCard
                key={item.id}
                {...item}
                showButton={false}
                thumbHeight={160}
                subLabel={`${item.pages}페이지 · 인터랙티브`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA 푸터 */}
      <section className="bg-mustard border-t-[4px] border-ink px-8 py-16 text-center">
        <h2 className="font-headline text-[40px] m-0 mb-4">지금 바로 만들어보세요 🎁</h2>
        <p className="font-body text-[15px] text-[#333] mb-9">30일 무료 · 카드 등록 불필요</p>
        <NeoButton bg="#111" color="#FFF7E6" size="lg" onClick={() => setLoginOpen(true)}>
          시작하기
        </NeoButton>
      </section>

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
