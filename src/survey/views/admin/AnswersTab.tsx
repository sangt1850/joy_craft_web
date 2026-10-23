import { useCallback, useEffect, useState } from 'react';
import type { AdminClient } from '../../api/adminClient';
import type { AnswerDistribution, QuestionDist } from '../../api/adminTypes';

interface Props {
  client: AdminClient;
}

function QuestionCard({ q }: { q: QuestionDist }) {
  const maxCount = Math.max(...q.options.map((o) => o.count), 1);
  const hasGroups = q.options.some((o) => o.countA > 0 || o.countB > 0);

  return (
    <div className="dist-card">
      <div className="dist-card__header">
        <span className="dist-card__qno">{q.qNo}</span>
        <span className="dist-card__code">{q.code}</span>
        <span className="dist-card__type">{q.qtype}</span>
      </div>
      <p className="dist-card__text">{q.text}</p>

      {q.qtype === 'LIKERT7' && q.mean != null ? (
        <div className="dist-means">
          <span>
            전체 <strong>{q.mean.toFixed(2)}</strong>
          </span>
          {q.meanA != null && (
            <span>
              A <strong>{q.meanA.toFixed(2)}</strong>
            </span>
          )}
          {q.meanB != null && (
            <span>
              B <strong>{q.meanB.toFixed(2)}</strong>
            </span>
          )}
          <span className="dist-n">N={q.totalAnswers.toLocaleString()}</span>
        </div>
      ) : (
        <div className="dist-n-header">N={q.totalAnswers.toLocaleString()}</div>
      )}

      <div className="dist-bars">
        {q.options.map((opt) => {
          const pct = q.totalAnswers > 0 ? (opt.count / q.totalAnswers) * 100 : 0;
          const barWidth = maxCount > 0 ? (opt.count / maxCount) * 100 : 0;
          return (
            <div key={opt.value} className="dist-row">
              <div className="dist-row__label">
                {q.qtype === 'LIKERT7' ? String(opt.value) : opt.label}
              </div>
              <div className="dist-row__bar-track">
                <div
                  className="dist-row__bar"
                  style={{ width: `${barWidth}%` }}
                  aria-valuenow={opt.count}
                  aria-valuemax={maxCount}
                  role="meter"
                />
              </div>
              <div className="dist-row__count">
                {opt.count.toLocaleString()}
                {q.totalAnswers > 0 && (
                  <span className="dist-row__pct"> ({pct.toFixed(1)}%)</span>
                )}
                {hasGroups && (
                  <span className="dist-row__groups">
                    {' '}
                    A:{opt.countA} B:{opt.countB}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {q.qtype === 'LIKERT7' && (
        <div className="likert-legend">
          <span>1 = 전혀 그렇지 않다</span>
          <span>7 = 매우 그렇다</span>
        </div>
      )}
    </div>
  );
}

export function AnswersTab({ client }: Props) {
  const [data, setData] = useState<AnswerDistribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [excludeAttFail, setExcludeAttFail] = useState(true);
  const [pageFilter, setPageFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(
    (exclude: boolean) => {
      setLoading(true);
      setError('');
      client
        .answers(exclude)
        .then(setData)
        .catch((e: unknown) => setError(e instanceof Error ? e.message : '불러오기 실패'))
        .finally(() => setLoading(false));
    },
    [client],
  );

  useEffect(() => {
    load(excludeAttFail);
  }, [load, excludeAttFail]);

  const questions = data?.questions ?? [];
  const pageKeys = [...new Set(questions.map((q) => q.pageKey))];

  const filtered = questions.filter((q) => {
    if (pageFilter && q.pageKey !== pageFilter) return false;
    if (
      search &&
      !q.text.includes(search) &&
      !q.code.toLowerCase().includes(search.toLowerCase()) &&
      !q.qNo.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="admin-section">
      <div className="admin-filters">
        <label className="admin-toggle">
          <input
            type="checkbox"
            checked={excludeAttFail}
            onChange={(e) => setExcludeAttFail(e.target.checked)}
          />
          <span>주의 실패 제외</span>
        </label>
        <select
          className="admin-select"
          value={pageFilter}
          onChange={(e) => setPageFilter(e.target.value)}
          aria-label="페이지 필터"
        >
          <option value="">전체 페이지</option>
          {pageKeys.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input
          className="admin-search"
          type="search"
          placeholder="문항 코드·텍스트 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {data && (
          <span className="admin-total-count" title="완료(COMPLETE) 응답자만 집계합니다.">
            {excludeAttFail
              ? `주의 제외 ${data.totalValid.toLocaleString()}명 / 완료 전체 ${data.totalAll.toLocaleString()}명`
              : `완료 전체 ${data.totalAll.toLocaleString()}명`}
          </span>
        )}
      </div>

      {loading ? (
        <div className="admin-loading">불러오는 중…</div>
      ) : error ? (
        <div className="admin-error">
          <p>{error}</p>
          <button className="admin-retry-btn" onClick={() => load(excludeAttFail)}>
            다시 시도
          </button>
        </div>
      ) : (
        <div className="dist-list">
          {filtered.length === 0 ? (
            <div className="admin-empty">표시할 문항이 없습니다.</div>
          ) : (
            filtered.map((q) => <QuestionCard key={q.questionId} q={q} />)
          )}
        </div>
      )}
    </div>
  );
}
