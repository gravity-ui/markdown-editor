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
import {toolbarBannerItem, toolbarButtonItem} from '@gravity-ui/markdown-editor-banner-extension';
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
const banner = 'banner';

export const playgroundToolbarsPreset: ToolbarsPreset = {
    items: {
        ...full.items,
        [Action.mathInline]: {view: latexInlineItemView, wysiwyg: latexInlineItemWysiwyg},
        [Action.mathBlock]: {view: latexBlockItemView, wysiwyg: latexBlockItemWysiwyg},
        [Action.mermaid]: {view: mermaidItemView, wysiwyg: mermaidItemWysiwyg},
        [pageConstructor]: {view: pageConstructorItemView, wysiwyg: pageConstructorItemWysiwyg},
        [Action.htmlBlock]: {view: yfmHtmlBlockItemView, wysiwyg: yfmHtmlBlockItemWysiwyg},
        [banner]: toolbarBannerItem,
        [button]: toolbarButtonItem,
    },
    orders: {
        ...full.orders,
        [Toolbar.wysiwygHidden]: [...full.orders[Toolbar.wysiwygHidden], [banner, button]],
        [Toolbar.markupHidden]: [...full.orders[Toolbar.markupHidden], [banner, button]],
        [Toolbar.wysiwygSlash]: [
            [
                ...full.orders[Toolbar.wysiwygSlash].flat(),
                Action.mathInline,
                Action.mathBlock,
                Action.mermaid,
                pageConstructor,
                banner,
                button,
                Action.htmlBlock,
            ],
        ],
    },
};
