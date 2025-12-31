import {ActionName as Action} from '../../bundle/config/action-names';

import {ListName as List, ToolbarName as Toolbar} from './constants';
import {
    boldItemMarkup,
    boldItemView,
    boldItemWysiwyg,
    bulletListItemMarkup,
    bulletListItemView,
    bulletListItemWysiwyg,
    checkboxItemMarkup,
    checkboxItemView,
    checkboxItemWysiwyg,
    codeBlockItemMarkup,
    codeBlockItemView,
    codeBlockItemWysiwyg,
    codeBlocksListItemView,
    codeItemMarkup,
    codeItemView,
    codeItemWysiwyg,
    colorifyItemMarkup,
    colorifyItemView,
    colorifyItemWysiwyg,
    cutItemMarkup,
    cutItemView,
    cutItemWysiwyg,
    emojiItemMarkup,
    emojiItemView,
    emojiItemWysiwyg,
    fileItemMarkup,
    fileItemView,
    fileItemWysiwyg,
    filePopupItemView,
    heading1ItemMarkup,
    heading1ItemView,
    heading1ItemWysiwyg,
    heading2ItemMarkup,
    heading2ItemView,
    heading2ItemWysiwyg,
    heading3ItemMarkup,
    heading3ItemView,
    heading3ItemWysiwyg,
    heading4ItemMarkup,
    heading4ItemView,
    heading4ItemWysiwyg,
    heading5ItemMarkup,
    heading5ItemView,
    heading5ItemWysiwyg,
    heading6ItemMarkup,
    heading6ItemView,
    heading6ItemWysiwyg,
    headingListItemView,
    hruleItemMarkup,
    hruleItemView,
    hruleItemWysiwyg,
    imageItemMarkup,
    imageItemView,
    imageItemWysiwyg,
    imagePopupItemView,
    italicItemMarkup,
    italicItemView,
    italicItemWysiwyg,
    liftListItemMarkup,
    liftListItemView,
    liftListItemWysiwyg,
    linkItemMarkup,
    linkItemView,
    linkItemWysiwyg,
    listsListItemView,
    markedItemMarkup,
    markedItemView,
    markedItemWysiwyg,
    monospaceItemMarkup,
    monospaceItemView,
    monospaceItemWysiwyg,
    noteItemMarkup,
    noteItemView,
    noteItemWysiwyg,
    orderedListItemMarkup,
    orderedListItemView,
    orderedListItemWysiwyg,
    paragraphItemMarkup,
    paragraphItemView,
    paragraphItemWisywig,
    quoteItemMarkup,
    quoteItemView,
    quoteItemWysiwyg,
    redoItemMarkup,
    redoItemView,
    redoItemWysiwyg,
    sinkListItemMarkup,
    sinkListItemView,
    sinkListItemWysiwyg,
    strikethroughItemMarkup,
    strikethroughItemView,
    strikethroughItemWysiwyg,
    tableItemMarkup,
    tableItemView,
    tableItemWysiwyg,
    tabsItemMarkup,
    tabsItemView,
    tabsItemWysiwyg,
    underlineItemMarkup,
    underlineItemView,
    underlineItemWysiwyg,
    undoItemMarkup,
    undoItemView,
    undoItemWysiwyg,
} from './items';
import type {ToolbarsPreset} from './types';

// presets
export const zero: ToolbarsPreset = {
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
    },
    orders: {
        [Toolbar.wysiwygMain]: [[Action.undo, Action.redo]],
        [Toolbar.markupMain]: [[Action.undo, Action.redo]],
    },
};

export const commonmark: ToolbarsPreset = {
    items: {
        ...zero.items,
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
        [List.heading]: {
            view: headingListItemView,
        },
        [Action.paragraph]: {
            view: paragraphItemView,
            wysiwyg: paragraphItemWisywig,
            markup: paragraphItemMarkup,
        },
        [Action.heading1]: {
            view: heading1ItemView,
            wysiwyg: heading1ItemWysiwyg,
            markup: heading1ItemMarkup,
        },
        [Action.heading2]: {
            view: heading2ItemView,
            wysiwyg: heading2ItemWysiwyg,
            markup: heading2ItemMarkup,
        },
        [Action.heading3]: {
            view: heading3ItemView,
            wysiwyg: heading3ItemWysiwyg,
            markup: heading3ItemMarkup,
        },
        [Action.heading4]: {
            view: heading4ItemView,
            wysiwyg: heading4ItemWysiwyg,
            markup: heading4ItemMarkup,
        },
        [Action.heading5]: {
            view: heading5ItemView,
            wysiwyg: heading5ItemWysiwyg,
            markup: heading5ItemMarkup,
        },
        [Action.heading6]: {
            view: heading6ItemView,
            wysiwyg: heading6ItemWysiwyg,
            markup: heading6ItemMarkup,
        },
        [List.lists]: {
            view: listsListItemView,
        },
        [Action.bulletList]: {
            view: bulletListItemView,
            wysiwyg: bulletListItemWysiwyg,
            markup: bulletListItemMarkup,
        },
        [Action.orderedList]: {
            view: orderedListItemView,
            wysiwyg: orderedListItemWysiwyg,
            markup: orderedListItemMarkup,
        },
        [Action.sinkListItem]: {
            view: sinkListItemView,
            wysiwyg: sinkListItemWysiwyg,
            markup: sinkListItemMarkup,
        },
        [Action.liftListItem]: {
            view: liftListItemView,
            wysiwyg: liftListItemWysiwyg,
            markup: liftListItemMarkup,
        },
        [Action.link]: {
            view: linkItemView,
            wysiwyg: linkItemWysiwyg,
            markup: linkItemMarkup,
        },
        [Action.quote]: {
            view: quoteItemView,
            wysiwyg: quoteItemWysiwyg,
            markup: quoteItemMarkup,
        },
        [List.code]: {
            view: codeBlocksListItemView,
        },
        [Action.codeInline]: {
            view: codeItemView,
            wysiwyg: codeItemWysiwyg,
            markup: codeItemMarkup,
        },
        [Action.codeBlock]: {
            view: codeBlockItemView,
            wysiwyg: codeBlockItemWysiwyg,
            markup: codeBlockItemMarkup,
        },
        [Action.horizontalRule]: {
            view: hruleItemView,
            wysiwyg: hruleItemWysiwyg,
            markup: hruleItemMarkup,
        },
    },
    orders: {
        [Toolbar.wysiwygMain]: [
            [Action.undo, Action.redo],
            [Action.bold, Action.italic],
            [
                {
                    id: List.heading,
                    items: [
                        Action.paragraph,
                        Action.heading1,
                        Action.heading2,
                        Action.heading3,
                        Action.heading4,
                        Action.heading5,
                        Action.heading6,
                    ],
                },
                {
                    id: List.lists,
                    items: [
                        Action.bulletList,
                        Action.orderedList,
                        Action.sinkListItem,
                        Action.liftListItem,
                    ],
                },
                Action.link,
                Action.quote,
                {
                    id: List.code,
                    items: [Action.codeInline, Action.codeBlock],
                },
            ],
        ],
        [Toolbar.markupMain]: [
            [Action.undo, Action.redo],
            [Action.bold, Action.italic],
            [
                {
                    id: List.heading,
                    items: [
                        Action.paragraph,
                        Action.heading1,
                        Action.heading2,
                        Action.heading3,
                        Action.heading4,
                        Action.heading5,
                        Action.heading6,
                    ],
                },
                {
                    id: List.lists,
                    items: [
                        Action.bulletList,
                        Action.orderedList,
                        Action.sinkListItem,
                        Action.liftListItem,
                    ],
                },
                Action.link,
                Action.quote,
                {
                    id: List.code,
                    items: [Action.codeInline, Action.codeBlock],
                },
            ],
        ],
        [Toolbar.wysiwygHidden]: [[Action.horizontalRule]],
        [Toolbar.markupHidden]: [[Action.horizontalRule]],
    },
};

export const defaultPreset: ToolbarsPreset = {
    items: {
        ...commonmark.items,
        [Action.strike]: {
            view: strikethroughItemView,
            wysiwyg: strikethroughItemWysiwyg,
            markup: strikethroughItemMarkup,
        },
    },
    orders: {
        [Toolbar.wysiwygMain]: [
            [Action.undo, Action.redo],
            [Action.bold, Action.italic, Action.strike],
            [
                {
                    id: List.heading,
                    items: [
                        Action.paragraph,
                        Action.heading1,
                        Action.heading2,
                        Action.heading3,
                        Action.heading4,
                        Action.heading5,
                        Action.heading6,
                    ],
                },
                {
                    id: List.lists,
                    items: [
                        Action.bulletList,
                        Action.orderedList,
                        Action.sinkListItem,
                        Action.liftListItem,
                    ],
                },
                Action.link,
                Action.quote,
                {
                    id: List.code,
                    items: [Action.codeInline, Action.codeBlock],
                },
            ],
        ],
        [Toolbar.markupMain]: [
            [Action.undo, Action.redo],
            [Action.bold, Action.italic, Action.strike],
            [
                {
                    id: List.heading,
                    items: [
                        Action.paragraph,
                        Action.heading1,
                        Action.heading2,
                        Action.heading3,
                        Action.heading4,
                        Action.heading5,
                        Action.heading6,
                    ],
                },
                {
                    id: List.lists,
                    items: [
                        Action.bulletList,
                        Action.orderedList,
                        Action.sinkListItem,
                        Action.liftListItem,
                    ],
                },
                Action.link,
                Action.quote,
                {
                    id: List.code,
                    items: [Action.codeInline, Action.codeBlock],
                },
            ],
        ],
        [Toolbar.wysiwygHidden]: [[Action.horizontalRule]],
        [Toolbar.markupHidden]: [[Action.horizontalRule]],
    },
};

export const yfm: ToolbarsPreset = {
    items: {
        ...defaultPreset.items,
        [Action.underline]: {
            view: underlineItemView,
            wysiwyg: underlineItemWysiwyg,
            markup: underlineItemMarkup,
        },
        [Action.mono]: {
            view: monospaceItemView,
            wysiwyg: monospaceItemWysiwyg,
            markup: monospaceItemMarkup,
        },
        [Action.note]: {
            view: noteItemView,
            wysiwyg: noteItemWysiwyg,
            markup: noteItemMarkup,
        },
        [Action.cut]: {
            view: cutItemView,
            wysiwyg: cutItemWysiwyg,
            markup: cutItemMarkup,
        },
        [Action.image]: {
            view: imageItemView,
            wysiwyg: imageItemWysiwyg,
        },
        [Action.imagePopup]: {
            view: imagePopupItemView,
            markup: imageItemMarkup,
        },
        [Action.file]: {
            view: fileItemView,
            wysiwyg: fileItemWysiwyg,
        },
        [Action.filePopup]: {
            view: filePopupItemView,
            markup: fileItemMarkup,
        },
        [Action.table]: {
            view: tableItemView,
            wysiwyg: tableItemWysiwyg,
            markup: tableItemMarkup,
        },
        [Action.checkbox]: {
            view: checkboxItemView,
            wysiwyg: checkboxItemWysiwyg,
            markup: checkboxItemMarkup,
        },
        [Action.tabs]: {
            view: tabsItemView,
            wysiwyg: tabsItemWysiwyg,
            markup: tabsItemMarkup,
        },
    },
    orders: {
        [Toolbar.wysiwygMain]: [
            [Action.undo, Action.redo],
            [Action.bold, Action.italic, Action.underline, Action.strike, Action.mono],
            [
                {
                    id: List.heading,
                    items: [
                        Action.paragraph,
                        Action.heading1,
                        Action.heading2,
                        Action.heading3,
                        Action.heading4,
                        Action.heading5,
                        Action.heading6,
                    ],
                },
                {
                    id: List.lists,
                    items: [
                        Action.bulletList,
                        Action.orderedList,
                        Action.sinkListItem,
                        Action.liftListItem,
                    ],
                },
                Action.link,
                Action.note,
                Action.cut,
                Action.quote,
                {
                    id: List.code,
                    items: [Action.codeInline, Action.codeBlock],
                },
            ],
            [Action.image, Action.file, Action.table, Action.checkbox],
        ],
        [Toolbar.markupMain]: [
            [Action.undo, Action.redo],
            [Action.bold, Action.italic, Action.underline, Action.strike, Action.mono],
            [
                {
                    id: List.heading,
                    items: [
                        Action.paragraph,
                        Action.heading1,
                        Action.heading2,
                        Action.heading3,
                        Action.heading4,
                        Action.heading5,
                        Action.heading6,
                    ],
                },
                {
                    id: List.lists,
                    items: [
                        Action.bulletList,
                        Action.orderedList,
                        Action.sinkListItem,
                        Action.liftListItem,
                    ],
                },
                Action.link,
                Action.note,
                Action.cut,
                Action.quote,
                {
                    id: List.code,
                    items: [Action.codeInline, Action.codeBlock],
                },
            ],
            [Action.imagePopup, Action.filePopup, Action.table, Action.checkbox],
        ],
        [Toolbar.wysiwygHidden]: [[Action.horizontalRule, Action.tabs]],
        [Toolbar.markupHidden]: [[Action.horizontalRule, Action.tabs]],
    },
};

export const full: ToolbarsPreset = {
    items: {
        ...yfm.items,
        [Action.mark]: {
            view: markedItemView,
            wysiwyg: markedItemWysiwyg,
            markup: markedItemMarkup,
        },
        [Action.colorify]: {
            view: colorifyItemView,
            wysiwyg: colorifyItemWysiwyg,
            markup: colorifyItemMarkup,
        },
        [Action.emoji]: {
            view: emojiItemView,
            wysiwyg: emojiItemWysiwyg,
            markup: emojiItemMarkup,
        },
    },
    orders: {
        [Toolbar.wysiwygMain]: [
            [Action.undo, Action.redo],
            [Action.bold, Action.italic, Action.underline, Action.strike, Action.mono, Action.mark],
            [
                {
                    id: List.heading,
                    items: [
                        Action.paragraph,
                        Action.heading1,
                        Action.heading2,
                        Action.heading3,
                        Action.heading4,
                        Action.heading5,
                        Action.heading6,
                    ],
                },
                {
                    id: List.lists,
                    items: [
                        Action.bulletList,
                        Action.orderedList,
                        Action.sinkListItem,
                        Action.liftListItem,
                    ],
                },
                Action.colorify,
                Action.link,
                Action.note,
                Action.cut,
                Action.quote,
                {
                    id: List.code,
                    items: [Action.codeInline, Action.codeBlock],
                },
            ],
            [Action.image, Action.file, Action.table, Action.checkbox],
        ],
        [Toolbar.markupMain]: [
            [Action.undo, Action.redo],
            [Action.bold, Action.italic, Action.underline, Action.strike, Action.mono, Action.mark],
            [
                {
                    id: List.heading,
                    items: [
                        Action.paragraph,
                        Action.heading1,
                        Action.heading2,
                        Action.heading3,
                        Action.heading4,
                        Action.heading5,
                        Action.heading6,
                    ],
                },
                {
                    id: List.lists,
                    items: [
                        Action.bulletList,
                        Action.orderedList,
                        Action.sinkListItem,
                        Action.liftListItem,
                    ],
                },
                Action.colorify,
                Action.link,
                Action.note,
                Action.cut,
                Action.quote,
                {
                    id: List.code,
                    items: [Action.codeInline, Action.codeBlock],
                },
            ],
            [Action.imagePopup, Action.filePopup, Action.table, Action.checkbox],
        ],
        [Toolbar.wysiwygHidden]: [[Action.horizontalRule, Action.emoji, Action.tabs]],
        [Toolbar.markupHidden]: [[Action.horizontalRule, Action.emoji, Action.tabs]],
    },
};
