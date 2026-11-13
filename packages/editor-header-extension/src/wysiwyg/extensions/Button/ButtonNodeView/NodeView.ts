import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {NodeView} from '@gravity-ui/markdown-editor/pm/view';
import {buttonAttrs} from '@gravity-ui/markdown-plugin-header';

import './NodeView.scss';

export class WButtonNodeView implements NodeView {
    readonly dom: HTMLElement;
    readonly contentDOM: HTMLElement;
    constructor(node: Node) {
        this.dom = document.createElement('a');
        for (const [name, value] of Object.entries(buttonAttrs(node.attrs))) {
            this.dom.setAttribute(name, value);
        }
        this.contentDOM = this.dom;
        this.dom.addEventListener('click', (event) => event.preventDefault());
    }
}
