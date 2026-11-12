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
    statusItemView,
    strikethroughItemView,
    tableItemView,
    tabsItemView,
    textContextItemView,
    toggleHeadingFoldingItemView,
    underlineItemView,
    undoItemView,
} from '../view/items';

import {
    boldItemWysiwyg,
    bulletListItemWysiwyg,
    checkboxItemWysiwyg,
    codeBlockItemWysiwyg,
    codeItemWysiwyg,
    colorifyItemWysiwyg,
    cutItemWysiwyg,
    emojiItemWysiwyg,
    fileItemWysiwyg,
    heading1ItemWysiwyg,
    heading2ItemWysiwyg,
    heading3ItemWysiwyg,
    heading4ItemWysiwyg,
    heading5ItemWysiwyg,
    heading6ItemWysiwyg,
    hruleItemWysiwyg,
    imageItemWysiwyg,
    italicItemWysiwyg,
    liftListItemWysiwyg,
    linkItemWysiwyg,
    markedItemWysiwyg,
    monospaceItemWysiwyg,
    noteItemWysiwyg,
    orderedListItemWysiwyg,
    paragraphItemWisywig,
    quoteItemWysiwyg,
    redoItemWysiwyg,
    sinkListItemWysiwyg,
    statusItemWysiwyg,
    strikethroughItemWysiwyg,
    tableItemWysiwyg,
    tabsItemWysiwyg,
    textContextItemWisywig,
    toggleHeadingFoldingItemWysiwyg,
    underlineItemWysiwyg,
    undoItemWysiwyg,
} from './items';

// presets
const zero: ToolbarsPreset = {
    items: {
        [Action.undo]: {
            view: undoItemView,
            wysiwyg: undoItemWysiwyg,
        },
        [Action.redo]: {
            view: redoItemView,
            wysiwyg: redoItemWysiwyg,
        },
    },
    orders: {
        [Toolbar.wysiwygMain]: [[Action.undo, Action.redo]],
        [Toolbar.wysiwygSelection]: [],
        [Toolbar.wysiwygSlash]: [],
    },
};

const commonmark: ToolbarsPreset = {
    items: {
        ...zero.items,
        [Action.text]: {
            view: textContextItemView,
            wysiwyg: textContextItemWisywig,
        },
        [Action.bold]: {
            view: boldItemView,
            wysiwyg: boldItemWysiwyg,
        },
        [Action.italic]: {
            view: italicItemView,
            wysiwyg: italicItemWysiwyg,
        },
        [List.heading]: {
            view: headingListItemView,
        },
        [Action.paragraph]: {
            view: paragraphItemView,
            wysiwyg: paragraphItemWisywig,
        },
        [Action.heading1]: {
            view: heading1ItemView,
            wysiwyg: heading1ItemWysiwyg,
        },
        [Action.heading2]: {
            view: heading2ItemView,
            wysiwyg: heading2ItemWysiwyg,
        },
        [Action.heading3]: {
            view: heading3ItemView,
            wysiwyg: heading3ItemWysiwyg,
        },
        [Action.heading4]: {
            view: heading4ItemView,
            wysiwyg: heading4ItemWysiwyg,
        },
        [Action.heading5]: {
            view: heading5ItemView,
            wysiwyg: heading5ItemWysiwyg,
        },
        [Action.heading6]: {
            view: heading6ItemView,
            wysiwyg: heading6ItemWysiwyg,
        },
        [List.lists]: {
            view: listsListItemView,
        },
        [Action.bulletList]: {
            view: bulletListItemView,
            wysiwyg: bulletListItemWysiwyg,
        },
        [Action.orderedList]: {
            view: orderedListItemView,
            wysiwyg: orderedListItemWysiwyg,
        },
        [Action.sinkListItem]: {
            view: sinkListItemView,
            wysiwyg: sinkListItemWysiwyg,
        },
        [Action.liftListItem]: {
            view: liftListItemView,
            wysiwyg: liftListItemWysiwyg,
        },
        [Action.link]: {
            view: linkItemView,
            wysiwyg: linkItemWysiwyg,
        },
        [Action.quote]: {
            view: quoteItemView,
            wysiwyg: quoteItemWysiwyg,
        },
        [List.code]: {
            view: codeBlocksListItemView,
        },
        [Action.codeInline]: {
            view: codeItemView,
            wysiwyg: codeItemWysiwyg,
        },
        [Action.codeBlock]: {
            view: codeBlockItemView,
            wysiwyg: codeBlockItemWysiwyg,
        },
        [Action.horizontalRule]: {
            view: hruleItemView,
            wysiwyg: hruleItemWysiwyg,
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
        [Toolbar.wysiwygHidden]: [[Action.horizontalRule]],
        [Toolbar.wysiwygSelection]: [
            [Action.text],
            [Action.bold, Action.italic, Action.codeInline],
            [Action.link],
        ],
        [Toolbar.wysiwygSlash]: [
            [
                Action.paragraph,
                Action.heading1,
                Action.heading2,
                Action.heading3,
                Action.heading4,
                Action.heading5,
                Action.heading6,
                Action.bulletList,
                Action.orderedList,
                Action.sinkListItem,
                Action.liftListItem,
                Action.link,
                Action.quote,
                Action.codeBlock,
                Action.horizontalRule,
            ],
        ],
    },
};

const defaultPreset: ToolbarsPreset = {
    items: {
        ...commonmark.items,
        [Action.strike]: {
            view: strikethroughItemView,
            wysiwyg: strikethroughItemWysiwyg,
        },
    },
    orders: {
        ...commonmark.orders,
        [Toolbar.wysiwygSelection]: [
            [Action.text],
            [Action.bold, Action.italic, Action.strike, Action.codeInline],
            [Action.link],
        ],
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
        [Toolbar.wysiwygHidden]: [[Action.horizontalRule]],
    },
};

const yfm: ToolbarsPreset = {
    items: {
        ...defaultPreset.items,
        [Action.underline]: {
            view: underlineItemView,
            wysiwyg: underlineItemWysiwyg,
        },
        [Action.mono]: {
            view: monospaceItemView,
            wysiwyg: monospaceItemWysiwyg,
        },
        [Action.note]: {
            view: noteItemView,
            wysiwyg: noteItemWysiwyg,
        },
        [Action.cut]: {
            view: cutItemView,
            wysiwyg: cutItemWysiwyg,
        },
        [Action.image]: {
            view: imageItemView,
            wysiwyg: imageItemWysiwyg,
        },
        [Action.imagePopup]: {
            view: imagePopupItemView,
        },
        [Action.file]: {
            view: fileItemView,
            wysiwyg: fileItemWysiwyg,
        },
        [Action.filePopup]: {
            view: filePopupItemView,
        },
        [Action.table]: {
            view: tableItemView,
            wysiwyg: tableItemWysiwyg,
        },
        [Action.checkbox]: {
            view: checkboxItemView,
            wysiwyg: checkboxItemWysiwyg,
        },
        [Action.tabs]: {
            view: tabsItemView,
            wysiwyg: tabsItemWysiwyg,
        },
    },
    orders: {
        ...defaultPreset.orders,
        [Toolbar.wysiwygSelection]: [
            [Action.text],
            [Action.bold, Action.italic, Action.strike, Action.mono, Action.codeInline],
            [Action.link],
        ],
        [Toolbar.wysiwygSlash]: [
            [
                Action.paragraph,
                Action.heading1,
                Action.heading2,
                Action.heading3,
                Action.heading4,
                Action.heading5,
                Action.heading6,
                Action.bulletList,
                Action.orderedList,
                Action.sinkListItem,
                Action.liftListItem,
                Action.link,
                Action.quote,
                Action.note,
                Action.cut,
                Action.codeBlock,
                Action.checkbox,
                Action.table,
                Action.image,
                Action.horizontalRule,
                Action.file,
                Action.tabs,
            ],
        ],
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
        [Toolbar.wysiwygHidden]: [[Action.horizontalRule, Action.tabs]],
    },
};

const full: ToolbarsPreset = {
    items: {
        ...yfm.items,
        [Action.foldingHeading]: {
            view: toggleHeadingFoldingItemView,
            wysiwyg: toggleHeadingFoldingItemWysiwyg,
        },
        [Action.mark]: {
            view: markedItemView,
            wysiwyg: markedItemWysiwyg,
        },
        [Action.colorify]: {
            view: colorifyItemView,
            wysiwyg: colorifyItemWysiwyg,
        },
        [Action.emoji]: {
            view: emojiItemView,
            wysiwyg: emojiItemWysiwyg,
        },
        [Action.status]: {
            view: statusItemView,
            wysiwyg: statusItemWysiwyg,
        },
    },
    orders: {
        ...yfm.orders,
        [Toolbar.wysiwygSelection]: [
            [Action.foldingHeading, Action.text],
            [
                Action.bold,
                Action.italic,
                Action.underline,
                Action.strike,
                Action.mono,
                Action.mark,
                Action.codeInline,
            ],
            [Action.colorify, Action.link],
        ],
        [Toolbar.wysiwygSlash]: [
            [
                Action.paragraph,
                Action.heading1,
                Action.heading2,
                Action.heading3,
                Action.heading4,
                Action.heading5,
                Action.heading6,
                Action.bulletList,
                Action.orderedList,
                Action.sinkListItem,
                Action.liftListItem,
                Action.link,
                Action.quote,
                Action.note,
                Action.cut,
                Action.codeBlock,
                Action.checkbox,
                Action.table,
                Action.image,
                Action.horizontalRule,
                Action.emoji,
                Action.file,
                Action.tabs,
                Action.status,
            ],
        ],
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
            [Action.image, Action.file, Action.table, Action.checkbox, Action.status],
        ],
        [Toolbar.wysiwygHidden]: [[Action.horizontalRule, Action.emoji, Action.tabs]],
    },
};

export const wysiwygToolbarsPresets: Record<MarkdownEditorPreset, ToolbarsPreset> = {
    zero,
    commonmark,
    default: defaultPreset,
    yfm,
    full,
};
