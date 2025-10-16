import type {Node} from '#pm/model';
import type {NodeView} from '#pm/view';

import {YfmCutClassName} from '../const';

import './yfm-cut-title.scss';

export class YfmCutTitleNodeView implements NodeView {
    readonly dom: HTMLElement;
    readonly contentDOM: HTMLElement;

    private node: Node;

    constructor(node: Node) {
        this.node = node;

        this.dom = document.createElement('div');
        this.dom.classList.add(YfmCutClassName.Title);
        this.dom.addEventListener('click', this._onTitleClick);

        this.contentDOM = this.dom.appendChild(document.createElement('div'));
        this.contentDOM.classList.add(YfmCutClassName.TitleInner);
        this.contentDOM.addEventListener('click', this._onTitleInnerClick);
    }

    update(node: Node): boolean {
        if (this.node.type !== node.type) return false;
        this.node = node;
        return true;
    }

    destroy() {
        this.dom.removeEventListener('click', this._onTitleClick);
        this.contentDOM.removeEventListener('click', this._onTitleInnerClick);
    }

    private _onTitleClick = (e: MouseEvent) => {
        const {currentTarget} = e;
        if (currentTarget instanceof HTMLElement) {
            const parent = currentTarget.parentElement;
            if (parent?.classList.contains(YfmCutClassName.Cut)) {
                // TODO: toggle open classname via prosemirror decoration
                parent.classList.toggle(YfmCutClassName.Open);
            }
        }
    };

    private _onTitleInnerClick = (e: MouseEvent) => {
        // ignore clicking on the title content
        // you can open/close yfm-cut by clicking on the arrow icon
        e.stopPropagation();
        e.preventDefault();
    };
}
