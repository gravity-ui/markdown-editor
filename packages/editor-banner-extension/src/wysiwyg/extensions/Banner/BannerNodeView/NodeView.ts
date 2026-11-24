import {cn} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {NodeView} from '@gravity-ui/markdown-editor/pm/view';
import {bannerClassNames} from '@gravity-ui/markdown-plugin-banner';

import './NodeView.scss';

const b = cn('banner-nodeview');

export class WBannerNodeView implements NodeView {
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
        this.dom.classList.remove(...bannerClassNames(this.node.attrs).split(' '));
        this.node = node;
        this.updateClassName();
        return true;
    }

    private updateClassName() {
        this.dom.classList.add(b(), ...bannerClassNames(this.node.attrs).split(' '));
    }
}
