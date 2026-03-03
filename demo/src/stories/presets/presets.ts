import type {ToolbarsPreset} from '@gravity-ui/markdown-editor';
import {ActionName as Action} from '@gravity-ui/markdown-editor/_/bundle/config/action-names.js';
import {ToolbarName as Toolbar} from '@gravity-ui/markdown-editor/_/modules/toolbars/constants.js';
import {
    boldItemView,
    boldItemWysiwyg,
    colorifyItemMarkup,
    colorifyItemView,
    colorifyItemWysiwyg,
    italicItemMarkup,
    italicItemView,
    redoItemMarkup,
    redoItemView,
    redoItemWysiwyg,
    undoItemMarkup,
    undoItemView,
    undoItemWysiwyg,
} from '@gravity-ui/markdown-editor/_/modules/toolbars/items.js';

export const toolbarPresets: Record<string, ToolbarsPreset> = {
    custom: {
        items: {
            [Action.undo]: {
                view: undoItemView,
                wysiwyg: undoItemWysiwyg,
                markup: undoItemMarkup,
            },
            [Action.redo]: {
                view: redoItemView,
                wysiwyg: redoItemWysiwyg,
                markup: redoItemMarkup,
            },
            [Action.bold]: {
                view: boldItemView,
                wysiwyg: boldItemWysiwyg,
            },
            [Action.italic]: {
                view: italicItemView,
                markup: italicItemMarkup,
            },
            [Action.colorify]: {
                view: colorifyItemView,
                wysiwyg: colorifyItemWysiwyg,
                markup: colorifyItemMarkup,
            },
        },
        orders: {
            [Toolbar.wysiwygMain]: [[Action.colorify], [Action.bold], [Action.undo, Action.redo]],
            [Toolbar.markupMain]: [[Action.colorify], [Action.italic], [Action.undo, Action.redo]],
        },
    },
};
