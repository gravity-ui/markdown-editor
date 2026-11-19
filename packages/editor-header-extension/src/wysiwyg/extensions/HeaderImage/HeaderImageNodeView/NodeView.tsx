import {type RendererItem, getReactRendererFromState} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView, NodeView} from '@gravity-ui/markdown-editor/pm/view';
import {headerImageAttrs} from '@gravity-ui/markdown-plugin-header';
import {Portal} from '@gravity-ui/uikit';

import {i18n} from '../../../../i18n';
import {syncDomAttrs} from '../../nodeview';

import {HeaderImagePlaceholder, cnHeaderImageNodeView} from './components/HeaderImagePlaceholder';

import './NodeView.scss';

/** An image with an address is the `img` of the preview; an image without one is a placeholder. */
export class WHeaderImageNodeView implements NodeView {
    readonly dom: HTMLElement;
    private node: Node;
    private readonly empty: boolean;
    private attrs: Record<string, string> = {};
    private readonly renderItem?: RendererItem;

    constructor(node: Node, view: EditorView) {
        this.node = node;
        const {class: className, ...attrs} = headerImageAttrs(node.attrs);
        this.empty = !('src' in attrs);
        this.dom = document.createElement(this.empty ? 'div' : 'img');
        this.dom.className = `${className} ${cnHeaderImageNodeView({empty: this.empty})}`;
        if (this.empty) {
            const {dom} = this;
            const {alt: _alt, title: _title, ...placeholderAttrs} = attrs;
            syncDomAttrs(
                dom,
                {},
                {
                    contenteditable: 'false',
                    ...placeholderAttrs,
                    role: 'button',
                    'aria-label': i18n('image-add'),
                },
            );
            this.renderItem = getReactRendererFromState(view.state).createItem(
                'header-image-view',
                () => (
                    <Portal container={dom}>
                        <HeaderImagePlaceholder />
                    </Portal>
                ),
            );
        } else {
            this.renderAttrs(attrs);
        }
    }

    update(node: Node) {
        if (node.type !== this.node.type) return false;
        const {class: _className, ...attrs} = headerImageAttrs(node.attrs);
        // An address added or removed changes the element: the view is created again.
        if (this.empty !== !('src' in attrs)) return false;
        const changed = !node.sameMarkup(this.node);
        this.node = node;
        if (changed && !this.empty) this.renderAttrs(attrs);
        return true;
    }

    destroy() {
        this.renderItem?.remove();
    }

    ignoreMutation() {
        return true;
    }

    // An image without the alternative text is named for screen readers in the editor only.
    private renderAttrs(attrs: Record<string, string>) {
        const {alt, ...named} = attrs;
        const domAttrs = alt ? attrs : {...named, role: 'img', 'aria-label': i18n('image')};
        syncDomAttrs(this.dom, this.attrs, domAttrs);
        this.attrs = domAttrs;
    }
}
