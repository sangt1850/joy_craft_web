# survey-frontend

석사 논문 실험 설문 응답 화면 (React 18 + Vite + TypeScript).

## 실행

```bash
npm install

# 백엔드 없이 화면 흐름 확인 (목 API)
npm run dev:mock
# → http://localhost:5173/s/demo?uid=test01
#   처음부터 다시: http://localhost:5173/s/demo?uid=test01&reset
#   45초가 길면 .env.mock 의 VITE_MOCK_STIMULUS_SECONDS 를 5 정도로

# 실제 백엔드(Spring Boot :8080) 연결
npm run dev

# 배포 빌드 → dist/ 를 nginx로 서빙, /api 는 Spring Boot로 프록시
npm run build
```

nginx는 SPA 라우팅을 위해 `try_files $uri /index.html;` 필요.

## 구조

```
src/
  api/
    types.ts        API 계약 (DTO, 에러 코드)
    client.ts       fetch 래퍼 — VITE_USE_MOCK=true 면 mock 사용
    mock.ts         목 서버 (스크리닝 종료, 45초 검증, 보기 쿼터 마감 흉내)
  hooks/
    useDwellTracker.ts  화면이 보이는 시간만 누적, 탭 이탈/blur 횟수 집계
  components/
    Layout.tsx      ProgressHeader, BottomBar, Card
    Choices.tsx     Likert7, SingleChoice(마감 배지), SelectChoice, QuotaNotice
    Toast.tsx
  views/
    SurveyPage.tsx  흐름 제어: start → enter → submit, 뒤로가기 차단, 이탈 경고
    ConsentView.tsx / QuestionsView.tsx / StimulusView.tsx / EndView.tsx
```

## 동작 규칙

- 페이지 진입 시 `POST /pages/{seq}/enter` → 서버가 진입 시각 기록
- 제출 시 `clientActiveMs`, `hiddenCount`, `blurCount` 함께 전송
- 자극물: 이미지 로딩이 끝난 뒤 타이머 시작, 탭이 가려지면 멈춤. 서버도 `TOO_EARLY`로 재검증
- 필수 문항 누락 시 버튼은 회색이지만 눌리면 첫 미응답 문항으로 스크롤 + 빨간 테두리
- `QUOTA_FULL` 응답 시 현재 페이지를 다시 받아 마감된 보기를 갱신
- 주의 점검 실패(`ATTENTION_FAIL`)는 응답자에게 완료 화면과 같게 보여줌
- 종료 시 `redirectUrl`이 있으면 3초 후 패널로 이동
