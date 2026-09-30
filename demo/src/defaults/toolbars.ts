import type {ToolbarsPreset} from '@gravity-ui/markdown-editor';
import {
    ActionName as Action,
    ToolbarName as Toolbar,
} from '@gravity-ui/markdown-editor/_/modules/toolbars/constants.js';
import {
    mermaidItemView,
    mermaidItemWysiwyg,
    yfmHtmlBlockItemView,
    yfmHtmlBlockItemWysiwyg,
} from '@gravity-ui/markdown-editor/_/modules/toolbars/items.js';
import {full} from '@gravity-ui/markdown-editor/_/modules/toolbars/presets.js';
import {
    latexBlockItemView,
    latexBlockItemWysiwyg,
    latexInlineItemView,
    latexInlineItemWysiwyg,
} from '@gravity-ui/markdown-editor-latex-extension/configs';
import {
    pageConstructorItemView,
    pageConstructorItemWysiwyg,
} from '@gravity-ui/markdown-editor-page-constructor-extension/configs';

const pageConstructor = 'pageConstructor';

export const playgroundToolbarsPreset: ToolbarsPreset = {
    items: {
        ...full.items,
        [Action.mathInline]: {view: latexInlineItemView, wysiwyg: latexInlineItemWysiwyg},
        [Action.mathBlock]: {view: latexBlockItemView, wysiwyg: latexBlockItemWysiwyg},
        [Action.mermaid]: {view: mermaidItemView, wysiwyg: mermaidItemWysiwyg},
        [pageConstructor]: {view: pageConstructorItemView, wysiwyg: pageConstructorItemWysiwyg},
        [Action.htmlBlock]: {view: yfmHtmlBlockItemView, wysiwyg: yfmHtmlBlockItemWysiwyg},
    },
    orders: {
        ...full.orders,
        [Toolbar.wysiwygSlash]: [
            [
                ...full.orders[Toolbar.wysiwygSlash].flat(),
                Action.mathInline,
                Action.mathBlock,
                Action.mermaid,
                pageConstructor,
                Action.htmlBlock,
            ],
        ],
    },
};
