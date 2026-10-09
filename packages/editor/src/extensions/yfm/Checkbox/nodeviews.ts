import type {Node} from 'prosemirror-model';
import type {EditorView, NodeView, NodeViewConstructor} from 'prosemirror-view';

import {CheckboxAttr, b} from './const';

export class CheckboxInputView implements NodeView {
    static create: NodeViewConstructor = (node, view, getPos) => new this(node, view, getPos);

    dom: HTMLInputElement;

    private _node: Node;
    private _view: EditorView;
    private _getPos: () => number | undefined;

    private constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
        this._node = node;
        this._view = view;
        this._getPos = getPos;

        this.dom = this._createDomElem();
        this._applyNodeAttrsToDomElem();
    }

    ignoreMutation(): boolean {
        return true;
    }

    update(node: Node): boolean {
        if (node.type !== this._node.type) return false;

        this._node = node;
        this._applyNodeAttrsToDomElem();

        return true;
    }

    destroy(): void {
        this.dom.removeEventListener('click', this._onInputClick);
    }

    private _createDomElem(): HTMLInputElement {
        const dom = document.createElement('input');
        dom.setAttribute('class', b('input'));
        dom.addEventListener('click', this._onInputClick);
        return dom;
    }

    private _applyNodeAttrsToDomElem(): void {
        const {dom, _node: node} = this;

        for (const [key, value] of Object.entries(node.attrs)) {
            if (value) dom.setAttribute(key, value);
            else dom.removeAttribute(key);
        }

        const checked = node.attrs[CheckboxAttr.Checked] === 'true';
        this.dom.checked = checked;
    }

    private _onInputClick = (event: MouseEvent): void => {
        if (event.target instanceof HTMLInputElement) {
            const {checked} = event.target;
            const pos = this._getPos();

            if (pos !== undefined)
                this._view.dispatch(
                    this._view.state.tr.setNodeAttribute(
                        pos,
                        CheckboxAttr.Checked,
                        checked ? 'true' : null,
                    ),
                );
        }

        this._view.focus();
    };
}
