import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {Plugin, Selection} from '@gravity-ui/markdown-editor/pm/state';

import {isDomSelectionReset, pointerFocusEvents} from '../../../blockToolbar';

export const focusSelectionPlugin = () => {
    let saved: {selection: Selection; doc: Node} | null = null;
    return new Plugin({
        props: {
            handleDOMEvents: {
                ...pointerFocusEvents((view, pointer) => {
                    const {selection, doc} = view.state;
                    saved = pointer ? null : {selection, doc};
                }),
                blur: () => {
                    saved = null;
                    return false;
                },
            },
        },
        appendTransaction(trs, _oldState, state) {
            const before = saved;
            if (!before || trs.every((tr) => !tr.docChanged && !tr.selectionSet)) return null;
            saved = null;
            const reset = isDomSelectionReset(trs);
            const start = Selection.findFrom(state.doc.resolve(0), 1, true);
            if (!reset || state.doc !== before.doc || !start || !state.selection.eq(start)) {
                return null;
            }
            return before.selection.eq(start) ? null : state.tr.setSelection(before.selection);
        },
    });
};
