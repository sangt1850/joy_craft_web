// 백엔드 API 계약 (survey-platform-dev-prompt.md 5장 기준)

export type RespondentStatus =
  | 'IN_PROGRESS'
  | 'COMPLETE'
  | 'SCREENOUT'
  | 'QUOTAFULL'
  | 'ATTENTION_FAIL'
  | 'ABANDONED';

export type PageType = 'CONSENT' | 'QUESTIONS' | 'STIMULUS' | 'END';
export type QuestionType = 'LIKERT7' | 'SINGLE' | 'SELECT';

export interface OptionDto {
  id: number;
  value: number;
  label: string;
  available: boolean; // 보기 쿼터가 찼으면 false
}

export interface QuestionDto {
  id: number;
  qNo: string; // 'Q14'
  code: string; // 'NOV1'
  text: string;
  qtype: QuestionType;
  required: boolean;
  options: OptionDto[];
}

export interface StimulusBlock {
  id: number;
  kind: 'IMAGE' | 'TEXT';
  content: string; // IMAGE: URL, TEXT: 본문
  caption?: string;
}

export interface ConsentSection {
  heading: string;
  body: string;
}

export interface PageDto {
  seq: number;
  pageKey: string;
  pageType: PageType;
  title: string;
  instruction?: string;
  minSeconds: number;
  progressIndex: number; // 화면에 보여줄 현재 순번
  totalPages: number;
  questions: QuestionDto[];
  stimulus: StimulusBlock[];
  consent?: {
    eyebrow: string;
    headline: string;
    summary: string;
    chips: string[];
    sections: ConsentSection[];
    agreeLabel: string;
  };
}

/** 기프트콘 이벤트 화면 문구. 비어 있는 값은 서버가 기본 문구로 채워 내려준다 */
export interface GiftContent {
  icon: string;
  eyebrow: string;
  headline: string;
  description: string;
  purpose: string; // 개인정보 수집·이용 목적
  endNotice: string; // 종료 화면의 발송 안내 문장
}

export interface GiftConfig {
  enabled: boolean; // false면 번호 입력 단계 없이 바로 설문 진행
  content: GiftContent;
}

export interface CurrentResponse {
  status: RespondentStatus;
  page?: PageDto; // IN_PROGRESS일 때만
  redirectUrl?: string; // 패널 리다이렉트
  gift?: GiftConfig;
}

export interface EnterResponse {
  enteredAt: string;
  serverNow: string;
}

export interface AnswerInput {
  questionId: number;
  optionId: number;
  changeCount: number;
}

export interface DwellMetrics {
  clientActiveMs: number;
  hiddenCount: number;
  blurCount: number;
}

export interface SubmitRequest extends DwellMetrics {
  answers: AnswerInput[];
  phone?: string | null;
}

export type ApiErrorCode =
  | 'TOO_EARLY'
  | 'QUOTA_FULL'
  | 'INVALID_PAGE'
  | 'MISSING_ANSWER'
  | 'SURVEY_CLOSED'
  | 'SURVEY_NOT_FOUND'
  | 'RESPONDENT_NOT_FOUND'
  | 'NOT_ENTERED'
  | 'INVALID_OPTION'
  | 'RATE_LIMITED'
  | 'PHONE_ALREADY_USED'
  | 'INVALID_REQUEST'
  | 'NETWORK';

export class ApiError extends Error {
  code: ApiErrorCode;
  detail?: Record<string, unknown>;

  // tsconfig의 erasableSyntaxOnly 때문에 파라미터 프로퍼티(public code)를 쓸 수 없다
  constructor(code: ApiErrorCode, message?: string, detail?: Record<string, unknown>) {
    super(message ?? code);
    this.code = code;
    this.detail = detail;
  }
}

export interface PhoneSubmitRequest {
  /** 숫자만, 예: "01012345678" */
  phone: string;
}

export type PhoneCheckStatus = 'NEW' | 'COMPLETE' | 'NOT_ELIGIBLE' | 'IN_PROGRESS';

export interface PhoneCheckResponse {
  checkStatus: PhoneCheckStatus;
}

export interface SurveyApi {
  start(code: string): Promise<CurrentResponse>;
  current(code: string): Promise<CurrentResponse>;
  enter(code: string, seq: number): Promise<EnterResponse>;
  submit(code: string, seq: number, body: SubmitRequest): Promise<CurrentResponse>;
  checkPhone(code: string, body: PhoneSubmitRequest): Promise<PhoneCheckResponse>;
}
