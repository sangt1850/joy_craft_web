import { useCallback, useEffect, useState } from 'react';
import type { AdminClient } from '../../api/adminClient';
import type { AnswerDistribution, QuestionDist } from '../../api/adminTypes';
import { GroupCompareDistribution, toCompareProps } from './GroupCompareDistribution';

interface Props {
  client: AdminClient;
}

const LIKERT_LABELS = [
  '전혀 그렇지 않다',
  '그렇지 않다',
  '다소 그렇지 않다',
  '보통이다',
  '다소 그렇다',
  '그렇다',
  '매우 그렇다',
];

const YEAR_LABEL = /^(\d{4})년$/;

function optionYear(label: string): number | null {
  const m = YEAR_LABEL.exec(label.trim());
  return m ? Number(m[1]) : null;
}

function YearRangeFilter({
  years,
  from,
  to,
  onChange,
}: {
  years: number[];
  from: number;
  to: number;
  onChange: (from: number, to: number) => void;
}) {
  const min = years[0];
  const max = years[years.length - 1];
  return (
    <div className="dist-year-filter">
      <select
        className="admin-select"
        aria-label="시작 연도"
        value={from}
        onChange={(e) => {
          const f = Number(e.target.value);
          onChange(f, Math.max(f, to));
        }}
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}년</option>
        ))}
      </select>
      <span>~</span>
      <select
        className="admin-select"
        aria-label="종료 연도"
        value={to}
        onChange={(e) => {
          const t = Number(e.target.value);
          onChange(Math.min(from, t), t);
        }}
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}년</option>
        ))}
      </select>
      <button
        type="button"
        className="admin-page-btn"
        onClick={() => onChange(min, max)}
        disabled={from === min && to === max}
      >
        전체
      </button>
    </div>
  );
}

type GroupView = 'ALL' | 'A' | 'B';
type ViewMode = 'MERGED' | 'SPLIT';

function QuestionCard({ q, group, mode }: { q: QuestionDist; group: GroupView; mode: ViewMode }) {
  // 출생 연도 문항(보기 라벨이 "YYYY년")이면 우측 상단에 연도 범위 필터를 제공한다
  const years = q.options
    .map((o) => optionYear(o.label))
    .filter((y): y is number => y != null)
    .sort((a, b) => a - b);
  const isYearQuestion = years.length > 0 && years.length === q.options.length;
  const [range, setRange] = useState<[number, number] | null>(null);
  const from = range?.[0] ?? years[0];
  const to = range?.[1] ?? years[years.length - 1];

  const isLikert = q.qtype === 'LIKERT7';
  // 리커트는 응답이 없는 점수도 1~7을 모두 표시한다
  const options = isLikert
    ? Array.from({ length: 7 }, (_, i) => {
        const value = i + 1;
        return (
          q.options.find((o) => o.value === value) ?? {
            value,
            label: String(value),
            count: 0,
            countA: 0,
            countB: 0,
          }
        );
      })
    : isYearQuestion
      ? q.options.filter((o) => {
          const y = optionYear(o.label)!;
          return y >= from && y <= to;
        })
      : q.options;
  // 그룹 보기에서는 해당 그룹의 응답 수만 사용한다
  const countOf = (o: { count: number; countA: number; countB: number }) =>
    group === 'A' ? o.countA : group === 'B' ? o.countB : o.count;
  const optionSum = options.reduce((sum, o) => sum + countOf(o), 0);
  const totalAnswers =
    group !== 'ALL' || isYearQuestion ? optionSum : q.totalAnswers || optionSum;

  const maxCount = Math.max(...options.map(countOf), 1);
  const hasGroups = group === 'ALL' && options.some((o) => o.countA > 0 || o.countB > 0);
  const groupMean = group === 'A' ? q.meanA : group === 'B' ? q.meanB : q.mean;

  return (
    <div className="dist-card">
      <div className="dist-card__header">
        <p className="dist-card__text">
          <span className="dist-card__qno">{q.qNo}.</span> {q.text}
        </p>
        {isYearQuestion && (
          <YearRangeFilter
            years={years}
            from={from}
            to={to}
            onChange={(f, t) => setRange([f, t])}
          />
        )}
      </div>

      {mode === 'SPLIT' ? (
        <GroupCompareDistribution
          {...toCompareProps(q, options, (o) => (isLikert ? LIKERT_LABELS[o.value - 1] : o.label))}
        />
      ) : (
        <>
      {q.qtype === 'LIKERT7' && group !== 'ALL' && groupMean != null ? (
        <div className="dist-means">
          <span>
            {group} 평균 <strong>{groupMean.toFixed(2)}</strong>
          </span>
        </div>
      ) : null}
      {q.qtype === 'LIKERT7' && group === 'ALL' && q.mean != null ? (
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
        </div>
      ) : null}

      <div className="dist-bars">
        {options.map((opt) => {
          const count = countOf(opt);
          const pct = totalAnswers > 0 ? (count / totalAnswers) * 100 : 0;
          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <div key={opt.value} className="dist-row">
              <div className="dist-row__label">
                {isLikert ? LIKERT_LABELS[opt.value - 1] : opt.label}
              </div>
              <div className="dist-row__bar-track">
                <div
                  className="dist-row__bar"
                  style={{ width: `${barWidth}%` }}
                  aria-valuenow={count}
                  aria-valuemax={maxCount}
                  role="meter"
                />
              </div>
              <div className="dist-row__count">
                {count.toLocaleString()}명
                <span className="dist-row__pct"> ({pct.toFixed(1)}%)</span>
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
        </>
      )}
    </div>
  );
}

export function AnswersTab({ client }: Props) {
  const [data, setData] = useState<AnswerDistribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState<GroupView>('ALL');
  const [mode, setMode] = useState<ViewMode>('MERGED');

  const load = useCallback(
    () => {
      setLoading(true);
      setError('');
      client
        .answers(false)
        .then(setData)
        .catch((e: unknown) => setError(e instanceof Error ? e.message : '불러오기 실패'))
        .finally(() => setLoading(false));
    },
    [client],
  );

  useEffect(() => {
    load();
  }, [load]);

  const questions = data?.questions ?? [];

  const filtered = questions.filter((q) => {
    if (
      search &&
      !q.text.includes(search) &&
      !q.qNo.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="admin-section">
      <div className="admin-filters">
        <input
          className="admin-search"
          type="search"
          placeholder="문항 번호·텍스트 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="admin-select"
          aria-label="보기 방식"
          value={mode}
          onChange={(e) => setMode(e.target.value as ViewMode)}
        >
          <option value="MERGED">합쳐보기</option>
          <option value="SPLIT">나눠보기 (A/B 비교)</option>
        </select>
        <select
          className="admin-select"
          aria-label="그룹 보기"
          disabled={mode === 'SPLIT'}
          value={group}
          onChange={(e) => setGroup(e.target.value as GroupView)}
        >
          <option value="ALL">전체</option>
          <option value="A">A그룹</option>
          <option value="B">B그룹</option>
        </select>
        {data && (
          <span className="admin-total-count" title="완료(COMPLETE) 응답자만 집계합니다.">
            완료 {data.totalAll.toLocaleString()}명
          </span>
        )}
      </div>

      {loading ? (
        <div className="admin-loading">불러오는 중…</div>
      ) : error ? (
        <div className="admin-error">
          <p>{error}</p>
          <button className="admin-retry-btn" onClick={load}>
            다시 시도
          </button>
        </div>
      ) : (
        <div className="dist-list">
          {filtered.length === 0 ? (
            <div className="admin-empty">표시할 문항이 없습니다.</div>
          ) : (
            filtered.map((q) => <QuestionCard key={q.questionId} q={q} group={group} mode={mode} />)
          )}
        </div>
      )}
    </div>
  );
}
