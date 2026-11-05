import type {NodeViewConstructor} from '@gravity-ui/markdown-editor/core';
import {getReactRendererFromState} from '@gravity-ui/markdown-editor/extensions';
import {headerClassName, headerDimensions} from '@gravity-ui/markdown-plugin-header';
import {createPortal} from 'react-dom';

import {HeaderControls} from './Controls/HeaderControls';

export const headerNodeView: NodeViewConstructor = (node, view, getPos) => {
    const dom = document.createElement('div');
    dom.className = `${headerClassName} g-md-header-view`;
    dom.contentEditable = 'false';

    const controls = document.createElement('div');
    controls.className = 'g-md-header-view__controls';
    dom.append(controls);

    const item = getReactRendererFromState(view.state).createItem('header-controls', () =>
        createPortal(<HeaderControls view={view} getPos={getPos} block={dom} />, controls),
    );

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
        // Children of the block are the controls and the settings panel.
        stopEvent: (event) => event.target !== dom,
        ignoreMutation: () => true,
        destroy: () => item.remove(),
    };
};
