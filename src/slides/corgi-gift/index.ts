import { registerSlide } from '../registry';
import CorgiGift from './CorgiGift';
import { schema } from './schema';

export { CorgiGift };
export { schema, defaultValues } from './schema';
export type { CorgiGiftData } from './schema';

registerSlide('corgi-gift', CorgiGift, schema);
