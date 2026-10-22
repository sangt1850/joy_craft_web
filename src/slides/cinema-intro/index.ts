import { registerSlide } from '../registry';
import CinemaIntro from './CinemaIntro';
import { schema } from './schema';
export { CinemaIntro };
export { schema, defaultValues } from './schema';
export type { CinemaIntroData, CinemaProfile, CinemaEpisode } from './types';
registerSlide('loveflix-intro',CinemaIntro,schema);
registerSlide('cinema-intro',CinemaIntro,schema); // 초기 개발 버전 하위호환
