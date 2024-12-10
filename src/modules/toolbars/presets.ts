import {ActionName as Action} from '../../bundle/config/action-names';

import {ListName as List, ToolbarName as Toolbar} from './constants';
import {
    boldItemCommon,
    boldItemMarkup,
    boldItemWysiwyg,
    bulletListItemCommon,
    bulletListItemMarkup,
    bulletListItemWysiwyg,
    codeBlockItemCommon,
    codeBlockItemMarkup,
    codeBlockItemWysiwyg,
    codeItemCommon,
    codeItemMarkup,
    codeItemWysiwyg,
    heading1ItemCommon,
    heading1ItemMarkup,
    heading1ItemWysiwyg,
    heading2ItemCommon,
    heading2ItemMarkup,
    heading2ItemWysiwyg,
    heading3ItemCommon,
    heading3ItemMarkup,
    heading3ItemWysiwyg,
    heading4ItemCommon,
    heading4ItemMarkup,
    heading4ItemWysiwyg,
    heading5ItemCommon,
    heading5ItemMarkup,
    heading5ItemWysiwyg,
    heading6ItemCommon,
    heading6ItemMarkup,
    heading6ItemWysiwyg,
    hruleItemCommon,
    hruleItemMarkup,
    hruleItemWysiwyg,
    italicItemCommon,
    italicItemMarkup,
    italicItemWysiwyg,
    liftListItemCommon,
    liftListItemMarkup,
    liftListItemWysiwyg,
    linkItemCommon,
    linkItemMarkup,
    linkItemWysiwyg,
    orderedListItemCommon,
    orderedListItemMarkup,
    orderedListItemWysiwyg,
    quoteItemCommon,
    quoteItemMarkup,
    quoteItemWysiwyg,
    redoItemCommon,
    redoItemMarkup,
    redoItemWysiwyg,
    sinkListItemCommon,
    sinkListItemMarkup,
    sinkListItemWysiwyg,
    undoItemCommon,
    undoItemMarkup,
    undoItemWysiwyg,
} from './items';
import {ToolbarsPreset} from './types';

export const Lists = {} as const;

// presets
export const zero: ToolbarsPreset = {
    nodes: {
        [Action.undo]: {
            common: undoItemCommon,
            wysiwyg: undoItemWysiwyg,
            markup: undoItemMarkup,
        },
        [Action.redo]: {
            common: redoItemCommon,
            wysiwyg: redoItemWysiwyg,
            markup: redoItemMarkup,
        },
    },
    orders: {
        [Toolbar.wysiwygMain]: [Action.undo, Action.redo],
        [Toolbar.wysiwygHidden]: [],
        [Toolbar.markupMain]: [Action.undo, Action.redo],
        [Toolbar.markupHidden]: [],
    },
};

export const commonmark: ToolbarsPreset = {
    nodes: {
        ...zero.nodes,
        [Action.bold]: {
            common: boldItemCommon,
            wysiwyg: boldItemWysiwyg,
            markup: boldItemMarkup,
        },
        [Action.italic]: {
            common: italicItemCommon,
            wysiwyg: italicItemWysiwyg,
            markup: italicItemMarkup,
        },
        [Action.heading1]: {
            common: heading1ItemCommon,
            wysiwyg: heading1ItemWysiwyg,
            markup: heading1ItemMarkup,
        },
        [Action.heading2]: {
            common: heading2ItemCommon,
            wysiwyg: heading2ItemWysiwyg,
            markup: heading2ItemMarkup,
        },
        [Action.heading3]: {
            common: heading3ItemCommon,
            wysiwyg: heading3ItemWysiwyg,
            markup: heading3ItemMarkup,
        },
        [Action.heading4]: {
            common: heading4ItemCommon,
            wysiwyg: heading4ItemWysiwyg,
            markup: heading4ItemMarkup,
        },
        [Action.heading5]: {
            common: heading5ItemCommon,
            wysiwyg: heading5ItemWysiwyg,
            markup: heading5ItemMarkup,
        },
        [Action.heading6]: {
            common: heading6ItemCommon,
            wysiwyg: heading6ItemWysiwyg,
            markup: heading6ItemMarkup,
        },
        [Action.bulletList]: {
            common: bulletListItemCommon,
            wysiwyg: bulletListItemWysiwyg,
            markup: bulletListItemMarkup,
        },
        [Action.orderedList]: {
            common: orderedListItemCommon,
            wysiwyg: orderedListItemWysiwyg,
            markup: orderedListItemMarkup,
        },
        [Action.sinkListItem]: {
            common: sinkListItemCommon,
            wysiwyg: sinkListItemWysiwyg,
            markup: sinkListItemMarkup,
        },
        [Action.liftListItem]: {
            common: liftListItemCommon,
            wysiwyg: liftListItemWysiwyg,
            markup: liftListItemMarkup,
        },
        [Action.link]: {
            common: linkItemCommon,
            wysiwyg: linkItemWysiwyg,
            markup: linkItemMarkup,
        },
        [Action.quote]: {
            common: quoteItemCommon,
            wysiwyg: quoteItemWysiwyg,
            markup: quoteItemMarkup,
        },
        [Action.code_inline]: {
            common: codeItemCommon,
            wysiwyg: codeItemWysiwyg,
            markup: codeItemMarkup,
        },
        [Action.code_block]: {
            common: codeBlockItemCommon,
            wysiwyg: codeBlockItemWysiwyg,
            markup: codeBlockItemMarkup,
        },
        [Action.horizontalrule]: {
            common: hruleItemCommon,
            wysiwyg: hruleItemWysiwyg,
            markup: hruleItemMarkup,
        },
        [List.heading]: {
            common: heading1ItemCommon,
        },
    },
    orders: {
        [Toolbar.wysiwygMain]: [
            [Action.undo, Action.redo],
            [Action.bold, Action.italic],
            {
                [List.heading]: [
                    Action.paragraph,
                    Action.heading1,
                    Action.heading2,
                    Action.heading3,
                    Action.heading4,
                    Action.heading5,
                    Action.heading6,
                ],
            },
        ],
        [Toolbar.wysiwygHidden]: [],
        [Toolbar.wysiwygSelection]: [],
        [Toolbar.wysiwygSlash]: [Action.undo, Action.redo],
        [Toolbar.markupMain]: [
            [Action.undo, Action.redo],
            [Action.bold, Action.italic],
            [Action.heading1],
            [Action.bulletList],
            [Action.link],
            [Action.quote],
            [Action.code_inline, [Action.code_block]],
        ],
    },
};

export const defaultPreset: ToolbarsPreset = {
    nodes: {
        ...zero.nodes,
        [Action.bold]: {
            common: boldItemCommon,
            wysiwyg: boldItemWysiwyg,
            markup: boldItemMarkup,
        },
        [Action.italic]: {
            common: italicItemCommon,
            wysiwyg: italicItemWysiwyg,
            markup: italicItemMarkup,
        },
        [Action.heading1]: {
            common: heading1ItemCommon,
            wysiwyg: heading1ItemWysiwyg,
            markup: heading1ItemMarkup,
        },
        [Action.heading2]: {
            common: heading2ItemCommon,
            wysiwyg: heading2ItemWysiwyg,
            markup: heading2ItemMarkup,
        },
        [Action.heading3]: {
            common: heading3ItemCommon,
            wysiwyg: heading3ItemWysiwyg,
            markup: heading3ItemMarkup,
        },
        [Action.heading4]: {
            common: heading4ItemCommon,
            wysiwyg: heading4ItemWysiwyg,
            markup: heading4ItemMarkup,
        },
        [Action.heading5]: {
            common: heading5ItemCommon,
            wysiwyg: heading5ItemWysiwyg,
            markup: heading5ItemMarkup,
        },
        [Action.heading6]: {
            common: heading6ItemCommon,
            wysiwyg: heading6ItemWysiwyg,
            markup: heading6ItemMarkup,
        },
        [Action.bulletList]: {
            common: bulletListItemCommon,
            wysiwyg: bulletListItemWysiwyg,
            markup: bulletListItemMarkup,
        },
        [Action.orderedList]: {
            common: orderedListItemCommon,
            wysiwyg: orderedListItemWysiwyg,
            markup: orderedListItemMarkup,
        },
        [Action.sinkListItem]: {
            common: sinkListItemCommon,
            wysiwyg: sinkListItemWysiwyg,
            markup: sinkListItemMarkup,
        },
        [Action.liftListItem]: {
            common: liftListItemCommon,
            wysiwyg: liftListItemWysiwyg,
            markup: liftListItemMarkup,
        },
        [Action.link]: {
            common: linkItemCommon,
            wysiwyg: linkItemWysiwyg,
            markup: linkItemMarkup,
        },
        [Action.quote]: {
            common: quoteItemCommon,
            wysiwyg: quoteItemWysiwyg,
            markup: quoteItemMarkup,
        },
        [Action.code_inline]: {
            common: codeItemCommon,
            wysiwyg: codeItemWysiwyg,
            markup: codeItemMarkup,
        },
        [Action.code_block]: {
            common: codeBlockItemCommon,
            wysiwyg: codeBlockItemWysiwyg,
            markup: codeBlockItemMarkup,
        },
        [Action.horizontalrule]: {
            common: hruleItemCommon,
            wysiwyg: hruleItemWysiwyg,
            markup: hruleItemMarkup,
        },
        [List.heading]: {
            common: heading1ItemCommon,
        },
    },
    orders: {
        [Toolbar.wysiwygMain]: [
            [Action.undo, Action.redo],
            [Action.bold, Action.italic],
            {
                [List.heading]: [
                    Action.paragraph,
                    Action.heading1,
                    Action.heading2,
                    Action.heading3,
                    Action.heading4,
                    Action.heading5,
                    Action.heading6,
                ],
            },
        ],
        [Toolbar.wysiwygHidden]: [],
        [Toolbar.wysiwygSelection]: [],
        [Toolbar.wysiwygSlash]: [Action.undo, Action.redo],
        [Toolbar.markupMain]: [
            [Action.undo, Action.redo],
            [Action.bold, Action.italic],
            [Action.heading1],
            [Action.bulletList],
            [Action.link],
            [Action.quote],
            [Action.code_inline, [Action.code_block]],
        ],
    },
};

export const yfm: ToolbarsPreset = {
    nodes: {
        ...zero.nodes,
        [Action.bold]: {
            common: boldItemCommon,
            wysiwyg: boldItemWysiwyg,
            markup: boldItemMarkup,
        },
        [Action.italic]: {
            common: italicItemCommon,
            wysiwyg: italicItemWysiwyg,
            markup: italicItemMarkup,
        },
        [Action.heading1]: {
            common: heading1ItemCommon,
            wysiwyg: heading1ItemWysiwyg,
            markup: heading1ItemMarkup,
        },
        [Action.heading2]: {
            common: heading2ItemCommon,
            wysiwyg: heading2ItemWysiwyg,
            markup: heading2ItemMarkup,
        },
        [Action.heading3]: {
            common: heading3ItemCommon,
            wysiwyg: heading3ItemWysiwyg,
            markup: heading3ItemMarkup,
        },
        [Action.heading4]: {
            common: heading4ItemCommon,
            wysiwyg: heading4ItemWysiwyg,
            markup: heading4ItemMarkup,
        },
        [Action.heading5]: {
            common: heading5ItemCommon,
            wysiwyg: heading5ItemWysiwyg,
            markup: heading5ItemMarkup,
        },
        [Action.heading6]: {
            common: heading6ItemCommon,
            wysiwyg: heading6ItemWysiwyg,
            markup: heading6ItemMarkup,
        },
        [Action.bulletList]: {
            common: bulletListItemCommon,
            wysiwyg: bulletListItemWysiwyg,
            markup: bulletListItemMarkup,
        },
        [Action.orderedList]: {
            common: orderedListItemCommon,
            wysiwyg: orderedListItemWysiwyg,
            markup: orderedListItemMarkup,
        },
        [Action.sinkListItem]: {
            common: sinkListItemCommon,
            wysiwyg: sinkListItemWysiwyg,
            markup: sinkListItemMarkup,
        },
        [Action.liftListItem]: {
            common: liftListItemCommon,
            wysiwyg: liftListItemWysiwyg,
            markup: liftListItemMarkup,
        },
        [Action.link]: {
            common: linkItemCommon,
            wysiwyg: linkItemWysiwyg,
            markup: linkItemMarkup,
        },
        [Action.quote]: {
            common: quoteItemCommon,
            wysiwyg: quoteItemWysiwyg,
            markup: quoteItemMarkup,
        },
        [Action.code_inline]: {
            common: codeItemCommon,
            wysiwyg: codeItemWysiwyg,
            markup: codeItemMarkup,
        },
        [Action.code_block]: {
            common: codeBlockItemCommon,
            wysiwyg: codeBlockItemWysiwyg,
            markup: codeBlockItemMarkup,
        },
        [Action.horizontalrule]: {
            common: hruleItemCommon,
            wysiwyg: hruleItemWysiwyg,
            markup: hruleItemMarkup,
        },
        [List.heading]: {
            common: heading1ItemCommon,
        },
    },
    orders: {
        [Toolbar.wysiwygMain]: [
            [Action.undo, Action.redo],
            [Action.bold, Action.italic],
            {
                [List.heading]: [
                    Action.paragraph,
                    Action.heading1,
                    Action.heading2,
                    Action.heading3,
                    Action.heading4,
                    Action.heading5,
                    Action.heading6,
                ],
            },
        ],
        [Toolbar.wysiwygHidden]: [],
        [Toolbar.wysiwygSelection]: [],
        [Toolbar.wysiwygSlash]: [Action.undo, Action.redo],
        [Toolbar.markupMain]: [
            [Action.undo, Action.redo],
            [Action.bold, Action.italic],
            [Action.heading1],
            [Action.bulletList],
            [Action.link],
            [Action.quote],
            [Action.code_inline, [Action.code_block]],
        ],
    },
};

export const full: ToolbarsPreset = {
    nodes: {
        ...zero.nodes,
        [Action.bold]: {
            common: boldItemCommon,
            wysiwyg: boldItemWysiwyg,
            markup: boldItemMarkup,
        },
        [Action.italic]: {
            common: italicItemCommon,
            wysiwyg: italicItemWysiwyg,
            markup: italicItemMarkup,
        },
        [Action.heading1]: {
            common: heading1ItemCommon,
            wysiwyg: heading1ItemWysiwyg,
            markup: heading1ItemMarkup,
        },
        [Action.heading2]: {
            common: heading2ItemCommon,
            wysiwyg: heading2ItemWysiwyg,
            markup: heading2ItemMarkup,
        },
        [Action.heading3]: {
            common: heading3ItemCommon,
            wysiwyg: heading3ItemWysiwyg,
            markup: heading3ItemMarkup,
        },
        [Action.heading4]: {
            common: heading4ItemCommon,
            wysiwyg: heading4ItemWysiwyg,
            markup: heading4ItemMarkup,
        },
        [Action.heading5]: {
            common: heading5ItemCommon,
            wysiwyg: heading5ItemWysiwyg,
            markup: heading5ItemMarkup,
        },
        [Action.heading6]: {
            common: heading6ItemCommon,
            wysiwyg: heading6ItemWysiwyg,
            markup: heading6ItemMarkup,
        },
        [Action.bulletList]: {
            common: bulletListItemCommon,
            wysiwyg: bulletListItemWysiwyg,
            markup: bulletListItemMarkup,
        },
        [Action.orderedList]: {
            common: orderedListItemCommon,
            wysiwyg: orderedListItemWysiwyg,
            markup: orderedListItemMarkup,
        },
        [Action.sinkListItem]: {
            common: sinkListItemCommon,
            wysiwyg: sinkListItemWysiwyg,
            markup: sinkListItemMarkup,
        },
        [Action.liftListItem]: {
            common: liftListItemCommon,
            wysiwyg: liftListItemWysiwyg,
            markup: liftListItemMarkup,
        },
        [Action.link]: {
            common: linkItemCommon,
            wysiwyg: linkItemWysiwyg,
            markup: linkItemMarkup,
        },
        [Action.quote]: {
            common: quoteItemCommon,
            wysiwyg: quoteItemWysiwyg,
            markup: quoteItemMarkup,
        },
        [Action.code_inline]: {
            common: codeItemCommon,
            wysiwyg: codeItemWysiwyg,
            markup: codeItemMarkup,
        },
        [Action.code_block]: {
            common: codeBlockItemCommon,
            wysiwyg: codeBlockItemWysiwyg,
            markup: codeBlockItemMarkup,
        },
        [Action.horizontalrule]: {
            common: hruleItemCommon,
            wysiwyg: hruleItemWysiwyg,
            markup: hruleItemMarkup,
        },
        [List.heading]: {
            common: heading1ItemCommon,
        },
    },
    orders: {
        [Toolbar.wysiwygMain]: [
            [Action.undo, Action.redo],
            [Action.bold, Action.italic],
            {
                [List.heading]: [
                    Action.paragraph,
                    Action.heading1,
                    Action.heading2,
                    Action.heading3,
                    Action.heading4,
                    Action.heading5,
                    Action.heading6,
                ],
            },
        ],
        [Toolbar.wysiwygHidden]: [],
        [Toolbar.wysiwygSelection]: [],
        [Toolbar.wysiwygSlash]: [Action.undo, Action.redo],
        [Toolbar.markupMain]: [
            [Action.undo, Action.redo],
            [Action.bold, Action.italic],
            [Action.heading1],
            [Action.bulletList],
            [Action.link],
            [Action.quote],
            [Action.code_inline, [Action.code_block]],
        ],
    },
};
