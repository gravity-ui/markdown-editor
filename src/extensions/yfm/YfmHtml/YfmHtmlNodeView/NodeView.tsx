import React from 'react';

import {Node} from 'prosemirror-model';
import {EditorView, NodeView} from 'prosemirror-view';
import {createPortal} from 'react-dom';

import type {YfmHtmlOptions} from '..';
import {getReactRendererFromState} from '../../../behavior';
import {YfmHtmlConsts} from '../YfmHtmlSpecs/const';

import {YfmHtmlView} from './YfmHtmlView';

export class WYfmHtmlNodeView implements NodeView {
    readonly dom: HTMLElement;
    private node: Node;
    private readonly view;
    private readonly getPos;
    private readonly renderItem;
    private readonly loadRuntimeScript: () => void;

    constructor(
        node: Node,
        view: EditorView,
        getPos: () => number | undefined,
        opts: YfmHtmlOptions,
    ) {
        const {loadRuntimeScript} = opts;
        this.node = node;
        this.dom = document.createElement('div');
        this.dom.classList.add('yfmHtml-container');
        this.dom.contentEditable = 'false';
        this.view = view;
        this.getPos = getPos;
        this.loadRuntimeScript = loadRuntimeScript;
        this.initializeYfmHtml();
        this.renderItem = getReactRendererFromState(view.state).createItem(
            'yfmHtml-view',
            this.renderYfmHtml.bind(this),
        );
    }

    initializeYfmHtml() {
        this.loadRuntimeScript();
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
        if (
            typeof target.className === 'string' &&
            target.className.includes('prosemirror-stop-event')
        ) {
            return true;
        }

        return false;
    }

    private onChange(attrs: {[YfmHtmlConsts.NodeAttrs.srcdoc]: string}) {
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

    private renderYfmHtml() {
        return createPortal(
            <YfmHtmlView
                view={this.view}
                onChange={this.onChange.bind(this)}
                node={this.node}
                getPos={this.getPos}
            />,
            this.dom,
        );
    }
}
