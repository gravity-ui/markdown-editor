import {ActionStorage} from 'src/core';

import {headingType, pType} from '../../extensions';
import type {
    SelectionContextConfig,
    SelectionContextItemData,
} from '../../extensions/behavior/SelectionContext';
// for typings from Math
import {gptHotKeys} from '../../extensions/yfm/GPT/constants';
import type {} from '../../extensions/yfm/Math';
import {i18n as i18nHint} from '../../i18n/hints';
import {i18n} from '../../i18n/menubar';
import {Action as A, formatter as f} from '../../shortcuts';
import {ToolbarData} from '../../toolbar/Toolbar';
import {ToolbarGroupData} from '../../toolbar/ToolbarGroup';
import {ToolbarListButtonData} from '../../toolbar/ToolbarListButton';
import {
    ToolbarDataType,
    ToolbarGroupItemData,
    ToolbarItemData,
    ToolbarListButtonItemData,
    ToolbarListItemData,
    ToolbarSingleItemData,
} from '../../toolbar/types';
import type {EditorPreset} from '../Editor';
import {WToolbarColors} from '../toolbar/wysiwyg/WToolbarColors';
import {WToolbarTextSelect} from '../toolbar/wysiwyg/WToolbarTextSelect';

import {ActionName} from './action-names';
import {icons} from './icons';

export type WToolbarData = ToolbarData<ActionStorage>;
export type WToolbarItemData = ToolbarItemData<ActionStorage>;
export type WToolbarSingleItemData = ToolbarSingleItemData<ActionStorage>;
export type WToolbarGroupData = ToolbarGroupData<ActionStorage>;
export type WToolbarGroupItemData = ToolbarGroupItemData<ActionStorage>;
export type WToolbarListButtonData = ToolbarListButtonData<ActionStorage>;
export type WToolbarListItemData = ToolbarListItemData<ActionStorage>;
export type WToolbarListButtonItemData = ToolbarListButtonItemData<ActionStorage>;

export const wHistoryGroupConfig: WToolbarGroupData = [
    {
        id: ActionName.undo,
        type: ToolbarDataType.SingleButton,
        title: i18n.bind(null, 'undo'),
        icon: icons.undo,
        hotkey: f.toView(A.Undo),
        hintWhenDisabled: false,
        exec: (e) => e.actions.undo.run(),
        isActive: (e) => e.actions.undo.isActive(),
        isEnable: (e) => e.actions.undo.isEnable(),
    },
    {
        id: ActionName.redo,
        type: ToolbarDataType.SingleButton,
        title: i18n.bind(null, 'redo'),
        icon: icons.redo,
        hotkey: f.toView(A.Redo),
        hintWhenDisabled: false,
        exec: (e) => e.actions.redo.run(),
        isActive: (e) => e.actions.redo.isActive(),
        isEnable: (e) => e.actions.redo.isEnable(),
    },
];

/** Bold, Italic, Underline, Strike buttons group */

export const wBoldItemData: WToolbarSingleItemData = {
    id: ActionName.bold,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'bold'),
    icon: icons.bold,
    hotkey: f.toView(A.Bold),
    exec: (e) => e.actions.bold.run(),
    isActive: (e) => e.actions.bold.isActive(),
    isEnable: (e) => e.actions.bold.isEnable(),
};

export const wItalicItemData: WToolbarSingleItemData = {
    id: ActionName.italic,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'italic'),
    icon: icons.italic,
    hotkey: f.toView(A.Italic),
    exec: (e) => e.actions.italic.run(),
    isActive: (e) => e.actions.italic.isActive(),
    isEnable: (e) => e.actions.italic.isEnable(),
};

export const wUnderlineItemData: WToolbarSingleItemData = {
    id: ActionName.underline,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'underline'),
    icon: icons.underline,
    hotkey: f.toView(A.Underline),
    exec: (e) => e.actions.underline.run(),
    isActive: (e) => e.actions.underline.isActive(),
    isEnable: (e) => e.actions.underline.isEnable(),
};

export const wStrikethroughItemData: WToolbarSingleItemData = {
    id: ActionName.strike,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'strike'),
    icon: icons.strikethrough,
    hotkey: f.toView(A.Strike),
    exec: (e) => e.actions.strike.run(),
    isActive: (e) => e.actions.strike.isActive(),
    isEnable: (e) => e.actions.strike.isEnable(),
};

export const wMonospaceItemData: WToolbarSingleItemData = {
    id: ActionName.mono,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'mono'),
    icon: icons.mono,
    exec: (e) => e.actions.mono.run(),
    isActive: (e) => e.actions.mono.isActive(),
    isEnable: (e) => e.actions.mono.isEnable(),
};

export const wMarkedItemData: WToolbarSingleItemData = {
    id: ActionName.mark,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'mark'),
    icon: icons.mark,
    exec: (e) => e.actions.mark.run(),
    isActive: (e) => e.actions.mark.isActive(),
    isEnable: (e) => e.actions.mark.isEnable(),
};

export const wBiusGroupConfig: WToolbarGroupData = [
    wBoldItemData,
    wItalicItemData,
    wUnderlineItemData,
    wStrikethroughItemData,
    wMonospaceItemData,
    wMarkedItemData,
];

export const wTextItemData: WToolbarListButtonItemData = {
    id: ActionName.paragraph,
    title: i18n.bind(null, 'text'),
    icon: icons.text,
    hotkey: f.toView(A.Text),
    exec: (e) => e.actions.toParagraph.run(),
    isActive: (e) => e.actions.toParagraph.isActive(),
    isEnable: (e) => e.actions.toParagraph.isEnable(),
    doNotActivateList: true,
};

export const wHeadingListConfig: WToolbarListButtonData = {
    icon: icons.headline,
    withArrow: true,
    title: i18n.bind(null, 'heading'),
    data: [
        wTextItemData,
        {
            id: ActionName.heading1,
            title: i18n.bind(null, 'heading1'),
            icon: icons.h1,
            hotkey: f.toView(A.Heading1),
            exec: (e) => e.actions.toH1.run(),
            isActive: (e) => e.actions.toH1.isActive(),
            isEnable: (e) => e.actions.toH1.isEnable(),
        },
        {
            id: ActionName.heading2,
            title: i18n.bind(null, 'heading2'),
            icon: icons.h2,
            hotkey: f.toView(A.Heading2),
            exec: (e) => e.actions.toH2.run(),
            isActive: (e) => e.actions.toH2.isActive(),
            isEnable: (e) => e.actions.toH2.isEnable(),
        },
        {
            id: ActionName.heading3,
            title: i18n.bind(null, 'heading3'),
            icon: icons.h3,
            hotkey: f.toView(A.Heading3),
            exec: (e) => e.actions.toH3.run(),
            isActive: (e) => e.actions.toH3.isActive(),
            isEnable: (e) => e.actions.toH3.isEnable(),
        },
        {
            id: ActionName.heading4,
            title: i18n.bind(null, 'heading4'),
            icon: icons.h4,
            hotkey: f.toView(A.Heading4),
            exec: (e) => e.actions.toH4.run(),
            isActive: (e) => e.actions.toH4.isActive(),
            isEnable: (e) => e.actions.toH4.isEnable(),
        },
        {
            id: ActionName.heading5,
            title: i18n.bind(null, 'heading5'),
            icon: icons.h5,
            hotkey: f.toView(A.Heading5),
            exec: (e) => e.actions.toH5.run(),
            isActive: (e) => e.actions.toH5.isActive(),
            isEnable: (e) => e.actions.toH5.isEnable(),
        },
        {
            id: ActionName.heading6,
            title: i18n.bind(null, 'heading6'),
            icon: icons.h6,
            hotkey: f.toView(A.Heading6),
            exec: (e) => e.actions.toH6.run(),
            isActive: (e) => e.actions.toH6.isActive(),
            isEnable: (e) => e.actions.toH6.isEnable(),
        },
    ],
};

export const wListsListConfig: WToolbarListButtonData = {
    icon: icons.bulletList,
    withArrow: true,
    title: i18n.bind(null, 'list'),
    data: [
        {
            id: ActionName.bulletList,
            title: i18n.bind(null, 'ulist'),
            icon: icons.bulletList,
            hotkey: f.toView(A.BulletList),
            exec: (e) => e.actions.toBulletList.run(),
            isActive: (e) => e.actions.toBulletList.isActive(),
            isEnable: (e) => e.actions.toBulletList.isEnable(),
        },
        {
            id: ActionName.orderedList,
            title: i18n.bind(null, 'olist'),
            icon: icons.orderedList,
            hotkey: f.toView(A.OrderedList),
            exec: (e) => e.actions.toOrderedList.run(),
            isActive: (e) => e.actions.toOrderedList.isActive(),
            isEnable: (e) => e.actions.toOrderedList.isEnable(),
        },
        {
            id: ActionName.sinkListItem,
            title: i18n.bind(null, 'list__action_sink'),
            hintWhenDisabled: () => i18n('list_action_disabled'),
            icon: icons.sink,
            hotkey: f.toView(A.SinkListItem),
            exec: (e) => e.actions.sinkListItem.run(),
            isActive: (e) => e.actions.sinkListItem.isActive(),
            isEnable: (e) => e.actions.sinkListItem.isEnable(),
        },
        {
            id: ActionName.liftListItem,
            title: i18n.bind(null, 'list__action_lift'),
            hintWhenDisabled: () => i18n('list_action_disabled'),
            icon: icons.lift,
            hotkey: f.toView(A.LiftListItem),
            exec: (e) => e.actions.liftListItem.run(),
            isActive: (e) => e.actions.liftListItem.isActive(),
            isEnable: (e) => e.actions.liftListItem.isEnable(),
        },
    ],
};

export const wCheckboxItemData: WToolbarSingleItemData = {
    id: ActionName.checkbox,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'checkbox'),
    icon: icons.checklist,
    exec: (e) => e.actions.addCheckbox.run(),
    isActive: (e) => e.actions.addCheckbox.isActive(),
    isEnable: (e) => e.actions.addCheckbox.isEnable(),
};

export const wLinkItemData: WToolbarSingleItemData = {
    id: ActionName.link,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'link'),
    icon: icons.link,
    hotkey: f.toView(A.Link),
    exec: (e) => e.actions.addLink.run(),
    isActive: (e) => e.actions.addLink.isActive(),
    isEnable: (e) => e.actions.addLink.isEnable(),
};

export const wQuoteItemData: WToolbarSingleItemData = {
    id: ActionName.quote,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'quote'),
    icon: icons.quote,
    hotkey: f.toView(A.Quote),
    exec: (e) => e.actions.quote.run(),
    isActive: (e) => e.actions.quote.isActive(),
    isEnable: (e) => e.actions.quote.isEnable(),
};

export const wCutItemData: WToolbarSingleItemData = {
    id: ActionName.yfm_cut,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'cut'),
    icon: icons.cut,
    hotkey: f.toView(A.Cut),
    exec: (e) => e.actions.toYfmCut.run(),
    isActive: (e) => e.actions.toYfmCut.isActive(),
    isEnable: (e) => e.actions.toYfmCut.isEnable(),
};

export const wListMoveListConfig: WToolbarListButtonData = {
    icon: icons.lift,
    withArrow: true,
    title: 'Move list item',
    data: [
        {
            id: ActionName.sinkListItem,
            title: 'Sink list item',
            icon: icons.sink,
            exec: (e) => e.actions.sinkListItem.run(),
            isActive: (e) => e.actions.sinkListItem.isActive(),
            isEnable: (e) => e.actions.sinkListItem.isEnable(),
        },
        {
            id: ActionName.liftListItem,
            title: 'Lift list item',
            icon: icons.lift,
            exec: (e) => e.actions.liftListItem.run(),
            isActive: (e) => e.actions.liftListItem.isActive(),
            isEnable: (e) => e.actions.liftListItem.isEnable(),
        },
    ],
};

export const wNoteItemData: WToolbarSingleItemData = {
    id: ActionName.yfm_note,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'note'),
    icon: icons.note,
    hotkey: f.toView(A.Note),
    exec: (e) => e.actions.toYfmNote.run(),
    isActive: (e) => e.actions.toYfmNote.isActive(),
    isEnable: (e) => e.actions.toYfmNote.isEnable(),
};

export const wTableItemData: WToolbarSingleItemData = {
    id: ActionName.table,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'table'),
    icon: icons.table,
    exec: (e) => e.actions.createYfmTable.run(),
    isActive: (e) => e.actions.createYfmTable.isActive(),
    isEnable: (e) => e.actions.createYfmTable.isEnable(),
};

export const wCodeItemData: WToolbarSingleItemData = {
    id: ActionName.code_inline,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'code_inline'),
    icon: icons.code,
    hotkey: f.toView(A.Code),
    exec: (e) => e.actions.code.run(),
    isActive: (e) => e.actions.code.isActive(),
    isEnable: (e) => e.actions.code.isEnable(),
};

export const wCodeBlockItemData: WToolbarItemData = {
    id: ActionName.code_block,
    title: i18n.bind(null, 'codeblock'),
    icon: icons.codeBlock,
    hotkey: f.toView(A.CodeBlock),
    exec: (e) => e.actions.toCodeBlock.run(),
    isActive: (e) => e.actions.toCodeBlock.isActive(),
    isEnable: (e) => e.actions.toCodeBlock.isEnable(),
};

export const wCodeListConfig: WToolbarListButtonData = {
    icon: icons.code,
    withArrow: true,
    title: i18n.bind(null, 'code'),
    data: [wCodeItemData, wCodeBlockItemData],
};

export const wImageItemData: WToolbarSingleItemData = {
    id: ActionName.image,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'image'),
    icon: icons.image,
    exec: (e) => e.actions.addImageWidget.run(),
    isActive: (e) => e.actions.addImageWidget.isActive(),
    isEnable: (e) => e.actions.addImageWidget.isEnable(),
};

export const wHruleItemData: WToolbarItemData = {
    id: ActionName.horizontalrule,
    title: i18n.bind(null, 'hrule'),
    icon: icons.horizontalRule,
    exec: (e) => e.actions.hRule.run(),
    isActive: (e) => e.actions.hRule.isActive(),
    isEnable: (e) => e.actions.hRule.isEnable(),
};

export const wEmojiItemData: WToolbarItemData = {
    id: ActionName.emoji,
    title: i18n.bind(null, 'emoji'),
    icon: icons.emoji,
    exec: (e) => e.actions.openEmojiSuggest.run({}),
    isActive: (e) => e.actions.openEmojiSuggest.isActive(),
    isEnable: (e) => e.actions.openEmojiSuggest.isEnable(),
};

export const wFileItemData: WToolbarSingleItemData = {
    id: ActionName.file,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'file'),
    icon: icons.file,
    exec: (e) => e.actions.addFile.run(),
    isActive: (e) => e.actions.addFile.isActive(),
    isEnable: (e) => e.actions.addFile.isEnable(),
};

export const wMathInlineItemData: WToolbarSingleItemData = {
    id: ActionName.math_inline,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'math_inline'),
    icon: icons.functionInline,
    hint: () => `${i18nHint.bind(null, 'math_hint')()} ${i18nHint.bind(null, 'math_hint_katex')()}`,
    exec: (e) => e.actions.addMathInline.run(),
    isActive: (e) => e.actions.addMathInline.isActive(),
    isEnable: (e) => e.actions.addMathInline.isEnable(),
};

export const wTabsItemData: WToolbarSingleItemData = {
    id: ActionName.tabs,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'tabs'),
    icon: icons.tabs,
    exec: (e) => e.actions.toYfmTabs.run(),
    isActive: (e) => e.actions.toYfmTabs.isActive(),
    isEnable: (e) => e.actions.toYfmTabs.isEnable(),
};

export const wMathBlockItemData: WToolbarSingleItemData = {
    id: ActionName.math_block,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'math_block'),
    icon: icons.functionBlock,
    hint: () => `${i18nHint.bind(null, 'math_hint')()} ${i18nHint.bind(null, 'math_hint_katex')()}`,
    exec: (e) => e.actions.toMathBlock.run(),
    isActive: (e) => e.actions.toMathBlock.isActive(),
    isEnable: (e) => e.actions.toMathBlock.isEnable(),
};

export const wMathListConfig: WToolbarListButtonData = {
    icon: icons.functionInline,
    withArrow: true,
    title: i18n.bind(null, 'math'),
    data: [wMathInlineItemData, wMathBlockItemData],
};

export const wMathListItem: WToolbarListItemData = {
    id: 'math',
    type: ToolbarDataType.ListButton,
    ...wMathListConfig,
};

export const wYfmHtmlBlockItemData: WToolbarSingleItemData = {
    id: ActionName.yfm_html_block,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'html'),
    icon: icons.html,
    exec: (e) => e.actions.createYfmHtmlBlock.run(),
    isActive: (e) => e.actions.createYfmHtmlBlock.isActive(),
    isEnable: (e) => e.actions.createYfmHtmlBlock.isEnable(),
};

export const wGptItemData: WToolbarSingleItemData = {
    id: ActionName.gpt,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'gpt'),
    hotkey: gptHotKeys.openGptKeyTooltip,
    icon: icons.gpt,
    exec: (e) => e.actions.addGptWidget.run({}),
    isActive: (e) => e.actions.addGptWidget.isActive(),
    isEnable: (e) => e.actions.addGptWidget.isEnable(),
};

export const wCommandMenuConfig: WToolbarItemData[] = [
    ...wHeadingListConfig.data,
    ...wListsListConfig.data,
    wLinkItemData,
    wQuoteItemData,
    wNoteItemData,
    wCutItemData,
    wCodeBlockItemData,
    wCheckboxItemData,
    wTableItemData,
    wImageItemData,
    wHruleItemData,
    wEmojiItemData,
    wFileItemData,
    // wMathInlineItemData,
    // wMathBlockItemData,
    wTabsItemData,
];

export const wHiddenData = wCommandMenuConfig;

/** prepared wysiwyg toolbar config */
export const wToolbarConfig: WToolbarData = [
    wHistoryGroupConfig,
    wBiusGroupConfig,
    [
        {
            id: 'heading',
            type: ToolbarDataType.ListButton,
            ...wHeadingListConfig,
        },
        {
            id: 'list',
            type: ToolbarDataType.ListButton,
            ...wListsListConfig,
        },
        {
            id: 'colorify',
            type: ToolbarDataType.ReactComponent,
            component: WToolbarColors,
            width: 42,
        },
        wLinkItemData,
        wNoteItemData,
        wCutItemData,
        wQuoteItemData,
        {
            id: 'code',
            type: ToolbarDataType.ListButton,
            ...wCodeListConfig,
        },
    ],
    [wImageItemData, wFileItemData, wTableItemData, wCheckboxItemData],
];

export const wToggleHeadingFoldingItemData: SelectionContextItemData = {
    id: 'folding-heading',
    type: ToolbarDataType.SingleButton,
    icon: icons.foldingHeading,
    title: () => i18n('folding-heading'),
    hint: () => i18n('folding-heading_hint'),
    isActive: (editor) => editor.actions.toggleHeadingFolding?.isActive() ?? false,
    isEnable: (editor) => editor.actions.toggleHeadingFolding?.isEnable() ?? false,
    exec: (editor) => editor.actions.toggleHeadingFolding.run(),
    condition: 'enabled',
};

const textContextItemData: SelectionContextItemData = {
    id: 'text',
    type: ToolbarDataType.ReactComponent,
    component: WToolbarTextSelect,
    width: 0,
    condition: ({selection: {$from, $to}, schema}) => {
        if (!$from.sameParent($to)) return false;
        const {parent} = $from;
        return parent.type === pType(schema) || parent.type === headingType(schema);
    },
};

export const wSelectionMenuConfig: SelectionContextConfig = [
    [wToggleHeadingFoldingItemData, textContextItemData],
    [...wBiusGroupConfig, wCodeItemData],
    [
        {
            id: 'colorify',
            type: ToolbarDataType.ReactComponent,
            component: WToolbarColors,
            width: 42,
        },
        wLinkItemData,
    ],
];

export const wMermaidItemData: WToolbarSingleItemData = {
    id: ActionName.mermaid,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'mermaid'),
    icon: icons.mermaid,
    exec: (e) => e.actions.createMermaid.run(),
    isActive: (e) => e.actions.createMermaid.isActive(),
    isEnable: (e) => e.actions.createMermaid.isEnable(),
};

export const wToolbarConfigByPreset: Record<EditorPreset, WToolbarData> = {
    zero: [wHistoryGroupConfig],
    commonmark: [
        wHistoryGroupConfig,
        [wBoldItemData, wItalicItemData],
        [
            {id: 'heading', type: ToolbarDataType.ListButton, ...wHeadingListConfig},
            {id: 'list', type: ToolbarDataType.ListButton, ...wListsListConfig},
            wLinkItemData,
            wQuoteItemData,
            {id: 'code', type: ToolbarDataType.ListButton, ...wCodeListConfig},
        ],
    ],
    default: [
        wHistoryGroupConfig,
        [wBoldItemData, wItalicItemData, wStrikethroughItemData],
        [
            {
                id: 'heading',
                type: ToolbarDataType.ListButton,
                ...wHeadingListConfig,
            },
            {
                id: 'list',
                type: ToolbarDataType.ListButton,
                ...wListsListConfig,
            },
            wLinkItemData,
            wQuoteItemData,
            {
                id: 'code',
                type: ToolbarDataType.ListButton,
                ...wCodeListConfig,
            },
        ],
    ],
    yfm: [
        wHistoryGroupConfig,
        [
            wBoldItemData,
            wItalicItemData,
            wUnderlineItemData,
            wStrikethroughItemData,
            wMonospaceItemData,
        ],
        [
            {
                id: 'heading',
                type: ToolbarDataType.ListButton,
                ...wHeadingListConfig,
            },
            {
                id: 'list',
                type: ToolbarDataType.ListButton,
                ...wListsListConfig,
            },
            wLinkItemData,
            wNoteItemData,
            wCutItemData,
            wQuoteItemData,
            {
                id: 'code',
                type: ToolbarDataType.ListButton,
                ...wCodeListConfig,
            },
        ],
        [wImageItemData, wFileItemData, wTableItemData, wCheckboxItemData],
    ],
    full: wToolbarConfig.slice(),
};

export const wCommandMenuConfigByPreset: Record<EditorPreset, WToolbarItemData[]> = {
    zero: [],
    commonmark: [
        ...wHeadingListConfig.data,
        ...wListsListConfig.data,
        wLinkItemData,
        wQuoteItemData,
        wCodeBlockItemData,
        wHruleItemData,
    ],
    default: [
        ...wHeadingListConfig.data,
        ...wListsListConfig.data,
        wLinkItemData,
        wQuoteItemData,
        wCodeBlockItemData,
        wHruleItemData,
    ],
    yfm: [
        ...wHeadingListConfig.data,
        ...wListsListConfig.data,
        wLinkItemData,
        wQuoteItemData,
        wNoteItemData,
        wCutItemData,
        wCodeBlockItemData,
        wCheckboxItemData,
        wTableItemData,
        wImageItemData,
        wHruleItemData,
        wFileItemData,
        wTabsItemData,
    ],
    full: wCommandMenuConfig.slice(),
};

export const wHiddenDataByPreset: Record<EditorPreset, WToolbarItemData[]> = {
    zero: wCommandMenuConfigByPreset.zero.slice(),
    commonmark: wCommandMenuConfigByPreset.commonmark.slice(),
    default: wCommandMenuConfigByPreset.default.slice(),
    yfm: wCommandMenuConfigByPreset.yfm.slice(),
    full: wCommandMenuConfigByPreset.full.slice(),
};

export const wSelectionMenuConfigByPreset: Record<EditorPreset, SelectionContextConfig> = {
    zero: [],
    commonmark: [
        [textContextItemData],
        [wBoldItemData, wItalicItemData, wCodeItemData],
        [wLinkItemData],
    ],
    default: [
        [textContextItemData],
        [wBoldItemData, wItalicItemData, wStrikethroughItemData, wCodeItemData],
        [wLinkItemData],
    ],
    yfm: [
        [textContextItemData],
        [wBoldItemData, wItalicItemData, wStrikethroughItemData, wMonospaceItemData, wCodeItemData],
        [wLinkItemData],
    ],
    full: wSelectionMenuConfig.slice(),
};
