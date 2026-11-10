import type {ToolbarsPreset} from '@gravity-ui/markdown-editor';
import {
    ActionName as Action,
    ToolbarName as Toolbar,
    full,
    yfmHtmlBlockItemView,
    yfmHtmlBlockItemWysiwyg,
} from '@gravity-ui/markdown-editor/toolbars';
import {
    latexBlockItemView,
    latexBlockItemWysiwyg,
    latexInlineItemView,
    latexInlineItemWysiwyg,
} from '@gravity-ui/markdown-editor-latex-extension/configs';
import {toolbarMermaidItem} from '@gravity-ui/markdown-editor-mermaid-extension';
import {
    pageConstructorItemView,
    pageConstructorItemWysiwyg,
} from '@gravity-ui/markdown-editor-page-constructor-extension/configs';

const mermaid = 'mermaid';
const pageConstructor = 'pageConstructor';

export const playgroundToolbarsPreset: ToolbarsPreset = {
    items: {
        ...full.items,
        [Action.mathInline]: {view: latexInlineItemView, wysiwyg: latexInlineItemWysiwyg},
        [Action.mathBlock]: {view: latexBlockItemView, wysiwyg: latexBlockItemWysiwyg},
        [mermaid]: toolbarMermaidItem,
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
                mermaid,
                pageConstructor,
                Action.htmlBlock,
            ],
        ],
    },
};
