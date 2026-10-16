import type {MouseEvent} from 'react';

import {Button, Portal} from '@gravity-ui/uikit';

import type {Node} from '#pm/model';
import type {EditorView, NodeView} from '#pm/view';
import {getReactRendererFromState} from 'src/extensions/behavior/ReactRenderer';

export class HeaderActionView implements NodeView {
    readonly dom = document.createElement('span');
    private readonly renderItem;
    private node: Node;

    constructor(node: Node, view: EditorView) {
        this.node = node;
        this.dom.contentEditable = 'false';
        this.renderItem = getReactRendererFromState(view.state).createItem('header-action', () => (
            <Portal container={this.dom}>
                <Button
                    className="g-md-header__action"
                    href={String(this.node.attrs.href)}
                    view={this.node.attrs.type === 'link' ? 'flat' : this.buttonView}
                    size="l"
                    data-type={this.node.attrs.type}
                    data-color={this.node.attrs.color}
                    onClick={(event: MouseEvent<HTMLAnchorElement>) => event.preventDefault()}
                >
                    {this.node.textContent}
                </Button>
            </Portal>
        ));
    }

    private get buttonView() {
        return this.node.attrs.color === 'brand' ? 'action' : 'normal';
    }

    update(node: Node) {
        if (node.type !== this.node.type) return false;
        this.node = node;
        this.renderItem.rerender();
        return true;
    }

    ignoreMutation() {
        return true;
    }

    destroy() {
        this.renderItem.remove();
    }
}
