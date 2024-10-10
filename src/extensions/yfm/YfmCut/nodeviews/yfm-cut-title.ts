import type {Node} from 'prosemirror-model';
import type {NodeView} from 'prosemirror-view';

import './yfm-cut-title.scss';

export class YfmCutTitleNodeView implements NodeView {
    readonly dom: HTMLElement;
    readonly contentDOM: HTMLElement;

    private node: Node;

    constructor(node: Node) {
        this.node = node;

        this.dom = document.createElement('summary');
        this.dom.classList.add('yfm-cut-title');
        this.dom.replaceChildren((this.contentDOM = document.createElement('div')));
        this.contentDOM.classList.add('g-md-yfm-cut-title-inner');
        this.contentDOM.addEventListener('click', (e) => {
            // ignore clicking on the title content
            // you can open/close yfm-cut by clicking on the arrow icon
            e.stopPropagation();
            e.preventDefault();
        });
    }

    update(node: Node): boolean {
        if (this.node.type !== node.type) return false;
        this.node = node;
        return true;
    }
}
