import type {ToolbarsPreset} from '@gravity-ui/markdown-editor';
import {ActionName as Action} from '@gravity-ui/markdown-editor/_/bundle/config/action-names.js';
import {ToolbarName as Toolbar} from '@gravity-ui/markdown-editor/_/modules/toolbars/constants.js';
import {
    boldItemView,
    boldItemWysiwyg,
    colorifyItemMarkup,
    colorifyItemView,
    colorifyItemWysiwyg,
    heading1ItemView,
    heading1ItemWysiwyg,
    heading2ItemView,
    heading2ItemWysiwyg,
    italicItemMarkup,
    italicItemView,
    italicItemWysiwyg,
    paragraphItemView,
    paragraphItemWisywig,
    redoItemMarkup,
    redoItemView,
    redoItemWysiwyg,
    textContextItemView,
    textContextItemWisywig,
    toggleHeadingFoldingItemView,
    toggleHeadingFoldingItemWysiwyg,
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
                wysiwyg: italicItemWysiwyg,
                markup: italicItemMarkup,
            },
            [Action.colorify]: {
                view: colorifyItemView,
                wysiwyg: colorifyItemWysiwyg,
                markup: colorifyItemMarkup,
            },
            [Action.text]: {view: textContextItemView, wysiwyg: textContextItemWisywig},
            [Action.foldingHeading]: {
                view: toggleHeadingFoldingItemView,
                wysiwyg: toggleHeadingFoldingItemWysiwyg,
            },
            [Action.paragraph]: {view: paragraphItemView, wysiwyg: paragraphItemWisywig},
            [Action.heading1]: {view: heading1ItemView, wysiwyg: heading1ItemWysiwyg},
            [Action.heading2]: {view: heading2ItemView, wysiwyg: heading2ItemWysiwyg},
        },
        orders: {
            [Toolbar.wysiwygMain]: [[Action.colorify], [Action.bold], [Action.undo, Action.redo]],
            [Toolbar.markupMain]: [[Action.colorify], [Action.italic], [Action.undo, Action.redo]],
            [Toolbar.wysiwygSelection]: [
                [Action.foldingHeading, Action.text],
                [Action.bold, Action.italic],
            ],
            [Toolbar.wysiwygSlash]: [[Action.paragraph, Action.heading1, Action.heading2]],
        },
    },
};
