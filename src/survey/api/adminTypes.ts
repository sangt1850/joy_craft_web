export interface AdminStats {
  code: string;
  status: 'TEST' | 'OPEN' | 'CLOSED';
  targetN: number;
  byStatus: Record<string, number>;
  byGroup: Record<string, number>;
  quotas: Array<{
    key: string;
    kind: 'GROUP' | 'OPTION';
    groupCode: string | null;
    limit: number;
    completed: number;
    reserved: number;
  }>;
}

export interface RespondentItem {
  id: string;
  panelUid: string | null;
  status: string;
  groupCode: string | null;
  attentionFailed: boolean;
  startedAt: string;
  assignedAt: string | null;
  finishedAt: string | null;
  totalMs: number | null;
  giftPhone: string | null;
}

export interface RespondentPage {
  items: RespondentItem[];
  total: number;
  page: number;
  size: number;
}

export interface OptionDist {
  value: number;
  label: string;
  count: number;
  countA: number;
  countB: number;
}

export interface QuestionDist {
  questionId: number;
  qNo: string;
  code: string;
  text: string;
  qtype: string;
  pageKey: string;
  options: OptionDist[];
  mean: number | null;
  meanA: number | null;
  meanB: number | null;
  totalAnswers: number;
}

export interface AnswerDistribution {
  questions: QuestionDist[];
  totalValid: number;
  totalAll: number;
}

export interface GiftPhoneItem {
  id: number;
  respondentId: string;
  phone: string;
  submittedAt: string;
  sentAt: string | null;
  respondentStatus: string;
  groupCode: string | null;
  attentionFailed: boolean;
  finishedAt: string | null;
}

export interface GiftPhonesResponse {
  items: GiftPhoneItem[];
  total: number;
  sentCount: number;
  unsentCount: number;
}

export type QuestionType = 'LIKERT7' | 'SINGLE' | 'SELECT';

export interface EditableOption {
  id: number;
  seq: number;
  value: number;
  label: string;
  terminates: boolean;
  hasQuota: boolean;
  visible: boolean;
  answerCount: number;
}

export interface EditableQuestion {
  id: number;
  seq: number;
  qNo: string;
  code: string;
  text: string;
  qtype: QuestionType;
  required: boolean;
  attentionValue: number | null;
  answerCount: number;
  options: EditableOption[];
}

export type EditablePageType = 'CONSENT' | 'QUESTIONS' | 'STIMULUS';

export interface EditablePage {
  pageKey: string;
  seq: number;
  pageType: EditablePageType;
  title: string | null;
  instruction: string | null;
  /** 자극물 페이지에서만 의미가 있는 최소 체류 시간(초) */
  minSeconds: number;
  questions: EditableQuestion[];
}

export interface QuestionEditData {
  status: 'TEST' | 'OPEN' | 'CLOSED';
  pages: EditablePage[];
}
