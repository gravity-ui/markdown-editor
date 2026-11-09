import {ActionName as Action} from 'src/bundle/config/action-names';
import type {MarkdownEditorPreset} from 'src/bundle/preset-base-types';

import {ListName as List, ToolbarName as Toolbar} from '../constants';
import type {ToolbarsPreset} from '../types';
import {
    boldItemView,
    bulletListItemView,
    checkboxItemView,
    codeBlockItemView,
    codeBlocksListItemView,
    codeItemView,
    colorifyItemView,
    cutItemView,
    emojiItemView,
    fileItemView,
    filePopupItemView,
    heading1ItemView,
    heading2ItemView,
    heading3ItemView,
    heading4ItemView,
    heading5ItemView,
    heading6ItemView,
    headingListItemView,
    hruleItemView,
    imageItemView,
    imagePopupItemView,
    italicItemView,
    liftListItemView,
    linkItemView,
    listsListItemView,
    markedItemView,
    monospaceItemView,
    noteItemView,
    orderedListItemView,
    paragraphItemView,
    quoteItemView,
    redoItemView,
    sinkListItemView,
    strikethroughItemView,
    tableItemView,
    tabsItemView,
    textContextItemView,
    toggleHeadingFoldingItemView,
    underlineItemView,
    undoItemView,
} from '../view/items';

import {
    boldItemMarkup,
    bulletListItemMarkup,
    checkboxItemMarkup,
    codeBlockItemMarkup,
    codeItemMarkup,
    colorifyItemMarkup,
    cutItemMarkup,
    emojiItemMarkup,
    fileItemMarkup,
    heading1ItemMarkup,
    heading2ItemMarkup,
    heading3ItemMarkup,
    heading4ItemMarkup,
    heading5ItemMarkup,
    heading6ItemMarkup,
    hruleItemMarkup,
    imageItemMarkup,
    italicItemMarkup,
    liftListItemMarkup,
    linkItemMarkup,
    markedItemMarkup,
    monospaceItemMarkup,
    noteItemMarkup,
    orderedListItemMarkup,
    paragraphItemMarkup,
    quoteItemMarkup,
    redoItemMarkup,
    sinkListItemMarkup,
    strikethroughItemMarkup,
    tableItemMarkup,
    tabsItemMarkup,
    underlineItemMarkup,
    undoItemMarkup,
} from './items';

// presets
const zero: ToolbarsPreset = {
    items: {
        [Action.undo]: {
            view: undoItemView,
            markup: undoItemMarkup,
        },
        [Action.redo]: {
            view: redoItemView,
            markup: redoItemMarkup,
        },
    },
    orders: {
        [Toolbar.markupMain]: [[Action.undo, Action.redo]],
    },
};

const commonmark: ToolbarsPreset = {
    items: {
        ...zero.items,
        [Action.text]: {
            view: textContextItemView,
        },
        [Action.bold]: {
            view: boldItemView,
            markup: boldItemMarkup,
        },
        [Action.italic]: {
            view: italicItemView,
            markup: italicItemMarkup,
        },
        [List.heading]: {
            view: headingListItemView,
        },
        [Action.paragraph]: {
            view: paragraphItemView,
            markup: paragraphItemMarkup,
        },
        [Action.heading1]: {
            view: heading1ItemView,
            markup: heading1ItemMarkup,
        },
        [Action.heading2]: {
            view: heading2ItemView,
            markup: heading2ItemMarkup,
        },
        [Action.heading3]: {
            view: heading3ItemView,
            markup: heading3ItemMarkup,
        },
        [Action.heading4]: {
            view: heading4ItemView,
            markup: heading4ItemMarkup,
        },
        [Action.heading5]: {
            view: heading5ItemView,
            markup: heading5ItemMarkup,
        },
        [Action.heading6]: {
            view: heading6ItemView,
            markup: heading6ItemMarkup,
        },
        [List.lists]: {
            view: listsListItemView,
        },
        [Action.bulletList]: {
            view: bulletListItemView,
            markup: bulletListItemMarkup,
        },
        [Action.orderedList]: {
            view: orderedListItemView,
            markup: orderedListItemMarkup,
        },
        [Action.sinkListItem]: {
            view: sinkListItemView,
            markup: sinkListItemMarkup,
        },
        [Action.liftListItem]: {
            view: liftListItemView,
            markup: liftListItemMarkup,
        },
        [Action.link]: {
            view: linkItemView,
            markup: linkItemMarkup,
        },
        [Action.quote]: {
            view: quoteItemView,
            markup: quoteItemMarkup,
        },
        [List.code]: {
            view: codeBlocksListItemView,
        },
        [Action.codeInline]: {
            view: codeItemView,
            markup: codeItemMarkup,
        },
        [Action.codeBlock]: {
            view: codeBlockItemView,
            markup: codeBlockItemMarkup,
        },
        [Action.horizontalRule]: {
            view: hruleItemView,
            markup: hruleItemMarkup,
        },
    },
    orders: {
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
        [Toolbar.markupHidden]: [[Action.horizontalRule]],
    },
};

const defaultPreset: ToolbarsPreset = {
    items: {
        ...commonmark.items,
        [Action.strike]: {
            view: strikethroughItemView,
            markup: strikethroughItemMarkup,
        },
    },
    orders: {
        ...commonmark.orders,
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
        [Toolbar.markupHidden]: [[Action.horizontalRule]],
    },
};

const yfm: ToolbarsPreset = {
    items: {
        ...defaultPreset.items,
        [Action.underline]: {
            view: underlineItemView,
            markup: underlineItemMarkup,
        },
        [Action.mono]: {
            view: monospaceItemView,
            markup: monospaceItemMarkup,
        },
        [Action.note]: {
            view: noteItemView,
            markup: noteItemMarkup,
        },
        [Action.cut]: {
            view: cutItemView,
            markup: cutItemMarkup,
        },
        [Action.image]: {
            view: imageItemView,
        },
        [Action.imagePopup]: {
            view: imagePopupItemView,
            markup: imageItemMarkup,
        },
        [Action.file]: {
            view: fileItemView,
        },
        [Action.filePopup]: {
            view: filePopupItemView,
            markup: fileItemMarkup,
        },
        [Action.table]: {
            view: tableItemView,
            markup: tableItemMarkup,
        },
        [Action.checkbox]: {
            view: checkboxItemView,
            markup: checkboxItemMarkup,
        },
        [Action.tabs]: {
            view: tabsItemView,
            markup: tabsItemMarkup,
        },
    },
    orders: {
        ...defaultPreset.orders,
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
        [Toolbar.markupHidden]: [[Action.horizontalRule, Action.tabs]],
    },
};

const full: ToolbarsPreset = {
    items: {
        ...yfm.items,
        [Action.foldingHeading]: {
            view: toggleHeadingFoldingItemView,
        },
        [Action.mark]: {
            view: markedItemView,
            markup: markedItemMarkup,
        },
        [Action.colorify]: {
            view: colorifyItemView,
            markup: colorifyItemMarkup,
        },
        [Action.emoji]: {
            view: emojiItemView,
            markup: emojiItemMarkup,
        },
    },
    orders: {
        ...yfm.orders,
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
        [Toolbar.markupHidden]: [[Action.horizontalRule, Action.emoji, Action.tabs]],
    },
};

export const markupToolbarsPresets: Record<MarkdownEditorPreset, ToolbarsPreset> = {
    zero,
    commonmark,
    default: defaultPreset,
    yfm,
    full,
};
