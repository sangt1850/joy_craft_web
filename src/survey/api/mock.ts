// 백엔드 없이 화면 흐름을 확인하기 위한 목 API.
// 서버 규칙(스크리닝 종료, 45초 검증, 보기 쿼터)을 흉내 낸다.
import {
  ApiError,
  type CurrentResponse,
  type GiftConfig,
  type OptionDto,
  type PageDto,
  type PhoneCheckStatus,
  type QuestionDto,
  type RespondentStatus,
  type SurveyApi,
} from './types';

const STIMULUS_SECONDS = Number(import.meta.env.VITE_MOCK_STIMULUS_SECONDS ?? 45);

let nextId = 1000;
const opt = (value: number, label: string, available = true): OptionDto => ({
  id: nextId++,
  value,
  label,
  available,
});

const LIKERT = [
  '전혀 그렇지 않다',
  '그렇지 않다',
  '약간 그렇지 않다',
  '보통이다',
  '약간 그렇다',
  '그렇다',
  '매우 그렇다',
];
const likert = (id: number, qNo: string, code: string, text: string): QuestionDto => ({
  id,
  qNo,
  code,
  text,
  qtype: 'LIKERT7',
  required: true,
  options: LIKERT.map((l, i) => opt(i + 1, l)),
});

// 스크리닝: 1995~2006년생만 통과
const years = Array.from({ length: 2026 - 1900 + 1 }, (_, i) => 2026 - i);
const yearOptions = years.map((y) => opt(y, `${y}년`));
const yesNo = () => [opt(1, '예'), opt(2, '아니오')];
const q2 = yesNo();
const q3 = yesNo();

const terminating = new Set<number>([
  ...yearOptions.filter((o) => o.value < 1995 || o.value > 2006).map((o) => o.id),
  q2[1].id,
  q3[1].id,
]);

const likeOptions = [opt(1, '마음에 든다', false), opt(2, '마음에 들지 않는다')];

const TOTAL = 6;
const PAGES: PageDto[] = [
  {
    seq: 1,
    pageKey: 'consent',
    pageType: 'CONSENT',
    title: '연구 참여 안내',
    minSeconds: 0,
    progressIndex: 1,
    totalPages: TOTAL,
    questions: [],
    stimulus: [],
    consent: {
      eyebrow: '학술 연구 설문',
      headline: 'Z세대 여행자의 자연 관광지 인식 조사',
      summary:
        '관광 홍보물을 보고 느낀 생각과 감정을 묻는 설문입니다. 정답은 없으니 느끼신 그대로 답해 주세요.',
      chips: ['예상 소요 약 10분', '객관식 49문항', '익명 응답'],
      sections: [
        {
          heading: '연구 목적',
          body: '관광 홍보물 유형에 따른 방문 의도와 SNS 공유 의도를 알아보기 위한 석사학위 논문 연구입니다.',
        },
        {
          heading: '자료 사용 범위',
          body: '응답은 통계 분석에만 쓰이며 개인을 알아볼 수 있는 정보는 수집하지 않습니다.',
        },
        { heading: '참여 중단', body: '언제든 창을 닫아 중단할 수 있으며 불이익은 없습니다.' },
        { heading: '문의', body: '[연구자 이름] · [연구자 이메일]' },
      ],
      agreeLabel: '위 내용을 확인했으며 연구 참여에 동의합니다.',
    },
  },
  {
    seq: 2,
    pageKey: 'screening',
    pageType: 'QUESTIONS',
    title: '기본 정보 확인',
    minSeconds: 0,
    progressIndex: 2,
    totalPages: TOTAL,
    stimulus: [],
    questions: [
      { id: 1, qNo: 'Q1', code: 'Q1', text: '귀하의 출생 연도는 언제입니까?', qtype: 'SELECT', required: true, options: yearOptions },
      { id: 2, qNo: 'Q2', code: 'Q2', text: '귀하의 국적은 대한민국입니까?', qtype: 'SINGLE', required: true, options: q2 },
      { id: 3, qNo: 'Q3', code: 'Q3', text: '귀하는 현재 대한민국에 거주하고 있습니까?', qtype: 'SINGLE', required: true, options: q3 },
    ],
  },
  {
    seq: 3,
    pageKey: 'stimulus_a',
    pageType: 'STIMULUS',
    title: '관광 홍보물 보기',
    instruction: '아래 이미지를 천천히 살펴봐 주세요. 이어지는 문항은 이 이미지를 바탕으로 답하게 됩니다.',
    minSeconds: STIMULUS_SECONDS,
    progressIndex: 3,
    totalPages: TOTAL,
    questions: [],
    stimulus: [
      { id: 1, kind: 'IMAGE', content: '', caption: '[자극물 이미지 · Group A / B]' },
      {
        id: 2,
        kind: 'TEXT',
        content:
          '[홍보 문구 — A그룹은 지형 형성 과정·지질 정보 중심, B그룹은 트레킹·도전 활동 중심의 텍스트가 들어갑니다.]',
        caption: '[홍보물 제목]',
      },
    ],
  },
  {
    seq: 4,
    pageKey: 'first_impression',
    pageType: 'QUESTIONS',
    title: '첫인상',
    minSeconds: 0,
    progressIndex: 4,
    totalPages: TOTAL,
    stimulus: [],
    questions: [
      { id: 90, qNo: 'Q-LIKE', code: 'LIKE', text: '방금 본 관광지가 마음에 드십니까?', qtype: 'SINGLE', required: true, options: likeOptions },
    ],
  },
  {
    seq: 5,
    pageKey: 'novelty',
    pageType: 'QUESTIONS',
    title: '방금 본 관광지에 대한 생각',
    instruction: '각 문장에 대해 얼마나 동의하는지 1점(전혀 그렇지 않다)부터 7점(매우 그렇다) 중 하나를 골라 주세요.',
    minSeconds: 0,
    progressIndex: 5,
    totalPages: TOTAL,
    stimulus: [],
    questions: [
      likert(14, 'Q14', 'NOV1', '방금 본 관광지의 경관은 내가 지금까지 보아온 자연경관과 확연히 다르다.'),
      likert(15, 'Q15', 'NOV2', '이곳은 흔히 접할 수 있는 일반적인 관광지와 구별되는 독특함이 있다.'),
      likert(16, 'Q16', 'NOV3', '이 장소는 나에게 매우 낯설고 새롭게 느껴진다.'),
      likert(17, 'Q17', 'NOV4', '이 경관은 내가 기존에 알고 있던 여행지의 유형에는 없던 새로운 것이다.'),
    ],
  },
  {
    seq: 6,
    pageKey: 'attention',
    pageType: 'QUESTIONS',
    title: '응답 확인',
    minSeconds: 0,
    progressIndex: 6,
    totalPages: TOTAL,
    stimulus: [],
    questions: [
      likert(43, 'Q43', 'ATT', '본 문항은 응답의 성실성을 확인하기 위한 것입니다. 내용과 관계없이 ‘전혀 그렇지 않다(1점)’를 선택해 주십시오.'),
    ],
  },
];

interface MockState {
  seq: number;
  status: RespondentStatus;
  enteredAt: Record<number, number>;
  attentionFailed: boolean;
  phone: string | null;
}
let state: MockState = { seq: 1, status: 'IN_PROGRESS', enteredAt: {}, attentionFailed: false, phone: null };

const delay = <T,>(v: T, ms = 250) => new Promise<T>((r) => setTimeout(() => r(v), ms));
// 서버 기본 문구와 같은 값. ?gift=off 로 이벤트 꺼진 흐름을 확인할 수 있다
const mockGift = (): GiftConfig => ({
  enabled: new URLSearchParams(location.search).get('gift') !== 'off',
  content: {
    icon: '☕',
    eyebrow: '이벤트 안내',
    headline: '커피 기프트콘 증정',
    description:
      '설문에 참여해 주시면 커피 기프트콘을 보내드려요. 번호 입력은 선택이며, 번호 없이도 설문에 참여할 수 있어요.',
    purpose: '경품(커피 기프트콘) 발송에만 사용',
    endNotice: '커피 쿠폰은 1주일 이내로 발송됩니다.',
  },
});

const currentResponse = (): CurrentResponse =>
  state.status === 'IN_PROGRESS'
    ? { status: state.status, page: PAGES.find((p) => p.seq === state.seq), gift: mockGift() }
    : { status: state.status, gift: mockGift() };

export const mockApi: SurveyApi = {
  async checkPhone() {
    // ?phone_check=IN_PROGRESS 등으로 시나리오 강제 가능
    const scenario = new URLSearchParams(location.search).get('phone_check');
    const checkStatus = (scenario as PhoneCheckStatus | null) ?? 'NEW';
    return delay({ checkStatus }, 300);
  },
  async start() {
    state = { seq: 1, status: 'IN_PROGRESS', enteredAt: {}, attentionFailed: false, phone: null };
    return delay(currentResponse());
  },
  async current() {
    return delay(currentResponse());
  },
  async enter(_code, seq) {
    if (!state.enteredAt[seq]) state.enteredAt[seq] = Date.now();
    const now = new Date().toISOString();
    return delay({ enteredAt: new Date(state.enteredAt[seq]).toISOString(), serverNow: now }, 50);
  },
  async submit(_code, seq, body) {
    await delay(null, 300);
    if (state.status === 'COMPLETE' && seq === state.seq) return currentResponse();
    if (state.status !== 'IN_PROGRESS' || seq !== state.seq) throw new ApiError('INVALID_PAGE');
    const page = PAGES.find((p) => p.seq === seq)!;

    if (page.minSeconds > 0) {
      const elapsed = Date.now() - (state.enteredAt[seq] ?? Date.now());
      if (elapsed < page.minSeconds * 1000 - 1000 || body.clientActiveMs < page.minSeconds * 1000 - 1000) {
        throw new ApiError('TOO_EARLY');
      }
    }
    for (const q of page.questions) {
      const a = body.answers.find((x) => x.questionId === q.id);
      if (q.required && !a) throw new ApiError('MISSING_ANSWER');
      const o = q.options.find((x) => x.id === a?.optionId);
      if (o && !o.available) throw new ApiError('QUOTA_FULL');
      if (a && terminating.has(a.optionId)) {
        state.status = 'SCREENOUT';
        return currentResponse();
      }
      if (q.code === 'ATT' && o && o.value !== 1) state.attentionFailed = true;
    }

    const next = PAGES.find((p) => p.seq > seq);
    if (next) state.seq = next.seq;
    else state.status = 'COMPLETE'; // 주의 점검 실패도 완료로 보관한다 (서버와 동일)
    if (state.status === 'COMPLETE') state.phone = body.phone ?? null;
    return currentResponse();
  },
};
