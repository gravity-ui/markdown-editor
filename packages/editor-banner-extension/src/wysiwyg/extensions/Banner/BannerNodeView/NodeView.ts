import {cn} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {NodeView} from '@gravity-ui/markdown-editor/pm/view';
import {bannerRender} from '@gravity-ui/markdown-plugin-banner';

import {syncDomAttrs} from '../../../utils/nodeview';

import './NodeView.scss';

const b = cn('banner-nodeview');

export class WBannerNodeView implements NodeView {
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
        const attrsChanged = !node.sameMarkup(this.node);
        this.node = node;
        if (attrsChanged) this.renderAttrs();
        return true;
    }

    // Only `background-image` is written, so the styles of node decorations stay.
    private renderAttrs() {
        const {className, backgroundImage, data} = bannerRender(this.node.attrs);
        const attrs = {class: className, ...data};
        syncDomAttrs(this.dom, this.attrs, attrs);
        this.attrs = attrs;
        this.dom.style.backgroundImage = backgroundImage ?? '';
    }
}
