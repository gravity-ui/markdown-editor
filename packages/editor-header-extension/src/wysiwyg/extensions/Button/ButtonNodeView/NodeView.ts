import {cn} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {NodeView} from '@gravity-ui/markdown-editor/pm/view';
import {buttonAttrs} from '@gravity-ui/markdown-plugin-header';

import {buttonLabel} from '../ButtonSpecs/utils';

import './NodeView.scss';

const b = cn('button-nodeview');

export class WButtonNodeView implements NodeView {
    readonly dom: HTMLElement;
    constructor(node: Node) {
        this.dom = document.createElement('a');
        for (const [name, value] of Object.entries(buttonAttrs(node.attrs))) {
            this.dom.setAttribute(name, value);
        }
        this.dom.classList.add(b());
        if (node.attrs.label.trim()) {
            this.dom.textContent = buttonLabel(node);
        } else {
            const placeholder = document.createElement('span');
            placeholder.className = b('placeholder');
            placeholder.textContent = buttonLabel(node);
            this.dom.append(placeholder);
        }
        this.dom.addEventListener('click', (event) => event.preventDefault());
    }
}
