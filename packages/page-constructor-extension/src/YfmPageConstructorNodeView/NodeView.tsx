import {
    generateEntityId,
    getReactRendererFromState,
    isInvalidEntityId,
    removeNode,
} from '@gravity-ui/markdown-editor';
import {Portal} from '@gravity-ui/uikit';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView, NodeView} from '@gravity-ui/markdown-editor/pm/view';

import type {YfmPageConstructorOptions} from '..';
import {
    YfmPageConstructorConsts,
    defaultYfmPageConstructorEntityId,
} from '../YfmPageConstructorSpecs/const';

import {STOP_EVENT_CLASSNAME, YfmPageConstructorView} from './YfmPageConstructorView';

export class WYfmPageConstructorNodeView implements NodeView {
    readonly dom: HTMLElement;
    private node: Node;
    private readonly view: EditorView;
    private readonly getPos: () => number | undefined;
    private readonly renderItem;
    private readonly options: YfmPageConstructorOptions;

    constructor(
        node: Node,
        view: EditorView,
        getPos: () => number | undefined,
        options: YfmPageConstructorOptions,
    ) {
        this.node = node;
        this.view = view;
        this.getPos = getPos;
        this.options = options;

        this.dom = document.createElement('div');
        this.dom.classList.add('yfm-page-constructor-container');
        this.dom.contentEditable = 'false';

        this.renderItem = getReactRendererFromState(view.state).createItem(
            'yfm-page-constructor-view',
            this.renderPageConstructor.bind(this),
        );

        this.validateEntityId();
    }

    update(node: Node) {
        if (node.type !== this.node.type) {
            return false;
        }

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
        const {target} = e;

        if (target instanceof Element) {
            return target.classList.contains(STOP_EVENT_CLASSNAME);
        }

        return false;
    }

    private validateEntityId() {
        if (
            isInvalidEntityId({
                node: this.node,
                doc: this.view.state.doc,
                defaultId: defaultYfmPageConstructorEntityId,
            })
        ) {
            const newId = generateEntityId(YfmPageConstructorConsts.NodeName);

            this.view.dispatch(
                this.view.state.tr.setNodeAttribute(
                    this.getPos()!,
                    YfmPageConstructorConsts.NodeAttrs.EntityId,
                    newId,
                ),
            );
        }
    }

    private onChange = (content: string) => {
        const pos = this.getPos();

        if (pos === undefined) {
            return;
        }

        this.view.dispatch(
            this.view.state.tr.setNodeAttribute(
                pos,
                YfmPageConstructorConsts.NodeAttrs.content,
                content,
            ),
        );
    };

    private onRemove = () => {
        const pos = this.getPos();

        if (pos === undefined) {
            return;
        }

        removeNode({node: this.node, pos, tr: this.view.state.tr, dispatch: this.view.dispatch});
        this.view.focus();
    };

    private renderPageConstructor() {
        return (
            <Portal container={this.dom}>
                <YfmPageConstructorView
                    view={this.view}
                    node={this.node}
                    onChange={this.onChange}
                    onRemove={this.onRemove}
                    canEdit={this.options.canEdit ?? true}
                    autoSave={this.options.autoSave}
                    transformerOptions={this.options.transformerOptions ?? false}
                />
            </Portal>
        );
    }
}
