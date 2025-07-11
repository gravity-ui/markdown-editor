import {ActionName as Action} from 'src/bundle/config/action-names';
import {ToolbarName as Toolbar} from 'src/modules/toolbars/constants';
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
} from 'src/modules/toolbars/items';
import type {ToolbarsPreset} from 'src/modules/toolbars/types';

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
