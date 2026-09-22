import {Facet} from '@codemirror/state';

export const historyLocked = Facet.define<boolean, boolean>({
    combine: (values) => values.some(Boolean),
});
