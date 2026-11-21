import {getReactRendererFromState} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView, NodeView} from '@gravity-ui/markdown-editor/pm/view';
import {bannerImageAttrs} from '@gravity-ui/markdown-plugin-banner';
import {Portal} from '@gravity-ui/uikit';

import {i18n} from '../../../../i18n';
import {syncDomAttrs} from '../../nodeview';

import {BannerImagePlaceholder, cnBannerImageNodeView} from './components/BannerImagePlaceholder';

import './NodeView.scss';

export class WBannerImageNodeView implements NodeView {
    readonly dom: HTMLElement;
    private node: Node;
    private readonly empty: boolean;
    private attrs: Record<string, string> = {};
    private readonly renderItem?: {remove(): void};

    constructor(node: Node, view: EditorView) {
        this.node = node;
        const {class: className, ...attrs} = bannerImageAttrs(node.attrs);
        this.empty = !('src' in attrs);
        this.dom = document.createElement(this.empty ? 'div' : 'img');
        this.dom.className = `${className} ${cnBannerImageNodeView({empty: this.empty})}`;
        if (this.empty) {
            const {dom} = this;
            const {alt: _alt, title: _title, ...placeholderAttrs} = attrs;
            syncDomAttrs(
                dom,
                {},
                {
                    ...placeholderAttrs,
                    contenteditable: 'false',
                    role: 'button',
                    'aria-label': i18n('image-add'),
                    'aria-haspopup': 'dialog',
                },
            );
            this.renderItem = getReactRendererFromState(view.state).createItem(
                'banner-image-view',
                () => (
                    <Portal container={dom}>
                        <BannerImagePlaceholder />
                    </Portal>
                ),
            );
        } else {
            this.renderAttrs(attrs);
        }
    }

    update(node: Node) {
        if (node.type !== this.node.type) return false;
        const {class: _className, ...attrs} = bannerImageAttrs(node.attrs);
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

    private renderAttrs(attrs: Record<string, string>) {
        const {alt, ...named} = attrs;
        const domAttrs = alt ? attrs : {...named, role: 'img', 'aria-label': i18n('image')};
        this.attrs = syncDomAttrs(this.dom, this.attrs, domAttrs);
    }
}
