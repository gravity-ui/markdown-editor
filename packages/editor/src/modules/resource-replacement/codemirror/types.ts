import type {ResourceRange} from '../controller.utils';
import type {ReplacementResource} from '../types';

export type PendingRange = ResourceRange & {resource: ReplacementResource; isUrl: boolean};
export type ResourceBatch = {id: string; ranges: PendingRange[]};
