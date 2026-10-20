import type {ToolbarsPreset} from '@gravity-ui/markdown-editor';
import {
    ActionName as Action,
    ToolbarName as Toolbar,
    boldItemMarkup,
    boldItemView,
    boldItemWysiwyg,
    italicItemMarkup,
    italicItemView,
    italicItemWysiwyg,
    strikethroughItemMarkup,
    strikethroughItemView,
    strikethroughItemWysiwyg,
    underlineItemMarkup,
    underlineItemView,
    underlineItemWysiwyg,
} from '@gravity-ui/markdown-editor/toolbars';

export const toolbarPreset: ToolbarsPreset = {
    items: {
        [Action.bold]: {
            view: boldItemView,
            wysiwyg: boldItemWysiwyg,
            markup: boldItemMarkup,
        },
        [Action.italic]: {
            view: italicItemView,
            wysiwyg: italicItemWysiwyg,
            markup: italicItemMarkup,
        },
        [Action.underline]: {
            view: underlineItemView,
            wysiwyg: underlineItemWysiwyg,
            markup: underlineItemMarkup,
        },
        [Action.strike]: {
            view: strikethroughItemView,
            wysiwyg: strikethroughItemWysiwyg,
            markup: strikethroughItemMarkup,
        },
    },
    orders: {
        [Toolbar.wysiwygMain]: [[Action.bold, Action.italic, Action.underline, Action.strike]],
        [Toolbar.markupMain]: [[Action.bold, Action.italic, Action.underline, Action.strike]],
    },
};
