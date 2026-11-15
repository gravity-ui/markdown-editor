import {cn} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {NodeView} from '@gravity-ui/markdown-editor/pm/view';
import {buttonAttrs} from '@gravity-ui/markdown-plugin-header';

import {buttonLabel} from '../ButtonSpecs/utils';

import './NodeView.scss';

const b = cn('button-nodeview');

type DomAttrs = Record<string, string>;

const classNames = (value: string | undefined) => (value ? value.split(' ') : []);

// The element keeps the classes that the editor adds to a selected node.
function syncDomAttrs(dom: HTMLElement, prev: DomAttrs, next: DomAttrs) {
    const {class: prevClass, ...prevAttrs} = prev;
    const {class: nextClass, ...nextAttrs} = next;
    if (prevClass !== nextClass) {
        dom.classList.remove(...classNames(prevClass));
        dom.classList.add(...classNames(nextClass));
    }
    for (const name of Object.keys(prevAttrs)) {
        if (!(name in nextAttrs)) dom.removeAttribute(name);
    }
    for (const [name, value] of Object.entries(nextAttrs)) {
        if (prevAttrs[name] !== value) dom.setAttribute(name, value);
    }
}

export class WButtonNodeView implements NodeView {
    readonly dom: HTMLElement;
    private node: Node;
    private attrs: DomAttrs = {};

    constructor(node: Node) {
        this.node = node;
        this.dom = document.createElement('a');
        this.dom.classList.add(b());
        // A link with an address is a Tab stop inside the editor.
        this.dom.tabIndex = -1;
        this.dom.setAttribute('aria-haspopup', 'dialog');
        this.renderAttrs();
        this.renderLabel();
        this.dom.addEventListener('click', (event) => event.preventDefault());
    }

    // The settings window is anchored to the element, so a change of attributes keeps it.
    update(node: Node) {
        if (node.type !== this.node.type) return false;
        const prev = this.node;
        this.node = node;
        if (node.sameMarkup(prev)) return true;
        this.renderAttrs();
        if (node.attrs.label !== prev.attrs.label) this.renderLabel();
        return true;
    }

    private renderAttrs() {
        const attrs: DomAttrs = buttonAttrs(this.node.attrs);
        // A link without an address has no role.
        if (!('href' in attrs)) attrs.role = 'button';
        syncDomAttrs(this.dom, this.attrs, attrs);
        this.attrs = attrs;
    }

    private renderLabel() {
        if (this.node.attrs.label.trim()) {
            this.dom.textContent = buttonLabel(this.node);
            return;
        }
        const placeholder = document.createElement('span');
        placeholder.className = b('placeholder');
        placeholder.textContent = buttonLabel(this.node);
        this.dom.replaceChildren(placeholder);
    }
}
