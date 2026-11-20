import {cn} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {NodeView} from '@gravity-ui/markdown-editor/pm/view';
import {headerAttrs} from '@gravity-ui/markdown-plugin-header';

import {syncDomAttrs} from '../../nodeview';

import './NodeView.scss';

const b = cn('header-nodeview');

export class WHeaderNodeView implements NodeView {
    readonly dom: HTMLElement;
    readonly contentDOM: HTMLElement;
    private node: Node;
    private attrs: Record<string, string> = {};

    constructor(node: Node) {
        this.node = node;
        this.dom = this.contentDOM = document.createElement('div');
        this.dom.classList.add(b());
        this.renderAttrs();
    }

    update(node: Node) {
        if (node.type !== this.node.type) return false;
        const attrsChanged = node.attrs !== this.node.attrs;
        this.node = node;
        if (attrsChanged) this.renderAttrs();
        return true;
    }

    private renderAttrs() {
        const attrs = headerAttrs(this.node.attrs);
        syncDomAttrs(this.dom, this.attrs, attrs);
        this.attrs = attrs;
    }
}
