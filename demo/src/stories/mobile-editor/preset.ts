import type {ToolbarsPreset} from '@gravity-ui/markdown-editor';
import {ActionName as Action} from '@gravity-ui/markdown-editor/_/bundle/config/action-names.js';
import {ToolbarName as Toolbar} from '@gravity-ui/markdown-editor/_/modules/toolbars/constants.js';
import {
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
} from '@gravity-ui/markdown-editor/_/modules/toolbars/items.js';

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
