import {Portal} from '@gravity-ui/uikit';
import type {Node} from 'prosemirror-model';
import type {EditorView, NodeView} from 'prosemirror-view';

import {getReactRendererFromState} from 'src/extensions/behavior/ReactRenderer';
import {generateEntityId, isInvalidEntityId} from 'src/utils/entity-id';

import {GridBlockConsts, defaultGridBlockEntityId} from '../GridBlockSpecs/const';

import {GridBlockView, STOP_EVENT_CLASSNAME} from './GridBlockView';

export class WGridBlockNodeView implements NodeView {
    readonly dom: HTMLElement;
    private node: Node;
    private readonly view: EditorView;
    private readonly getPos: () => number | undefined;
    private readonly renderItem;

    constructor({
        node,
        view,
        getPos,
    }: {
        node: Node;
        view: EditorView;
        getPos: () => number | undefined;
    }) {
        this.node = node;
        this.dom = document.createElement('div');
        this.dom.classList.add('grid-block-container');
        this.dom.contentEditable = 'false';
        this.view = view;
        this.getPos = getPos;

        this.renderItem = getReactRendererFromState(view.state).createItem(
            'gridBlock-view',
            this.renderGridBlock.bind(this),
        );

        this.validateEntityId();
    }

    update(node: Node) {
        if (node.type !== this.node.type) return false;
        this.node = node;
        this.renderItem.rerender();
        return true;
    }

    destroy() {
        this.renderItem.remove();
    }

    ignoreMutation() {
        return true;
    }

    stopEvent(e: Event) {
        const target = e.target as Element;
        return Boolean(target.closest?.(`.${STOP_EVENT_CLASSNAME}`));
    }

    private validateEntityId() {
        if (
            isInvalidEntityId({
                node: this.node,
                doc: this.view.state.doc,
                defaultId: defaultGridBlockEntityId,
            })
        ) {
            const newId = generateEntityId(GridBlockConsts.NodeName);
            this.view.dispatch(
                this.view.state.tr.setNodeAttribute(
                    this.getPos()!,
                    GridBlockConsts.NodeAttrs.EntityId,
                    newId,
                ),
            );
        }
    }

    private onChange(attrs: Partial<Node['attrs']>) {
        const pos = this.getPos();
        if (pos === undefined) return;

        this.view.dispatch(
            this.view.state.tr.setNodeMarkup(pos, undefined, {...this.node.attrs, ...attrs}, []),
        );
    }

    private renderGridBlock() {
        return (
            <Portal container={this.dom}>
                <GridBlockView
                    node={this.node}
                    getPos={this.getPos}
                    view={this.view}
                    onChange={this.onChange.bind(this)}
                />
            </Portal>
        );
    }
}
