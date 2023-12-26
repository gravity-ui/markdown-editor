import React from 'react';

import type {Node} from 'prosemirror-model';
import type {EditorView, NodeView, NodeViewConstructor} from 'prosemirror-view';
import {createPortal} from 'react-dom';

import {ExtensionDeps, Serializer} from '../core';
import {getReactRendererFromState} from '../extensions';

type ReactNodeViewOptions<T> = {
    isInline?: boolean;
    reactNodeWrapperCn?: string;
    extensionOptions?: T;
};

export const ReactNodeStopEventCn = 'prosemirror-stop-event';
export type ReactNodeViewProps<T extends object = {}> = {
    dom: HTMLElement;
    view: EditorView;
    updateAttributes: (attrs: object) => void;
    node: Node;
    getPos: () => number | undefined;
    serializer: Serializer;
    extensionOptions?: T;
};

export class ReactNodeView<T extends object = {}> implements NodeView {
    readonly dom: HTMLElement;
    node: Node;
    readonly view;
    readonly serializer;
    readonly renderItem;
    readonly getPos;

    constructor(
        Component: React.FC<ReactNodeViewProps<T>>,
        opts: {
            node: Node;
            view: EditorView;
            getPos: () => number | undefined;
            serializer: Serializer;
            options?: ReactNodeViewOptions<T>;
        },
    ) {
        const {getPos, node, serializer, view, options} = opts;
        this.node = node;

        this.dom = options?.isInline
            ? document.createElement('span')
            : document.createElement('div');
        this.dom.classList.add('react-node-wrapper');
        if (options?.reactNodeWrapperCn) {
            this.dom.classList.add(options?.reactNodeWrapperCn);
        }
        this.dom.contentEditable = 'false';

        this.serializer = serializer;
        this.view = view;
        this.getPos = getPos;

        this.renderItem = getReactRendererFromState(view.state).createItem(
            `${Component.displayName || this.node.type.name}-view`,
            () =>
                createPortal(
                    <Component
                        dom={this.dom}
                        view={this.view}
                        updateAttributes={this.updateAttributes.bind(this)}
                        node={this.node}
                        getPos={this.getPos.bind(this)}
                        serializer={this.serializer}
                        extensionOptions={options?.extensionOptions}
                    />,
                    this.dom,
                ),
        );
    }

    update(node: Node) {
        if (node.type !== this.node.type) return false;
        if (this.node === node) return true;

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

    updateAttributes(attributes: {}) {
        const pos = this.getPos();
        if (pos === undefined) return;

        const {tr} = this.view.state;
        tr.setNodeMarkup(pos, undefined, {
            ...this.node.attrs,
            ...attributes,
        });
        this.view.dispatch(tr);
    }

    stopEvent(e: Event) {
        const target = e.target as Element;
        const isInput = ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'].includes(target.tagName);

        if (
            isInput ||
            (typeof target.className === 'string' &&
                target.className.includes(ReactNodeStopEventCn))
        ) {
            return true;
        }

        return false;
    }
}

export const reactNodeViewFactory: <T extends object = {}>(
    Component: React.FC<ReactNodeViewProps<T>>,
    options?: ReactNodeViewOptions<T>,
) => (deps: ExtensionDeps) => NodeViewConstructor =
    (Component, options) =>
    ({serializer}) =>
    (node, view, getPos) =>
        new ReactNodeView(Component, {node, view, getPos, serializer, options});
