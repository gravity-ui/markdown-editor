import {cn} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {NodeView} from '@gravity-ui/markdown-editor/pm/view';
import {headerClassNames} from '@gravity-ui/markdown-plugin-header';

import './NodeView.scss';

const b = cn('header-view');

export class WHeaderNodeView implements NodeView {
    readonly dom: HTMLElement;
    readonly contentDOM: HTMLElement;
    private node: Node;

    constructor(node: Node) {
        this.node = node;
        this.dom = this.contentDOM = document.createElement('div');
        this.updateClassName();
    }

    update(node: Node) {
        if (node.type !== this.node.type) return false;
        this.dom.classList.remove(...headerClassNames(this.node.attrs).split(' '));
        this.node = node;
        this.updateClassName();
        return true;
    }

    private updateClassName() {
        this.dom.classList.add(b(), ...headerClassNames(this.node.attrs).split(' '));
    }
}
