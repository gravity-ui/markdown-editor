import {Portal} from '@gravity-ui/uikit';
import type {Node} from 'prosemirror-model';
import type {EditorView, NodeView} from 'prosemirror-view';

import {getReactRendererFromState} from '../../../behavior';
import {YfmHtmlBlockConsts} from '../YfmHtmlBlockSpecs/const';
import type {YfmHtmlBlockOptions} from '../index';

import {STOP_EVENT_CLASSNAME, YfmHtmlBlockView} from './YfmHtmlBlockView';

export class WYfmHtmlBlockNodeView implements NodeView {
    readonly dom: HTMLElement;
    private node: Node;
    private readonly view;
    private readonly getPos;
    private readonly options: YfmHtmlBlockOptions = {};
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
        options: YfmHtmlBlockOptions;
    }) {
        this.node = node;
        this.dom = document.createElement('div');
        this.dom.classList.add('yfm-html-block-container');
        this.dom.contentEditable = 'false';
        this.view = view;
        this.getPos = getPos;
        this.options = options;

        this.renderItem = getReactRendererFromState(view.state).createItem(
            'yfmHtmlBlock-view',
            this.renderYfmHtmlBlock.bind(this),
        );
    }

    update(node: Node) {
        if (node.type !== this.node.type) return false;
        if (
            node.attrs[YfmHtmlBlockConsts.NodeAttrs.newCreated] !==
            this.node.attrs[YfmHtmlBlockConsts.NodeAttrs.newCreated]
        )
            return false;
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
        return target.classList.contains(STOP_EVENT_CLASSNAME);
    }

    private onChange(attrs: {[YfmHtmlBlockConsts.NodeAttrs.srcdoc]: string}) {
        const pos = this.getPos();
        if (pos === undefined) return;

        const tr = this.view.state.tr.setNodeMarkup(
            pos,
            undefined,
            {
                ...this.node.attrs,
                ...attrs,
            },
            [],
        );

        this.view.dispatch(tr);
    }

    private renderYfmHtmlBlock() {
        return (
            <Portal container={this.dom}>
                <YfmHtmlBlockView
                    getPos={this.getPos}
                    node={this.node}
                    onChange={this.onChange.bind(this)}
                    options={this.options}
                    view={this.view}
                />
            </Portal>
        );
    }
}
