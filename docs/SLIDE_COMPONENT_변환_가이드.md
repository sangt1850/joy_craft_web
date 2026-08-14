# JoyCraft 슬라이드 컴포넌트 변환 가이드

> DC(Design Canvas) 형식의 프로토타입 컴포넌트를 React TSX 슬라이드 컴포넌트로 변환하는 가이드.

---

## 1. 변환 대상 목록

| ID | 이름 | 원본 파일 | componentRef | 카테고리 |
|----|------|----------|-------------|---------|
| A2 | 기념일 잠금 | 4종.dc.html | `pin-lock` | 인터랙션 |
| A3 | 지문 인증 | 4종.dc.html | `fingerprint` | 인터랙션 |
| A4 | 퀴즈 | 4종.dc.html | `quiz` | 인터랙션 |
| A5 | 룰렛 | 4종.dc.html | `roulette` | 인터랙션 |
| B1 | 스크래치 복권 | B그룹.dc.html | `scratch-lottery` | 인터랙션 |
| B2 | 어둠 속 손전등 | B그룹.dc.html | `flashlight` | 인터랙션 |
| B3 | 선물상자 열기 | B그룹.dc.html | `gift-box` | 인터랙션 |
| B4 | 사진 퍼즐 | B그룹.dc.html | `photo-puzzle` | 인터랙션 |
| C1 | 하트 연타 | CD그룹.dc.html | `heart-gauge` | 감정 |
| C2 | 풍선 터뜨리기 | CD그룹.dc.html | `balloon-pop` | 감정 |
| D1 | 편지 열기 | CD그룹.dc.html | `envelope-letter` | 읽기 |
| D2 | 타자기 편지 | CD그룹.dc.html | `typewriter` | 읽기 |
| D3 | 롤링페이퍼 | CD그룹.dc.html | `rolling-paper` | 읽기 |
| D4 | 카세트 | CD그룹.dc.html | `cassette-player` | 읽기 |
| E2 | 페이지 책 | EF그룹.dc.html | `story-book` | 이야기 |
| E3 | 엔딩 크레딧 | EF그룹.dc.html | `ending-credits` | 연출 |
| F3 | D-day 카운트다운 | EF그룹.dc.html | `dday-counter` | 연출 |
| F4 | 소원 등불 | EF그룹.dc.html | `wish-lantern` | 연출 |

---

## 2. 파일 구조

### 2-1. 전체 디렉토리

```
src/slides/
├── registry.ts              ← 이미 존재. 여기에 등록
├── SlideProps.ts             ← 공통 props 타입 (새로 생성)
├── useVibrate.ts             ← 공통 훅: 진동 (새로 생성)
├── useAudio.ts               ← 공통 훅: Web Audio 사운드 (새로 생성)
│
├── pin-lock/
│   ├── PinLock.tsx           ← React 컴포넌트
│   ├── schema.ts             ← 스키마 정의
│   └── index.ts              ← export + registry 등록
│
├── scratch-lottery/
│   ├── ScratchLottery.tsx
│   ├── schema.ts
│   └── index.ts
│
├── ... (나머지 16개 동일 구조)
│
└── index.ts                  ← 전체 슬라이드 일괄 import (registry에 등록)
```

### 2-2. 각 슬라이드 폴더 내 파일 역할

| 파일 | 역할 |
|------|------|
| `ComponentName.tsx` | 순수 React 컴포넌트. `data` props만 받아서 렌더링 |
| `schema.ts` | CUSTOMER에게 노출할 편집 필드 정의 + 기본값 |
| `index.ts` | 컴포넌트 export + `registerSlide()` 호출 |

---

## 3. 공통 타입 정의

### 3-1. SlideProps (모든 슬라이드가 받는 props)

```ts
// src/slides/SlideProps.ts

export interface SlideProps<T extends Record<string, unknown> = Record<string, unknown>> {
  /** defaultValues + overrides가 merge된 최종 데이터 */
  data: T;

  /** 슬라이드 완료 시 호출 (다음 슬라이드로 전환) */
  onComplete?: () => void;

  /** 에디터 모드 여부 (true면 onComplete 호출 안 함) */
  isPreview?: boolean;
}
```

### 3-2. SchemaDefinition (스키마 정의용 타입)

```ts
// src/slides/SlideProps.ts 에 같이 정의

export interface SchemaFieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "color" | "number" | "font" | "image" | "select" | "boolean";
  default: unknown;
  required?: boolean;
  placeholder?: string;
  // number 전용
  min?: number;
  max?: number;
  step?: number;
  // select 전용
  options?: { label: string; value: string }[];
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

interface ScratchData {
  prizeEmoji: string;
  prizeText: string;
  scratchPrompt: string;
  backgroundColor: string;
}

export default function ScratchLottery({
  data, onComplete, isPreview,
}: SlideProps<ScratchData>) {
  const { prizeEmoji, prizeText, scratchPrompt, backgroundColor } = data;

  const [revealed, setRevealed] = useState(false);
  const [ratio, setRatio] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    initScratch();
    return () => { /* cleanup */ };
  }, []);

  const initScratch = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    // canvas 초기화 ...
    ctxRef.current = c.getContext("2d");
  }, []);

  const handleScratch = useCallback((e: React.PointerEvent) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    // 긁기 로직 ...
  }, []);

  const msg = revealed ? "🎉 당첨!" : "긁어보세요";

  return (
    <div style={{ background: backgroundColor, /* ... */ }}>
      <p>{scratchPrompt}</p>
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
      type: "text",
      default: "당첨!\n오늘 저녁은 내가 쏜다",
      required: true,
    },
    {
      key: "scratchPrompt",
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
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
```

### 5-2. DC 원본에서 스키마 필드 추출하는 방법

DC 원본의 **상수 객체**가 곧 CUSTOMER에게 열어줄 편집 필드다.

```js
// DC 원본 (B1)
B3 = { inside: '짜잔! 열어줘서 고마워 🎁', hint: '리본을 아래로 당겨보세요', pull: 130 };
```

위에서:
- `inside` → `type: "text"`, CUSTOMER가 바꿀 수 있음
- `hint` → `type: "text"`, CUSTOMER가 바꿀 수 있음
- `pull` → 내부 로직 값이므로 스키마에 **포함하지 않음**

**원칙**: 텍스트, 색상, 이미지 등 **콘텐츠** 성격의 값만 스키마에 넣는다.
속도, 거리, 카운트 등 **로직** 값은 넣지 않거나 `number` 타입으로 선택적 제공.

### 5-3. 각 컴포넌트별 스키마 추출 결과

#### A2: 기념일 잠금 (`pin-lock`)

| key | type | label | default |
|-----|------|-------|---------|
| `question` | text | 질문 문구 | "우리가 처음 만난 날은?" |
| `answer` | text | 정답 (4자리) | "0214" |
| `hint` | text | 힌트 문구 | "달력에 하트 그려둔 그날 💕" |
| `successMessage` | text | 성공 메시지 | "정답! 열어볼까?" |
| `backgroundColor` | color | 배경 색상 | "#1b1533" |
| `accentColor` | color | 강조 색상 | "#FFD97D" |

#### A3: 지문 인증 (`fingerprint`)

| key | type | label | default |
|-----|------|-------|---------|
| `prompt` | text | 안내 문구 | "손가락을 올려서\n인증해주세요" |
| `successMessage` | textarea | 인증 완료 메시지 | "본인 확인 완료.\n당신에게만 열리는 페이지예요." |
| `holdDuration` | number | 인증 시간(초) | 2.5 (min:1, max:5) |
| `ringColor` | color | 게이지 색상 | "#4dd0ff" |

#### A4: 퀴즈 (`quiz`)

| key | type | label | default |
|-----|------|-------|---------|
| `intro` | text | 소개 문구 | "얼마나 알고 있나 볼까 😏" |
| `highScoreMessage` | text | 고득점 메시지 | "역시 나를 제일 잘 아는 사람 💯" |
| `lowScoreMessage` | text | 저득점 메시지 | "음... 우리 더 친해지자 😂" |
| `questions` | (특수) | 퀴즈 목록 | 아래 참조 |
| `backgroundColor` | color | 배경 색상 | "#FFF8F0" |
| `accentColor` | color | 강조 색상 | "#E94F6A" |

> `questions`는 복합 타입이다. 별도 섹션(§6) 참조.

#### A5: 룰렛 (`roulette`)

| key | type | label | default |
|-----|------|-------|---------|
| `title` | text | 제목 | "오늘 뭐 할지\n룰렛이 정해줄게" |
| `slices` | (특수) | 룰렛 항목 | 아래 참조 |
| `backgroundColor` | color | 배경 색상 | "#fff5f7" |

#### B1: 스크래치 복권 (`scratch-lottery`)

| key | type | label | default |
|-----|------|-------|---------|
| `prizeEmoji` | text | 당첨 이모지 | "🎉" |
| `prizeText` | textarea | 당첨 메시지 | "당첨!\n오늘 저녁은 내가 쏜다" |
| `prompt` | text | 안내 문구 | "은박을 긁어서 확인해 보세요" |
| `backgroundColor` | color | 배경 색상 | "#2b2340" |

#### B2: 어둠 속 손전등 (`flashlight`)

| key | type | label | default |
|-----|------|-------|---------|
| `instruction` | text | 안내 문구 | "화면을 비춰서 찾아보세요" |
| `clearText` | textarea | 클리어 메시지 | "우리 추억,\n다 찾았네 ✨" |
| `spots` | (특수) | 숨겨진 아이템 | `[{emoji,caption}, ...]` |
| `backgroundColor` | color | 배경 색상 | "#0d1117" |

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
| `puzzleImage` | image | 퍼즐 이미지 | null (기본: 그라데이션) |
| `gridSize` | number | 격자 크기 | 3 (min:2, max:4) |

#### C1: 하트 연타 (`heart-gauge`)

| key | type | label | default |
|-----|------|-------|---------|
| `title` | text | 제목 | "마음 게이지" |
| `targetCount` | number | 목표 탭 수 | 30 (min:10, max:100) |
| `successMessage` | textarea | 성공 메시지 | "마음이\n가득 찼어요 💗" |
| `heartColor` | color | 하트 색상 | "#E94F6A" |
| `backgroundColor` | color | 배경 색상 | "#fff0f4" |

#### C2: 풍선 터뜨리기 (`balloon-pop`)

| key | type | label | default |
|-----|------|-------|---------|
| `successMessage` | textarea | 성공 메시지 | "펑펑!\n생일 축하해 🎂" |
| `balloons` | (특수) | 풍선 목록 | `[{emoji,color}, ...]` |
| `backgroundColor` | color | 배경 색상 | "#eaf6ff" |

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
| `typingSpeed` | number | 타이핑 속도(ms) | 62 (min:30, max:120) |
| `enableSound` | boolean | 타이핑 사운드 | true |
| `paperColor` | color | 종이 색상 | "#f6f0e2" |
| `backgroundColor` | color | 배경 색상 | "#2b2620" |

#### D3: 롤링페이퍼 (`rolling-paper`)

| key | type | label | default |
|-----|------|-------|---------|
| `title` | text | 제목 | "우리들의 롤링페이퍼" |
| `seedNotes` | (특수) | 초기 메모 목록 | `[{text,from,color}, ...]` |
| `allowUserInput` | boolean | 방문자 작성 허용 | true |
| `backgroundColor` | color | 배경 색상 | "#faf4ea" |

#### D4: 카세트 (`cassette-player`)

| key | type | label | default |
|-----|------|-------|---------|
| `tracks` | (특수) | 트랙 목록 | `[{title,artist,dur,root,scale,tempo}, ...]` |
| `note` | text | 하단 안내 문구 | "실제 재생되는 로파이 멜로디예요 🎧" |
| `tapeColor` | color | 테이프 색상 | "#f0e6d0" |
| `backgroundColor` | color | 배경 색상 | "#3a2e2a" |

#### E2: 페이지 책 (`story-book`)

| key | type | label | default |
|-----|------|-------|---------|
| `pages` | (특수) | 페이지 목록 | `[{emoji,title,text,bgColor}, ...]` |
| `footerText` | text | 넘기기 안내 | "← 좌우로 넘겨보세요 →" |

#### E3: 엔딩 크레딧 (`ending-credits`)

| key | type | label | default |
|-----|------|-------|---------|
| `title` | text | 제목 | "우리들의 1년" |
| `endMessage` | textarea | 마지막 메시지 | "THE END\n고마웠어 ♥" |
| `credits` | (특수) | 크레딧 목록 | `[{role,name}, ...]` |
| `enableSound` | boolean | 배경음 재생 | true |

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
| `doneMessage` | textarea | 완료 메시지 | "소원이\n하늘로 올라갔어요 🌟" |
| `prompt` | text | 안내 문구 | "소원을 적고 하늘로 띄워보내요" |
| `lanternColor` | color | 등불 색상 | "#ffb463" |
| `backgroundColor` | color | 배경 색상 | "#0a0f26" |

---

## 6. 복합 타입 (배열 필드) 처리

퀴즈의 `questions`, 룰렛의 `slices`, 롤링페이퍼의 `seedNotes` 등은
단순 스키마 필드 하나로 표현할 수 없는 **배열 구조**다.

### 6-1. 백엔드 저장

DB의 `default_values` (JSONB) 에 그대로 JSON 배열로 저장한다.

```json
{
  "questions": [
    {
      "q": "내가 스트레스 받으면 제일 먼저 하는 건?",
      "choices": ["매운 거 폭식 🌶️", "무작정 잠자기", "충동 쇼핑", "혼자 드라이브"],
      "explain": "떡볶이 앞에서 스트레스는 못 참지."
    }
  ]
}
```

### 6-2. 에디터 UI

현재 에디터에서 배열 필드는 **전용 편집 UI**가 필요하다.
기본 스키마 자동 생성으로는 부족하므로, 아래 두 가지 중 택한다:

**방법 A: JSON 직접 편집** (1차 구현)
- `type: "textarea"`로 처리하고 JSON 문자열로 입력받는다
- 컴포넌트 내부에서 `JSON.parse()`

**방법 B: 전용 배열 에디터** (2차 구현)
- `type: "array"`를 스키마에 추가 정의
- 에디터가 항목 추가/삭제/순서변경 UI를 자동 생성

> 1차에는 방법 A로 빠르게 구현하고, 에디터 고도화 시 방법 B로 전환한다.

### 6-3. 컴포넌트 내부 처리

```tsx
// 컴포넌트에서 안전하게 파싱
const questions: QuizQuestion[] = useMemo(() => {
  if (Array.isArray(data.questions)) return data.questions;
  try { return JSON.parse(data.questions as string); }
  catch { return DEFAULT_QUESTIONS; }
}, [data.questions]);
```

---

## 7. 공통 훅 (Hooks)

DC 원본에서 반복적으로 사용되는 패턴을 공통 훅으로 추출한다.

### 7-1. useVibrate

```ts
// src/slides/useVibrate.ts
export function useVibrate() {
  return (pattern: number | number[]) => {
    try { navigator.vibrate?.(pattern); } catch {}
  };
}
```

**DC 원본에서의 사용**: 18개 컴포넌트 중 16개가 `vibe()` 메서드를 갖고 있다.

### 7-2. useAudio

```ts
// src/slides/useAudio.ts
import { useRef, useCallback, useEffect } from "react";

export function useAudio() {
  const acRef = useRef<AudioContext | null>(null);

  const getAc = useCallback(() => {
    if (!acRef.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      acRef.current = new AC();
    }
    if (acRef.current.state === "suspended") acRef.current.resume();
    return acRef.current;
  }, []);

  const blip = useCallback((
    freq = 440, dur = 0.06, type: OscillatorType = "square", gain = 0.15
  ) => {
    try {
      const ac = getAc();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, ac.currentTime);
      g.gain.linearRampToValueAtTime(gain, ac.currentTime + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
      o.connect(g);
      g.connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + dur);
    } catch {}
  }, [getAc]);

  // cleanup
  useEffect(() => {
    return () => { acRef.current?.close().catch(() => {}); };
  }, []);

  return { getAc, blip };
}
```

**DC 원본에서의 사용**: C1, C2, D1, D2, D4, E2, E3, F4 (8개 컴포넌트).

### 7-3. useHoldProgress

길게 누르기 패턴 (A3 지문인증, F4 소원등불).

```ts
// src/slides/useHoldProgress.ts
import { useState, useRef, useCallback } from "react";

export function useHoldProgress(duration: number, onComplete: () => void) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const rafRef = useRef<number>(0);
  const lastRef = useRef(0);

  const loop = useCallback((t: number) => {
    const dt = (t - lastRef.current) / 1000;
    lastRef.current = t;
    setProgress((prev) => {
      const next = prev + dt / duration;
      if (next >= 1) { onComplete(); return 1; }
      rafRef.current = requestAnimationFrame(loop);
      return next;
    });
  }, [duration, onComplete]);

  const down = useCallback(() => {
    lastRef.current = performance.now();
    setHolding(true);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const up = useCallback(() => {
    setHolding(false);
    cancelAnimationFrame(rafRef.current);
    // decay logic if needed
  }, []);

  const reset = useCallback(() => {
    setProgress(0);
    setHolding(false);
    cancelAnimationFrame(rafRef.current);
  }, []);

  return { progress, holding, down, up, reset };
}
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

DC 원본의 `@keyframes`는 슬라이드 전용 CSS 파일로 분리한다.

```
src/slides/slide-animations.css
```

```css
@keyframes jc-pop { 0%{transform:scale(.4);opacity:0} 60%{transform:scale(1.12)} 100%{transform:scale(1);opacity:1} }
@keyframes jc-fadeup { 0%{transform:translateY(14px);opacity:0} 100%{transform:translateY(0);opacity:1} }
@keyframes jc-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-9px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(4px)} }
@keyframes jc-beat { 0%,100%{transform:scale(1)} 50%{transform:scale(1.18)} }
@keyframes jc-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
@keyframes jc-scan { 0%{top:6%} 100%{top:94%} }
@keyframes jc-heartfly { 0%{transform:translate(0,0) scale(.6);opacity:1} 100%{transform:translate(var(--hx),-160px) scale(1.3);opacity:0} }
@keyframes jc-float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
@keyframes jc-popscale { 0%{transform:scale(1);opacity:1} 100%{transform:scale(1.6);opacity:0} }
@keyframes jc-confburst { from{transform:translate(0,0) scale(1);opacity:1} to{transform:translate(var(--tx),var(--ty));opacity:0} }
@keyframes jc-burst { from{transform:translate(0,0) scale(.5);opacity:1} to{transform:translate(var(--tx),var(--ty)) rotate(var(--rot));opacity:0} }
@keyframes jc-caret { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes jc-wiggle { 0%,100%{transform:rotate(-2deg)} 50%{transform:rotate(2deg)} }
@keyframes jc-boxwiggle { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-1.5deg)} 75%{transform:rotate(1.5deg)} }
@keyframes jc-sparkle { 0%{transform:scale(0);opacity:0} 50%{transform:scale(1.2);opacity:1} 100%{transform:scale(1);opacity:1} }
@keyframes jc-hintwiggle { 0%,100%{transform:translate(0,0) rotate(0)} 30%{transform:translate(-7px,4px) rotate(-8deg)} 70%{transform:translate(7px,-2px) rotate(8deg)} }
@keyframes jc-lanternfloat { 0%{transform:translate(-50%,0) scale(1)} 100%{transform:translate(calc(-50% + var(--drift)),-560px) scale(.55);opacity:0} }
@keyframes jc-glow { 0%,100%{filter:drop-shadow(0 0 8px rgba(255,180,80,.7))} 50%{filter:drop-shadow(0 0 20px rgba(255,200,110,.95))} }
@keyframes jc-fall { 0%{transform:translateY(-20px) rotate(0);opacity:0} 10%{opacity:1} 100%{transform:translateY(520px) rotate(320deg);opacity:.2} }
@keyframes jc-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
@keyframes jc-spinhint { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
@keyframes jc-bloom { 0%{transform:rotate(var(--a)) translateY(0) scale(0)} 60%{transform:rotate(var(--a)) translateY(var(--d)) scale(1.12)} 100%{transform:rotate(var(--a)) translateY(var(--d)) scale(1)} }
```

이 파일을 `src/slides/index.ts`에서 import 한다.

### 8-4. 폰트

DC 원본에서 사용하는 폰트 목록:

| 폰트 | 용도 | 로딩 |
|------|------|------|
| Pretendard | 기본 본문 | CDN (이미 프로젝트에 있음) |
| Nanum Pen Script | 손글씨 메시지 | Google Fonts |
| Gaegu | 손글씨 (롤링페이퍼, 카세트) | Google Fonts |
| Special Elite | 타자기 | Google Fonts |

`index.html` 또는 슬라이드 CSS에 해당 폰트 link를 추가한다.

---

## 9. 등록 방법

### 9-1. 개별 슬라이드 index.ts

```ts
// src/slides/scratch-lottery/index.ts
import { registerSlide } from "../registry";
import ScratchLottery from "./ScratchLottery";

export { ScratchLottery };
export { schema, defaultValues } from "./schema";

registerSlide("scratch-lottery", ScratchLottery);
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
import { resolveSlide } from "@/slides/registry";

const SlideComponent = resolveSlide(slide.componentRef);
if (SlideComponent) {
  const mergedData = { ...slide.defaultValues, ...slide.overrides };
  return <SlideComponent data={mergedData} onComplete={goNext} />;
}
```

---

## 10. 변환 작업 순서 (권장)

### Phase 1: 인프라 (먼저)

1. `SlideProps.ts` — 공통 타입 정의
2. `useVibrate.ts` — 진동 훅
3. `useAudio.ts` — 사운드 훅
4. `useHoldProgress.ts` — 길게 누르기 훅
5. `slide-animations.css` — 공통 keyframes
6. `src/slides/index.ts` — 일괄 등록 엔트리

### Phase 2: 단순한 것부터 (난이도 ★)

| 순서 | 컴포넌트 | 이유 |
|------|---------|------|
| 1 | D1 편지 열기 | 상태 1개 (open/close), CSS 전환만 |
| 2 | F3 D-day 카운트다운 | 상태 없음, setInterval 1개 |
| 3 | C1 하트 연타 | 카운터 + CSS 애니메이션 |
| 4 | B3 선물상자 열기 | 드래그 1개 + CSS 전환 |

### Phase 3: 중간 난이도 (★★)

| 순서 | 컴포넌트 | 이유 |
|------|---------|------|
| 5 | A2 기념일 잠금 | 키패드 + 상태 관리 |
| 6 | D2 타자기 편지 | setInterval + 사운드 |
| 7 | C2 풍선 터뜨리기 | 배열 상태 + 파티클 |
| 8 | A3 지문 인증 | rAF 게이지 + SVG |
| 9 | F4 소원 등불 | rAF + CSS 애니메이션 |
| 10 | D3 롤링페이퍼 | 입력 + 동적 리스트 |
| 11 | E3 엔딩 크레딧 | 스크롤 + 오디오 |
| 12 | E2 페이지 책 | 스와이프 + 3D 전환 |

### Phase 4: 복잡한 것 (★★★)

| 순서 | 컴포넌트 | 이유 |
|------|---------|------|
| 13 | A5 룰렛 | SVG 계산 + 가중치 + 회전 |
| 14 | A4 퀴즈 | 다중 질문 + 셔플 + 채점 |
| 15 | D4 카세트 | Web Audio API 멜로디 생성 |
| 16 | B1 스크래치 복권 | Canvas 2D + 포인터 캡처 |
| 17 | B2 어둠 속 손전등 | 포인터 추적 + radial-gradient |
| 18 | B4 사진 퍼즐 | 그리드 스왑 + 이미지 분할 |

---

## 11. 변환 체크리스트

각 컴포넌트 변환 완료 시 아래 항목을 확인한다.

```
□ ComponentName.tsx 작성 완료
□ schema.ts 작성 완료 (fields + defaultValues export)
□ index.ts에서 registerSlide() 호출
□ src/slides/index.ts에 import 추가
□ TypeScript 에러 없음
□ 기본값(defaultValues)만으로 정상 렌더링 됨
□ data props 변경 시 실시간 반영 됨
□ onComplete 콜백 정상 호출 (완료 조건 충족 시)
□ isPreview=true일 때 onComplete 호출하지 않음
□ 모바일 터치 동작 정상 (touch-action 설정)
□ 진동/사운드 try-catch로 안전하게 처리
□ useEffect cleanup에서 타이머/rAF/오디오 정리
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
