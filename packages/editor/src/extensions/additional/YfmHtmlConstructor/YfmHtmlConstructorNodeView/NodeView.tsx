import {Portal} from '@gravity-ui/uikit';
import type {Node} from 'prosemirror-model';
import type {EditorView, NodeView} from 'prosemirror-view';

import {getReactRendererFromState} from 'src/extensions/behavior/ReactRenderer';
import {generateEntityId, isInvalidEntityId} from 'src/utils/entity-id';

import {
    YfmHtmlConstructorConsts,
    defaultYfmHtmlConstructorEntityId,
} from '../YfmHtmlConstructorSpecs/const';
import type {YfmHtmlConstructorExtensionOptions} from '../types';

import {YfmHtmlConstructorView} from './YfmHtmlConstructorView';
import {STOP_EVENT_CLASSNAME} from './const';

export class WYfmHtmlConstructorNodeView implements NodeView {
    readonly dom: HTMLElement;
    private node: Node;
    private readonly view: EditorView;
    private readonly getPos: () => number | undefined;
    private readonly options: YfmHtmlConstructorExtensionOptions;
    private readonly renderItem;
    private destroyed = false;

    constructor({
        node,
        view,
        getPos,
        options,
    }: {
        node: Node;
        view: EditorView;
        getPos: () => number | undefined;
        options: YfmHtmlConstructorExtensionOptions;
    }) {
        this.node = node;
        this.dom = document.createElement('div');
        this.dom.classList.add('yfm-html-constructor-root');
        this.dom.contentEditable = 'false';
        this.view = view;
        this.getPos = getPos;
        this.options = options;

        this.renderItem = getReactRendererFromState(view.state).createItem(
            'yfmHtmlConstructor-view',
            this.renderYfmHtmlConstructor.bind(this),
        );

        queueMicrotask(() => this.validateEntityId());
    }

    update(node: Node) {
        if (node.type !== this.node.type) return false;
        if (node === this.node) return true;
        this.node = node;
        this.renderItem.rerender();
        return true;
    }

    destroy() {
        this.destroyed = true;
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
        const pos = this.getPos();
        if (this.destroyed || this.view.isDestroyed || pos === undefined) return;
        if (
            isInvalidEntityId({
                node: this.node,
                doc: this.view.state.doc,
                defaultId: defaultYfmHtmlConstructorEntityId,
            })
        ) {
            const newId = generateEntityId(YfmHtmlConstructorConsts.NodeName);
            this.view.dispatch(
                this.view.state.tr.setNodeAttribute(
                    pos,
                    YfmHtmlConstructorConsts.NodeAttrs.EntityId,
                    newId,
                ),
            );
        }
    }

    private onChange = (attrs: Partial<Node['attrs']>) => {
        const pos = this.getPos();
        if (pos === undefined || this.destroyed || this.view.isDestroyed) return;
        const node = this.view.state.doc.nodeAt(pos);
        if (node?.type !== this.node.type) return;

        this.view.dispatch(
            this.view.state.tr.setNodeMarkup(pos, undefined, {...node.attrs, ...attrs}),
        );
    };

    private renderYfmHtmlConstructor() {
        return (
            <Portal container={this.dom}>
                <YfmHtmlConstructorView
                    node={this.node}
                    getPos={this.getPos}
                    view={this.view}
                    onChange={this.onChange}
                    options={this.options}
                />
            </Portal>
        );
    }
}
