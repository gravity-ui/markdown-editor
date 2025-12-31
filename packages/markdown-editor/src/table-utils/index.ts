export * from './commands';
export * from './const';
export * from './utils';

import type {TableRole} from './const';

declare module 'prosemirror-model' {
    interface NodeSpec {
        tableRole?: TableRole;
    }
}
