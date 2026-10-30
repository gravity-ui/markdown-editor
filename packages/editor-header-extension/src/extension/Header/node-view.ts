import type {NodeViewConstructor} from '@gravity-ui/markdown-editor/core';
import {NodeSelection} from '@gravity-ui/markdown-editor/pm/state';
import {headerClassName, headerDimensions} from '@gravity-ui/markdown-plugin-header';

import {headerSettingsKey} from './Settings';

export const headerNodeView: NodeViewConstructor = (node, view, getPos) => {
    const dom = document.createElement('div');
    dom.className = headerClassName;
    dom.contentEditable = 'false';

    const select = (event: MouseEvent) => {
        if (event.button !== 0 || !view.editable) return;
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
        return true;
    };
    update(node);

    return {
        dom,
        update,
        stopEvent: (event) => event.type === 'mousedown' || event.type === 'click',
        ignoreMutation: () => true,
        destroy: () => dom.removeEventListener('mousedown', select),
    };
};
