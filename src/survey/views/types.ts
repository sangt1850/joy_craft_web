import type { AnswerInput, DwellMetrics, PageDto } from '../api/types';

export interface ViewProps {
  page: PageDto;
  submitting: boolean;
  onSubmit: (answers: AnswerInput[], metrics: DwellMetrics) => void;
}
