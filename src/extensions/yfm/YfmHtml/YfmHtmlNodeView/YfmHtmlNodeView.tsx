import React from 'react';

import {Node} from 'prosemirror-model';
import {EditorView, NodeView} from 'prosemirror-view';
import {createPortal} from 'react-dom';

import type {YfmHtmlOptions} from '..';
import {getReactRendererFromState} from '../../../behavior';

import {YfmHtmlBlockView} from './YfmHtmlBlockView';

interface Constructor {
    node: Node;
    options: YfmHtmlOptions;
    view: EditorView;
}

export class YfmHtmlNodeView implements NodeView {
    readonly dom: HTMLElement;
    private node: Node;
    private readonly view;
    // private readonly getPos;

    private readonly renderItem;
    private readonly loadRuntimeScript?: () => void;

    constructor({node, view, options: {loadRuntimeScript}}: Constructor) {
        this.dom = document.createElement('div');
        this.dom.classList.add('yfmHtml-container');
        this.dom.contentEditable = 'false';
        this.node = node;
        this.view = view;

        this.loadRuntimeScript = loadRuntimeScript;
        this.initializeYfmHtml();

        this.renderItem = getReactRendererFromState(view.state).createItem(
            'yfm-html-view',
            this.renderYfmHtml.bind(this),
        );
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

    stopEvent(event: Event) {
        console.log('stopEvent YfmHtml');
        const target = event.target as Element;
        if (
            typeof target.className === 'string' &&
            target.className.includes('prosemirror-stop-event')
        ) {
            return true;
        }

        return false;
    }

    initializeYfmHtml() {
        this.loadRuntimeScript?.();
    }

    private renderYfmHtml() {
        return createPortal(<YfmHtmlBlockView node={this.node} view={this.view} />, this.dom);
    }
}
