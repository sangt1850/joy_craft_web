import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { ApiError, type AnswerInput, type CurrentResponse, type DwellMetrics } from '../api/types';
import { Toast } from '../components/Toast';
import { ConsentView } from './ConsentView';
import { EndView } from './EndView';
import { QuestionsView } from './QuestionsView';
import { StimulusView } from './StimulusView';

const ERROR_TEXT: Record<string, string> = {
  TOO_EARLY: '홍보물을 조금 더 살펴본 뒤 넘어갈 수 있어요.',
  QUOTA_FULL: '방금 선택한 보기의 모집이 마감되었어요. 다시 선택해 주세요.',
  MISSING_ANSWER: '답하지 않은 문항이 있어요.',
  INVALID_PAGE: '진행 상태가 바뀌어 현재 문항으로 이동했어요.',
  SURVEY_CLOSED: '설문이 종료되었습니다.',
  SURVEY_NOT_FOUND: '설문 링크가 올바르지 않습니다.',
  INVALID_OPTION: '선택지가 바뀌어 문항을 다시 불러왔어요.',
  RATE_LIMITED: '요청이 너무 빨라요. 잠시 후 다시 시도해 주세요.',
  NETWORK: '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
};

const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

export function SurveyPage() {
  const { code = '' } = useParams();
  const [params] = useSearchParams();
  const uid = params.get('uid');

  const [data, setData] = useState<CurrentResponse | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  // 시작 또는 이어하기
  useEffect(() => {
    api
      .start(code, uid)
      .then((res) => {
        // 링크를 공유해도 패널 uid가 새지 않도록 주소창에서 지운다 (서버는 쿠키로 식별)
        if (uid && !import.meta.env.VITE_USE_MOCK) {
          const url = new URL(location.href);
          url.searchParams.delete('uid');
          history.replaceState(null, '', url);
        }
        setData(res);
      })
      .catch((e: unknown) => setFatal(e instanceof ApiError ? ERROR_TEXT[e.code] ?? e.message : '오류가 발생했습니다.'));
  }, [code, uid]);

  const page = data?.status === 'IN_PROGRESS' ? data.page : undefined;
  const inProgress = data?.status === 'IN_PROGRESS';

  // 페이지 진입 시각을 서버에 기록 (체류 시간·45초 검증 기준)
  useEffect(() => {
    if (page) api.enter(code, page.seq).catch(() => undefined);
    window.scrollTo(0, 0);
  }, [code, page?.seq]); // eslint-disable-line react-hooks/exhaustive-deps

  // 뒤로 가기 막기
  useEffect(() => {
    if (!inProgress) return;
    history.pushState(null, '', location.href);
    const onPop = () => {
      history.pushState(null, '', location.href);
      setToast('이전 문항으로 돌아갈 수 없어요.');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [inProgress]);

  // 진행 중 이탈 경고
  useEffect(() => {
    if (!inProgress) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [inProgress]);

  const handleSubmit = async (answers: AnswerInput[], metrics: DwellMetrics) => {
    if (!page || submitting) return;
    setSubmitting(true);
    const body = { answers, ...metrics };
    try {
      try {
        setData(await api.submit(code, page.seq, body));
      } catch (e) {
        // enter 기록이 누락됐거나(네트워크), 요청이 몰린 경우는 한 번만 조용히 복구한다
        const c = e instanceof ApiError ? e.code : null;
        if (c === 'NOT_ENTERED') {
          await api.enter(code, page.seq);
        } else if (c === 'RATE_LIMITED') {
          await sleep(1000);
        } else {
          throw e;
        }
        setData(await api.submit(code, page.seq, body));
      }
    } catch (e) {
      const codeErr = e instanceof ApiError ? e.code : 'NETWORK';
      setToast(ERROR_TEXT[codeErr] ?? '오류가 발생했습니다.');
      // 쿠키 만료: 처음부터 다시 식별해서 서버 상태로 복구
      if (codeErr === 'RESPONDENT_NOT_FOUND') {
        try {
          setData(await api.start(code, uid));
        } catch {
          /* 토스트로 이미 안내 */
        }
      }
      // 쿼터 마감·페이지 불일치는 서버 상태로 다시 그린다
      if (codeErr === 'QUOTA_FULL' || codeErr === 'INVALID_PAGE' || codeErr === 'INVALID_OPTION') {
        try {
          setData(await api.current(code));
        } catch {
          /* 토스트로 이미 안내 */
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (fatal) {
    return (
      <div className="center-msg">
        <p>{fatal}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="center-msg" aria-busy="true">
        <div className="spinner" />
      </div>
    );
  }

  let view;
  if (data.status !== 'IN_PROGRESS') {
    view = <EndView status={data.status} redirectUrl={data.redirectUrl} />;
  } else if (page) {
    const props = { page, submitting, onSubmit: handleSubmit };
    // key=seq: 페이지가 바뀌면 응답·타이머 상태를 새로 시작
    if (page.pageType === 'CONSENT') view = <ConsentView key={page.seq} {...props} />;
    else if (page.pageType === 'STIMULUS') view = <StimulusView key={page.seq} {...props} />;
    else view = <QuestionsView key={`${page.seq}-${JSON.stringify(page.questions.map((q) => q.options.map((o) => o.available)))}`} {...props} />;
  }

  return (
    <>
      {view}
      <Toast message={toast} onDone={clearToast} />
    </>
  );
}
