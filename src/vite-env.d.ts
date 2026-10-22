/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** survey: 설문 앱만 마운트 / 그 외: 기존 JoyCraft 앱 */
  readonly VITE_APP_MODE?: 'survey' | 'app'
  /** true면 백엔드 없이 목 API 사용 (설문 화면 확인용) */
  readonly VITE_USE_MOCK?: string
  readonly VITE_MOCK_STIMULUS_SECONDS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
