import type {MarkdownEditorPreset} from 'src/bundle';
import {ActionName as Action} from 'src/bundle/config/action-names';
import {ToolbarName as Toolbar} from 'src/modules/toolbars/constants';
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
} from 'src/modules/toolbars/items';
import type {ToolbarsPreset} from 'src/modules/toolbars/types';

export const presets: Record<string, MarkdownEditorPreset> = {
    commonmark: 'commonmark',
    defaultPreset: 'default',
    full: 'full',
    yfm: 'yfm',
    zero: 'zero',
};

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
