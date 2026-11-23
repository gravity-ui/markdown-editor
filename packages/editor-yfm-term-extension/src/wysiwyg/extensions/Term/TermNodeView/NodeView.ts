import {cn} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView, NodeView} from '@gravity-ui/markdown-editor/pm/view';

import {editTerm} from '../commands';

import './NodeView.scss';

const b = cn('yfm-term-node-view');

export class TermNodeView implements NodeView {
    readonly dom: HTMLButtonElement;

    constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
        this.dom = view.dom.ownerDocument.createElement('button');
        this.dom.type = 'button';
        this.dom.tabIndex = -1;
        this.dom.className = b();
        this.dom.contentEditable = 'false';
        this.dom.setAttribute('aria-haspopup', 'dialog');
        this.dom.textContent = node.attrs.label;
        this.dom.addEventListener('mousedown', (event) => {
            if (event.button === 0) event.preventDefault();
        });
        this.dom.addEventListener('click', () => {
            const pos = getPos();
            if (pos !== undefined) editTerm(view, pos);
        });
    }

    stopEvent(event: Event) {
        return event.type === 'click' || event.type === 'mousedown';
    }
}
