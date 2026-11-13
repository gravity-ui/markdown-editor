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
import {toolbarButtonItem} from '@gravity-ui/markdown-editor-header-extension';
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
const button = 'button';

export const playgroundToolbarsPreset: ToolbarsPreset = {
    items: {
        ...full.items,
        [Action.mathInline]: {view: latexInlineItemView, wysiwyg: latexInlineItemWysiwyg},
        [Action.mathBlock]: {view: latexBlockItemView, wysiwyg: latexBlockItemWysiwyg},
        [Action.mermaid]: {view: mermaidItemView, wysiwyg: mermaidItemWysiwyg},
        [pageConstructor]: {view: pageConstructorItemView, wysiwyg: pageConstructorItemWysiwyg},
        [Action.htmlBlock]: {view: yfmHtmlBlockItemView, wysiwyg: yfmHtmlBlockItemWysiwyg},
        [button]: toolbarButtonItem,
    },
    orders: {
        ...full.orders,
        [Toolbar.wysiwygHidden]: [...full.orders[Toolbar.wysiwygHidden], [button]],
        [Toolbar.markupHidden]: [...full.orders[Toolbar.markupHidden], [button]],
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
