import {Plugin, PluginKey} from 'prosemirror-state';
import type {EditorView} from 'prosemirror-view';
import type {ResolvedPos} from 'prosemirror-model';
import {isTextSelection} from '../../../../utils/selection';
import {cutContentType, cutType} from '../const';

const key = new PluginKey('yfm-cut-auto-open');

export const cutAutoOpenPlugin = () =>
    new Plugin({
        key,
        view(view) {
            update(view);
            return {
                update: (view) => update(view),
            };
        },
    });

function update(view: EditorView) {
    const sel = view.state.selection;
    const domAtPos = view.domAtPos.bind(view);
    if (isTextSelection(sel)) {
        if (sel.$cursor) {
            openParentYfmCuts(sel.$cursor, domAtPos);
        } else {
            openParentYfmCuts(sel.$head, domAtPos);
            openParentYfmCuts(sel.$anchor, domAtPos);
        }
    }
}

function openParentYfmCuts($pos: ResolvedPos, domAtPos: EditorView['domAtPos']): void {
    let {depth} = $pos;
    const {schema} = $pos.parent.type;
    while (depth > 0) {
        if ($pos.node(depth).type === cutContentType(schema)) {
            if ($pos.node(depth - 1).type === cutType(schema)) {
                const {node: cutDomNode} = domAtPos($pos.start(depth - 1), 0);
                (cutDomNode as Element).classList.add('open');
                depth--;
            }
        }
        depth--;
    }
}
