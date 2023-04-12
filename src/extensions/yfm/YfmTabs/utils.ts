import {EditorView} from 'prosemirror-view';
import {tabPanelType} from '.';

export const atEndOfPanel = (view?: EditorView) => {
    if (!view) return null;
    const {$head} = view.state.selection;
    for (let d = $head.depth; d >= 0; d--) {
        const parent = $head.node(d),
            index = $head.indexAfter(d);
        if (index !== parent.childCount) return false;
        if (parent.type === tabPanelType(view.state.schema)) {
            const panelPos = $head.before(d);
            return view?.endOfTextblock('down') ? panelPos : null;
        }
    }

    return null;
};
