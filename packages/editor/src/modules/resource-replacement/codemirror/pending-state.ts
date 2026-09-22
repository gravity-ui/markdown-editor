import {StateField} from '@codemirror/state';

import {historyLocked} from '../../../markup/codemirror/history-lock';

import {release, tracked} from './const';

/** Includes accepted insertions whose update listener has not started resolve yet. */
export const pendingField = StateField.define<readonly string[]>({
    create: () => [],
    provide: (field) => historyLocked.from(field, (operations) => operations.length > 0),
    update(operations, tr) {
        for (const effect of tr.effects) {
            if (effect.is(release)) operations = operations.filter((id) => id !== effect.value);
        }
        const id = tr.annotation(tracked);
        return id ? [...operations, id] : operations;
    },
});
