# JoyCraft 디자인 시스템 v2

버전 2.0 · 2026-09-14

이 문서는 플랫폼 UI의 현재 기준이다. 편집기 세부 수치는 `C:/bizbee/joy_craft/JoyCraft-editor-design-guide/JoyCraft-편집-UI-디자인-가이드.md`에서 가져왔다. 원본에 없는 일반 서비스 화면 규격은 JoyCraft 확장 규격으로 구분한다.

## 방향

차분하고 가벼운 제작 도구를 목표로 한다. 크림 화이트 바탕, 딥 틸 브랜드, 샌드 베이지·테라코타 포인트, 차콜 텍스트, 1px 경계, 8–16px 라운드를 사용한다. 강한 원색 면, 굵은 검정 테두리, 픽셀 폰트, 오프셋 그림자는 플랫폼 UI에서 사용하지 않는다.

슬라이드는 독립 작품이므로 이 시스템의 시각 스타일을 적용하지 않는다. 미리보기 프레임과 서비스 상태 UI만 적용 대상이다.

## 토큰

| 의미 | 기본값 | 용도 |
|---|---:|---|
| `--color-bg` | `#F4EFE4` | 크림 화이트 앱 바탕 |
| `--color-surface` | `#FFFFFF` | 카드, 입력, 모달 |
| `--color-subtle` | `#F6F3F8` | 보조 표면 |
| `--color-selected` | `#EDEAF1` | 선택 항목 |
| `--color-ink` | `#2B2B27` | 차콜 본문·헤드라인 |
| `--color-heading` | `#4F4559` | 제목 |
| `--color-muted` | `#8A8291` | 설명, 메타 |
| `--color-border` | `#E8E5ED` | 셸과 카드 경계 |
| `--color-border-control` | `#E4DFE9` | 폼 경계 |
| `--color-primary` | `#1F4B48` | 딥 틸 브랜드·주요 CTA |
| `--color-secondary` | `#C9A876` | 샌드 베이지 보조 강조 |
| `--color-accent` | `#B5714A` | 테라코타 웜 포인트 |
| focus | `#847099` | 키보드 포커스 |

danger/success/warning/info는 상태 메시지와 의미가 있는 액션에만 사용한다. 카카오처럼 외부 브랜드가 요구하는 고유 색과 사용자 콘텐츠 색은 토큰 팔레트의 예외다.

## 타이포그래피

플랫폼 기본 스택은 `-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif`다. 제목은 같은 스택에서 600–650 굵기와 좁은 자간을 사용한다.

| 일반 화면 | 크기 |
|---|---:|
| 랜딩 히어로 | 58px / 모바일 38px |
| 페이지 제목 | 28px / 모바일 24px |
| 섹션 제목 | 20px |
| 카드 제목 | 15–17px |
| 본문 | 14px |
| 설명·메타 | 11–13px |
| 기본 버튼 | 14px |

편집기 compact 규격은 label 10px, 입력 11px, 섹션 제목 12px, 큰 제목 28px이다. 작은 글자가 긴 안내 본문을 맡지 않게 한다.

## 형태와 간격

- 선: 기본 1px, 포커스 outline 2px/offset 3px.
- radius: 입력 8px, 버튼 8–10px, 편집 항목 13px, 앱 카드 13–16px, 다이얼로그 16px.
- 그림자: 카드와 입력 기본 없음. 선택 세그먼트는 아주 약한 1px 그림자. 다이얼로그·부유 미리보기는 부드러운 확산 그림자.
- 일반 간격: 4/8/12/16/24/32/48/64px.
- 일반 카드 padding: 20px. 앱 페이지 여백: 32/24/16px.

편집기 원본 간격은 label 위 13px, label-input gap 7px, input padding 10px, 2열 gap 9px, 항목 padding 12px, 섹션 세로 22px이다.

## 기본 컴포넌트

Button은 primary, secondary, ghost, danger, dashed, icon 변형을 가진다. 높이는 sm 32px, md 40px, lg 48px. disabled와 loading은 중복 제출을 막고 레이아웃 너비를 유지한다.

Card는 surface/subtle/selected 표면을 사용한다. 임의 테두리 두께와 그림자 숫자를 받지 않는다. 클릭 가능한 카드는 hover뿐 아니라 focus-visible 상태를 가진다.

Input/Textarea/Select는 1px control border, 8px radius, 10–12px padding을 공유한다. label과 오류·도움말의 연결을 유지한다. 에디터의 number spinner, select, checkbox는 참고 원본처럼 네이티브 컨트롤을 사용한다.

SegmentedControl은 `#EDEAF1` 바탕, 4px padding, 3px gap, 11px 외곽 radius를 쓴다. 선택 버튼은 흰 바탕과 650 굵기다. 선택 버튼은 `aria-pressed`; 콘텐츠 탭은 올바른 tab 의미를 사용한다.

Badge는 pill 형태, 1px 경계, 10–12px 글자다. Dialog는 16px radius, 반투명 보라색 backdrop과 부드러운 그림자를 쓴다. 아이콘은 Lucide 선형 아이콘 14/16/18px를 기본으로 한다.

## 레이아웃

고객과 관리자의 일반 사이드바는 240px다. 선택 메뉴는 selected 배경과 heading 글자를 사용한다. 모바일 고객 탐색은 하단 탭, 만들기는 48px 주요 액션이다.

에디터는 좌측 페이지 목록, 중앙 미리보기, 우측 속성 폼의 기존 구조를 유지한다. 넓은 화면 속성 패널 318px, 툴바 78px. 760px 이하에서는 페이지/미리보기/편집을 모바일 탭으로 전환한다. 패널과 stage에는 `min-width:0`, `min-height:0`, 내부 스크롤을 적용한다.

## 상태와 접근성

모든 데이터 화면에서 정상·로딩·빈 결과·오류·재시도를 구분한다. 색만으로 상태를 구분하지 않는다. 아이콘 단독 버튼에는 이름을 제공한다. 모달은 Escape, 초기 포커스, 포커스 복구를 지원해야 한다. 모바일 주요 터치 영역은 44px 이상을 목표로 한다.

시각 검증은 1440/1024/768/390/360px, 에디터는 1100px와 760px 경계 전후에서 한다. default/pastel/dark/mono 테마와 슬라이드 CSS 격리도 함께 확인한다.
