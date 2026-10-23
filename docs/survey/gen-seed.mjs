// 문항표(표 4-1~4-5) → questionnaire.md (+ 최초 seed SQL) 생성. 문항 데이터는 이 파일 한 곳에서만 관리한다.
// 사용: node gen-seed.mjs <questionnaire.md 경로>  (문서만 생성한다. DB 변경은 db/survey 마이그레이션을 직접 작성한다)
// ⚠️ 적용된 마이그레이션(V3~)은 Flyway 체크섬이 고정되므로 수정 금지. 변경은 새 버전 파일로 추가한다.
import { writeFileSync } from 'node:fs';

const SURVEY = { code: 'awe2026', title: '자연 관광지 인식 조사', targetN: 500 };
const LIKERT_INSTR = '각 문장에 대해 얼마나 동의하는지 1점(전혀 그렇지 않다)부터 7점(매우 그렇다) 중 하나를 골라 주세요.';
const STIM_INSTR = '아래 홍보물을 천천히 살펴봐 주세요. 이어지는 문항은 이 홍보물을 바탕으로 답하게 됩니다.';

const consent = {
  eyebrow: '학술 연구 설문',
  headline: 'Z세대 여행자의 자연 관광지 인식 조사',
  summary: '관광 홍보물을 보고 느낀 생각과 감정을 묻는 설문입니다. 정답은 없으니 느끼신 그대로 답해 주세요.',
  chips: ['예상 소요 약 10분', '객관식 응답', '익명 응답'],
  sections: [
    { heading: '연구 목적', body: '관광 홍보물 유형에 따른 방문 의도와 SNS 공유 의도를 알아보기 위한 석사학위 논문 연구입니다.' },
    { heading: '자료 사용 범위', body: '응답은 통계 분석에만 쓰이며 개인을 알아볼 수 있는 정보는 수집하지 않습니다. 다만 응답의 질을 확인하기 위해 문항별 응답 시간, 화면 이용 시간, 접속 환경 정보(브라우저 종류, 암호화된 접속 기록)가 함께 기록됩니다.' },
    { heading: '참여 중단', body: '언제든 창을 닫아 중단할 수 있으며 불이익은 없습니다.' },
    { heading: '문의', body: '이상현 · dltkdgus1850@gmail.com' },
  ],
  agreeLabel: '위 내용을 확인했으며 연구 참여에 동의합니다.',
};

const YN = [[1, '예'], [2, '아니오']];
const L = (qNo, code, text, extra = {}) => ({ qNo, code, text, qtype: 'LIKERT7', ...extra });

// 페이지 정의: seq, key, type, title, instruction, group, min, questions
const pages = [
  { seq: 1, key: 'consent', type: 'CONSENT', title: '연구 참여 안내', content: consent, questions: [] },
  { seq: 2, key: 'screening', type: 'QUESTIONS', title: '기본 정보 확인', questions: [
    { qNo: 'Q1', code: 'BIRTH', text: '귀하의 출생 연도는 언제입니까?', qtype: 'SELECT', years: true },
    { qNo: 'Q2', code: 'NAT', text: '귀하의 국적은 대한민국입니까?', qtype: 'SINGLE', opts: YN.map(([v, l]) => [v, l, v === 2]) },
    { qNo: 'Q3', code: 'RES', text: '귀하는 현재 대한민국에 거주하고 있습니까?', qtype: 'SINGLE', opts: YN.map(([v, l]) => [v, l, v === 2]) },
  ] },
  { seq: 3, key: 'pre_travel', type: 'QUESTIONS', title: '나의 여행 스타일', instruction: LIKERT_INSTR, questions: [
    L('Q4', 'EXP1', '나는 여행할 때 휴식과 관람보다 직접 몸으로 참여하는 체험 활동을 선호한다.'),
    L('Q5', 'EXP2', '나는 익숙하고 편안한 여행지보다 다소 불편해도 새로운 경험을 할 수 있는 여행지를 선택하는 편이다.'),
  ] },
  { seq: 4, key: 'pre_activity', type: 'QUESTIONS', title: '평소 신체 활동', questions: [
    L('Q6', 'PA1', '나는 평소 운동이나 신체 활동을 규칙적으로 하고 있다.'),
    L('Q7', 'PA2', '나는 숨이 차거나 땀이 날 정도로 몸을 쓰는 활동에 익숙한 편이다.'),
    { qNo: 'Q8-1', code: 'PAAE', text: '최근 3개월간 유산소 운동(달리기, 자전거, 수영, 구기 운동 등)을 주 몇 회 하셨습니까?', qtype: 'SINGLE',
      opts: [[1, '전혀 없음'], [2, '주 1회'], [3, '주 2~3회'], [4, '주 4회 이상']] },
    { qNo: 'Q8-2', code: 'PAST', text: '최근 3개월간 근력 운동(웨이트 트레이닝, 맨몸 운동 등)을 주 몇 회 하셨습니까?', qtype: 'SINGLE',
      opts: [[1, '전혀 없음'], [2, '주 1회'], [3, '주 2~3회'], [4, '주 4회 이상']] },
    { qNo: 'Q8-3', code: 'PAOUT', text: '최근 3개월간 야외 활동(등산, 트레킹, 클라이밍, 캠핑 등)을 얼마나 자주 하셨습니까?', qtype: 'SINGLE',
      opts: [[1, '전혀 없음'], [2, '월 1회 미만'], [3, '월 1~2회'], [4, '월 3회 이상']] },
  ] },
  { seq: 5, key: 'pre_involve', type: 'QUESTIONS', title: '평소 생활 방식', instruction: LIKERT_INSTR, questions: [
    L('Q9', 'INV1', '야외에서 몸을 쓰는 활동은 나의 일상에서 중요한 부분을 차지한다.'),
    L('Q10', 'INV2', '나는 신체적으로 도전적인 활동에 관한 정보를 평소에 즐겨 찾아본다.'),
    L('Q11', 'INV3', '몸을 쓰는 활동을 통해 성취를 경험하는 것은 나에게 의미 있는 일이다.'),
  ] },
  { seq: 6, key: 'pre_media', type: 'QUESTIONS', title: '미디어 이용과 방문 경험', questions: [
    L('Q12', 'SFM', '나는 여행지 정보를 탐색할 때 숏폼 미디어(인스타그램 릴스, 틱톡, 유튜브 쇼츠 등)를 자주 활용한다.'),
    { qNo: 'Q13', code: 'KARST', text: '귀하는 과거에 카르스트 지형 관광지(예: 중국 구이린·구이저우·윈난, 베트남 하롱베이 등)를 방문한 경험이 있습니까?', qtype: 'SINGLE', opts: YN },
  ] },
  { seq: 7, key: 'assign', type: 'ASSIGN', title: '그룹 할당', questions: [] },
  { seq: 8, key: 'stimulus_a', type: 'STIMULUS', title: '관광 홍보물 보기', instruction: STIM_INSTR, group: 'A', min: 45, questions: [],
    stimulus: [['IMAGE', '/survey/stimuli/awe2026/stimulus-01.webp', null]] }, // A·B 공용 사진(임시). 홍보 문구·제목은 의도적으로 비워 둠
  { seq: 9, key: 'stimulus_b', type: 'STIMULUS', title: '관광 홍보물 보기', instruction: STIM_INSTR, group: 'B', min: 45, questions: [],
    stimulus: [['IMAGE', '/survey/stimuli/awe2026/stimulus-01.webp', null]] }, // A·B 공용 사진(임시). 홍보 문구·제목은 의도적으로 비워 둠
  { seq: 10, key: 'interest', type: 'QUESTIONS', title: '첫인상', questions: [
    { qNo: 'QI', code: 'INTEREST', text: '방금 본 사진을 보고 흥미가 있습니까, 없습니까?', qtype: 'SINGLE',
      opts: [[1, '흥미가 있다', false, 'INTEREST'], [2, '흥미가 없다', false, 'NO_INTEREST']] },
  ] },
  { seq: 11, key: 'novelty', type: 'QUESTIONS', title: '방금 본 관광지에 대한 생각', instruction: LIKERT_INSTR, questions: [
    L('Q14', 'NOV1', '방금 본 관광지의 경관은 내가 지금까지 보아온 자연경관과 확연히 다르다.'),
    L('Q15', 'NOV2', '이곳은 흔히 접할 수 있는 일반적인 관광지와 구별되는 독특함이 있다.'),
    L('Q16', 'NOV3', '이 장소는 나에게 매우 낯설고 새롭게 느껴진다.'),
    L('Q17', 'NOV4', '이 경관은 내가 기존에 알고 있던 여행지의 유형에는 없던 새로운 것이다.'),
  ] },
  { seq: 12, key: 'awe_aes', type: 'QUESTIONS', title: '방금 본 관광지에 대한 느낌', instruction: LIKERT_INSTR, questions: [
    L('Q18', 'AES1', '이 경관은 규모가 압도적이어서 그 앞에서 내가 작게 느껴진다.'),
    L('Q19', 'AES2', '이 풍경을 보고 있으면 경이로움과 함께 가슴이 벅차오르는 감정이 든다.'),
    L('Q20', 'AES3', '이곳의 경관은 내가 평소 자연을 이해하던 방식을 넘어설 정도로 웅장하다.'),
  ] },
  { seq: 13, key: 'awe_cha', type: 'QUESTIONS', title: '방금 본 관광지에 대한 느낌', instruction: LIKERT_INSTR, questions: [
    L('Q21', 'CHA1', '이 거대한 자연 속에서 나의 신체적 한계를 시험해 보고 싶다.'),
    L('Q22', 'CHA2', '이곳의 험난한 지형을 직접 극복해 보고 싶은 욕구가 생긴다.'),
    L('Q23', 'CHA3', '이곳의 험난함은 나에게 위협이라기보다 극복해 보고 싶은 과제로 느껴진다.'),
  ] },
  { seq: 14, key: 'awe_mng', type: 'QUESTIONS', title: '방금 본 관광지에 대한 느낌', instruction: LIKERT_INSTR, questions: [
    L('Q24', 'MNG1', '이곳에서의 도전은 단순한 재미를 넘어 나에게 의미 있는 경험이 될 것 같다.'),
    L('Q25', 'MNG2', '이 과정을 이겨낸다면 내가 지향하는 삶의 모습에 한 걸음 다가갈 수 있을 것 같다.'),
    L('Q26', 'MNG3', '이곳에서의 경험은 내가 어떤 사람인지 스스로 확인하는 계기가 될 것 같다.'),
  ] },
  { seq: 15, key: 'visit', type: 'QUESTIONS', title: '방문에 대한 생각', instruction: LIKERT_INSTR, questions: [
    L('Q27', 'VI1', '나는 이 관광지를 방문하고 싶다.'),
    L('Q28', 'VI2', '향후 여행 계획을 세울 때 나는 이곳을 목적지 후보로 고려할 것이다.'),
    L('Q29', 'VI3', '기회가 된다면 나의 시간과 비용을 들여 이곳을 방문할 의향이 있다.'),
    L('Q30', 'VI4', '가까운 시일 내에 이곳을 방문하는 방법을 구체적으로 알아볼 것이다.'),
  ] },
  { seq: 16, key: 'share', type: 'QUESTIONS', title: '공유에 대한 생각', instruction: LIKERT_INSTR, questions: [
    L('Q31', 'SI1', '이곳을 방문한다면 나는 그 경험을 나의 SNS에 게시할 것이다.'),
    L('Q32', 'SI2', '이곳에서 촬영한 사진이나 영상을 나의 SNS에 공유하고 싶다.'),
    L('Q33', 'SI3', '나는 이곳에 관한 정보를 나의 SNS 친구나 팔로워에게 전달할 의향이 있다.'),
    L('Q34', 'SI4', '나는 이곳에서의 경험을 SNS에 공유하는 일에 적극적으로 참여할 것이다.'),
  ] },
  // Q37·Q38(지각된 광대함, AWE-S 발췌)은 문항 원문을 받은 뒤 V4 마이그레이션으로 추가한다.
  { seq: 17, key: 'threat_vast', type: 'QUESTIONS', title: '방금 본 관광지에 대한 인상', instruction: LIKERT_INSTR, questions: [
    L('Q35', 'RSK1', '방금 본 장소를 직접 여행한다면 신체적으로 위험할 것 같다.'),
    L('Q36', 'RSK2', '방금 본 장소에서의 활동은 나의 안전에 위협이 될 것 같아 불안하다.'),
  ] },
  { seq: 18, key: 'manip', type: 'QUESTIONS', title: '홍보물에 대한 평가', instruction: LIKERT_INSTR, questions: [
    L('Q39', 'MAN1', '방금 본 홍보물은 이 지역의 형성 과정이나 지질학적 특성 등 객관적 정보를 중심으로 구성되어 있었다.'),
    L('Q40', 'MAN2', '방금 본 홍보물은 이 지역에서의 신체적 활동과 도전을 중심으로 구성되어 있었다.'),
    L('Q41', 'MAN3', '방금 본 홍보물의 전반적인 분위기는 차분하고 설명적이기보다 역동적이고 활기찼다.'),
    L('Q42', 'MAN4', '나는 홍보물의 내용에 대해 주의 깊게 생각하며 살펴보았다.'),
  ] },
  { seq: 19, key: 'attention', type: 'QUESTIONS', title: '응답 확인', instruction: LIKERT_INSTR, questions: [
    L('Q43', 'ATT', '본 문항은 응답의 성실성을 확인하기 위한 것입니다. 내용과 관계없이 ‘전혀 그렇지 않다(1점)’를 선택해 주십시오.', { att: 1 }),
  ] },
  { seq: 20, key: 'demo', type: 'QUESTIONS', title: '응답자 정보', questions: [
    { qNo: 'Q44', code: 'GEN', text: '귀하의 성별은 무엇입니까?', qtype: 'SINGLE', opts: [[1, '남성'], [2, '여성'], [3, '응답하지 않음']] },
    { qNo: 'Q45', code: 'EDU', text: '귀하의 최종 학력은 무엇입니까?', qtype: 'SINGLE',
      opts: [[1, '고등학교 졸업 이하'], [2, '전문대학 재학·졸업'], [3, '4년제 대학 재학·졸업'], [4, '대학원 재학 이상']] },
    { qNo: 'Q46', code: 'JOB', text: '귀하의 직업은 무엇입니까?', qtype: 'SINGLE',
      opts: [[1, '학생'], [2, '사무·관리직'], [3, '전문직'], [4, '서비스·판매직'], [5, '자영업'], [6, '프리랜서'], [7, '무직·구직 중'], [8, '기타']] },
    { qNo: 'Q47', code: 'INC', text: '귀하의 월 가처분 소득(본인이 자유롭게 사용 가능한 금액)은 어느 정도입니까?', qtype: 'SINGLE',
      opts: [[1, '50만 원 미만'], [2, '50~100만 원 미만'], [3, '100~200만 원 미만'], [4, '200~300만 원 미만'], [5, '300만 원 이상'], [6, '응답하지 않음']] },
    { qNo: 'Q48', code: 'COMP', text: '귀하가 주로 함께 여행하는 동반자 유형은 무엇입니까?', qtype: 'SINGLE',
      opts: [[1, '혼자'], [2, '친구'], [3, '연인'], [4, '가족'], [5, '직장·학교 동료'], [6, '동호회·커뮤니티']] },
    { qNo: 'Q49', code: 'SNSF', text: '귀하의 평소 SNS 이용 빈도는 어느 정도입니까?', qtype: 'SINGLE',
      opts: [[1, '거의 이용하지 않음'], [2, '주 1~2회'], [3, '주 3~5회'], [4, '매일 1시간 미만'], [5, '매일 1시간 이상']] },
  ] },
  { seq: 21, key: 'end', type: 'END', title: '종료', questions: [] },
];

const questions = pages.flatMap((p) => p.questions.map((x, i) => ({ ...x, page: p.key, seq: i + 1 })));

// ── questionnaire.md ───────────────────────────────────────
let md = `# 설문 문항 원문 (questionnaire.md)

> 출처: 논문 표 4-1~4-5 + 흥미 문항(INTEREST, 논문 표에 없는 추가 문항 — 보기 쿼터용). 설문 코드 \`${SURVEY.code}\`, CSV 열 이름은 \`code\`.
> DB 반영은 \`api/src/main/resources/db/survey/V3~\` 마이그레이션이 한다. 이 문서는 \`docs/survey/gen-seed.mjs\`의 데이터에서 생성된다
> (\`node docs/survey/gen-seed.mjs docs/survey/questionnaire.md\`). 문항을 바꾸면 스크립트 데이터와 새 마이그레이션을 같이 고친다.

## 0. 확정·미정 사항

| 항목 | 상태 |
|---|---|
| 설문 코드 / 제목 / 목표 인원 | \`${SURVEY.code}\` / ${SURVEY.title} / ${SURVEY.targetN}명 (그룹 A·B 각 ${SURVEY.targetN / 2}) — 코드·제목은 가칭, 바꾸려면 생성 데이터 수정 |
| **Q37·Q38 (지각된 광대함, AWE-S 발췌)** | ❗ **문항 원문 없음** — 표 4-3이 Q36에서 끝남. 나중에 받으면 새 마이그레이션으로 추가 (현재 ${questions.length}문항 = 논문 표 49문항(Q8을 3개로 셈, Q37·Q38 제외) + 흥미 문항 1) |
| 동의 화면 "문의" | ✅ 이상현 · dltkdgus1850@gmail.com |
| 예상 소요 시간 | ✅ 약 10분 (동의 화면 칩) |
| 자극물 사진 (45초 시청) | ✅ \`public/survey/stimuli/${SURVEY.code}/stimulus-01.webp\` (암벽 등반 인스타그램 게시물, 이미지 안에 문구 포함). **현재 A·B 두 자극물 페이지가 같은 사진을 보여준다(임시)** — 그룹별로 다른 사진이 필요하면 \`stimulus_a\` 블록의 경로만 교체 |
| 자극물 홍보 문구·제목 | ❗ **채워야 함** — 의도적으로 비워 둠(웹에도 표시되지 않음). 이미지에 문구가 이미 들어 있으면 비워 두어도 된다 |
| 흥미 문항 + 보기 쿼터 | ✅ 사진 직후 "방금 본 사진을 보고 흥미가 있습니까, 없습니까?" — 흥미가 있다 / 흥미가 없다 **각 250명**. 가득 찬 보기는 "모집 마감"으로 비활성. **문항·보기 문구는 임시 표현이므로 확인 필요** |
| 패널 리다이렉트 URL | 없음 (자체 종료 화면) |
| 주의 점검(Q43) 실패 | 끝까지 진행 후 ATTENTION_FAIL로 제외, 쿼터 반환 (화면은 완료와 동일) |
| 자극물 대기 | 45초, 탭이 보이는 시간만 카운트(VISIBLE_ONLY) |

## 1. 페이지 구성

| seq | page_key | 화면 제목 | 문항 | 그룹 |
|---|---|---|---|---|
${pages.map((p) => `| ${p.seq} | ${p.key} | ${p.title} | ${p.type === 'STIMULUS' ? '자극물 45초' : p.type === 'ASSIGN' ? '(그룹 할당, 화면 없음)' : p.type === 'CONSENT' ? '연구 안내·동의' : p.type === 'END' ? '' : p.questions.map((x) => x.qNo).join(', ')} | ${p.group ?? ''} |`).join('\n')}

## 2. 문항

종료 조건 ⛔ = 선택 시 즉시 SCREENOUT(쿼터 미소모). 리커트 7점 보기: 1 전혀 그렇지 않다 / 2 그렇지 않다 / 3 약간 그렇지 않다 / 4 보통이다 / 5 약간 그렇다 / 6 그렇다 / 7 매우 그렇다.

| Q | code | 유형 | 문항 | 보기·비고 |
|---|---|---|---|---|
${questions.map((x) => {
  let note = '';
  if (x.years) note = '1950~2012년 선택. ⛔ 1995~2006년생 외';
  else if (x.opts) note = x.opts.map(([v, l, t, quota]) => `${v} ${l}${t ? ' ⛔' : ''}${quota ? ` (쿼터 ${quota} 250)` : ''}`).join(' / ');
  else if (x.att) note = `주의 점검: ${x.att}점 외 응답 시 표본 제외`;
  return `| ${x.qNo} | ${x.code} | ${x.qtype} | ${x.text} | ${note} |`;
}).join('\n')}
| Q37 | — | LIKERT7 | ❗ 원문 필요 (지각된 광대함, Yaden et al. 2019 AWE-S 발췌) | |
| Q38 | — | LIKERT7 | ❗ 원문 필요 | |

총 ${questions.length}문항 구성 (Q8-1~Q8-3을 각각 1문항으로 셈. Q37·Q38 추가 시 +2).

## 3. 동의 화면

- eyebrow: ${consent.eyebrow}
- headline: ${consent.headline}
- summary: ${consent.summary}
- chips: ${consent.chips.join(' / ')}
${consent.sections.map((s) => `- ${s.heading}: ${s.body}`).join('\n')}
- 체크 문구: ${consent.agreeLabel}

## 4. 자극물

| 그룹 | 이미지 | 제목(caption) | 홍보 문구(본문) |
|---|---|---|---|
| A | \`${pages[7].stimulus[0][1]}\` (임시 공용) | ❗ 채워야 함 (비어 있음) | ❗ 채워야 함 (비어 있음) |
| B | \`${pages[8].stimulus[0][1]}\` (임시 공용) | ❗ 채워야 함 (비어 있음) | ❗ 채워야 함 (비어 있음) |

제목·문구를 채울 때는 \`sv_stimulus_block\`에 \`kind='TEXT'\` 행(content=본문, caption=제목)을 추가한다. 비어 있는 동안에는 웹에 아무것도 표시되지 않는다.
`;
writeFileSync(process.argv[2], md);
console.log('questions:', questions.length, 'pages:', pages.length);
