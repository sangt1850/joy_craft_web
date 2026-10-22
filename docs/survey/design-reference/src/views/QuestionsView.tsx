import { useRef, useState } from 'react';
import { Body, BottomBar, Card, ProgressHeader, Screen } from '../components/Layout';
import { Likert7, QuotaNotice, SelectChoice, SingleChoice } from '../components/Choices';
import { useDwellTracker } from '../hooks/useDwellTracker';
import type { QuestionDto } from '../api/types';
import type { ViewProps } from './types';

interface Picked {
  optionId: number;
  changeCount: number;
}

export function QuestionsView({ page, submitting, onSubmit }: ViewProps) {
  const [answers, setAnswers] = useState<Record<number, Picked>>({});
  const [showErrors, setShowErrors] = useState(false);
  const refs = useRef<Record<number, HTMLElement | null>>({});
  const { snapshot } = useDwellTracker(true);

  const missing = page.questions.filter((q) => q.required && !answers[q.id]);
  const hasClosedOption = page.questions.some((q) => q.options.some((o) => !o.available));

  const pick = (q: QuestionDto, optionId: number) =>
    setAnswers((prev) => {
      const before = prev[q.id];
      if (before?.optionId === optionId) return prev;
      return { ...prev, [q.id]: { optionId, changeCount: before ? before.changeCount + 1 : 0 } };
    });

  const handleNext = () => {
    if (missing.length > 0) {
      setShowErrors(true);
      refs.current[missing[0].id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onSubmit(
      page.questions
        .filter((q) => answers[q.id])
        .map((q) => ({ questionId: q.id, ...answers[q.id] })),
      snapshot(),
    );
  };

  return (
    <Screen>
      <ProgressHeader title={page.title} index={page.progressIndex} total={page.totalPages} />
      <Body>
        {page.instruction && <p className="instruction">{page.instruction}</p>}
        {page.questions.map((q, i) => {
          const err = showErrors && q.required && !answers[q.id];
          const Input = q.qtype === 'LIKERT7' ? Likert7 : q.qtype === 'SELECT' ? SelectChoice : SingleChoice;
          return (
            <Card key={q.id} className={err ? 'is-error' : ''}>
              <div
                ref={(el) => {
                  refs.current[q.id] = el;
                }}
                className="question"
              >
                <h2 className="question__text">
                  {i + 1}. {q.text}
                  {q.required && (
                    <span className="required" aria-label="필수">
                      {' '}*
                    </span>
                  )}
                </h2>
                <Input question={q} value={answers[q.id]?.optionId} onChange={(id) => pick(q, id)} />
                {err && <p className="field-error">응답해 주세요</p>}
              </div>
            </Card>
          );
        })}
        {hasClosedOption && <QuotaNotice />}
      </Body>
      <BottomBar
        label="다음"
        enabled={missing.length === 0}
        loading={submitting}
        hint={missing.length > 0 ? `아직 답하지 않은 문항이 ${missing.length}개 있어요` : undefined}
        onClick={handleNext}
      />
    </Screen>
  );
}
