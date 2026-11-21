import {cn} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {NodeView} from '@gravity-ui/markdown-editor/pm/view';
import {buttonAttrs} from '@gravity-ui/markdown-plugin-banner';

import {syncDomAttrs} from '../../nodeview';
import {ButtonAttr, buttonLabel, hasButtonLabel} from '../ButtonSpecs';

import './NodeView.scss';

const b = cn('button-nodeview');

const preventDefault = (event: Event) => event.preventDefault();

export class WButtonNodeView implements NodeView {
    readonly dom: HTMLElement;
    private node: Node;
    private attrs: Record<string, string> = {};

    constructor(node: Node) {
        this.node = node;
        this.dom = document.createElement('a');
        this.dom.classList.add(b());
        this.dom.tabIndex = -1;
        this.dom.setAttribute('aria-haspopup', 'dialog');
        this.renderAttrs();
        this.renderLabel();
        this.dom.addEventListener('click', preventDefault);
    }

    update(node: Node) {
        if (node.type !== this.node.type) return false;
        const prev = this.node;
        this.node = node;
        if (node.sameMarkup(prev)) return true;
        this.renderAttrs();
        if (node.attrs[ButtonAttr.Label] !== prev.attrs[ButtonAttr.Label]) this.renderLabel();
        return true;
    }

    private renderAttrs() {
        const attrs: Record<string, string> = buttonAttrs(this.node.attrs);
        if (!('href' in attrs)) attrs.role = 'button';
        this.attrs = syncDomAttrs(this.dom, this.attrs, attrs);
    }

    private renderLabel() {
        const label = buttonLabel(this.node);
        if (hasButtonLabel(this.node)) {
            this.dom.textContent = label;
            return;
        }
        const placeholder = document.createElement('span');
        placeholder.className = b('placeholder');
        placeholder.textContent = label;
        this.dom.replaceChildren(placeholder);
    }
}
