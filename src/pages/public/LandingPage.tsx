import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Gift, LayoutTemplate, Link2, MousePointer2, Sparkles } from "lucide-react";
import LoginModal from "../../components/ui/LoginModal";
import RegisterModal from "../../components/ui/RegisterModal";
import { useAuthStore } from "../../store/authStore";

const STEPS = [
  { icon: LayoutTemplate, no: "01", title: "페이지 골라 담기", desc: "마음에 드는 인터랙티브 페이지를 골라 사이트에 추가하세요." },
  { icon: MousePointer2, no: "02", title: "내 마음대로 편집", desc: "문구와 색상, 이미지를 바꿔 나만의 이야기로 완성하세요." },
  { icon: Link2, no: "03", title: "링크 하나로 공유", desc: "완성된 링크를 복사해 소중한 사람에게 바로 보내세요." },
];
const EXAMPLES = [
  { title: "친구 생일 파티", meta: "4개 페이지", emoji: "🎂" },
  { title: "고마운 마음 전하기", meta: "6개 페이지", emoji: "💌" },
  { title: "우리의 특별한 기념일", meta: "5개 페이지", emoji: "✨" },
];
const FAQ = [
  ["코딩을 전혀 몰라도 만들 수 있나요?", "네. 원하는 페이지를 고르고 글과 사진을 바꾸는 것만으로 완성할 수 있어요."],
  ["받는 사람도 앱을 설치해야 하나요?", "아니요. 공유한 링크를 브라우저에서 열면 바로 볼 수 있어요."],
  ["무료로 사용할 수 있나요?", "네, 현재 무료 베타 기간으로 모든 기능을 자유롭게 이용할 수 있어요."],
];

export default function LandingPage() {
  const navigate = useNavigate();
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  useEffect(() => { fetchMe(); }, [fetchMe]);
  const success = () => { setLoginOpen(false); setRegisterOpen(false); navigate("/dashboard"); };
  if (isLoading) return <div className="grid h-dvh place-items-center bg-bg text-sm text-muted">JoyCraft를 준비하고 있어요…</div>;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <div className="min-h-dvh bg-bg text-ink">
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between px-5 md:px-8">
        <a href="#top" className="text-[18px] font-semibold tracking-[-.045em] text-heading no-underline">JoyCraft</a>
        <nav className="hidden items-center gap-7 text-[13px] text-muted md:flex"><a href="#how" className="text-inherit no-underline hover:text-heading">만드는 방법</a><a href="#examples" className="text-inherit no-underline hover:text-heading">예시</a><a href="#faq" className="text-inherit no-underline hover:text-heading">자주 묻는 질문</a></nav>
        <div className="flex items-center gap-2"><button onClick={() => setLoginOpen(true)} className="jc-button h-9 rounded-lg bg-surface px-3.5 text-xs text-heading">로그인</button><button onClick={() => setRegisterOpen(true)} className="jc-button h-9 rounded-lg bg-primary px-3.5 text-xs text-white">무료로 시작하기</button></div>
      </div>
    </header>

    <main id="top">
      <section className="relative overflow-hidden px-5 pb-20 pt-16 md:px-8 md:pb-28 md:pt-24">
        <div className="absolute left-1/2 top-10 -z-0 size-[520px] -translate-x-1/2 rounded-full bg-[#edeaf1] blur-3xl opacity-70" />
        <div className="relative mx-auto grid max-w-[1120px] items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] font-semibold text-muted"><Sparkles size={13} /> 마음을 움직이는 인터랙티브 선물</div>
            <h1 className="m-0 max-w-[650px] text-[38px] font-semibold leading-[1.18] tracking-[-.055em] text-heading sm:text-[48px] lg:text-[58px]">받는 사람이 직접 눌러보는,<br /><span className="text-secondary">세상에 하나뿐인 선물</span></h1>
            <p className="mb-8 mt-6 max-w-[560px] text-[15px] leading-7 text-muted sm:text-[17px]">코딩 없이 이야기와 사진을 담아 인터랙티브 선물 사이트를 만드세요. 생일과 기념일, 고마운 모든 순간을 더 오래 기억하게 해요.</p>
            <div className="flex flex-wrap gap-3"><button onClick={() => setRegisterOpen(true)} className="jc-button h-12 rounded-[10px] bg-primary px-6 text-sm text-white">무료로 만들어보기 <ArrowRight size={16} /></button><a href="#how" className="jc-button h-12 rounded-[10px] bg-surface px-6 text-sm text-heading no-underline">어떻게 만드나요?</a></div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted"><span className="flex items-center gap-1.5"><Check size={14} /> 카드 등록 불필요</span><span className="flex items-center gap-1.5"><Check size={14} /> 완전 무료</span><span className="flex items-center gap-1.5"><Check size={14} /> 링크로 바로 공유</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-[440px]">
            <div className="absolute -inset-5 -z-0 rotate-3 rounded-[28px] bg-selected" />
            <div className="relative overflow-hidden rounded-[22px] border border-border bg-surface shadow-[0_24px_70px_rgba(57,40,66,.14)]">
              <div className="flex h-11 items-center gap-1.5 border-b border-border bg-[#faf9fc] px-4"><i className="size-2 rounded-full bg-[#cfc3da]" /><i className="size-2 rounded-full bg-[#ddd5e2]" /><i className="size-2 rounded-full bg-[#e8e5ed]" /><span className="ml-3 text-[9px] uppercase tracking-[.16em] text-muted">preview · joycraft</span></div>
              <div className="flex aspect-[4/5] flex-col items-center justify-center bg-[linear-gradient(145deg,#f5eef7,#ede5f1)] p-8 text-center"><div className="mb-5 grid size-16 place-items-center rounded-[20px] bg-surface text-3xl shadow-sm">🎁</div><p className="m-0 text-xl font-semibold leading-relaxed text-heading">오늘의 주인공에게<br />보내는 작은 선물</p><p className="mb-7 mt-3 text-xs leading-5 text-muted">화면을 눌러 이야기를 시작해 보세요</p><button className="jc-button h-10 rounded-lg bg-primary px-5 text-xs text-white">선물 열어보기</button></div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface px-5 py-8"><div className="mx-auto grid max-w-[960px] grid-cols-3 gap-6 text-center">{[["완전 무료","베타 기간 무제한"],["코딩 불필요","클릭만으로 완성"],["즉시 공유","링크 하나로 전달"]].map(([v,l]) => <div key={l}><strong className="block text-xl font-semibold text-heading md:text-2xl">{v}</strong><span className="mt-1 block text-[11px] text-muted">{l}</span></div>)}</div></section>

      <section id="how" className="px-5 py-20 md:px-8 md:py-28"><div className="mx-auto max-w-[1080px]"><div className="mb-12 max-w-[560px]"><span className="text-[10px] font-semibold uppercase tracking-[.18em] text-muted">How it works</span><h2 className="mb-3 mt-3 text-[30px] tracking-[-.04em] md:text-[38px]">세 단계면 충분해요</h2><p className="m-0 text-sm leading-6 text-muted">어려운 설정 없이, 고르고 바꾸고 공유하세요.</p></div><div className="grid gap-4 md:grid-cols-3">{STEPS.map(({icon:Icon,no,title,desc}) => <article key={no} className="rounded-[16px] border border-border bg-surface p-6"><div className="mb-8 flex items-center justify-between"><div className="grid size-10 place-items-center rounded-[12px] bg-subtle text-secondary"><Icon size={19} /></div><span className="text-[10px] font-semibold tracking-widest text-muted">{no}</span></div><h3 className="mb-2 text-[17px]">{title}</h3><p className="m-0 text-[13px] leading-6 text-muted">{desc}</p></article>)}</div></div></section>

      <section id="examples" className="border-y border-border bg-surface px-5 py-20 md:px-8 md:py-28"><div className="mx-auto max-w-[1080px]"><div className="mb-12 text-center"><span className="text-[10px] font-semibold uppercase tracking-[.18em] text-muted">Made with JoyCraft</span><h2 className="mb-3 mt-3 text-[30px] tracking-[-.04em] md:text-[38px]">이런 마음을 전했어요</h2></div><div className="grid gap-5 md:grid-cols-3">{EXAMPLES.map((item,i) => <article key={item.title} className="overflow-hidden rounded-[16px] border border-border bg-bg"><div className={"grid aspect-[16/11] place-items-center text-5xl " + (i===1?"bg-[#f1edf4]":i===2?"bg-[#eee8f1]":"bg-[#f6f3f8]")}>{item.emoji}</div><div className="border-t border-border bg-surface p-5"><h3 className="m-0 text-[15px]">{item.title}</h3><p className="mb-0 mt-1 text-xs text-muted">{item.meta} · 인터랙티브</p></div></article>)}</div></div></section>

      <section id="faq" className="px-5 py-20 md:px-8 md:py-28"><div className="mx-auto max-w-[760px]"><div className="mb-10 text-center"><span className="text-[10px] font-semibold uppercase tracking-[.18em] text-muted">FAQ</span><h2 className="mb-0 mt-3 text-[30px] tracking-[-.04em] md:text-[38px]">자주 묻는 질문</h2></div><div className="space-y-3">{FAQ.map(([q,a]) => <details key={q} className="group rounded-[13px] border border-border bg-surface px-5 py-4"><summary className="cursor-pointer list-none pr-6 text-sm font-semibold text-heading marker:hidden">{q}</summary><p className="mb-1 mt-3 text-[13px] leading-6 text-muted">{a}</p></details>)}</div></div></section>

      <section className="px-5 pb-20 md:px-8 md:pb-28"><div className="mx-auto flex max-w-[1080px] flex-col items-center rounded-[24px] bg-primary px-6 py-14 text-center text-white md:py-16"><Gift size={28} className="mb-4 opacity-80" /><h2 className="m-0 text-[29px] tracking-[-.04em] text-white md:text-[38px]">오늘, 마음을 직접 만들어 보세요</h2><p className="mb-7 mt-3 text-sm text-white/70">지금 바로 무료로 시작할 수 있어요.</p><button onClick={() => setRegisterOpen(true)} className="jc-button h-12 rounded-[10px] border-white/10 bg-white px-6 text-sm text-heading">무료로 시작하기 <ArrowRight size={16} /></button></div></section>
    </main>
    <footer className="border-t border-border bg-surface"><div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-5 py-8 text-xs text-muted md:flex-row md:items-center md:justify-between md:px-8"><strong className="text-sm text-heading">JoyCraft</strong><span>© 2026 JoyCraft. All rights reserved.</span><div className="flex gap-5"><a href="#" className="text-inherit no-underline">이용약관</a><a href="#" className="text-inherit no-underline">개인정보처리방침</a></div></div></footer>
    {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} onSuccess={success} onSwitchToRegister={() => { setLoginOpen(false); setRegisterOpen(true); }} />}
    {registerOpen && <RegisterModal onClose={() => setRegisterOpen(false)} onSuccess={success} onSwitchToLogin={() => { setRegisterOpen(false); setLoginOpen(true); }} />}
  </div>;
}
