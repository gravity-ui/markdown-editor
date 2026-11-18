import type {ToolbarsPreset} from '@gravity-ui/markdown-editor';
import {
    ActionName as Action,
    ToolbarName as Toolbar,
    full,
    mermaidItemView,
    mermaidItemWysiwyg,
    yfmHtmlBlockItemView,
    yfmHtmlBlockItemWysiwyg,
} from '@gravity-ui/markdown-editor/toolbars';
import {toolbarFoldingHeadingItem} from '@gravity-ui/markdown-editor-folding-heading-extension';
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

const foldingHeading = 'foldingHeading';
const pageConstructor = 'pageConstructor';

export const playgroundToolbarsPreset: ToolbarsPreset = {
    items: {
        ...full.items,
        [foldingHeading]: toolbarFoldingHeadingItem,
        [Action.mathInline]: {view: latexInlineItemView, wysiwyg: latexInlineItemWysiwyg},
        [Action.mathBlock]: {view: latexBlockItemView, wysiwyg: latexBlockItemWysiwyg},
        [Action.mermaid]: {view: mermaidItemView, wysiwyg: mermaidItemWysiwyg},
        [pageConstructor]: {view: pageConstructorItemView, wysiwyg: pageConstructorItemWysiwyg},
        [Action.htmlBlock]: {view: yfmHtmlBlockItemView, wysiwyg: yfmHtmlBlockItemWysiwyg},
    },
    orders: {
        ...full.orders,
        [Toolbar.wysiwygSelection]: [
            [foldingHeading, Action.text],
            ...full.orders[Toolbar.wysiwygSelection].slice(1),
        ],
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
