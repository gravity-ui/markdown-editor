import {Portal} from '@gravity-ui/uikit';
import type {Mermaid} from 'mermaid' with {'resolution-mode': 'import'};
import type {Node} from 'prosemirror-model';
import type {EditorView, NodeView} from 'prosemirror-view';

import type {MermaidOptions} from '..';
import {getReactRendererFromState} from '../../../behavior';
import type {MermaidConsts} from '../MermaidSpecs/const';

import {MermaidView, STOP_EVENT_CLASSNAME} from './MermaidView';

let mermaidInstance: Mermaid;

export class WMermaidNodeView implements NodeView {
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
        opts: MermaidOptions,
    ) {
        const {loadRuntimeScript} = opts;
        this.node = node;
        this.dom = document.createElement('div');
        this.dom.classList.add('mermaid-container');
        this.dom.contentEditable = 'false';
        this.view = view;
        this.getPos = getPos;
        this.loadRuntimeScript = loadRuntimeScript;
        this.initializeMermaid();
        this.renderItem = getReactRendererFromState(view.state).createItem(
            'mermaid-view',
            this.renderMermaid.bind(this),
        );
    }

    initializeMermaid() {
        // https://github.com/diplodoc-platform/mermaid-extension/tree/master#prepared-mermaid-runtime
        window.mermaidJsonp = window.mermaidJsonp || [];
        window.mermaidJsonp.push((mermaid: Mermaid) => {
            mermaidInstance = mermaid;
        });

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
        return target.classList.contains(STOP_EVENT_CLASSNAME);
    }

    private onChange(attrs: {[MermaidConsts.NodeAttrs.content]: string}) {
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

    private getMermaidInstance = () => mermaidInstance;

    private renderMermaid() {
        return (
            <Portal container={this.dom}>
                <MermaidView
                    view={this.view}
                    onChange={this.onChange.bind(this)}
                    node={this.node}
                    getMermaidInstance={this.getMermaidInstance}
                    getPos={this.getPos}
                />
            </Portal>
        );
    }
}
