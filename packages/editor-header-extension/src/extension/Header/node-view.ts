import type {NodeViewConstructor} from '@gravity-ui/markdown-editor/core';
import {NodeSelection} from '@gravity-ui/markdown-editor/pm/state';
import {
    headerClassName,
    headerDimensions,
    headerTextDomAttrs,
} from '@gravity-ui/markdown-plugin-header';

import {headerSettingsKey} from './Settings';

export const headerNodeView: NodeViewConstructor = (node, view, getPos) => {
    const dom = document.createElement('div');
    dom.className = headerClassName;

    const select = (event: MouseEvent) => {
        if (event.button !== 0 || !view.editable || event.target !== dom) return;
        const pos = getPos();
        if (pos === undefined) return;
        event.preventDefault();
        view.dispatch(
            view.state.tr
                .setSelection(NodeSelection.create(view.state.doc, pos))
                .setMeta(headerSettingsKey, pos),
        );
        view.focus();
    };
    dom.addEventListener('mousedown', select);

    const update = (next: typeof node) => {
        if (next.type !== node.type) return false;
        const {height, width} = headerDimensions(next.attrs);
        dom.dataset.height = height;
        dom.dataset.width = width;
        const {'data-title': title, 'data-description': description} = headerTextDomAttrs(
            next.attrs,
        );
        if (title) dom.dataset.title = title;
        else delete dom.dataset.title;
        if (description) dom.dataset.description = description;
        else delete dom.dataset.description;
        return true;
    };
    update(node);

    return {
        dom,
        contentDOM: dom,
        update,
        stopEvent: (event) =>
            (event.type === 'mousedown' || event.type === 'click') && event.target === dom,
        ignoreMutation: (mutation) => mutation.type === 'attributes' && mutation.target === dom,
        destroy: () => dom.removeEventListener('mousedown', select),
    };
};
