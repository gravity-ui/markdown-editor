import type {EditorView} from 'prosemirror-view';

import {DIPLODOC_ID_ATTR, YFM_TAB_CLASSNAME, tabPanelType} from './const';

export const execAfterPaint = (fn: () => void) => {
    requestAnimationFrame(() => {
        requestAnimationFrame(fn);
    });
};

export const atEndOfPanel = (view?: EditorView) => {
    if (!view) return null;
    const {$head} = view.state.selection;
    for (let d = $head.depth; d >= 0; d--) {
        const parent = $head.node(d),
            index = $head.indexAfter(d);
        if (index !== parent.childCount) return false;
        if (parent.type === tabPanelType(view.state.schema)) {
            const panelPos = $head.before(d);
            return view?.endOfTextblock('down') ? panelPos : null;
        }
    }

    return null;
};

export const switchTabByElem = (tabElem: HTMLElement) => {
    if (tabElem.classList.contains(YFM_TAB_CLASSNAME)) {
        tabElem.click();
    }
};

export const switchTabById = (container: HTMLElement, tabId: string) => {
    const selector = `.${YFM_TAB_CLASSNAME}[${DIPLODOC_ID_ATTR}="${tabId}"]`;
    const tabElem = container.querySelector<HTMLDivElement>(selector);
    if (tabElem) {
        switchTabByElem(tabElem);
    }
};
