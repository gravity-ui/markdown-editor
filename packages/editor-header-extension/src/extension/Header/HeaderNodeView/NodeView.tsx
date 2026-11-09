import {cn} from '@gravity-ui/markdown-editor';
import {getReactRendererFromState} from '@gravity-ui/markdown-editor/extensions';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView, NodeView, ViewMutationRecord} from '@gravity-ui/markdown-editor/pm/view';
import {headerClassNames} from '@gravity-ui/markdown-plugin-header';
import {Portal} from '@gravity-ui/uikit';

import {STOP_EVENT_CLASSNAME} from '../const';

import {HeaderControls} from './HeaderControls';

import './NodeView.scss';

const b = cn('header-view');

export class WHeaderNodeView implements NodeView {
    readonly dom: HTMLElement;
    readonly contentDOM: HTMLElement;
    private node: Node;
    private readonly view: EditorView;
    private readonly getPos: () => number | undefined;
    private readonly renderItem;

    constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
        this.node = node;
        this.view = view;
        this.getPos = getPos;

        this.dom = document.createElement('div');
        this.updateClassName();
        this.contentDOM = this.dom.appendChild(document.createElement('div'));
        this.contentDOM.className = b('content');

        this.renderItem = getReactRendererFromState(view.state).createItem(
            'header-controls',
            this.renderControls.bind(this),
        );
    }

    update(node: Node) {
        if (node.type !== this.node.type) return false;
        this.dom.classList.remove(...headerClassNames(this.node.attrs).split(' '));
        this.node = node;
        this.updateClassName();
        return true;
    }

    destroy() {
        this.renderItem.remove();
    }

    ignoreMutation(mutation: ViewMutationRecord) {
        return mutation.type !== 'selection' && !this.contentDOM.contains(mutation.target);
    }

    stopEvent(event: Event) {
        const {target} = event;
        return target instanceof Element && target.closest(`.${STOP_EVENT_CLASSNAME}`) !== null;
    }

    private updateClassName() {
        this.dom.classList.add(b(), ...headerClassNames(this.node.attrs).split(' '));
    }

    private renderControls() {
        return (
            <Portal container={this.dom}>
                <HeaderControls view={this.view} getPos={this.getPos} />
            </Portal>
        );
    }
}
