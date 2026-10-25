import { useEffect } from 'react';
import { Body, Card, Screen } from '../components/Layout';
import type { GiftConfig, RespondentStatus } from '../api/types';

// 발송 안내 문장은 기프트콘 이벤트가 켜져 있을 때만 끼워 넣는다
function completeBody(gift?: GiftConfig): string {
  return [
    '소중한 시간을 내어 참여해 주셔서 감사합니다.',
    gift?.enabled ? gift.content.endNotice : null,
    '응답은 연구 목적으로만 사용됩니다.',
  ]
    .filter(Boolean)
    .join('\n');
}

const COPY: Record<Exclude<RespondentStatus, 'IN_PROGRESS'>, { title: string; body: string; ok: boolean }> = {
  COMPLETE: { title: '응답이 제출되었습니다', body: '', ok: true },
  // 주의 점검 실패는 응답자에게 따로 알리지 않는다
  ATTENTION_FAIL: { title: '응답이 제출되었습니다', body: '', ok: true },
  SCREENOUT: { title: '참여 대상이 아닙니다', body: '이번 조사는 정해진 조건에 맞는 분만 참여할 수 있어요.\n관심 가져 주셔서 감사합니다.', ok: false },
  QUOTAFULL: { title: '목표 인원이 모두 모였습니다', body: '조사 인원이 마감되어 더 이상 응답을 받지 않아요.\n관심 가져 주셔서 감사합니다.', ok: false },
  ABANDONED: { title: '응답 시간이 만료되었습니다', body: '오래 머물러 응답이 종료되었어요.\n관심 가져 주셔서 감사합니다.', ok: false },
};

export function EndView({
  status,
  redirectUrl,
  gift,
}: {
  status: Exclude<RespondentStatus, 'IN_PROGRESS'>;
  redirectUrl?: string;
  gift?: GiftConfig;
}) {
  const base = COPY[status];
  const c = base.ok ? { ...base, body: completeBody(gift) } : base;

  useEffect(() => {
    if (!redirectUrl) return;
    const t = window.setTimeout(() => window.location.assign(redirectUrl), 3000);
    return () => window.clearTimeout(t);
  }, [redirectUrl]);

  return (
    <Screen>
      <div className="accent-strip" />
      <Body>
        <div className="end">
          <Card className="end__card">
            <div className={`end__icon ${c.ok ? '' : 'end__icon--neutral'}`}>
              {c.ok ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              ) : (
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5" />
                  <path d="M12 16h.01" />
                </svg>
              )}
            </div>
            <h1 className="end__title">{c.title}</h1>
            <p className="end__body">{c.body}</p>
            {redirectUrl && <div className="end__foot">잠시 후 패널 사이트로 자동 이동합니다</div>}
          </Card>
        </div>
      </Body>
      {redirectUrl && (
        <footer className="bottom-bar">
          <a className="btn-secondary" href={redirectUrl}>
            지금 이동하기
          </a>
        </footer>
      )}
    </Screen>
  );
}
