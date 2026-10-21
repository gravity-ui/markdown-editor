import {
    type EditorState,
    NodeSelection,
    Plugin,
    PluginKey,
    type Transaction,
} from 'prosemirror-state';

import {isNodeSelection} from '../../../utils/selection';

import {labelCn, labelType} from './LabelSpecs';

/**
 * Position of the label opened for explicit editing, as after a click or an insertion.
 * The popover of such a label moves the focus to the caption field.
 * A label selected by the keyboard opens the popover without moving the focus.
 */
type LabelEdit = {pos: number; id: number} | null;

const labelEditKey = new PluginKey<LabelEdit>('label-edit');
let lastEditId = 0;

export const startLabelEdit = (tr: Transaction, pos: number): Transaction =>
    tr
        .setSelection(NodeSelection.create(tr.doc, pos))
        .setMeta(labelEditKey, {pos, id: ++lastEditId});

export const isLabelEdited = (state: EditorState): boolean =>
    (labelEditKey.getState(state) ?? null) !== null;

/** Id of the latest request to edit the selected label; every click or insertion gets a new one. */
export const getLabelEditId = (state: EditorState): number | null =>
    labelEditKey.getState(state)?.id ?? null;

export const labelEditPlugin = () =>
    new Plugin<LabelEdit>({
        key: labelEditKey,
        state: {
            init: () => null,
            apply(tr, edit) {
                const meta: LabelEdit | undefined = tr.getMeta(labelEditKey);
                if (meta !== undefined) return meta;
                if (edit === null) return null;

                const pos = tr.mapping.map(edit.pos);
                if (!isNodeSelection(tr.selection) || tr.selection.from !== pos) return null;
                return pos === edit.pos ? edit : {...edit, pos};
            },
        },
        props: {
            handleDOMEvents: {
                // ProseMirror selects an atom before its click handlers run, so the click is caught here.
                mousedown(view, event) {
                    const target = event.target instanceof Element ? event.target : null;
                    const dom = target?.closest(`.${labelCn()}`);
                    if (event.button !== 0 || !dom || !view.dom.contains(dom)) return false;

                    const pos = view.posAtDOM(dom, 0);
                    if (view.state.doc.nodeAt(pos)?.type !== labelType(view.state.schema)) {
                        return false;
                    }

                    event.preventDefault();
                    view.dispatch(startLabelEdit(view.state.tr, pos));
                    return true;
                },
            },
        },
    });
