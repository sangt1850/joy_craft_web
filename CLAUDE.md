# JoyCraft 개발 가이드

이 저장소에서 작업할 때 사용하는 현재 규칙이다. 디자인 구현 전 `docs/DESIGN_SYSTEM.md`와 관련 컴포넌트를 함께 확인한다.

## 프로젝트

- Web: 현재 저장소 `C:/bizbee/joy_craft/joycraft-web`
- API: 인접 저장소 `C:/bizbee/joy_craft/joy_craft_api`
- 편집 UI 원본: `C:/bizbee/joy_craft/JoyCraft-editor-design-guide`

경로 문자열을 코드나 자동화 지침에 중복해서 넣지 말고 저장소 기준 상대 경로를 사용한다.

## 디자인 원칙

JoyCraft 서비스 UI는 밝은 회백색 바탕, 흰 표면, 차분한 보라색, 얇은 경계, 작은 라운드를 사용한다. 정보 위계를 먼저 만들고 장식은 줄인다.

- 색상은 `src/index.css`의 의미 토큰을 사용한다. 페이지에 임의 HEX를 추가하지 않는다. 소셜 브랜드색, 사용자 콘텐츠, 작품 미리보기는 예외다.
- 플랫폼 UI 폰트는 시스템 산세리프 스택을 사용한다. 픽셀 폰트를 기본 UI에 사용하지 않는다.
- 기본 경계는 1px이다. 포커스는 2px `#847099`, offset 3px이다.
- 카드·입력은 그림자를 기본값으로 사용하지 않는다. 다이얼로그와 부유 요소에만 부드러운 그림자를 쓴다.
- 버튼은 공통 컴포넌트/`jc-button` 규격을 사용한다. 검정 오프셋 그림자와 눌림 이동 효과를 추가하지 않는다.
- 입력·텍스트·버튼의 상태에는 기본, hover, focus-visible, disabled, loading, error를 필요한 만큼 제공한다.
- 아이콘 단독 버튼에는 접근 가능한 이름을 제공한다.

## 크기와 밀도

일반 서비스 화면은 편안한 밀도를 쓴다: 본문 14px, 입력 14px, 기본 버튼 높이 40px, 카드 padding 20px. 모바일 입력은 필요하면 16px로 높인다.

에디터 컨트롤은 참고 원본의 compact 밀도를 쓴다: label 10px, 입력값 11px, 입력 padding 10px/radius 8px, 반복 항목 padding 12px/radius 13px, 섹션 세로 padding 22px. 일반 페이지 숫자를 에디터에 그대로 적용하지 않는다.

## 공통 컴포넌트

기존 `src/components/ui`의 Button/Card/SearchInput/TabBar/StatusBadge와 도메인 카드부터 재사용한다. 현재 이름이 `NeoButton`, `NeoCard`인 파일은 이관 호환을 위해 유지되지만 외형은 v2 시스템이다. 신규 코드에 `Neo` 또는 `Nb` 접두 컴포넌트를 추가하지 않는다.

기존 `components/nb`는 레거시 호환 영역이다. 새 사용처를 만들지 않고, 화면 이관 시 `components/ui` 기본형으로 바꾼다. 임의 `bg`, `color`, `shadow` 숫자를 새로운 API로 확산하지 않는다.

## 레이아웃과 반응형

- 일반 고객/관리자 사이드바: 240px.
- 에디터 속성 패널: 넓은 화면 318px, 1100px 이하 285px를 기준으로 조정.
- 에디터 모바일 경계: 760px. 모바일 패널 최대 `min(340px, 100%)`.
- 에디터 툴바: 데스크톱 78px, 모바일 60px.
- 앱 셸은 `100dvh`, 내용 영역은 `min-width:0`/`min-height:0`, 패널은 내부 스크롤을 사용한다.
- 일반 페이지 좌우 여백은 데스크톱 32px, 태블릿 24px, 모바일 16px를 기본으로 한다.

## 슬라이드 콘텐츠 경계

`src/slides/**`는 사용자가 감상하는 독립 작품이다. 플랫폼 UI 토큰으로 작품 내부의 배경·폰트·버튼을 덮어쓰지 않는다. `SlideCanvas`를 감싸는 미리보기 프레임, 로딩, 오류, 종료 화면만 서비스 디자인 시스템을 사용한다.

전역 `button`, `input`, `h1` 규칙이 슬라이드에 시각 스타일을 주입하지 않게 한다. 편집 컨트롤 reset은 네임스페이스 또는 명시적인 클래스 아래에 둔다.

## 코드 규칙

- 기존 API, store, UI, slide registry를 먼저 조사한다.
- 정적 스타일은 Tailwind 클래스 또는 CSS 토큰을 사용한다. 스케일, 좌표, 사용자 지정색 같은 런타임 값만 인라인 스타일을 허용한다.
- 실제 button/link 의미, label 연결, aria-pressed/tab 의미를 유지한다.
- 로딩을 성공처럼 표현하거나 API 결과를 추정하지 않는다.
- 기존 작업 파일과 `.claude/worktrees`를 수정하지 않는다.

## 검증

```bash
npm run build
npm run lint
npm run test
```

UI 변경은 1440/1024/768/390/360px에서 확인한다. 에디터는 1100px와 760px 전후를 추가로 검사한다. 키보드 포커스, 긴 한글, 빈 상태, 오류 상태, 모바일 스크롤, 각 테마, 슬라이드 CSS 격리를 확인한다.

구현 계획과 전체 완료 체크리스트는 `docs/DESIGN_REFACTOR_PLAN.md`를 따른다.
