# JoyCraft 디자인 시스템 가이드

> 새 컴포넌트나 페이지를 만들 때 이 문서를 반드시 참고해 일관된 스타일을 유지하세요.
> 디자인은 특별한 지시사항이 없을 경우 반응형으로 웹/태블릿/모바일 지원 되도록 하세요.
---

## 1. 디자인 콘셉트

**Y2K Neo-Brutalism** — 두꺼운 검정 보더, 강한 박스 섀도우, 밝은 팝 컬러, 픽셀 폰트를 결합한 스타일. 코딩 없이 인터랙티브 선물 사이트를 만드는 플랫폼의 성격에 맞게 재미있고 에너제틱한 느낌을 줍니다.

---

## 2. 색상 시스템

### 기본 팔레트 (Y2K Bright)

| 토큰 | HEX | 용도 |
|------|-----|------|
| `--color-mustard` | `#ffc93c` | CTA 버튼, 강조, 배지, 환영 배너 |
| `--color-pink` | `#ff57a6` | 로고, FAB, 액센트, 버튼 |
| `--color-mint` | `#7fe0bb` | 보조 강조, 카드 배경 |
| `--color-blue` | `#9fd3f5` | 보조 강조, 통계 카드 |
| `--color-peach` | `#ffb784` | 히어로 배경, 통계 카드 |
| `--color-cream` | `#fff7e6` | 기본 배경, 사이드바 텍스트 |
| `--color-ink` | `#111111` | 텍스트, 보더, 섀도우 |

Tailwind 클래스: `bg-mustard`, `text-pink`, `border-mint` 등 모두 사용 가능.

### 배경색 ↔ 텍스트색 규칙

| 배경 | 텍스트 |
|------|--------|
| Mustard, Blue, Mint, Peach, Cream | `#111` (ink) |
| Pink, Ink | `#fff` (white) |

NeoButton 컴포넌트는 이 규칙을 자동으로 적용합니다.

### 테마 변형

테마는 `data-theme` attribute로 CSS 변수를 오버라이드합니다.

```
default (Y2K Bright) → pastel → dark → mono
```

각 테마 정의는 `src/index.css`의 `[data-theme="..."]` 셀렉터를 참고하세요.

---

## 3. 타이포그래피

### 폰트 패밀리

| 변수 | 용도 | Tailwind 클래스 |
|------|------|----------------|
| `--font-headline` | 히어로 제목, 로고 | `font-headline` |
| `--font-sub` | 네비게이션, 버튼, 소제목 | `font-sub` |
| `--font-body` | 본문, 설명 텍스트 | `font-body` |
| `--font-pixel` | 배지, 상태 라벨 | `font-pixel` |

기본 한글 폰트는 **Gmarket Sans**이며, 영문은 Archivo Black / Space Grotesk / Space Mono로 폴백됩니다.

### 사이즈 스케일

| 용도 | 사이즈 |
|------|--------|
| 히어로 H1 | `text-[48px]` |
| 페이지 제목 | `text-[28px]` ~ `text-[36px]` |
| 섹션 소제목 | `text-[18px]` ~ `text-[22px]` |
| 카드 제목 | `text-[14px]` ~ `text-[18px]` |
| 본문 | `text-[13px]` ~ `text-[16px]` |
| 배지/라벨 | `text-[8px]` ~ `text-[12px]` + `font-pixel` |

---

## 4. 보더 & 섀도우 (Neo-Brutalism 핵심)

### 기본 규칙

모든 카드, 버튼, 입력 필드에 **두꺼운 검정 보더 + 오프셋 섀도우**를 적용합니다.

```css
/* 보더 */
border: 3px solid #111;   /* 기본 */
border: 4px solid #111;   /* 강조 */

/* 섀도우 */
box-shadow: 3px 3px 0 #111;  /* 작은 요소 */
box-shadow: 5px 5px 0 #111;  /* 기본 카드/버튼 */
box-shadow: 6px 6px 0 #111;  /* 주요 카드 */
box-shadow: 8px 8px 0 #111;  /* 히어로 요소 */
```

### Utility 클래스

```
neo-border       → border: 3px solid var(--color-ink)
neo-border-4     → border: 4px solid var(--color-ink)
neo-input        → 입력 필드 (neo-border + 패딩)
neo-grid-sm      → auto-fill, min 180px
neo-grid-md      → auto-fill, min 220px
```

### 인터랙션 효과

버튼 hover: `transform: translateY(-1px)` + 섀도우 +2px
버튼 active: `transform: translateY(2px)` + 섀도우 -2px
카드 lift hover: `transform: translateY(-2px)` + 섀도우 +3px

---

## 5. 컴포넌트

### NeoButton — `src/components/ui/NeoButton.tsx`

```tsx
<NeoButton bg="var(--color-mustard)" color="#111" size="lg">
  무료로 시작하기
</NeoButton>

<NeoButton bg="#FF57A6" block onClick={handler}>
  + 새 사이트
</NeoButton>

<NeoButton href="/login" bg="var(--color-blue)" size="sm">
  로그인
</NeoButton>
```

**주요 Props**

| Prop | 기본값 | 설명 |
|------|--------|------|
| `bg` | `#FF57A6` | 배경색 (CSS 변수 또는 HEX) |
| `color` | 자동 감지 | 텍스트색 |
| `size` | `"md"` | `"sm"` / `"md"` / `"lg"` |
| `shadow` | `5` | 섀도우 픽셀 |
| `radius` | `8` | border-radius |
| `block` | `false` | 100% 너비 |
| `href` | — | 링크로 렌더링 |

### NeoCard — `src/components/ui/NeoCard.tsx`

```tsx
<NeoCard pad={28} shadow={6}>
  콘텐츠
</NeoCard>

<NeoCard flex dir="column" gap={8} lift bg="var(--color-blue)" onClick={handler}>
  클릭 가능한 카드
</NeoCard>

<NeoCard pad={20} radius={12} clip>
  rounded 카드
</NeoCard>
```

**주요 Props**

| Prop | 기본값 | 설명 |
|------|--------|------|
| `bg` | `#FFF7E6` | 배경색 |
| `pad` | `22` | 패딩(px) |
| `shadow` | `6` | 섀도우 픽셀 |
| `border` | `4` | 보더 두께(px) |
| `radius` | `0` | border-radius (0 = 직각) |
| `flex` | `false` | flex 레이아웃 |
| `dir` | `"column"` | flex 방향 |
| `gap` | `12` | flex gap |
| `lift` | `false` | hover lift 효과 |
| `clip` | `false` | overflow: hidden |

### PixelIcon — `src/components/ui/PixelIcon.tsx`

```tsx
<PixelIcon name="heart" size={40} fill="#fff" />
<PixelIcon name="home" size={18} fill={isActive ? "#111" : "#FFF7E6"} />
```

**사용 가능한 아이콘**

```
heart, flower, star, letter, clock, check, arrow,
home, doc, grid, gear, logout, share, search,
back, play, menu, plus, mail
```

---

## 6. 배지

```tsx
{/* 검정 배경 배지 */}
<span className="pixel-badge">NEW</span>

{/* 반투명 배지 */}
<span className="pixel-badge-muted">DRAFT</span>

{/* PRO 배지 (노란 배경 + 보더 + 섀도우) */}
<span className="pixel-badge-pro">PRO</span>
```

---

## 7. 레이아웃

### 고객 앱 (AppLayout)

- **데스크탑:** 좌측 사이드바 240px (`bg-ink`) + 메인 영역
- **모바일:** 메인 영역 + 하단 탭바 72px
- 활성 탭: `bg-mustard text-ink`
- 비활성 탭: `text-cream`

### 관리자 (MasterLayout)

- 항상 좌측 사이드바 220px + 메인 영역 (데스크탑 전용)

### 공개 페이지

- 풀 너비 섹션 구조
- 내부 콘텐츠: `max-w-[1100px] mx-auto px-8`

---

## 8. 반복되는 레이아웃 패턴

### 통계/요약 카드 그리드

```tsx
<div className="neo-grid-sm">
  <NeoCard bg="var(--color-blue)" pad={20} shadow={5}>
    <span className="font-pixel text-[10px]">총 사이트</span>
    <span className="font-headline text-[28px]">12</span>
  </NeoCard>
  {/* ... */}
</div>
```

### 페이지 헤더

```tsx
<div className="flex items-center justify-between mb-6">
  <h1 className="font-headline text-[24px]">페이지 제목</h1>
  <NeoButton bg="var(--color-pink)" size="sm">액션</NeoButton>
</div>
```

### 필터 탭

```tsx
// CVA variants 사용 (MySitesPage.tsx 참고)
<div className="flex">
  {tabs.map((tab, i) => (
    <button
      key={tab}
      className={tabVariants({
        active: activeTab === tab,
        pos: i === 0 ? "first" : i === tabs.length - 1 ? "last" : "middle",
      })}
      onClick={() => setActiveTab(tab)}
    >
      {tab}
    </button>
  ))}
</div>
```

### 검색창

```tsx
<div className="flex items-center gap-2 neo-border bg-white px-3 py-2">
  <PixelIcon name="search" size={16} fill="#111" />
  <input className="flex-1 outline-none font-body text-[13px]" placeholder="검색..." />
</div>
```

---

## 9. 애니메이션

### CSS 기반

```css
/* 티커 */
animation: ticker 20s linear infinite;

/* 로딩 프로그레스 */
animation: progress 2.4s ease-in-out infinite;
```

### Transition 표준

```css
/* 버튼 */
transition: transform 0.08s, box-shadow 0.08s;

/* 카드 */
transition: transform 0.12s, box-shadow 0.12s;
```

framer-motion과 GSAP도 설치되어 있으나, 기본 인터랙션은 CSS transition으로 처리합니다.

---

## 10. 유틸리티

### cn() 함수 — `src/utils/cn.ts`

clsx 래퍼입니다. 조건부 클래스 결합 시 항상 사용하세요.

```tsx
import { cn } from "@/utils/cn";

<div className={cn("base-class", isActive && "active-class", { "optional": condition })} />
```

### CVA (class-variance-authority)

컴포넌트 variants 정의에 사용합니다.

```tsx
import { cva } from "class-variance-authority";

const variants = cva("base-classes", {
  variants: {
    size: { sm: "...", lg: "..." },
    active: { true: "...", false: "..." },
  },
});
```

---

## 11. 테마 사용

```tsx
import { useThemeStore } from "@/store/themeStore";

function SettingsPage() {
  const { theme, setTheme } = useThemeStore();

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
      {THEMES.map((t) => (
        <option key={t.id} value={t.id}>{t.label}</option>
      ))}
    </select>
  );
}
```

---

## 12. Do / Don't

### Do ✅

- `NeoCard`, `NeoButton`, `PixelIcon` 컴포넌트를 우선 사용
- 모든 카드/버튼에 두꺼운 검정 보더 + 오프셋 섀도우 적용
- 색상은 반드시 CSS 변수(`var(--color-mustard)`) 또는 팔레트 Tailwind 클래스 사용
- 폰트는 `font-headline`, `font-sub`, `font-body`, `font-pixel` 중에서 선택
- 배지는 `pixel-badge` 유틸리티 클래스 사용

### Don't ❌

- 임의의 색상 HEX를 직접 사용 (팔레트 외 색상 사용 금지)
- border-radius를 크게 주어 카드가 둥글게 되는 것 (Neo-Brutalism 스타일과 어울리지 않음)
- 그림자 없는 카드/버튼 (플랫한 느낌은 스타일과 맞지 않음)
- 얇은 보더 (1px, 2px) — 최소 3px 유지

---

## 13. 파일 구조 참고

```
src/
├── index.css                  ← 전체 디자인 토큰, @utility 정의
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx      ← 고객 레이아웃
│   │   └── MasterLayout.tsx   ← 관리자 레이아웃
│   └── ui/
│       ├── NeoButton.tsx      ← 버튼 컴포넌트
│       ├── NeoCard.tsx        ← 카드 컴포넌트
│       └── PixelIcon.tsx      ← 픽셀 아이콘
├── pages/
│   ├── public/LandingPage.tsx ← 디자인 패턴 참고용
│   ├── customer/DashboardPage.tsx
│   └── customer/BrowsePage.tsx
└── store/themeStore.ts        ← 테마 관리
```
