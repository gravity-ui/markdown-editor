/**
 * @deprecated This file is deprecated. Use ToolbarsPreset instead.
 */

import {i18n} from '../../i18n/menubar';
import {
    insertHRule,
    insertLink,
    insertMermaidDiagram,
    insertYfmHtmlBlock,
    insertYfmTable,
    insertYfmTabs,
    liftListItem,
    redo,
    redoDepth,
    sinkListItem,
    toBulletList,
    toH1,
    toH2,
    toH3,
    toH4,
    toH5,
    toH6,
    toOrderedList,
    toggleBold,
    toggleItalic,
    toggleMarked,
    toggleMonospace,
    toggleStrikethrough,
    toggleUnderline,
    undo,
    undoDepth,
    wrapToBlockquote,
    wrapToCheckbox,
    wrapToCodeBlock,
    wrapToInlineCode,
    wrapToMathBlock,
    wrapToMathInline,
    wrapToYfmCut,
    wrapToYfmNote,
} from '../../markup/commands';
import type {CodeEditor} from '../../markup/editor';
import {Action as A, formatter as f} from '../../shortcuts';
import {MToolbarColors} from '../toolbar/markup/MToolbarColors';
import {MToolbarFilePopup} from '../toolbar/markup/MToolbarFilePopup';
import {MToolbarImagePopup} from '../toolbar/markup/MToolbarImagePopup';
import type {
    MToolbarButtonPopupData,
    MToolbarData,
    MToolbarGroupData,
    MToolbarItemData,
    MToolbarListButtonData,
    MToolbarListItemData,
    MToolbarSingleItemData,
    ToolbarListButtonItemData,
} from '../toolbar/types';
import {ToolbarDataType} from '../toolbar/types';
import type {MarkdownEditorPreset} from '../types';

import {ActionName} from './action-names';
import {icons} from './icons';
import {HeadingPreview} from './previews/HeadingPreview';

export type {
    MToolbarData,
    MToolbarItemData,
    MToolbarSingleItemData,
    MToolbarGroupData,
    MToolbarReactComponentData,
    MToolbarListButtonData,
    MToolbarListItemData,
    MToolbarButtonPopupData,
} from '../toolbar/types';

const noop = () => {};
const inactive = () => false;
const enable = () => true;
const disable = () => false;

export const mUndoItemData: MToolbarSingleItemData = {
    id: ActionName.undo,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'undo'),
    icon: icons.undo,
    hotkey: f.toView(A.Undo),
    exec: (e) => undo(e.cm),
    isActive: inactive,
    isEnable: (e) => undoDepth(e.cm.state) > 0,
};

export const mRedoItemData: MToolbarSingleItemData = {
    id: ActionName.redo,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'redo'),
    icon: icons.redo,
    hotkey: f.toView(A.Redo),
    exec: (e) => redo(e.cm),
    isActive: inactive,
    isEnable: (e) => redoDepth(e.cm.state) > 0,
};

export const mBoldItemData: MToolbarSingleItemData = {
    id: ActionName.bold,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'bold'),
    icon: icons.bold,
    hotkey: f.toView(A.Bold),
    exec: (e) => toggleBold(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const mItalicItemData: MToolbarSingleItemData = {
    id: ActionName.italic,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'italic'),
    icon: icons.italic,
    hotkey: f.toView(A.Italic),
    exec: (e) => toggleItalic(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const mUnderlineItemData: MToolbarSingleItemData = {
    id: ActionName.underline,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'underline'),
    icon: icons.underline,
    hotkey: f.toView(A.Underline),
    exec: (e) => toggleUnderline(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const mStrikethroughItemData: MToolbarSingleItemData = {
    id: ActionName.strike,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'strike'),
    icon: icons.strikethrough,
    hotkey: f.toView(A.Strike),
    exec: (e) => toggleStrikethrough(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const mMonospaceItemData: MToolbarSingleItemData = {
    id: ActionName.mono,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'mono'),
    icon: icons.mono,
    exec: (e) => toggleMonospace(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const mMarkedItemData: MToolbarSingleItemData = {
    id: ActionName.mark,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'mark'),
    icon: icons.mark,
    exec: (e) => toggleMarked(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const mCheckboxButton: MToolbarSingleItemData = {
    id: ActionName.checkbox,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'checkbox'),
    icon: icons.checklist,
    exec: (e) => wrapToCheckbox(e.cm),
    isActive: inactive,
    isEnable: enable,
};
export const mCheckboxItemData = mCheckboxButton;

export const mLinkButton: MToolbarSingleItemData = {
    id: ActionName.link,
    type: ToolbarDataType.SingleButton,
    icon: icons.link,
    title: i18n('link'),
    exec: (e) => insertLink(e.cm),
    isActive: inactive,
    isEnable: enable,
};
export const mLinkItemData = mLinkButton;

export const mQuoteButton: MToolbarSingleItemData = {
    id: ActionName.quote,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'quote'),
    icon: icons.quote,
    exec: (e) => wrapToBlockquote(e.cm),
    isActive: inactive,
    isEnable: enable,
};
export const mQuoteItemData = mQuoteButton;

export const mCutButton: MToolbarSingleItemData = {
    id: ActionName.yfm_cut,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'cut'),
    icon: icons.cut,
    hotkey: f.toView(A.Cut),
    exec: (e) => wrapToYfmCut(e.cm),
    isActive: inactive,
    isEnable: enable,
};
export const mCutItemData = mCutButton;

export const mNoteButton: MToolbarSingleItemData = {
    id: ActionName.yfm_note,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'note'),
    icon: icons.note,
    hotkey: f.toView(A.Note),
    exec: (e) => wrapToYfmNote(e.cm),
    isActive: inactive,
    isEnable: enable,
};
export const mNoteItemData = mNoteButton;

export const mTableButton: MToolbarSingleItemData = {
    id: ActionName.table,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'table'),
    icon: icons.table,
    exec: (e) => insertYfmTable(e.cm),
    isActive: inactive,
    isEnable: enable,
};
export const mTableItemData = mTableButton;

export const mCodeItemData: ToolbarListButtonItemData<CodeEditor> = {
    id: ActionName.code_inline,
    title: i18n.bind(null, 'code_inline'),
    icon: icons.code,
    hotkey: f.toView(A.Code),
    exec: (e) => wrapToInlineCode(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const mImagePopupData: MToolbarButtonPopupData = {
    id: 'image',
    type: ToolbarDataType.ButtonPopup,
    icon: icons.image,
    title: i18n('image'),
    exec: noop,
    isActive: inactive,
    isEnable: enable,
    renderPopup: (props) => <MToolbarImagePopup {...props} />,
};
export const mImageItemData = mImagePopupData;

export const mFilePopupData: MToolbarButtonPopupData = {
    id: 'file',
    type: ToolbarDataType.ButtonPopup,
    icon: icons.file,
    title: i18n('file'),
    exec: noop,
    isActive: inactive,
    isEnable: enable,
    renderPopup: (props) => <MToolbarFilePopup {...props} />,
};
export const mFileItemData = mFilePopupData;

export const mTabsItemData: MToolbarSingleItemData = {
    id: 'tabs',
    title: i18n.bind(null, 'tabs'),
    icon: icons.tabs,
    type: ToolbarDataType.SingleButton,
    exec: (e) => insertYfmTabs(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const mMathInlineItemData: ToolbarListButtonItemData<CodeEditor> = {
    id: ActionName.math_inline,
    title: i18n.bind(null, 'math_inline'),
    icon: icons.functionInline,
    exec: (e) => wrapToMathInline(e.cm),
    isActive: inactive,
    isEnable: enable,
};
export const mMathBlockItemData: ToolbarListButtonItemData<CodeEditor> = {
    id: ActionName.math_block,
    title: i18n.bind(null, 'math_block'),
    icon: icons.functionBlock,
    exec: (e) => wrapToMathBlock(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const mYfmHtmlBlockButton: MToolbarSingleItemData = {
    id: ActionName.yfm_html_block,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'html'),
    icon: icons.html,
    exec: (e) => insertYfmHtmlBlock(e.cm),
    isActive: inactive,
    isEnable: enable,
};
export const mYfmHtmlBlockItemData = mYfmHtmlBlockButton;

export const mMermaidButton: MToolbarSingleItemData = {
    id: ActionName.mermaid,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'mermaid'),
    icon: icons.mermaid,
    exec: (e) => insertMermaidDiagram(e.cm),
    isActive: inactive,
    isEnable: enable,
};
export const mMermaidItemData = mMermaidButton;

export const mCodeblockItemData: MToolbarItemData = {
    id: ActionName.code_block,
    title: i18n.bind(null, 'codeblock'),
    icon: icons.codeBlock,
    hotkey: f.toView(A.CodeBlock),
    exec: (e) => wrapToCodeBlock(e.cm),
    isActive: inactive,
    isEnable: enable,
};
export const mCodeBlockItemData = mCodeblockItemData;

export const mHruleItemData: MToolbarSingleItemData = {
    id: 'hrule',
    title: i18n.bind(null, 'hrule'),
    icon: icons.horizontalRule,
    type: ToolbarDataType.SingleButton,
    exec: (e) => insertHRule(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const mEmojiItemData: MToolbarSingleItemData = {
    id: 'emoji',
    title: i18n.bind(null, 'emoji'),
    icon: icons.emoji,
    type: ToolbarDataType.SingleButton,
    exec: noop,
    hintWhenDisabled: i18n.bind(null, 'emoji__hint'),
    isActive: inactive,
    isEnable: disable,
};

export const mMathListItem: MToolbarListItemData = {
    id: 'math',
    type: ToolbarDataType.ListButton,
    icon: icons.functionInline,
    withArrow: true,
    title: i18n.bind(null, 'math'),
    data: [mMathInlineItemData, mMathBlockItemData],
};

export const mHeading1ItemData: ToolbarListButtonItemData<CodeEditor> = {
    id: ActionName.heading1,
    title: i18n.bind(null, 'heading1'),
    icon: icons.h1,
    hotkey: f.toView(A.Heading1),
    exec: (e) => toH1(e.cm),
    isActive: inactive,
    isEnable: enable,
    preview: <HeadingPreview level={1} />,
};
export const mHeading2ItemData: ToolbarListButtonItemData<CodeEditor> = {
    id: ActionName.heading2,
    title: i18n.bind(null, 'heading2'),
    icon: icons.h2,
    hotkey: f.toView(A.Heading2),
    exec: (e) => toH2(e.cm),
    isActive: inactive,
    isEnable: enable,
    preview: <HeadingPreview level={2} />,
};
export const mHeading3ItemData: ToolbarListButtonItemData<CodeEditor> = {
    id: ActionName.heading3,
    title: i18n.bind(null, 'heading3'),
    icon: icons.h3,
    hotkey: f.toView(A.Heading3),
    exec: (e) => toH3(e.cm),
    isActive: inactive,
    isEnable: enable,
    preview: <HeadingPreview level={3} />,
};
export const mHeading4ItemData: ToolbarListButtonItemData<CodeEditor> = {
    id: ActionName.heading4,
    title: i18n.bind(null, 'heading4'),
    icon: icons.h4,
    hotkey: f.toView(A.Heading4),
    exec: (e) => toH4(e.cm),
    isActive: inactive,
    isEnable: enable,
    preview: <HeadingPreview level={4} />,
};
export const mHeading5ItemData: ToolbarListButtonItemData<CodeEditor> = {
    id: ActionName.heading5,
    title: i18n.bind(null, 'heading5'),
    icon: icons.h5,
    hotkey: f.toView(A.Heading5),
    exec: (e) => toH5(e.cm),
    isActive: inactive,
    isEnable: enable,
    preview: <HeadingPreview level={5} />,
};
export const mHeading6ItemData: ToolbarListButtonItemData<CodeEditor> = {
    id: ActionName.heading6,
    title: i18n.bind(null, 'heading6'),
    icon: icons.h6,
    hotkey: f.toView(A.Heading6),
    exec: (e) => toH6(e.cm),
    isActive: inactive,
    isEnable: enable,
    preview: <HeadingPreview level={6} />,
};

export const mBulletListItemData: ToolbarListButtonItemData<CodeEditor> = {
    id: ActionName.bulletList,
    title: i18n.bind(null, 'ulist'),
    icon: icons.bulletList,
    exec: (e) => toBulletList(e.cm),
    isActive: inactive,
    isEnable: enable,
};
export const mOrderedListItemData: ToolbarListButtonItemData<CodeEditor> = {
    id: ActionName.orderedList,
    title: i18n.bind(null, 'olist'),
    icon: icons.orderedList,
    exec: (e) => toOrderedList(e.cm),
    isActive: inactive,
    isEnable: enable,
};
export const mSinkListItemData: ToolbarListButtonItemData<CodeEditor> = {
    id: ActionName.sinkListItem,
    title: i18n.bind(null, 'list__action_sink'),
    icon: icons.sink,
    exec: (e) => sinkListItem(e.cm),
    isActive: inactive,
    isEnable: enable,
};
export const mLiftListItemData: ToolbarListButtonItemData<CodeEditor> = {
    id: ActionName.liftListItem,
    title: i18n.bind(null, 'list__action_lift'),
    icon: icons.lift,
    exec: (e) => liftListItem(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const mHeadingListConfig: MToolbarListButtonData = {
    icon: icons.headline,
    withArrow: true,
    title: i18n.bind(null, 'heading'),
    data: [
        mHeading1ItemData,
        mHeading2ItemData,
        mHeading3ItemData,
        mHeading4ItemData,
        mHeading5ItemData,
        mHeading6ItemData,
    ],
};

export const mListsListConfig: MToolbarListButtonData = {
    icon: icons.bulletList,
    withArrow: true,
    title: i18n.bind(null, 'list'),
    data: [mBulletListItemData, mOrderedListItemData],
};

export const mListMoveListConfig: MToolbarListButtonData = {
    icon: icons.lift,
    withArrow: true,
    title: 'Move list item',
    data: [mSinkListItemData, mLiftListItemData],
};

export const mCodeListConfig: MToolbarListButtonData = {
    icon: icons.code,
    withArrow: true,
    title: i18n.bind(null, 'code'),
    data: [mCodeItemData, mCodeblockItemData],
};

export const mMathListConfig: MToolbarListButtonData = {
    icon: icons.functionInline,
    withArrow: true,
    title: i18n.bind(null, 'math'),
    data: [mMathInlineItemData, mMathBlockItemData],
};

export const mHiddenData = [mHruleItemData, mEmojiItemData, mTabsItemData];

export const mHistoryGroupConfig: MToolbarGroupData = [mUndoItemData, mRedoItemData];

export const mBiusGroupConfig: MToolbarGroupData = [
    mBoldItemData,
    mItalicItemData,
    mUnderlineItemData,
    mStrikethroughItemData,
    mMonospaceItemData,
    mMarkedItemData,
];

export const mToolbarConfig: MToolbarData = [
    [mUndoItemData, mRedoItemData],
    mBiusGroupConfig,
    [
        {
            id: 'heading',
            type: ToolbarDataType.ListButton,
            icon: icons.headline,
            withArrow: true,
            title: i18n.bind(null, 'heading'),
            data: [
                mHeading1ItemData,
                mHeading2ItemData,
                mHeading3ItemData,
                mHeading4ItemData,
                mHeading5ItemData,
                mHeading6ItemData,
            ],
        },
        {
            id: 'list',
            type: ToolbarDataType.ListButton,
            icon: icons.bulletList,
            withArrow: true,
            title: i18n.bind(null, 'list'),
            data: [mBulletListItemData, mOrderedListItemData],
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
            icon: icons.code,
            withArrow: true,
            title: i18n.bind(null, 'code'),
            data: [mCodeItemData, mCodeblockItemData],
        },
    ],
    [mImagePopupData, mFilePopupData, mTableButton, mCheckboxButton],
];

export const mToolbarConfigByPreset: Record<MarkdownEditorPreset, MToolbarData> = {
    zero: [mHistoryGroupConfig],
    commonmark: [
        [mUndoItemData, mRedoItemData],
        [mBoldItemData, mItalicItemData],
        [
            {
                id: 'heading',
                type: ToolbarDataType.ListButton,
                icon: icons.headline,
                withArrow: true,
                title: i18n.bind(null, 'heading'),
                data: [
                    mHeading1ItemData,
                    mHeading2ItemData,
                    mHeading3ItemData,
                    mHeading4ItemData,
                    mHeading5ItemData,
                    mHeading6ItemData,
                ],
            },
            {
                id: 'list',
                type: ToolbarDataType.ListButton,
                icon: icons.bulletList,
                withArrow: true,
                title: i18n.bind(null, 'list'),
                data: [mBulletListItemData, mOrderedListItemData],
            },
            mLinkButton,
            mQuoteButton,
            {
                id: 'code',
                type: ToolbarDataType.ListButton,
                icon: icons.code,
                withArrow: true,
                title: i18n.bind(null, 'code'),
                data: [mCodeItemData, mCodeblockItemData],
            },
        ],
    ],
    default: [
        [mUndoItemData, mRedoItemData],
        [mBoldItemData, mItalicItemData, mStrikethroughItemData],
        [
            {
                id: 'heading',
                type: ToolbarDataType.ListButton,
                icon: icons.headline,
                withArrow: true,
                title: i18n.bind(null, 'heading'),
                data: [
                    mHeading1ItemData,
                    mHeading2ItemData,
                    mHeading3ItemData,
                    mHeading4ItemData,
                    mHeading5ItemData,
                    mHeading6ItemData,
                ],
            },
            {
                id: 'list',
                type: ToolbarDataType.ListButton,
                icon: icons.bulletList,
                withArrow: true,
                title: i18n.bind(null, 'list'),
                data: [mBulletListItemData, mOrderedListItemData],
            },
            mLinkButton,
            mQuoteButton,
            {
                id: 'code',
                type: ToolbarDataType.ListButton,
                icon: icons.code,
                withArrow: true,
                title: i18n.bind(null, 'code'),
                data: [mCodeItemData, mCodeblockItemData],
            },
        ],
    ],
    yfm: [
        [mUndoItemData, mRedoItemData],
        [
            mBoldItemData,
            mItalicItemData,
            mUnderlineItemData,
            mStrikethroughItemData,
            mMonospaceItemData,
        ],
        [
            {
                id: 'heading',
                type: ToolbarDataType.ListButton,
                icon: icons.headline,
                withArrow: true,
                title: i18n.bind(null, 'heading'),
                data: [
                    mHeading1ItemData,
                    mHeading2ItemData,
                    mHeading3ItemData,
                    mHeading4ItemData,
                    mHeading5ItemData,
                    mHeading6ItemData,
                ],
            },
            {
                id: 'list',
                type: ToolbarDataType.ListButton,
                icon: icons.bulletList,
                withArrow: true,
                title: i18n.bind(null, 'list'),
                data: [mBulletListItemData, mOrderedListItemData],
            },
            mLinkButton,
            mNoteButton,
            mCutButton,
            mQuoteButton,
            {
                id: 'code',
                type: ToolbarDataType.ListButton,
                icon: icons.code,
                withArrow: true,
                title: i18n.bind(null, 'code'),
                data: [mCodeItemData, mCodeblockItemData],
            },
        ],
        [mImagePopupData, mFilePopupData, mTableButton, mCheckboxButton],
    ],
    full: mToolbarConfig.slice(),
};

export const mHiddenDataByPreset: Record<MarkdownEditorPreset, MToolbarItemData[]> = {
    zero: [],
    commonmark: [
        mHeading1ItemData,
        mHeading2ItemData,
        mHeading3ItemData,
        mHeading4ItemData,
        mHeading5ItemData,
        mHeading6ItemData,
        mBulletListItemData,
        mOrderedListItemData,
        mLinkButton,
        mQuoteButton,
        mCodeblockItemData,
        mHruleItemData,
    ],
    default: [
        mHeading1ItemData,
        mHeading2ItemData,
        mHeading3ItemData,
        mHeading4ItemData,
        mHeading5ItemData,
        mHeading6ItemData,
        mBulletListItemData,
        mOrderedListItemData,
        mLinkButton,
        mQuoteButton,
        mCodeblockItemData,
        mHruleItemData,
    ],
    yfm: [
        mHeading1ItemData,
        mHeading2ItemData,
        mHeading3ItemData,
        mHeading4ItemData,
        mHeading5ItemData,
        mHeading6ItemData,
        mBulletListItemData,
        mOrderedListItemData,
        mLinkButton,
        mQuoteButton,
        mNoteButton,
        mCutButton,
        mCodeblockItemData,
        mCheckboxButton,
        mTableButton,
        mImagePopupData,
        mHruleItemData,
        mFilePopupData,
        mTabsItemData,
    ],
    full: [
        mHeading1ItemData,
        mHeading2ItemData,
        mHeading3ItemData,
        mHeading4ItemData,
        mHeading5ItemData,
        mHeading6ItemData,
        mBulletListItemData,
        mOrderedListItemData,
        mLinkButton,
        mQuoteButton,
        mNoteButton,
        mCutButton,
        mCodeblockItemData,
        mCheckboxButton,
        mTableButton,
        mImagePopupData,
        mHruleItemData,
        mEmojiItemData,
        mFilePopupData,
        mTabsItemData,
    ],
};
