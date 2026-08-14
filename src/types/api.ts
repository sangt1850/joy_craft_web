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

export interface SiteDetailResponse {
  id: string;
  title: string;
  theme: Record<string, unknown> | null;
  background: Record<string, unknown> | null;
  flowPolicy: Record<string, unknown> | null;
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
