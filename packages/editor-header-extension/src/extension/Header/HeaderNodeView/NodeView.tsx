import {cn} from '@gravity-ui/markdown-editor';
import {getReactRendererFromState} from '@gravity-ui/markdown-editor/extensions';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView, NodeView} from '@gravity-ui/markdown-editor/pm/view';
import {headerClassNames} from '@gravity-ui/markdown-plugin-header';
import {Portal} from '@gravity-ui/uikit';

import {HeaderControls, STOP_EVENT_CLASSNAME} from './HeaderControls';

const b = cn('header-view');

export class WHeaderNodeView implements NodeView {
    readonly dom: HTMLElement;
    private node: Node;
    private readonly view: EditorView;
    private readonly getPos: () => number | undefined;
    private readonly renderItem;

    constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
        this.node = node;
        this.view = view;
        this.getPos = getPos;

        this.dom = document.createElement('div');
        this.dom.contentEditable = 'false';
        this.updateClassName();

        this.renderItem = getReactRendererFromState(view.state).createItem(
            'header-controls',
            this.renderControls.bind(this),
        );
    }

    update(node: Node) {
        if (node.type !== this.node.type) return false;
        this.node = node;
        this.updateClassName();
        return true;
    }

    destroy() {
        this.renderItem.remove();
    }

    ignoreMutation() {
        return true;
    }

    stopEvent(event: Event) {
        const {target} = event;
        // The target can be an icon or a text inside the marked controls.
        return target instanceof Element && target.closest(`.${STOP_EVENT_CLASSNAME}`) !== null;
    }

    private updateClassName() {
        const {attrs} = this.node;
        this.dom.className = b({source: Boolean(attrs.source)}, headerClassNames(attrs));
    }

    private renderControls() {
        return (
            <Portal container={this.dom}>
                <HeaderControls view={this.view} getPos={this.getPos} block={this.dom} />
            </Portal>
        );
    }
}
