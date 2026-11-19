import {NodeSelection, Plugin} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {headerImageClassName} from '@gravity-ui/markdown-plugin-header';

import {headerImageNodeType} from '../../HeaderImageSpecs';
import {setHeaderImagePopupOpen} from '../HeaderImagePopupPlugin';

/** The position of the image whose element holds `target`. */
function imagePos(view: EditorView, target: EventTarget | null) {
    const dom = target instanceof Element ? target.closest(`.${headerImageClassName}`) : null;
    if (!dom || !view.dom.contains(dom)) return null;
    const pos = view.posAtDOM(dom, 0);
    return view.state.doc.nodeAt(pos)?.type === headerImageNodeType(view.state.schema) ? pos : null;
}

/**
 * A press on the image or on its placeholder selects the image node and opens the image window.
 * The default action of the press would move the selection of the page next to the image,
 * and the editor would read it back as a cursor after the press when the image is already selected.
 */
export const headerImageClickPlugin = () =>
    new Plugin({
        props: {
            handleDOMEvents: {
                mousedown(view, event) {
                    const modified = event.shiftKey || event.ctrlKey || event.metaKey;
                    if (event.button !== 0 || modified || !view.editable) return false;
                    const pos = imagePos(view, event.target);
                    if (pos === null) return false;
                    event.preventDefault();
                    view.focus();
                    const {state} = view;
                    const tr = state.tr.setSelection(NodeSelection.create(state.doc, pos));
                    view.dispatch(setHeaderImagePopupOpen(tr, true));
                    return true;
                },
            },
        },
    });
