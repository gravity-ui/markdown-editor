import {Portal} from '@gravity-ui/uikit';
import type {Node} from 'prosemirror-model';
import type {EditorView, NodeView} from 'prosemirror-view';

import {getReactRendererFromState} from 'src/extensions/behavior/ReactRenderer';
import {generateEntityId, isInvalidEntityId} from 'src/utils/entity-id';

import {
    GridBlockTemplatesConsts,
    defaultGridBlockTemplatesEntityId,
} from '../GridBlockTemplatesSpecs/const';
import type {GridBlockTemplatesOptions} from '../types';

import {GridBlockTemplatesView} from './GridBlockTemplatesView';
import {STOP_EVENT_CLASSNAME} from './const';

export class WGridBlockTemplatesNodeView implements NodeView {
    readonly dom: HTMLElement;
    private node: Node;
    private readonly view: EditorView;
    private readonly getPos: () => number | undefined;
    private readonly options: {templates?: GridBlockTemplatesOptions};
    private readonly renderItem;

    constructor({
        node,
        view,
        getPos,
        options,
    }: {
        node: Node;
        view: EditorView;
        getPos: () => number | undefined;
        options: {templates?: GridBlockTemplatesOptions};
    }) {
        this.node = node;
        this.dom = document.createElement('div');
        this.dom.classList.add('grid-block-templates-container');
        this.dom.contentEditable = 'false';
        this.view = view;
        this.getPos = getPos;
        this.options = options;

        this.renderItem = getReactRendererFromState(view.state).createItem(
            'gridBlockTemplates-view',
            this.renderGridBlockTemplates.bind(this),
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
                defaultId: defaultGridBlockTemplatesEntityId,
            })
        ) {
            const newId = generateEntityId(GridBlockTemplatesConsts.NodeName);
            this.view.dispatch(
                this.view.state.tr.setNodeAttribute(
                    this.getPos()!,
                    GridBlockTemplatesConsts.NodeAttrs.EntityId,
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

    private renderGridBlockTemplates() {
        return (
            <Portal container={this.dom}>
                <GridBlockTemplatesView
                    node={this.node}
                    getPos={this.getPos}
                    view={this.view}
                    onChange={this.onChange.bind(this)}
                    options={this.options}
                />
            </Portal>
        );
    }
}
