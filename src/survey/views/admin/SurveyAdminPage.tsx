import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { createAdminClient, type AdminClient } from '../../api/adminClient';
import { AnswersTab } from './AnswersTab';
import { GiftTab } from './GiftTab';
import { OverviewTab } from './OverviewTab';
import { QuestionsTab } from './QuestionsTab';
import { RespondentsTab } from './RespondentsTab';

type Tab = 'overview' | 'respondents' | 'answers' | 'questions' | 'gifts';

const TABS: [Tab, string][] = [
  ['overview', '개요'],
  ['respondents', '응답자'],
  ['answers', '문항 분포'],
  ['questions', '문항 관리'],
  ['gifts', '선물 발송'],
];

const STORAGE_KEY = 'survey-admin-key';

export function SurveyAdminPage() {
  const { code = '' } = useParams();
  const [keyInput, setKeyInput] = useState('');
  const [client, setClient] = useState<AdminClient | null>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? createAdminClient(code, stored) : null;
  });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    document.title = `관리자 — ${code}`;
    return () => {
      document.title = 'SNS 여행 게시물과 자연 관광지 인식에 관한 설문조사';
    };
  }, [code]);

  const handleLogin = async () => {
    const key = keyInput.trim();
    if (!key) return;
    setAuthLoading(true);
    setAuthError('');
    const c = createAdminClient(code, key);
    try {
      await c.stats();
      sessionStorage.setItem(STORAGE_KEY, key);
      setClient(c);
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : '관리자 키가 올바르지 않습니다.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setClient(null);
    setKeyInput('');
  };

  // 인증 게이트
  if (!client) {
    return (
      <div className="admin-gate">
        <div className="admin-gate__card">
          <div className="admin-gate__eyebrow">설문 관리자</div>
          <h1 className="admin-gate__title">{code}</h1>
          <input
            className="admin-gate__input"
            type="password"
            placeholder="관리자 키 입력"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            autoFocus
          />
          {authError && <p className="admin-gate__error">{authError}</p>}
          <button
            className="btn-primary admin-gate__btn"
            onClick={handleLogin}
            disabled={authLoading || !keyInput.trim()}
          >
            {authLoading ? '확인 중…' : '확인'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-root">
      {/* 헤더 */}
      <div className="admin-header">
        <div className="admin-header__left">
          <span className="admin-header__code">{code}</span>
          <h1 className="admin-header__title">설문 결과 관리</h1>
        </div>
        <button className="admin-header__logout" onClick={handleLogout}>
          로그아웃
        </button>
      </div>

      {/* 탭 */}
      <div className="admin-tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={`admin-tab${tab === id ? ' admin-tab--active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 컨텐츠 */}
      <div className="admin-content">
        {tab === 'overview' && <OverviewTab client={client} />}
        {tab === 'respondents' && <RespondentsTab client={client} />}
        {tab === 'answers' && <AnswersTab client={client} />}
        {tab === 'questions' && <QuestionsTab client={client} />}
        {tab === 'gifts' && <GiftTab client={client} />}
      </div>
    </div>
  );
}
