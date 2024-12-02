import {ActionName as Action} from '../../bundle/config/action-names';

import {
    boldItem,
    bulletListItem,
    // checkboxItem,
    codeBlockItem,
    codeItem,
    // cutItem,
    // emojiItem,
    // fileItem,
    // gptItem,
    heading1Item,
    heading2Item,
    heading3Item,
    heading4Item,
    heading5Item,
    heading6Item,
    hruleItem,
    // imageItem,
    italicItem,
    liftListItem,
    linkItem,
    // markedItem,
    markupBoldAction,
    markupBulletListAction,
    markupCodeAction,
    markupCodeBlockAction,
    markupHeading1Action,
    markupHeading2Action,
    markupHeading3Action,
    markupHeading4Action,
    markupHeading5Action,
    markupHeading6Action,
    markupHruleAction,
    markupItalicAction,
    markupLiftListAction,
    markupLinkAction,
    markupOrderedListAction,
    markupQuoteAction,
    markupRedoAction,
    markupSinkListAction,
    markupUndoAction,
    // mathBlockItem,
    // mathInlineItem,
    // mathListItem,
    // mermaidItem,
    // monospaceItem,
    // noteItem,
    orderedListItem,
    quoteItem,
    redoItem,
    sinkListItem,
    // strikethroughItem,
    // tableItem,
    // tabsItem,
    // textItem,
    // toggleHeadingFoldingItem,
    // underlineItem,
    undoItem,
    wysiwygBoldAction,
    wysiwygBulletListAction,
    wysiwygCodeAction,
    wysiwygCodeBlockAction,
    wysiwygHeading1Action,
    wysiwygHeading2Action,
    wysiwygHeading3Action,
    wysiwygHeading4Action,
    wysiwygHeading5Action,
    wysiwygHeading6Action,
    wysiwygHruleAction,
    wysiwygItalicAction,
    wysiwygLiftListAction,
    wysiwygLinkAction,
    wysiwygOrderedListAction,
    wysiwygQuoteAction,
    wysiwygRedoAction,
    wysiwygSinkListAction,
    wysiwygUndoAction,
    // yfmHtmlBlockItem,
} from './items';
import {ToolbarsPreset} from './types';

// presets
export const zero: ToolbarsPreset = {
    toolbarsNodes: {
        [Action.undo]: {
            view: undoItem,
            wysiwygAction: wysiwygUndoAction,
            markupAction: markupUndoAction,
        },
        [Action.redo]: {
            view: redoItem,
            wysiwygAction: wysiwygRedoAction,
            markupAction: markupRedoAction,
        },
    },
    toolbarsOrders: {
        wysiwygMain: [['undo', 'redo']],
        wysiwygHidden: [],
        wysiwygSelection: [],
        wysiwygSlash: ['undo', 'redo'],
        markupMain: [['undo', 'redo']],
        markupHidden: [],
    },
};
export const commonmark = {
    toolbarsNodes: {
        ...zero.toolbarsNodes,
        [Action.bold]: {
            view: boldItem,
            wysiwygAction: wysiwygBoldAction,
            markupAction: markupBoldAction,
        },
        [Action.italic]: {
            view: italicItem,
            wysiwygAction: wysiwygItalicAction,
            markupAction: markupItalicAction,
        },
        [Action.heading1]: {
            view: heading1Item,
            wysiwygAction: wysiwygHeading1Action,
            markupAction: markupHeading1Action,
        },
        [Action.heading2]: {
            view: heading2Item,
            wysiwygAction: wysiwygHeading2Action,
            markupAction: markupHeading2Action,
        },
        [Action.heading3]: {
            view: heading3Item,
            wysiwygAction: wysiwygHeading3Action,
            markupAction: markupHeading3Action,
        },
        [Action.heading4]: {
            view: heading4Item,
            wysiwygAction: wysiwygHeading4Action,
            markupAction: markupHeading4Action,
        },
        [Action.heading5]: {
            view: heading5Item,
            wysiwygAction: wysiwygHeading5Action,
            markupAction: markupHeading5Action,
        },
        [Action.heading6]: {
            view: heading6Item,
            wysiwygAction: wysiwygHeading6Action,
            markupAction: markupHeading6Action,
        },
        [Action.bulletList]: {
            view: bulletListItem,
            wysiwygAction: wysiwygBulletListAction,
            markupAction: markupBulletListAction,
        },
        [Action.orderedList]: {
            view: orderedListItem,
            wysiwygAction: wysiwygOrderedListAction,
            markupAction: markupOrderedListAction,
        },
        [Action.sinkListItem]: {
            view: sinkListItem,
            wysiwygAction: wysiwygSinkListAction,
            markupAction: markupSinkListAction,
        },
        [Action.liftListItem]: {
            view: liftListItem,
            wysiwygAction: wysiwygLiftListAction,
            markupAction: markupLiftListAction,
        },
        [Action.link]: {
            view: linkItem,
            wysiwygAction: wysiwygLinkAction,
            markupAction: markupLinkAction,
        },
        [Action.quote]: {
            view: quoteItem,
            wysiwygAction: wysiwygQuoteAction,
            markupAction: markupQuoteAction,
        },
        [Action.code_inline]: {
            view: codeItem,
            wysiwygAction: wysiwygCodeAction,
            markupAction: markupCodeAction,
        },
        [Action.code_block]: {
            view: codeBlockItem,
            wysiwygAction: wysiwygCodeBlockAction,
            markupAction: markupCodeBlockAction,
        },
        [Action.horizontalrule]: {
            view: hruleItem,
            wysiwygAction: wysiwygHruleAction,
            markupAction: markupHruleAction,
        },
    },
    toolbarsOrders: {
        wysiwygMain: [
            ['undo', 'redo'],
            ['bold', 'italic'],
            ['heading1'],
            ['bulletList'],
            ['link'],
            ['quote'],
            ['code_inline', ['code_block']],
        ],
        wysiwygHidden: [],
        wysiwygSelection: [],
        wysiwygSlash: ['undo', 'redo'],
        markupMain: [
            ['undo', 'redo'],
            ['bold', 'italic'],
            ['heading1'],
            ['bulletList'],
            ['link'],
            ['quote'],
            ['code_inline', ['code_block']],
        ],
        markupHidden: [],
    },
};

// TODO @makhnatkin
// export const defaultPreset = {
//     toolbarItems: {
//         ...commonmark.toolbarItems,
//         ...createToolbarDictonary([strikethroughItem]),
//     },
//     visible: [
//         ...zero.visible,
//         [Action.bold, Action.italic, Action.strike],
//         [
//             Action.heading1,
//             Action.heading2,
//             Action.heading3,
//             Action.heading4,
//             Action.heading5,
//             Action.heading6,
//         ],
//         [Action.bulletList, Action.orderedList, Action.sinkListItem, Action.liftListItem],
//         Action.link,
//         Action.quote,
//         [Action.code_inline, Action.code_block],
//     ],
//     hidden: [Action.horizontalrule],
// };
// export const full = {
//     toolbarItems: {
//         ...defaultPreset.toolbarItems,
//         ...createToolbarDictonary([
//             checkboxItem,
//             cutItem,
//             emojiItem,
//             fileItem,
//             gptItem,
//             imageItem,
//             markedItem,
//             mathBlockItem,
//             mathInlineItem,
//             // mathListItem,
//             mermaidItem,
//             monospaceItem,
//             noteItem,
//             tableItem,
//             tabsItem,
//             textItem,
//             toggleHeadingFoldingItem,
//             underlineItem,
//             yfmHtmlBlockItem,
//         ]),
//     },
//     visible: [
//         ...zero.visible,
//         [Action.bold, Action.italic, Action.strike],
//         [
//             Action.heading1,
//             Action.heading2,
//             Action.heading3,
//             Action.heading4,
//             Action.heading5,
//             Action.heading6,
//         ],
//         [Action.bulletList, Action.orderedList, Action.sinkListItem, Action.liftListItem],
//         Action.link,
//         Action.quote,
//         [Action.code_inline, Action.code_block],
//     ],
//     hidden: [
//         Action.checkbox,
//         Action.yfm_cut,
//         Action.emoji,
//         Action.file,
//         Action.gpt,
//         Action.image,
//         Action.mermaid,
//         Action.math_inline,
//         Action.math_block,
//         // TODO
//     ],
// };

const defaultPresets = {
    zero,
    commonmark,
    default: zero,
    yfm: zero,
    full: zero,
};

export const getToolbarConfigByPreset = (
    preset: 'zero' | 'commonmark' | 'default' | 'yfm' | 'full' | ToolbarsPreset,
) => {
    if (
        typeof preset === 'string' &&
        ['zero', 'commonmark', 'default', 'yfm', 'full'].includes(preset)
    ) {
        return defaultPresets[preset];
    } else if (
        (preset as ToolbarsPreset).toolbarsOrders &&
        (preset as ToolbarsPreset).toolbarsNodes
    ) {
        return preset;
    }

    return defaultPresets.default;
};
