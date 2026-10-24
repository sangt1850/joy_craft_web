import type { OptionDist, QuestionDist } from '../../api/adminTypes';

export interface CompareGroup {
  key: string;
  label: string;
  color: string;
  counts: number[];
}

export interface GroupCompareProps {
  questionNo: number | string;
  title: string;
  options: string[];
  groups: CompareGroup[];
}

const GROUP_COLORS: Record<string, string> = { A: '#2a78d6', B: '#eb6834' };

/** 비율(%) — 소수점 첫째 자리 반올림, 총원이 0이면 0 */
function pctOf(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
}

/**
 * 관리자 API의 문항 분포(QuestionDist)를 비교 차트 props로 변환한다.
 * 보기 목록(`shown`)은 호출부에서 리커트 보정·연도 필터를 적용한 결과를 넘긴다.
 */
export function toCompareProps(
  q: QuestionDist,
  shown: OptionDist[],
  labelOf: (o: OptionDist) => string,
): GroupCompareProps {
  return {
    questionNo: q.qNo,
    title: q.text,
    options: shown.map(labelOf),
    groups: [
      { key: 'A', label: 'A', color: GROUP_COLORS.A, counts: shown.map((o) => o.countA) },
      { key: 'B', label: 'B', color: GROUP_COLORS.B, counts: shown.map((o) => o.countB) },
    ],
  };
}

/** 보기 1개 = 1행, 그룹별 막대를 위아래로 쌓는 A/B 비교 분포. 비율은 각 그룹 응답자 기준 */
export function GroupCompareDistribution({ options, groups }: Omit<GroupCompareProps, 'questionNo' | 'title'>) {
  const totals = groups.map((g) => g.counts.reduce((s, c) => s + c, 0));

  return (
    <div className="gcmp">
      <div className="gcmp__legend">
        {groups.map((g, gi) => (
          <span key={g.key} className="gcmp__legend-item">
            <i className="gcmp__swatch" style={{ background: g.color }} />
            {g.label} (n={totals[gi].toLocaleString()})
          </span>
        ))}
        <span className="gcmp__note">비율은 각 그룹 응답자 기준</span>
      </div>

      {options.map((label, oi) => (
        <div key={oi} className="gcmp__row">
          <div className="gcmp__label">{label}</div>
          <div className="gcmp__bars">
            {groups.map((g, gi) => {
              const count = g.counts[oi] ?? 0;
              const pct = pctOf(count, totals[gi]);
              return (
                <div
                  key={g.key}
                  className="gcmp__track"
                  title={`${g.label} · ${label} · ${count.toLocaleString()}명 (${pct}%)`}
                >
                  <div className="gcmp__bar" style={{ width: `${pct}%`, background: g.color }} />
                </div>
              );
            })}
          </div>
          <div className="gcmp__nums">
            {groups.map((g, gi) => {
              const count = g.counts[oi] ?? 0;
              return (
                <div key={g.key}>
                  {g.label} {count.toLocaleString()}명 {pctOf(count, totals[gi])}%
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
