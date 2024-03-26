import {Command, Selection} from 'prosemirror-state';

export function arrowHandler(dir: 'left' | 'right' | 'up' | 'down', nodeName: string): Command {
    return (state, dispatch, view) => {
        if (state.selection.empty && view?.endOfTextblock(dir)) {
            const side = dir === 'left' || dir === 'up' ? -1 : 1,
                $head = state.selection.$head;
            const nextPos = Selection.near(
                state.doc.resolve(side > 0 ? $head.after() : $head.before()),
                side,
            );
            if (nextPos.$head && nextPos.$head.parent.type.name === nodeName) {
                dispatch?.(state.tr.setSelection(nextPos));
                return true;
            }
        }
        return false;
    };
}
