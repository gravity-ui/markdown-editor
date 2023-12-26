import throttle from 'lodash/throttle';
import type {ResolvedPos} from 'prosemirror-model';
import {Plugin, PluginKey, PluginView} from 'prosemirror-state';
import {findDomRefAtPos} from 'prosemirror-utils';
import type {EditorView} from 'prosemirror-view';

import {isTextSelection} from '../../../../utils/selection';
import {cutContentType, cutType} from '../const';

const key = new PluginKey('yfm-cut-auto-open');

export const cutAutoOpenPlugin = () => {
    return new Plugin({
        key,
        view(view) {
            update(view);
            const dragHandler = new CutAutoOpenOnDragOver(view);
            return {
                update: (view) => update(view),
                destroy: () => dragHandler.destroy(),
            };
        },
    });
};

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

class CutAutoOpenOnDragOver implements PluginView {
    private static readonly YFM_CUT_SELECTOR = '.yfm-cut:not(.open)';
    private static readonly OPEN_TIMEOUT = 500; //ms
    private static readonly THROTTLE_WAIT = 50; //ms

    private _cutElem: HTMLElement | null = null;
    private _editorView: EditorView;
    private _timeout: ReturnType<typeof setTimeout> | null = null;
    private readonly _docListener;

    constructor(view: EditorView) {
        this._editorView = view;
        this._docListener = throttle(
            this._onDocEvent.bind(this),
            CutAutoOpenOnDragOver.THROTTLE_WAIT,
        );
        document.addEventListener('mousemove', this._docListener);
        document.addEventListener('dragover', this._docListener);
    }

    destroy(): void {
        this._clear();
        this._docListener.cancel();
        document.removeEventListener('mousemove', this._docListener);
        document.removeEventListener('dragover', this._docListener);
    }

    private _onDocEvent(event: MouseEvent) {
        const view = this._editorView;
        if (!view.dragging) return;
        const pos = view.posAtCoords({left: event.clientX, top: event.clientY});
        if (!pos) return;
        const elem = findDomRefAtPos(pos.pos, view.domAtPos.bind(view)) as HTMLElement;
        const cutElem = elem.closest(CutAutoOpenOnDragOver.YFM_CUT_SELECTOR);
        if (cutElem === this._cutElem) return;
        this._clear();
        if (cutElem) this._setCutElem(cutElem as HTMLElement);
    }

    private _clear() {
        if (this._timeout !== null) clearTimeout(this._timeout);
        this._timeout = null;
        this._cutElem = null;
    }

    private _setCutElem(elem: HTMLElement) {
        this._cutElem = elem;
        this._timeout = setTimeout(this._openCut.bind(this), CutAutoOpenOnDragOver.OPEN_TIMEOUT);
    }

    private _openCut() {
        if (this._editorView.dragging) {
            this._cutElem?.classList.add('open');
        }
        this._clear();
    }
}
