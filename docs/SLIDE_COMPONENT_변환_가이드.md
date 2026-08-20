# JoyCraft 슬라이드 컴포넌트 변환 가이드

> DC(Design Canvas) 형식의 프로토타입 컴포넌트를 React TSX 슬라이드 컴포넌트로 변환하는 가이드.
> **모든 18종 슬라이드 구현 완료 (2025-08 기준)**

---

## 1. 변환 대상 목록

| ID | 이름 | 원본 파일 | componentRef | 카테고리 | 상태 |
|----|------|----------|-------------|---------|------|
| A2 | 기념일 잠금 | 4종.dc.html | `pin-lock` | 인터랙션 | ✅ |
| A3 | 지문 인증 | 4종.dc.html | `fingerprint` | 인터랙션 | ✅ |
| A4 | 퀴즈 | 4종.dc.html | `quiz` | 인터랙션 | ✅ |
| A5 | 룰렛 | 4종.dc.html | `roulette` | 인터랙션 | ✅ |
| B1 | 스크래치 복권 | B그룹.dc.html | `scratch-lottery` | 인터랙션 | ✅ |
| B2 | 어둠 속 손전등 | B그룹.dc.html | `flashlight` | 인터랙션 | ✅ |
| B3 | 선물상자 열기 | B그룹.dc.html | `gift-box` | 인터랙션 | ✅ |
| B4 | 사진 퍼즐 | B그룹.dc.html | `photo-puzzle` | 인터랙션 | ✅ |
| C1 | 하트 연타 | CD그룹.dc.html | `heart-gauge` | 감정 | ✅ |
| C2 | 풍선 터뜨리기 | CD그룹.dc.html | `balloon-pop` | 감정 | ✅ |
| D1 | 편지 열기 | CD그룹.dc.html | `envelope-letter` | 읽기 | ✅ |
| D2 | 타자기 편지 | CD그룹.dc.html | `typewriter` | 읽기 | ✅ |
| D3 | 롤링페이퍼 | CD그룹.dc.html | `rolling-paper` | 읽기 | ✅ |
| D4 | 카세트 | CD그룹.dc.html | `cassette-player` | 읽기 | ✅ |
| E2 | 페이지 책 | EF그룹.dc.html | `story-book` | 이야기 | ✅ |
| E3 | 엔딩 크레딧 | EF그룹.dc.html | `ending-credits` | 연출 | ✅ |
| F3 | D-day 카운트다운 | EF그룹.dc.html | `dday-counter` | 연출 | ✅ |
| F4 | 소원 등불 | EF그룹.dc.html | `wish-lantern` | 연출 | ✅ |

---

## 2. 파일 구조

### 2-1. 전체 디렉토리

```
src/slides/
├── registry.ts              ← 컴포넌트 + 스키마 등록
├── SlideProps.ts             ← 공통 props 타입 + 스키마 타입
├── arrayFieldValue.ts        ← type:"array" 필드의 직렬화/역직렬화 유틸
├── schemaAdapter.ts          ← 서버 스키마 ↔ 로컬 스키마 변환·병합
├── schemaAdapter.test.ts     ← 어댑터 단위 테스트
├── useVibrate.ts             ← 공통 훅: 진동
├── useAudio.ts               ← 공통 훅: Web Audio 사운드
├── useHoldProgress.ts        ← 공통 훅: 길게 누르기 게이지
├── useSlideComplete.ts       ← 공통 훅: 완료 신호 (isPreview 체크 + 1회 보장)
├── useSlideTimeout.ts        ← 공통 훅: 언마운트 시 자동 정리 setTimeout
├── slide-animations.css      ← 공통 keyframes
│
├── pin-lock/
│   ├── PinLock.tsx
│   ├── schema.ts
│   └── index.ts
│
├── ... (나머지 17개 동일 구조)
│
└── index.ts                  ← 전체 슬라이드 일괄 import
```

### 2-2. 각 슬라이드 폴더 내 파일 역할

| 파일 | 역할 |
|------|------|
| `ComponentName.tsx` | 순수 React 컴포넌트. `data` props만 받아서 렌더링 |
| `schema.ts` | CUSTOMER에게 노출할 편집 필드 정의 + 기본값 |
| `index.ts` | 컴포넌트 export + `registerSlide()` 호출 (schema 포함) |

---

## 3. 공통 타입 정의

### 3-1. SlideProps (모든 슬라이드가 받는 props)

```ts
// src/slides/SlideProps.ts

// T extends object 로 쓴다.
// Record<string, unknown> 제약을 걸면 인덱스 시그니처가 없는 인터페이스가
// 전부 컴파일 에러가 나기 때문에 object 제약으로 완화한다.
export interface SlideProps<T extends object = Record<string, unknown>> {
  /** defaultValues + overrides가 merge된 최종 데이터 */
  data: T;

  /** 슬라이드 완료 시 호출 (다음 슬라이드로 전환) */
  onComplete?: () => void;

  /** 에디터 미리보기 모드 — true면 onComplete 호출 안 함 */
  isPreview?: boolean;
}
```

### 3-2. SchemaFieldDef (스키마 정의용 타입)

```ts
// src/slides/SlideProps.ts 에 같이 정의

/**
 * 편집 위젯 종류.
 *
 * - `array`    : 항목 목록. 값은 JSON 문자열로 저장한다.
 *                항목 내부 필드는 `itemFields`로 기술한다.
 * - `textlist` : 문자열 배열. 값은 string[]. 줄 단위로 편집한다.
 *                (예: quiz 문항의 choices — 첫 줄이 정답)
 */
export type SchemaFieldType =
  | "text"
  | "textarea"
  | "color"
  | "number"
  | "font"
  | "image"
  | "select"
  | "boolean"
  | "array"
  | "textlist";

export interface SchemaFieldDef {
  key: string;
  label: string;
  type: SchemaFieldType;
  default: unknown;
  required?: boolean;
  placeholder?: string;
  /** 편집 패널에 보조 설명으로 노출 */
  hint?: string;
  // number 전용
  min?: number;
  max?: number;
  step?: number;
  // select 전용
  options?: { label: string; value: string }[];

  // ── type: "array" 전용 ──────────────────────────────────
  /** 항목 1개 안의 필드 정의 */
  itemFields?: SchemaFieldDef[];
  /** 항목 1개를 부르는 이름 (예: "문항", "슬라이스") */
  itemLabel?: string;
  /**
   * 새 항목을 만들 때 깔아주는 기본 골격.
   * itemFields로 노출하지 않지만 슬라이드가 필요로 하는 키를 여기에 둔다.
   * (예: cassette-player 트랙의 root / scale / tempo)
   * 기존 항목의 미노출 키는 편집 중에도 그대로 보존된다.
   */
  itemDefaults?: Record<string, unknown>;
}

export interface SlideSchema {
  fields: SchemaFieldDef[];
}
```

---

## 4. DC → React 문법 변환 규칙

### 4-1. 템플릿 바인딩

| DC 문법 | React JSX |
|---------|-----------|
| `{{ variable }}` | `{variable}` |
| `{{ obj.prop }}` | `{obj.prop}` |
| `style="{{ styleObj }}"` | `style={styleObj}` |
| `onClick="{{ handler }}"` | `onClick={handler}` |

### 4-2. 조건부 렌더링

```html
<!-- DC -->
<sc-if value="{{ isOpen }}" hint-placeholder-val="{{ false }}">
  <div>열렸습니다</div>
</sc-if>
```

```tsx
// React
{isOpen && (
  <div>열렸습니다</div>
)}
```

### 4-3. 반복 렌더링

```html
<!-- DC -->
<sc-for list="{{ items }}" as="item" hint-placeholder-count="4">
  <div style="{{ item.style }}">{{ item.label }}</div>
</sc-for>
```

```tsx
// React
{items.map((item) => (
  <div key={item.key} style={item.style}>{item.label}</div>
))}
```

### 4-4. 클래스 → 함수형 컴포넌트

DC의 `DCLogic` 클래스는 React 클래스 컴포넌트와 유사한 구조다.
변환 시 함수형 컴포넌트 + Hooks로 바꾼다.

| DCLogic | React Hooks |
|---------|-------------|
| `state = { ... }` | `useState()` |
| `componentDidMount()` | `useEffect(() => { ... }, [])` |
| `componentDidUpdate(pp, ps)` | `useEffect()` 의존성 배열 활용 |
| `componentWillUnmount()` | `useEffect` 의 cleanup return |
| `this.setState(patch)` | `setState(prev => ({ ...prev, ...patch }))` |
| `renderVals()` | 컴포넌트 함수 본문에서 직접 계산 |
| 클래스 인스턴스 변수 (`this._xxx`) | `useRef()` |

### 4-5. 변환 전후 비교 (B1 스크래치 복권 발췌)

**변환 전 (DC)**:
```js
class Component extends DCLogic {
  state = { b1Revealed: false, b1Ratio: 0 };

  componentDidMount() { this.initScratch(); }
  componentWillUnmount() { cancelAnimationFrame(this._raf); }

  initScratch() {
    const c = this._b1c;
    // canvas 초기화 ...
  }

  b1Scratch(e) {
    const ctx = this._b1ctx;
    const { x, y } = this.b1Pos(e);
    ctx.beginPath(); ctx.arc(x, y, 24, 0, 7); ctx.fill();
  }

  renderVals() {
    return {
      b1Msg: this.state.b1Revealed ? '🎉 당첨!' : '긁어보세요',
      b1CanvasStyle: { ... },
    };
  }
}
```

**변환 후 (React TSX)**:
```tsx
import { useState, useRef, useEffect, useCallback } from "react";
import type { SlideProps } from "../SlideProps";
import { useSlideComplete } from "../useSlideComplete";

interface ScratchData {
  prizeEmoji: string;
  prizeText: string;
  prompt: string;
  backgroundColor: string;
  accentColor: string;
}

export default function ScratchLottery({
  data, onComplete, isPreview,
}: SlideProps<ScratchData>) {
  const { prizeEmoji, prizeText, prompt, backgroundColor } = data;

  const [revealed, setRevealed] = useState(false);
  const [ratio, setRatio] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingRef = useRef(false);

  const complete = useSlideComplete(onComplete, isPreview);

  useEffect(() => {
    initScratch();
    return () => { /* cleanup */ };
  }, []);

  const initScratch = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    ctxRef.current = c.getContext("2d");
    // canvas 초기화 ...
  }, []);

  const handleScratch = useCallback((e: React.PointerEvent) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    // 긁기 로직 ...
  }, []);

  const msg = revealed ? "🎉 당첨!" : "긁어보세요";

  return (
    <div style={{ background: backgroundColor, position: "absolute", inset: 0 }}>
      <p>{prompt}</p>
      <div style={{ position: "relative" }}>
        <div>{prizeEmoji} {prizeText}</div>
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handleScratch}
          onPointerUp={handlePointerUp}
        />
      </div>
      <p>{msg}</p>
    </div>
  );
}
```

---

## 5. schema.ts 작성 규칙

### 5-1. 기본 구조

```ts
// src/slides/scratch-lottery/schema.ts
import type { SlideSchema } from "../SlideProps";

export const schema: SlideSchema = {
  fields: [
    {
      key: "prizeEmoji",
      label: "당첨 이모지",
      type: "text",
      default: "🎉",
    },
    {
      key: "prizeText",
      label: "당첨 메시지",
      type: "textarea",
      default: "당첨!\n오늘 저녁은 내가 쏜다",
      required: true,
    },
    {
      key: "prompt",
      label: "안내 문구",
      type: "text",
      default: "은박을 긁어서 확인해 보세요",
    },
    {
      key: "backgroundColor",
      label: "배경 색상",
      type: "color",
      default: "#2b2340",
    },
    {
      key: "accentColor",
      label: "강조 색상",
      type: "color",
      default: "#c7b8e0",
    },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
```

### 5-2. DC 원본에서 스키마 필드 추출하는 방법

DC 원본의 **상수 객체**가 곧 CUSTOMER에게 열어줄 편집 필드다.

```js
// DC 원본 (B3)
B3 = { inside: '짜잔! 열어줘서 고마워 🎁', hint: '리본을 아래로 당겨보세요', pull: 130 };
```

위에서:
- `inside` → `type: "textarea"`, CUSTOMER가 바꿀 수 있음
- `hint` → `type: "text"`, CUSTOMER가 바꿀 수 있음
- `pull` → 내부 로직 값이므로 스키마에 **포함하지 않음**

**원칙**: 텍스트, 색상, 이미지 등 **콘텐츠** 성격의 값만 스키마에 넣는다.
속도, 거리, 카운트 등 **로직** 값은 넣지 않거나 `number` 타입으로 선택적 제공.

### 5-3. 각 컴포넌트별 스키마 (실제 구현 기준)

#### A2: 기념일 잠금 (`pin-lock`)

| key | type | label | default |
|-----|------|-------|---------|
| `question` | text | 질문 문구 | "우리가 처음 만난 날은?" |
| `answer` | text | 정답 (4자리 숫자) | "0214" |
| `hint` | text | 힌트 문구 | "달력에 하트 그려둔 그날 💕" |
| `hintAfter` | number | 힌트 표시 (틀린 횟수) | 3 (min:1, max:10) |
| `successMessage` | text | 성공 메시지 | "정답! 열어볼까?" |
| `backgroundColor` | color | 배경 색상 | "#1b1533" |
| `accentColor` | color | 강조 색상 (자물쇠) | "#FFD97D" |

#### A3: 지문 인증 (`fingerprint`)

| key | type | label | default |
|-----|------|-------|---------|
| `prompt` | textarea | 안내 문구 | "손가락을 올려서\n인증해주세요" |
| `successMessage` | textarea | 인증 완료 메시지 | "본인 확인 완료.\n당신에게만 열리는 페이지예요." |
| `holdDuration` | number | 인증 시간 (초) | 2.5 (min:1, max:5, step:0.5) |
| `ringColor` | color | 게이지 색상 | "#4dd0ff" |

#### A4: 퀴즈 (`quiz`)

| key | type | label | default |
|-----|------|-------|---------|
| `intro` | text | 소개 문구 | "얼마나 알고 있나 볼까 😏" |
| `highScoreMessage` | text | 고득점 메시지 | "역시 나를 제일 잘 아는 사람 💯" |
| `lowScoreMessage` | text | 저득점 메시지 | "음... 우리 더 친해지자 😂" |
| `questions` | array | 퀴즈 목록 | JSON 배열 (3문항) |
| `backgroundColor` | color | 배경 색상 | "#FFF8F0" |
| `accentColor` | color | 강조 색상 | "#E94F6A" |

`questions` itemFields:

| key | type | 설명 |
|-----|------|------|
| `q` | textarea | 질문 |
| `choices` | textlist | 선택지 (한 줄=하나, 첫 줄이 정답) |
| `explain` | text | 해설 |

#### A5: 룰렛 (`roulette`)

| key | type | label | default |
|-----|------|-------|---------|
| `title` | textarea | 제목 | "오늘 뭐 할지\n룰렛이 정해줄게" |
| `slices` | array | 룰렛 항목 | JSON 배열 (6칸) |
| `backgroundColor` | color | 배경 색상 | "#fff5f7" |
| `accentColor` | color | 강조 색상 | "#E94F6A" |

`slices` itemFields:

| key | type | 설명 |
|-----|------|------|
| `label` | text | 칸 이름 |
| `detail` | textarea | 당첨 시 문구 |
| `weight` | number | 가중치 (1~9, 클수록 잘 뽑힘) |
| `color` | color | 칸 색상 |

#### B1: 스크래치 복권 (`scratch-lottery`)

| key | type | label | default |
|-----|------|-------|---------|
| `prizeEmoji` | text | 당첨 이모지 | "🎉" |
| `prizeText` | textarea | 당첨 메시지 | "당첨!\n오늘 저녁은 내가 쏜다" |
| `prompt` | text | 안내 문구 | "은박을 긁어서 확인해 보세요" |
| `backgroundColor` | color | 배경 색상 | "#2b2340" |
| `accentColor` | color | 강조 색상 | "#c7b8e0" |

#### B2: 어둠 속 손전등 (`flashlight`)

| key | type | label | default |
|-----|------|-------|---------|
| `instruction` | text | 안내 문구 | "화면을 비춰서 찾아보세요" |
| `clearText` | textarea | 클리어 메시지 | "우리 추억,\n다 찾았네 ✨" |
| `spots` | array | 숨겨진 아이템 | JSON 배열 (3개) |
| `backgroundColor` | color | 배경 색상 | "#0d1117" |

`spots` itemFields:

| key | type | 설명 |
|-----|------|------|
| `emoji` | text | 이모지 |
| `caption` | text | 설명 |
| `x` | number | 가로 위치 (0~1, 소수점) |
| `y` | number | 세로 위치 (0~1, 소수점) |

#### B3: 선물상자 열기 (`gift-box`)

| key | type | label | default |
|-----|------|-------|---------|
| `insideMessage` | textarea | 상자 안 메시지 | "짜잔! 열어줘서 고마워 🎁" |
| `hint` | text | 안내 문구 | "리본을 아래로 당겨보세요" |
| `boxColor` | color | 상자 색상 | "#E94F6A" |
| `ribbonColor` | color | 리본 색상 | "#FFD97D" |
| `backgroundColor` | color | 배경 색상 | "#fff0f3" |

#### B4: 사진 퍼즐 (`photo-puzzle`)

| key | type | label | default |
|-----|------|-------|---------|
| `clearText` | textarea | 완성 메시지 | "우리 처음 만난 날\n기억나?" |
| `puzzleImage` | image | 퍼즐 이미지 URL | null (기본: 그라데이션) |
| `gridSize` | number | 격자 크기 | 3 (min:2, max:4) |

#### C1: 하트 연타 (`heart-gauge`)

| key | type | label | default |
|-----|------|-------|---------|
| `title` | text | 제목 | "마음 게이지" |
| `targetCount` | number | 목표 탭 횟수 | 30 (min:10, max:100, step:5) |
| `successMessage` | textarea | 성공 메시지 | "마음이\n가득 찼어요 💗" |
| `heartColor` | color | 하트 색상 | "#E94F6A" |
| `backgroundColor` | color | 배경 색상 | "#fff0f4" |

#### C2: 풍선 터뜨리기 (`balloon-pop`)

| key | type | label | default |
|-----|------|-------|---------|
| `successMessage` | textarea | 성공 메시지 | "펑펑!\n생일 축하해 🎂" |
| `balloons` | array | 풍선 목록 | JSON 배열 (6개) |
| `backgroundColor` | color | 배경 색상 | "#eaf6ff" |

`balloons` itemFields:

| key | type | 설명 |
|-----|------|------|
| `emoji` | text | 이모지 |
| `color` | color | 풍선 색상 |
| `x` | number | 가로 위치 % (0~75) |
| `y` | number | 세로 위치 % (0~70) |

#### D1: 편지 열기 (`envelope-letter`)

| key | type | label | default |
|-----|------|-------|---------|
| `letterBody` | textarea | 편지 내용 | "늘 곁에 있어줘서\n고마워.\n오늘도 사랑해 💌" |
| `hint` | text | 안내 문구 | "봉투를 탭해서 편지를 열어보세요" |
| `envelopeColor` | color | 봉투 색상 | "#e8c98a" |
| `sealColor` | color | 봉랍 색상 | "#E94F6A" |
| `backgroundColor` | color | 배경 색상 | "#f4ede0" |

#### D2: 타자기 편지 (`typewriter`)

| key | type | label | default |
|-----|------|-------|---------|
| `letterText` | textarea | 편지 내용 | "보고 싶었어.\n\n오늘 하루는 어땠어?..." |
| `typingSpeed` | number | 타이핑 속도 (ms) | 62 (min:20, max:200, step:10) |
| `enableSound` | boolean | 타이핑 사운드 | true |
| `paperColor` | color | 종이 색상 | "#f6f0e2" |
| `backgroundColor` | color | 배경 색상 | "#2b2620" |

#### D3: 롤링페이퍼 (`rolling-paper`)

| key | type | label | default |
|-----|------|-------|---------|
| `title` | text | 제목 | "우리들의 롤링페이퍼" |
| `seedNotes` | array | 초기 메모 | JSON 배열 (4개) |
| `allowUserInput` | boolean | 방문자 작성 허용 | true |
| `backgroundColor` | color | 배경 색상 | "#faf4ea" |

`seedNotes` itemFields:

| key | type | 설명 |
|-----|------|------|
| `text` | textarea | 메모 내용 |
| `from` | text | 보낸 사람 |
| `color` | color | 이름 색상 |

#### D4: 카세트 (`cassette-player`)

| key | type | label | default |
|-----|------|-------|---------|
| `tracks` | array | 트랙 목록 | JSON 배열 (3곡) |
| `note` | text | 하단 안내 | "실제 재생되는 로파이 멜로디예요 🎧..." |
| `tapeColor` | color | 테이프 색상 | "#f0e6d0" |
| `backgroundColor` | color | 배경 색상 | "#3a2e2a" |

`tracks` itemFields (편집 노출):

| key | type | 설명 |
|-----|------|------|
| `title` | text | 곡 제목 |
| `artist` | text | 아티스트 |
| `dur` | number | 길이 (초, 5~600) |

`tracks` itemDefaults (편집 미노출, 멜로디 생성용):

```ts
{ root: 261.63, scale: [0, 2, 4, 7, 9], tempo: 300 }
```

#### E2: 페이지 책 (`story-book`)

| key | type | label | default |
|-----|------|-------|---------|
| `pages` | array | 페이지 목록 | JSON 배열 (5페이지) |
| `footerText` | text | 안내 문구 | "← 좌우로 넘겨보세요 →" |
| `backgroundColor` | color | 배경 색상 | "#efe6d6" |

`pages` itemFields:

| key | type | 설명 |
|-----|------|------|
| `emoji` | text | 이모지 |
| `title` | text | 소제목 |
| `text` | textarea | 내용 |
| `bgColor` | color | 페이지 배경 |

#### E3: 엔딩 크레딧 (`ending-credits`)

| key | type | label | default |
|-----|------|-------|---------|
| `movieTitle` | text | 영화 제목 | "우리들의 1년" |
| `endMessage` | textarea | 마지막 메시지 | "THE END\n고마웠어 ♥" |
| `credits` | array | 크레딧 목록 | JSON 배열 (8개) |
| `enableSound` | boolean | 배경음 재생 | true |

`credits` itemFields:

| key | type | 설명 |
|-----|------|------|
| `role` | text | 역할 |
| `name` | text | 이름 |

#### F3: D-day 카운트다운 (`dday-counter`)

| key | type | label | default |
|-----|------|-------|---------|
| `eventName` | text | 이벤트 이름 | "크리스마스" |
| `targetDate` | text | 목표 날짜 (YYYY-MM-DD) | "2026-12-25" |
| `message` | textarea | 하단 메시지 | "조금만 더 기다리면\n만날 수 있어 💫" |
| `accentColor` | color | 강조 색상 | "#FFD97D" |
| `backgroundColor` | color | 배경 색상 | "#1e1b3a" |

#### F4: 소원 등불 (`wish-lantern`)

| key | type | label | default |
|-----|------|-------|---------|
| `prompt` | text | 안내 문구 | "소원을 적고 하늘로 띄워보내요" |
| `doneMessage` | textarea | 완료 메시지 | "소원이\n하늘로 올라갔어요 🌟" |
| `lanternColor` | color | 등불 색상 | "#ffb463" |
| `backgroundColor` | color | 배경 색상 | "#0a0f26" |

---

## 6. 복합 타입 (배열 필드) 처리

퀴즈의 `questions`, 룰렛의 `slices`, 롤링페이퍼의 `seedNotes` 등
배열 구조는 **`type: "array"`** 로 구현한다. (1차 구현부터 전용 배열 에디터 방식 채택)

### 6-1. 저장 형태

값은 **JSON 문자열**로 저장한다. DB의 `default_values` (JSONB)와 V7 시드가 이 형태다.

```json
{
  "questions": "[{\"q\":\"...\",\"choices\":[...],\"explain\":\"...\"}]"
}
```

### 6-2. 컴포넌트 내부 파싱

```tsx
// 컴포넌트에서 안전하게 파싱
const questions: QuizQuestion[] = useMemo(() => {
  if (Array.isArray(data.questions)) return data.questions;
  try { return JSON.parse(data.questions as string); }
  catch { return DEFAULT_QUESTIONS; }
}, [data.questions]);
```

### 6-3. arrayFieldValue.ts 유틸

배열 필드의 직렬화/역직렬화는 `src/slides/arrayFieldValue.ts`에 모아두었다.

| 함수 | 역할 |
|------|------|
| `parseArrayValue(value)` | 저장값(문자열/배열/null) → `{ok, items, raw}` |
| `serializeArrayValue(items)` | 항목 배열 → JSON 문자열 |
| `makeArrayItem(field)` | 스키마 기준 새 항목 생성 (itemDefaults + itemFields default) |
| `setItemValue(item, key, value)` | 항목 1개 특정 키만 변경 (미노출 키 보존) |
| `moveArrayItem(items, from, to)` | 항목 순서 변경 |
| `summarizeItem(item, itemFields)` | 항목 카드 헤더용 대표 문자열 |

---

## 7. 공통 훅 (Hooks)

### 7-1. useVibrate

```ts
// src/slides/useVibrate.ts
export function useVibrate() {
  return (pattern: number | number[]) => {
    try { navigator.vibrate?.(pattern); } catch {}
  };
}
```

**사용**: 18개 컴포넌트 중 16개.

### 7-2. useAudio

```ts
// src/slides/useAudio.ts
export function useAudio() {
  // ...
  const blip = useCallback((
    freq = 440, dur = 0.06, type: OscillatorType = "square", gain = 0.15
  ) => { /* Web Audio API로 단발 사운드 */ }, []);

  return { getAc, blip };
}
```

**사용**: C1, C2, D1, D2, D4, E2, E3, F4 (8개 컴포넌트).

### 7-3. useHoldProgress

길게 누르기 패턴 (A3 지문인증, F4 소원등불).

```ts
// src/slides/useHoldProgress.ts
export function useHoldProgress(duration: number, onComplete: () => void) {
  // rAF 기반 게이지 진행
  return { progress, holding, down, up, reset };
}
```

### 7-4. useSlideComplete *(신규)*

```ts
// src/slides/useSlideComplete.ts
export function useSlideComplete(onComplete?: () => void, isPreview?: boolean) {
  // isPreview이면 호출하지 않음
  // 슬라이드 인스턴스당 한 번만 호출됨
  // 언마운트 이후에는 호출되지 않음
  return complete; // () => void
}
```

**사용 목적**: `isPreview` 체크 + 단발성 보장을 모든 슬라이드에서 반복 구현하지 않기 위해 추출.

```tsx
// 사용 예시
const complete = useSlideComplete(onComplete, isPreview);
// ...
complete(); // 완료 조건 충족 시
```

### 7-5. useSlideTimeout *(신규)*

```ts
// src/slides/useSlideTimeout.ts
export function useSlideTimeout() {
  // 반환된 later로 예약한 타이머는 언마운트 시 전부 취소된다
  return later; // (fn: () => void, ms: number) => number
}
```

**사용 목적**: 슬라이드 대부분이 "1~2초 뒤 완료" 같은 지연 동작을 갖는데,
언마운트 후 타이머가 살아남아 dead 컴포넌트 상태를 건드리는 사고를 방지.

```tsx
// 사용 예시
const later = useSlideTimeout();
later(() => complete(), 1500);
```

---

## 8. 스타일 처리 규칙

### 8-1. 인라인 style 유지

슬라이드 컴포넌트는 **플랫폼 디자인 시스템(Neo-Brutalism)을 따르지 않는다**.
슬라이드는 독립된 "캔버스"이므로 인라인 style을 그대로 사용한다.

> CLAUDE.md의 "인라인 style 최소화" 규칙은 플랫폼 UI(레이아웃, 에디터)에만 적용.
> 슬라이드 컴포넌트는 예외.

### 8-2. CSS 변수 대신 data props

슬라이드 내 색상은 `var(--color-xxx)` 대신 `data.backgroundColor` 등
props로 받은 값을 직접 사용한다.

```tsx
// ✅ 맞음
<div style={{ background: data.backgroundColor }}>

// ❌ 틀림 (슬라이드에서는 플랫폼 토큰 사용 금지)
<div className="bg-cream">
```

### 8-3. 애니메이션 keyframes

DC 원본의 `@keyframes`는 `src/slides/slide-animations.css`에 모아둔다.
`src/slides/index.ts`에서 import 한다.

```css
@keyframes jc-pop { 0%{transform:scale(.4);opacity:0} 60%{transform:scale(1.12)} 100%{transform:scale(1);opacity:1} }
@keyframes jc-fadeup { 0%{transform:translateY(14px);opacity:0} 100%{transform:translateY(0);opacity:1} }
@keyframes jc-shake { ... }
@keyframes jc-beat { ... }
/* ... */
```

### 8-4. 폰트

| 폰트 | 용도 | 로딩 |
|------|------|------|
| Pretendard | 기본 본문 | CDN (이미 프로젝트에 있음) |
| Nanum Pen Script | 손글씨 메시지 | Google Fonts |
| Gaegu | 손글씨 (롤링페이퍼, 카세트) | Google Fonts |
| Special Elite | 타자기 | Google Fonts |

---

## 9. 등록 방법

### 9-1. 개별 슬라이드 index.ts

```ts
// src/slides/scratch-lottery/index.ts
import { registerSlide } from "../registry";
import ScratchLottery from "./ScratchLottery";
import { schema } from "./schema";

export { ScratchLottery };
export { schema, defaultValues } from "./schema";

// 세 번째 인수로 schema를 넘겨야 에디터가 위젯을 그린다
registerSlide("scratch-lottery", ScratchLottery, schema);
```

### 9-2. 전체 일괄 등록

```ts
// src/slides/index.ts
import "./slide-animations.css";

// A그룹
import "./pin-lock";
import "./fingerprint";
import "./quiz";
import "./roulette";

// B그룹
import "./scratch-lottery";
import "./flashlight";
import "./gift-box";
import "./photo-puzzle";

// C그룹
import "./heart-gauge";
import "./balloon-pop";

// D그룹
import "./envelope-letter";
import "./typewriter";
import "./rolling-paper";
import "./cassette-player";

// E그룹
import "./story-book";
import "./ending-credits";

// F그룹
import "./dday-counter";
import "./wish-lantern";
```

### 9-3. 앱 진입점에서 로드

```ts
// src/main.tsx 또는 src/App.tsx 상단
import "./slides";
```

이후 에디터나 플레이어에서:

```tsx
import { resolveSlide, resolveSlideSchema } from "@/slides/registry";

const SlideComponent = resolveSlide(slide.componentRef);
if (SlideComponent) {
  const mergedData = { ...slide.defaultValues, ...slide.overrides };
  return <SlideComponent data={mergedData} onComplete={goNext} />;
}
```

### 9-4. 에디터용 스키마 조회

```ts
import { resolveEditorSchema } from "@/slides/schemaAdapter";

// 로컬 스키마 우선, 서버 스키마는 누락 필드 보충에만 사용
const schema = resolveEditorSchema(componentRef, serverSchemaFields);
// schema.source: "local" | "server" | "empty"
// schema.serverOnlyKeys: 서버에만 있어 뒤에 덧붙인 키 목록
```

---

## 10. 변환 작업 완료 현황

18종 전체 구현 완료. 아래는 구현 완료 체크리스트 확인 기준으로 활용.

### Phase 1: 인프라

| 항목 | 상태 |
|------|------|
| `SlideProps.ts` | ✅ |
| `useVibrate.ts` | ✅ |
| `useAudio.ts` | ✅ |
| `useHoldProgress.ts` | ✅ |
| `useSlideComplete.ts` | ✅ |
| `useSlideTimeout.ts` | ✅ |
| `arrayFieldValue.ts` | ✅ |
| `schemaAdapter.ts` | ✅ |
| `slide-animations.css` | ✅ |
| `src/slides/index.ts` | ✅ |

### Phase 2~4: 슬라이드

| 컴포넌트 | 상태 |
|---------|------|
| D1 편지 열기 | ✅ |
| F3 D-day 카운트다운 | ✅ |
| C1 하트 연타 | ✅ |
| B3 선물상자 열기 | ✅ |
| A2 기념일 잠금 | ✅ |
| D2 타자기 편지 | ✅ |
| C2 풍선 터뜨리기 | ✅ |
| A3 지문 인증 | ✅ |
| F4 소원 등불 | ✅ |
| D3 롤링페이퍼 | ✅ |
| E3 엔딩 크레딧 | ✅ |
| E2 페이지 책 | ✅ |
| A5 룰렛 | ✅ |
| A4 퀴즈 | ✅ |
| D4 카세트 | ✅ |
| B1 스크래치 복권 | ✅ |
| B2 어둠 속 손전등 | ✅ |
| B4 사진 퍼즐 | ✅ |

---

## 11. 변환 체크리스트

각 컴포넌트 변환 완료 시 아래 항목을 확인한다.

```
□ ComponentName.tsx 작성 완료
□ schema.ts 작성 완료 (fields + defaultValues export)
□ index.ts에서 registerSlide(ref, Component, schema) 호출
□ src/slides/index.ts에 import 추가
□ TypeScript 에러 없음
□ 기본값(defaultValues)만으로 정상 렌더링 됨
□ data props 변경 시 실시간 반영 됨
□ onComplete 콜백 정상 호출 (완료 조건 충족 시)
□ isPreview=true일 때 onComplete 호출하지 않음 (useSlideComplete 사용)
□ 모바일 터치 동작 정상 (touch-action 설정)
□ 진동/사운드 try-catch로 안전하게 처리
□ useEffect cleanup에서 타이머/rAF/오디오 정리 (useSlideTimeout 활용)
□ 메모리 누수 없음 (이벤트 리스너 정리)
```

---

## 12. 주의사항

### 12-1. DC 원본의 쇼케이스 부분은 변환하지 않는다

DC 파일에는 탭 전환 UI, 폰 프레임, 설명 텍스트 등 **쇼케이스용 래퍼**가 있다.
이 부분은 슬라이드 컴포넌트가 아니므로 변환 대상이 아니다.

변환 대상은 `<sc-if value="{{ isXX }}">` 안쪽의 **실제 인터랙션 영역**만.

### 12-2. 슬라이드는 전체 화면을 차지한다

모든 슬라이드 컴포넌트의 최상위 div는:

```tsx
<div style={{
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  // ... 컴포넌트별 스타일
}}>
```

DC 원본에서도 동일하게 `position:absolute;inset:0`으로 시작한다.

### 12-3. 이벤트 핸들러 안전 처리

포인터 이벤트에서 `setPointerCapture`는 try-catch로 감싼다 (일부 브라우저 미지원).

```tsx
const handlePointerDown = (e: React.PointerEvent) => {
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  // ...
};
```

### 12-4. 상수 vs props 구분

DC 원본에서 클래스 상단에 정의된 상수 객체를 보면:

```js
// DC 원본
B3 = { inside: '짜잔!', hint: '리본을 당겨보세요', pull: 130 };
```

- `inside`, `hint` → **사용자 콘텐츠** → `data` props로 받음
- `pull` (130px) → **로직 상수** → 컴포넌트 내부에 하드코딩

콘텐츠와 로직을 구분하는 기준:
- "CUSTOMER가 이걸 바꾸고 싶어할까?" → Yes → `data` props
- "바꾸면 인터랙션이 깨질 수 있는가?" → Yes → 내부 상수

### 12-5. schemaAdapter와 서버 스키마

로컬 `schema.ts`가 정본이고, 서버 스키마는 보조로만 쓴다.
에디터는 `resolveEditorSchema()`를 통해 로컬 우선으로 스키마를 조회한다.
로컬에 없는 필드는 서버 스키마에서 변환해 뒤에 덧붙인다.

어댑터 로직이 틀리면 편집 패널이 조용히 빈 값을 저장하므로
`schemaAdapter.test.ts` 테스트를 유지한다.
