export * from './commands';
export * from './const';
export * from './utils';
export * from './cell-selection';

import type {TableRole} from './const';

declare module 'prosemirror-model' {
    interface NodeSpec {
        tableRole?: TableRole;
    }
}
