export interface UserResponse {
  id: string;
  loginId: string;
  displayName: string;
  email: string | null;
  role: "MASTER" | "CREATOR" | "CUSTOMER";
  createdAt: string;
}

export interface LoginResponse {
  accessToken?: string;
  alreadyLogin?: boolean;
  preAuthTicket?: string;
}

export interface ApiResponse<T> {
  data: T;
}

export interface SiteListResponse {
  id: string;
  title: string;
  slideCount: number;
  status: "DRAFT" | "PUBLISHED";
  bgColor: string;
  updatedAt: string;
}

export interface SiteStatsResponse {
  totalSites: number;
  publishedSites: number;
  totalHearts: number;
  trialDaysLeft: number;
}

/**
 * 슬라이드 전환 정책.
 * - mode: "gated" = 슬라이드가 onComplete를 호출해야 다음으로 진행
 *         "free"  = 수신자가 임의로 다음/이전으로 이동 가능
 * - showProgress: 진행 표시(3/8) 노출 여부
 * - escapeAfter: 슬라이드 진입 후 N초가 지나면 건너뛰기를 허용 (null/0 = 허용 안 함)
 */
export interface FlowPolicy {
  mode: "gated" | "free";
  showProgress: boolean;
  escapeAfter: number | null;
}

/** 서버가 내려주는 flowPolicy는 필드가 비어 있을 수 있으므로 부분 형태로 받는다 */
export type FlowPolicyInput = Partial<FlowPolicy>;

export interface SiteDetailResponse {
  id: string;
  title: string;
  theme: Record<string, unknown> | null;
  background: Record<string, unknown> | null;
  flowPolicy: FlowPolicyInput | null;
  timezone: string;
  status: "DRAFT" | "PUBLISHED";
  slides: SlideResponse[];
  updatedAt: string;
}

export interface SlideResponse {
  id: string;
  position: number;
  templateId: string;
  templateName: string;
  componentRef: string;
  schema: SchemaField[];
  defaultValues: Record<string, unknown>;
  overrides: Record<string, unknown>;
  escapeAfter: number | null;
}

export interface SchemaField {
  key: string;
  label: string;
  field: {
    kind: "string" | "color" | "number" | "font" | "image";
    min?: number;
    max?: number;
  };
}

/**
 * 발행 스냅샷의 슬라이드 1개.
 * 주의: 스냅샷 슬라이드에는 id가 없다 — 인덱스로 다룬다.
 * values는 서버(SiteService.publish)에서 defaultValues + overrides가
 * 이미 병합된 최종 값이므로 프론트에서 재병합하지 않는다.
 */
export interface PlaySlide {
  componentRef: string;
  schema?: SchemaField[];
  values: Record<string, unknown>;
  escapeAfter?: number | null;
}

/**
 * GET /api/play/{slug} 응답.
 * 다른 엔드포인트와 달리 ApiResponse<T> 봉투 없이 스냅샷이 raw로 내려온다.
 */
export interface PlaySnapshot {
  title: string;
  theme?: Record<string, unknown> | null;
  flowPolicy?: FlowPolicyInput | null;
  slides: PlaySlide[];
}

export interface TemplateListResponse {
  id: string;
  groupId: string;
  name: string;
  description: string | null;
  category: string;
  pricing: "free" | "premium";
  thumbnailUrl: string | null;
}

export interface PublishResponse {
  id: string;
  slug: string;
  url: string;
  publishedAt: string;
}

export interface PlatformStatsResponse {
  totalUsers: number;
  totalSites: number;
  todaySignups: number;
  todaySites: number;
  proSubscribers: number;
  monthlyRevenue: string;
}

export interface KakaoAuthResponse {
  accessToken?: string;
  newUser?: boolean;
  registerToken?: string;
}

/**
 * 카카오 인가 URL 응답.
 * state는 sessionStorage에 넣어 두었다가 콜백 쿼리의 state와 대조한다 —
 * 이 대조가 "이 브라우저에서 시작한 로그인이 맞는가"를 보장하는 CSRF 방어다.
 */
export interface KakaoAuthUrlResponse {
  url: string;
  state: string;
}
