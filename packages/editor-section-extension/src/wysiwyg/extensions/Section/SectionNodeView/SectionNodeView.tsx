import {cn, getReactRendererFromState} from '@gravity-ui/markdown-editor';
import {EditorPopup} from '@gravity-ui/markdown-editor/_/plugins/BaseTooltip/EditorPopup.js';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {Decoration, EditorView, NodeView} from '@gravity-ui/markdown-editor/pm/view';
import {sectionAttrs} from '@gravity-ui/markdown-plugin-section';

import {SectionToolbar} from './components/SectionToolbar';

import './SectionNodeView.scss';

const b = cn('section-nodeview');
type RendererItem = ReturnType<ReturnType<typeof getReactRendererFromState>['createItem']>;

export class SectionNodeView implements NodeView {
    readonly dom: HTMLElement;
    readonly contentDOM: HTMLElement;

    private node: Node;
    private readonly view: EditorView;
    private readonly getPos: () => number | undefined;
    private hover = false;
    private selected = false;
    private hoverTimeout?: ReturnType<typeof setTimeout>;
    private toolbar?: RendererItem;

    constructor(
        node: Node,
        view: EditorView,
        getPos: () => number | undefined,
        decorations: readonly Decoration[],
    ) {
        this.node = node;
        this.view = view;
        this.getPos = getPos;
        this.dom = view.dom.ownerDocument.createElement('div');
        this.contentDOM = this.dom.ownerDocument.createElement('div');
        this.dom.className = b();
        this.contentDOM.className = sectionAttrs(node.attrs).class;
        this.dom.append(this.contentDOM);
        this.dom.addEventListener('mouseenter', this.activateHover);
        this.dom.addEventListener('mouseleave', this.deactivateHover);
        this.update(node, decorations);
    }

    update(node: Node, decorations: readonly Decoration[]): boolean {
        if (node.type !== this.node.type) return false;
        this.node = node;
        this.contentDOM.className = sectionAttrs(node.attrs).class;
        this.selected = decorations.some(({spec}) => spec.sectionSelected);
        this.updateToolbar();
        return true;
    }

    ignoreMutation(mutation: Parameters<NonNullable<NodeView['ignoreMutation']>>[0]) {
        if (mutation.type === 'selection') return false;
        return (
            mutation.type === 'attributes' &&
            (mutation.target === this.dom || mutation.target === this.contentDOM)
        );
    }

    destroy() {
        clearTimeout(this.hoverTimeout);
        this.dom.removeEventListener('mouseenter', this.activateHover);
        this.dom.removeEventListener('mouseleave', this.deactivateHover);
        this.toolbar?.remove();
    }

    private activateHover = () => {
        clearTimeout(this.hoverTimeout);
        this.hover = true;
        this.updateToolbar();
    };

    private deactivateHover = () => {
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = setTimeout(() => {
            this.hover = false;
            this.updateToolbar();
        }, 160);
    };

    private updateToolbar() {
        const active = this.view.editable && (this.hover || this.selected);
        if (!active) {
            this.toolbar?.remove();
            this.toolbar = undefined;
        } else if (this.toolbar) {
            this.toolbar.rerender();
        } else {
            this.toolbar = getReactRendererFromState(this.view.state).createItem(
                'section-toolbar',
                this.renderToolbar,
            );
        }
    }

    private renderToolbar = () => {
        const pos = this.getPos();
        if (pos === undefined) return null;
        return (
            <EditorPopup
                editorElement={this.view.dom}
                anchorElement={this.dom}
                placement={['bottom', 'top']}
            >
                <SectionToolbar
                    view={this.view}
                    node={this.node}
                    pos={pos}
                    onMouseEnter={this.activateHover}
                    onMouseLeave={this.deactivateHover}
                />
            </EditorPopup>
        );
    };
}
