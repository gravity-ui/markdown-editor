import {BaseTooltipPlugin} from '@gravity-ui/markdown-editor';
import {Plugin} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';

import {headerNodeType} from '../../HeaderSpecs';

import {HeaderToolbar, headerToolbars} from './HeaderToolbar';

export {headerKeymap} from './keymap';

const tooltips = new WeakMap<EditorView, HeaderTooltipView>();
const companions = new WeakMap<EditorView, Element>();

export const headerToolbar = (view: EditorView) => headerToolbars.get(view);

export const showHeaderToolbar = (view: EditorView) => tooltips.get(view)?.show();

/** Focus and clicks inside the element keep the toolbar open. */
export const keepHeaderToolbarWith = (view: EditorView, element: Element | null) => {
    if (element) companions.set(view, element);
    else companions.delete(view);
};

class HeaderTooltipView extends BaseTooltipPlugin.BaseTooltipPluginView {
    constructor(view: EditorView) {
        super(view, {
            idPrefix: 'header-tooltip',
            nodeType: headerNodeType(view.state.schema),
            popupPlacement: ['bottom', 'top'],
            content: (editorView, {node, pos, dom}) => (
                <HeaderToolbar view={editorView} node={node} pos={pos} block={dom} />
            ),
        });
        const openChange = this.popupOpenChangeHandler;
        this.popupOpenChangeHandler = (open, event, reason) => {
            const target = event instanceof FocusEvent ? event.relatedTarget : event?.target;
            const within = companions.get(this.view);
            if (!open && target instanceof window.Node && within?.contains(target)) return;
            openChange?.(open, event, reason);
        };
    }

    show() {
        if (!this.manualHidden || !this.currentNode) return;
        this.manualHidden = false;
        this.stopTrackingViewFocus();
        this.render();
    }
}

export const headerTooltipPlugin = () =>
    new Plugin({
        view: (view) => {
            const tooltip = new HeaderTooltipView(view);
            tooltips.set(view, tooltip);
            return tooltip;
        },
    });
