# JoyCraft — Claude 개발 가이드

> 이 파일은 Claude가 코드를 작성할 때 항상 참고하는 프로젝트 규칙입니다.
> 신규 코드는 반드시 이 규칙을 따라야 합니다.

---

## 0. 프로젝트 경로

| 역할 | 경로 |
|------|------|
| **Frontend (Web)** | `C:\bizbee\joy_craft\joycraft-web` |
| **Backend (API)** | `C:\bizbee\joy_craft\joy_craft_api` |

파일을 읽거나 수정할 때 위 경로를 기준으로 탐색한다. API 관련 작업은 `joy_craft_api`, UI/페이지 작업은 `joycraft-web` 디렉토리를 사용한다.

---

## 1. 핵심 원칙

- **디자인 콘셉트**: Y2K Neo-Brutalism — 두꺼운 검정 보더, 오프셋 섀도우, 밝은 팝 컬러, 픽셀 폰트
- **컴포넌트 우선**: 아래 컴포넌트 목록에 있는 것은 반드시 가져다 쓰고, 직접 div를 조립하지 않는다
- **CSS 변수 우선**: 색상은 `var(--color-mustard)` 또는 Tailwind 클래스(`bg-mustard`)로 — HEX 직접 사용 금지 (팔레트 7색 외)
- **인라인 style 최소화**: 동적 숫자 값(px, %)만 인라인 style 사용. 정적 스타일은 Tailwind 클래스

---

## 2. 컴포넌트 목록

### 기본 UI (`src/components/ui/`)

| 컴포넌트 | 파일 | 언제 쓰나 |
|---------|------|----------|
| `NeoButton` | `NeoButton.tsx` | 모든 버튼. href 있으면 `<a>` 렌더링 |
| `NeoCard` | `NeoCard.tsx` | 모든 카드/패널 컨테이너 |
| `PixelIcon` | `PixelIcon.tsx` | 모든 아이콘 |
| `StatusBadge` | `StatusBadge.tsx` | 공개/초안/PRO 상태 배지 |
| `StatCard` | `StatCard.tsx` | 숫자 통계 카드 (아이콘 + 수치 + 라벨) |
| `SiteCard` | `SiteCard.tsx` | 사이트 목록 카드 (썸네일 + 편집/공유 버튼) |
| `TemplateCard` | `TemplateCard.tsx` | 템플릿/갤러리 카드 (PRO 배지 포함) |
| `SearchInput` | `SearchInput.tsx` | 픽셀 아이콘 붙은 검색창 |
| `TabBar` | `TabBar.tsx` | 세그먼트 탭 필터 (전체/공개/초안 등) |
| `SectionHeader` | `SectionHeader.tsx` | 섹션 제목 + 우측 액션 버튼 |
| `ToggleSwitch` | `ToggleSwitch.tsx` | ON/OFF 토글 스위치 |
| `ColorPicker` | `ColorPicker.tsx` | 색상 스와치 선택기 |
| `DashedButton` | `DashedButton.tsx` | 점선 테두리 추가 버튼 |
| `UserRow` | `UserRow.tsx` | 사용자 목록 행 (아바타 + 이름 + 배지 + 메타) |

### 레이아웃 (`src/components/layout/`)

| 컴포넌트 | 파일 | 용도 |
|---------|------|------|
| `AppLayout` | `AppLayout.tsx` | 고객 앱 (사이드바 240px + 하단 탭바) |
| `MasterLayout` | `MasterLayout.tsx` | 관리자 (사이드바 220px) |

---

## 3. 색상 팔레트

팔레트 외 HEX 직접 사용 금지. 항상 아래 토큰 또는 Tailwind 클래스 사용.

| 토큰 | HEX | Tailwind | 용도 |
|------|-----|----------|------|
| `--color-mustard` | `#ffc93c` | `bg-mustard` | CTA, 배지, 강조 |
| `--color-pink` | `#ff57a6` | `bg-pink` | 로고, FAB, 주요 버튼 |
| `--color-mint` | `#7fe0bb` | `bg-mint` | 보조 강조 |
| `--color-blue` | `#9fd3f5` | `bg-blue` | 보조 강조, 통계 카드 |
| `--color-peach` | `#ffb784` | `bg-peach` | 히어로, 통계 카드 |
| `--color-cream` | `#fff7e6` | `bg-cream` | 기본 배경 |
| `--color-ink` | `#111111` | `bg-ink` | 텍스트, 보더, 섀도우 |

**배경 → 텍스트 자동 규칙**
- Pink / Ink 배경 → 흰색(`#fff`) 텍스트
- 나머지 → 검정(`#111`) 텍스트

---

## 4. 타이포그래피

| Tailwind 클래스 | 용도 |
|----------------|------|
| `font-headline` | 히어로 H1, 카드 제목 |
| `font-sub` | 버튼, 네비게이션, 소제목 |
| `font-body` | 본문, 설명 텍스트 |
| `font-pixel` | 배지, 픽셀 라벨, 수치 |

---

## 5. 보더 & 섀도우 규칙

모든 카드/버튼에 두꺼운 보더 + 오프셋 섀도우 필수.

```
보더:   neo-border (3px) / neo-border-4 (4px)
섀도우: neo-shadow-sm (3px) / neo-shadow-md (5px) / neo-shadow-lg (8px)
        또는 --shadow-sm / --shadow-md / --shadow-lg CSS 변수
```

Hover 효과: `neo-card-lift` 클래스 (CSS만, useState 불필요)

---

## 6. 유틸리티 클래스

```
pixel-badge         검정 배경 + 노란 텍스트 배지
pixel-badge-muted   반투명 배경 배지
pixel-badge-pro     노란 배경 + 보더 PRO 배지
neo-grid-sm         auto-fill, min 180px 그리드
neo-grid-md         auto-fill, min 220px 그리드
neo-input           표준 입력 필드 스타일
neo-card-lift       hover lift 효과 (CSS only)
neo-shadow-sm/md/lg 섀도우 유틸리티
```

---

## 7. 컴포넌트 사용 예시

### 카드 + 버튼

```tsx
import NeoCard from "@/components/ui/NeoCard";
import NeoButton from "@/components/ui/NeoButton";

<NeoCard bg="var(--color-blue)" pad={20} shadow={5}>
  <h2 className="font-headline text-[20px]">제목</h2>
  <NeoButton bg="var(--color-mustard)" color="#111" size="sm">
    확인
  </NeoButton>
</NeoCard>
```

### 통계 카드 그리드

```tsx
import StatCard from "@/components/ui/StatCard";

<div className="neo-grid-sm">
  <StatCard label="총 사이트" value="12" icon="doc" bg="bg-blue" />
  <StatCard label="공개 사이트" value="8" icon="share" bg="bg-mint" />
</div>
```

### 사이트 목록

```tsx
import SiteCard from "@/components/ui/SiteCard";

<div className="neo-grid-md">
  {sites.map((s) => (
    <SiteCard
      key={s.id}
      {...s}
      onEdit={(id) => navigate(`/editor/${id}`)}
    />
  ))}
</div>
```

### 탭 필터

```tsx
import TabBar from "@/components/ui/TabBar";

const TABS = [
  { id: "all",     label: "전체" },
  { id: "public",  label: "공개" },
  { id: "draft",   label: "초안" },
];

<TabBar tabs={TABS} active={filter} onChange={setFilter} className="mb-5" />
```

### 섹션 헤더

```tsx
import SectionHeader from "@/components/ui/SectionHeader";
import NeoButton from "@/components/ui/NeoButton";
import PixelIcon from "@/components/ui/PixelIcon";

<SectionHeader
  title="내 사이트"
  titleSize={28}
  as="h1"
  className="mb-6"
  action={
    <NeoButton bg="var(--color-pink)" size="sm" onClick={() => navigate("/editor/new")}>
      <span className="flex items-center gap-1.5">
        <PixelIcon name="plus" size={12} fill="#fff" />
        새 사이트
      </span>
    </NeoButton>
  }
/>
```

### 검색 + 탭 조합

```tsx
import SearchInput from "@/components/ui/SearchInput";

<SearchInput
  value={search}
  onChange={setSearch}
  placeholder="템플릿 검색..."
  maxWidth={420}
  className="mb-5"
/>
```

### 에디터 폼 요소

```tsx
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import ColorPicker from "@/components/ui/ColorPicker";
import DashedButton from "@/components/ui/DashedButton";

<ToggleSwitch label="도트 배경" checked={dotBg} onChange={setDotBg} />

<ColorPicker
  label="버튼 색상"
  colors={["#FF57A6", "#ffc93c", "#7fe0bb", "#9fd3f5"]}
  value={selectedColor}
  onChange={setSelectedColor}
/>

<DashedButton icon="plus" onClick={addPage}>페이지 추가</DashedButton>
```

### StatusBadge 단독 사용

```tsx
import StatusBadge, { inferVariant } from "@/components/ui/StatusBadge";

// 자동 variant 감지
<StatusBadge variant={inferVariant(status)}>{status}</StatusBadge>

// 직접 지정
<StatusBadge variant="pro">PRO</StatusBadge>
<StatusBadge variant="default">공개</StatusBadge>
<StatusBadge variant="muted">초안</StatusBadge>
```

---

## 8. 금지 사항

- `style={{ boxShadow: "5px 5px 0 #111" }}` — `neo-shadow-md` 클래스 또는 `--shadow-md` 변수 사용
- `<span className="pixel-badge">` — `StatusBadge` 컴포넌트 사용
- `<div className="neo-border p-5 bg-blue" style={{ boxShadow: ... }}>` + 수치/아이콘 — `StatCard` 사용
- `<div className="neo-border overflow-hidden ...">` + 썸네일 + 버튼 패턴 — `SiteCard` / `TemplateCard` 사용
- 팔레트 외 HEX 색상 직접 사용 (e.g. `#ff0000`)
- `border-radius` 크게 사용 (카드 기본값 = 0, 버튼 = 8px)
- 그림자 없는 카드/버튼

---

## 9. 파일 구조

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx       고객 레이아웃
│   │   └── MasterLayout.tsx    관리자 레이아웃
│   └── ui/
│       ├── NeoButton.tsx
│       ├── NeoCard.tsx
│       ├── PixelIcon.tsx
│       ├── StatusBadge.tsx
│       ├── StatCard.tsx
│       ├── SiteCard.tsx
│       ├── TemplateCard.tsx
│       ├── SearchInput.tsx
│       ├── TabBar.tsx
│       ├── SectionHeader.tsx
│       ├── ToggleSwitch.tsx
│       ├── ColorPicker.tsx
│       ├── DashedButton.tsx
│       └── UserRow.tsx
├── pages/
│   ├── public/         LandingPage, PlayerPage
│   ├── customer/       Dashboard, MySites, Browse, Settings
│   ├── master/         MasterDashboard
│   └── editor/         SiteEditor
├── store/
│   └── themeStore.ts   Zustand 테마 (default/pastel/dark/mono)
├── utils/
│   └── cn.ts           clsx 래퍼
└── index.css           디자인 토큰, @utility 정의
```

---

## 10. 상세 디자인 가이드

전체 색상/타이포/애니메이션 상세 → `docs/DESIGN_SYSTEM.md`
