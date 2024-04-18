import React from 'react';

import {i18n} from '../../i18n/menubar';
import {
    isBoldActive,
    isH1Active,
    isH2Active,
    isH3Active,
    isH4Active,
    isH5Active,
    isH6Active,
    isItalicActive,
} from '../../markup/active';
import {
    insertLink,
    insertTable,
    liftListItem,
    sinkListItem,
    toBulletList,
    toCheckbox,
    toCodeBlock,
    toH1,
    toH2,
    toH3,
    toH4,
    toH5,
    toH6,
    toHr,
    toInlineCode,
    toMermaid,
    toOrderedList,
    toQuote,
    toTabs,
    wrapToBold,
    wrapToCut,
    wrapToItalic,
    wrapToMark,
    wrapToMathBlock,
    wrapToMathInline,
    wrapToMonospace,
    wrapToNote,
    wrapToStrike,
    wrapToUnderline,
} from '../../markup/commands';
import {CodeEditor} from '../../markup/editor';
import {Action as A, formatter as f} from '../../shortcuts';
import {ToolbarData} from '../../toolbar/Toolbar';
import {ToolbarGroupData} from '../../toolbar/ToolbarGroup';
import {ToolbarListButtonData} from '../../toolbar/ToolbarListButton';
import {
    ToolbarButtonPopupData,
    ToolbarDataType,
    ToolbarListItemData,
    ToolbarReactComponentData,
    ToolbarSingleItemData,
} from '../../toolbar/types';
import {ToolbarLinkPopup} from '../toolbar/custom/ToolbarLinkPopup';
import {MToolbarColors} from '../toolbar/markup/MToolbarColors';
import {MToolbarFilePopup} from '../toolbar/markup/MToolbarFilePopup';
import {MToolbarImagePopup} from '../toolbar/markup/MToolbarImagePopup';

import {ActionName} from './action-names';
import {icons} from './icons';

const noop = () => {};
const isActiveFn = () => false;
const isEnableFn = () => true;

export type MToolbarData = ToolbarData<CodeEditor>;
export type MToolbarSingleItemData = ToolbarSingleItemData<CodeEditor>;
export type MToolbarGroupData = ToolbarGroupData<CodeEditor>;
export type MToolbarReactComponentData = ToolbarReactComponentData<CodeEditor>;
export type MToolbarListButtonData = ToolbarListButtonData<CodeEditor>;
export type MToolbarListItemData = ToolbarListItemData<CodeEditor>;

export const mHistoryGroupConfig: MToolbarGroupData = [
    {
        id: ActionName.undo,
        type: ToolbarDataType.SingleButton,
        title: i18n.bind(null, 'undo'),
        icon: icons.undo,
        hotkey: f.toView(A.Undo),
        exec: (e) => e.cm.undo(),
        isActive: isActiveFn,
        isEnable: (e) => e.cm.historySize().undo > 0,
    },
    {
        id: ActionName.redo,
        type: ToolbarDataType.SingleButton,
        title: i18n.bind(null, 'redo'),
        icon: icons.redo,
        hotkey: f.toView(A.Redo),
        exec: (e) => e.cm.redo(),
        isActive: isActiveFn,
        isEnable: (e) => e.cm.historySize().redo > 0,
    },
];

/** Bold, Italic, Underline, Strike buttons group */

export const mBoldGroupItem: MToolbarSingleItemData = {
    id: ActionName.bold,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'bold'),
    icon: icons.bold,
    hotkey: f.toView(A.Bold),
    exec: (e) => wrapToBold(e.cm),
    isActive: (e) => isBoldActive(e.cm),
    isEnable: isEnableFn,
};

export const mItalicGroupItem: MToolbarSingleItemData = {
    id: ActionName.italic,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'italic'),
    icon: icons.italic,
    hotkey: f.toView(A.Italic),
    exec: (e) => wrapToItalic(e.cm),
    isActive: (e) => isItalicActive(e.cm),
    isEnable: isEnableFn,
};

export const mBiusGroupConfig: MToolbarGroupData = [
    mBoldGroupItem,
    mItalicGroupItem,
    {
        id: ActionName.underline,
        type: ToolbarDataType.SingleButton,
        title: i18n.bind(null, 'underline'),
        icon: icons.underline,
        hotkey: f.toView(A.Underline),
        exec: (e) => wrapToUnderline(e.cm),
        isActive: isActiveFn,
        isEnable: isEnableFn,
    },
    {
        id: ActionName.strike,
        type: ToolbarDataType.SingleButton,
        title: i18n.bind(null, 'strike'),
        icon: icons.strikethrough,
        hotkey: f.toView(A.Strike),
        exec: (e) => wrapToStrike(e.cm),
        isActive: isActiveFn,
        isEnable: isEnableFn,
    },
    {
        id: ActionName.mono,
        type: ToolbarDataType.SingleButton,
        title: i18n.bind(null, 'mono'),
        icon: icons.mono,
        exec: (e) => wrapToMonospace(e.cm),
        isActive: isActiveFn,
        isEnable: isEnableFn,
    },
    {
        id: ActionName.mark,
        type: ToolbarDataType.SingleButton,
        title: i18n.bind(null, 'mark'),
        icon: icons.mark,
        exec: (e) => wrapToMark(e.cm),
        isActive: isActiveFn,
        isEnable: isEnableFn,
    },
];

export const mHeadingListConfig: MToolbarListButtonData = {
    icon: icons.headline,
    withArrow: true,
    title: i18n.bind(null, 'heading'),
    data: [
        {
            id: ActionName.heading1,
            title: i18n.bind(null, 'heading1'),
            icon: icons.h1,
            hotkey: f.toView(A.Heading1),
            exec: (e) => toH1(e.cm),
            isActive: (e) => isH1Active(e.cm),
            isEnable: isEnableFn,
        },
        {
            id: ActionName.heading2,
            title: i18n.bind(null, 'heading2'),
            icon: icons.h2,
            hotkey: f.toView(A.Heading2),
            exec: (e) => toH2(e.cm),
            isActive: (e) => isH2Active(e.cm),
            isEnable: isEnableFn,
        },
        {
            id: ActionName.heading3,
            title: i18n.bind(null, 'heading3'),
            icon: icons.h3,
            hotkey: f.toView(A.Heading3),
            exec: (e) => toH3(e.cm),
            isActive: (e) => isH3Active(e.cm),
            isEnable: isEnableFn,
        },
        {
            id: ActionName.heading4,
            title: i18n.bind(null, 'heading4'),
            icon: icons.h4,
            hotkey: f.toView(A.Heading4),
            exec: (e) => toH4(e.cm),
            isActive: (e) => isH4Active(e.cm),
            isEnable: isEnableFn,
        },
        {
            id: ActionName.heading5,
            title: i18n.bind(null, 'heading5'),
            icon: icons.h5,
            hotkey: f.toView(A.Heading5),
            exec: (e) => toH5(e.cm),
            isActive: (e) => isH5Active(e.cm),
            isEnable: isEnableFn,
        },
        {
            id: ActionName.heading6,
            title: i18n.bind(null, 'heading6'),
            icon: icons.h6,
            hotkey: f.toView(A.Heading6),
            exec: (e) => toH6(e.cm),
            isActive: (e) => isH6Active(e.cm),
            isEnable: isEnableFn,
        },
    ],
};

export const mListsListConfig: MToolbarListButtonData = {
    icon: icons.bulletList,
    withArrow: true,
    title: i18n.bind(null, 'list'),
    data: [
        {
            id: ActionName.bulletList,
            title: i18n.bind(null, 'ulist'),
            icon: icons.bulletList,
            exec: (e) => toBulletList(e.cm),
            isActive: isActiveFn,
            isEnable: isEnableFn,
        },
        {
            id: ActionName.orderedList,
            title: i18n.bind(null, 'olist'),
            icon: icons.orderedList,
            exec: (e) => toOrderedList(e.cm),
            isActive: isActiveFn,
            isEnable: isEnableFn,
        },
    ],
};

export const mCheckboxButton: MToolbarSingleItemData = {
    id: ActionName.checkbox,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'checkbox'),
    icon: icons.checklist,
    exec: (e) => toCheckbox(e.cm),
    isActive: isActiveFn,
    isEnable: isEnableFn,
};

export const mListMoveListConfig: MToolbarListButtonData = {
    icon: icons.lift,
    withArrow: true,
    title: 'Move list item',
    data: [
        {
            id: ActionName.sinkListItem,
            title: i18n.bind(null, 'list__action_sink'),
            icon: icons.sink,
            exec: (e) => sinkListItem(e.cm),
            isActive: isActiveFn,
            isEnable: isEnableFn,
        },
        {
            id: ActionName.liftListItem,
            title: i18n.bind(null, 'list__action_lift'),
            icon: icons.lift,
            exec: (e) => liftListItem(e.cm),
            isActive: isActiveFn,
            isEnable: isEnableFn,
        },
    ],
};

export const mLinkButton: ToolbarButtonPopupData<CodeEditor> = {
    id: ActionName.link,
    type: ToolbarDataType.ButtonPopup,
    icon: icons.link,
    title: i18n('link'),
    exec: noop,
    isActive: isActiveFn,
    isEnable: isEnableFn,
    renderPopup: (props) => {
        const {editor} = props;
        const selection = editor.cm.getSelection();

        return (
            <ToolbarLinkPopup
                {...props}
                formInitialText={selection}
                formReadOnlyText={Boolean(selection)}
                onSubmit={(url, text) => {
                    insertLink({url, text})(editor.cm);
                }}
            />
        );
    },
};

export const mNoteButton: MToolbarSingleItemData = {
    id: ActionName.yfm_note,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'note'),
    icon: icons.note,
    hotkey: f.toView(A.Note),
    exec: (e) => wrapToNote(e.cm),
    isActive: isActiveFn,
    isEnable: isEnableFn,
};

export const mQuoteButton: MToolbarSingleItemData = {
    id: ActionName.quote,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'quote'),
    icon: icons.quote,
    exec: (e) => toQuote(e.cm),
    isActive: isActiveFn,
    isEnable: isEnableFn,
};

export const mCutButton: MToolbarSingleItemData = {
    id: ActionName.yfm_cut,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'cut'),
    icon: icons.cut,
    hotkey: f.toView(A.Cut),
    exec: (e) => wrapToCut(e.cm),
    isActive: isActiveFn,
    isEnable: isEnableFn,
};

export const mTableButton: MToolbarSingleItemData = {
    id: ActionName.table,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'table'),
    icon: icons.table,
    exec: (e) => insertTable(e.cm),
    isActive: isActiveFn,
    isEnable: isEnableFn,
};

export const mCodeListConfig: MToolbarListButtonData = {
    icon: icons.code,
    withArrow: true,
    title: i18n.bind(null, 'code'),
    data: [
        {
            id: ActionName.code_inline,
            title: i18n.bind(null, 'code_inline'),
            icon: icons.code,
            hotkey: f.toView(A.Code),
            exec: (e) => toInlineCode(e.cm),
            isActive: isActiveFn,
            isEnable: isEnableFn,
        },
        {
            id: ActionName.code_block,
            title: i18n.bind(null, 'codeblock'),
            icon: icons.codeBlock,
            hotkey: f.toView(A.CodeBlock),
            exec: (e) => toCodeBlock(e.cm),
            isActive: isActiveFn,
            isEnable: isEnableFn,
        },
    ],
};

export const mMathListConfig: MToolbarListButtonData = {
    icon: icons.functionInline,
    withArrow: true,
    title: i18n.bind(null, 'math'),
    data: [
        {
            id: ActionName.math_inline,
            title: i18n.bind(null, 'math_inline'),
            icon: icons.functionInline,
            exec: (e) => wrapToMathInline(e.cm),
            isActive: isActiveFn,
            isEnable: isEnableFn,
        },
        {
            id: ActionName.math_block,
            title: i18n.bind(null, 'math_block'),
            icon: icons.functionBlock,
            exec: (e) => wrapToMathBlock(e.cm),
            isActive: isActiveFn,
            isEnable: isEnableFn,
        },
    ],
};

export const mMathListItem: MToolbarListItemData = {
    id: 'math',
    type: ToolbarDataType.ListButton,
    ...mMathListConfig,
};

export const mMermaidButton: MToolbarSingleItemData = {
    id: ActionName.mermaid,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'mermaid'),
    icon: icons.mermaid,
    exec: (e) => toMermaid(e.cm),
    isActive: isActiveFn,
    isEnable: isEnableFn,
};

/** prepared markup toolbar config */
export const mToolbarConfig: MToolbarData = [
    mHistoryGroupConfig,
    mBiusGroupConfig,
    [
        {
            id: 'heading',
            type: ToolbarDataType.ListButton,
            ...mHeadingListConfig,
        },
        {
            id: 'list',
            type: ToolbarDataType.ListButton,
            ...mListsListConfig,
        },
        {
            id: 'colorify',
            type: ToolbarDataType.ReactComponent,
            component: MToolbarColors,
            width: 42,
        },
        mLinkButton,
        mNoteButton,
        mCutButton,
        mQuoteButton,
        {
            id: 'code',
            type: ToolbarDataType.ListButton,
            ...mCodeListConfig,
        },
    ],
    [
        {
            id: 'image',
            type: ToolbarDataType.ButtonPopup,
            icon: icons.image,
            title: i18n('image'),
            exec: noop,
            isActive: isActiveFn,
            isEnable: isEnableFn,
            renderPopup: (props) => <MToolbarImagePopup {...props} />,
        },
        {
            id: 'file',
            type: ToolbarDataType.ButtonPopup,
            icon: icons.file,
            title: i18n('file'),
            exec: noop,
            isActive: isActiveFn,
            isEnable: isEnableFn,
            renderPopup: (props) => <MToolbarFilePopup {...props} />,
        },
        mTableButton,
        mCheckboxButton,
    ],
];

export const mHruleItemData: MToolbarSingleItemData = {
    id: 'hrule',
    title: i18n.bind(null, 'hrule'),
    icon: icons.horizontalRule,
    type: ToolbarDataType.SingleButton,
    exec: (e) => toHr(e.cm),
    isActive: (e) => isBoldActive(e.cm),
    isEnable: isEnableFn,
};

export const mTabsItemData: MToolbarSingleItemData = {
    id: 'tabs',
    title: i18n.bind(null, 'tabs'),
    icon: icons.tabs,
    type: ToolbarDataType.SingleButton,
    exec: (e) => toTabs(e.cm),
    isActive: (e) => isBoldActive(e.cm),
    isEnable: isEnableFn,
};

export const mHiddenData = [mHruleItemData, mTabsItemData];
