import {MToolbarColors} from 'src/bundle/toolbar/markup/MToolbarColors';
import {MToolbarFilePopup} from 'src/bundle/toolbar/markup/MToolbarFilePopup';
import {MToolbarImagePopup} from 'src/bundle/toolbar/markup/MToolbarImagePopup';
import {showMarkupGpt} from 'src/extensions/additional/GPT/MarkupGpt/commands';
import {
    insertBlockquoteLink,
    insertHRule,
    insertLink,
    insertMermaidDiagram,
    insertYfmHtmlBlock,
    insertYfmTable,
    insertYfmTabs,
    liftListItem as liftListItemCommand,
    openEmojiSuggest,
    redo,
    redoDepth,
    sinkListItem as sinkListItemCommand,
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
} from 'src/markup/commands';
import type {ToolbarDataType} from 'src/toolbar/types';

import type {ToolbarItemMarkup} from '../types';

const noop = () => {};
const inactive = () => false;
const enable = () => true;

export const undoItemMarkup: ToolbarItemMarkup = {
    hintWhenDisabled: false,
    exec: (e) => undo(e.cm),
    isActive: inactive,
    isEnable: (e) => undoDepth(e.cm.state) > 0,
};

export const redoItemMarkup: ToolbarItemMarkup = {
    hintWhenDisabled: false,
    exec: (e) => redo(e.cm),
    isActive: inactive,
    isEnable: (e) => redoDepth(e.cm.state) > 0,
};

export const boldItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toggleBold(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const italicItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toggleItalic(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const underlineItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toggleUnderline(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const strikethroughItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toggleStrikethrough(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const monospaceItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toggleMonospace(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const markedItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toggleMarked(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const checkboxItemMarkup: ToolbarItemMarkup = {
    exec: (e) => wrapToCheckbox(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const linkItemMarkup: ToolbarItemMarkup = {
    exec: (e) => insertLink(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const quoteItemMarkup: ToolbarItemMarkup = {
    exec: (e) => wrapToBlockquote(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const quoteLinkItemMarkup: ToolbarItemMarkup = {
    exec: (e) => insertBlockquoteLink(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const cutItemMarkup: ToolbarItemMarkup = {
    exec: (e) => wrapToYfmCut(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const noteItemMarkup: ToolbarItemMarkup = {
    exec: (e) => wrapToYfmNote(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const tableItemMarkup: ToolbarItemMarkup = {
    exec: (e) => insertYfmTable(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const codeItemMarkup: ToolbarItemMarkup = {
    exec: (e) => wrapToInlineCode(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const imageItemMarkup: ToolbarItemMarkup<ToolbarDataType.ButtonPopup> = {
    exec: noop,
    isActive: inactive,
    isEnable: enable,
    renderPopup: (props) => <MToolbarImagePopup {...props} />,
};

export const fileItemMarkup: ToolbarItemMarkup<ToolbarDataType.ButtonPopup> = {
    exec: noop,
    isActive: inactive,
    isEnable: enable,
    renderPopup: (props) => <MToolbarFilePopup {...props} />,
};

export const tabsItemMarkup: ToolbarItemMarkup = {
    exec: (e) => insertYfmTabs(e.cm),
    isActive: inactive,
    isEnable: enable,
};

/** @deprecated Use latexInlineItemMarkup from `@gravity-ui/markdown-editor-latex-extension` */
export const mathInlineItemMarkup: ToolbarItemMarkup = {
    exec: (e) => wrapToMathInline(e.cm),
    isActive: inactive,
    isEnable: enable,
};

/** @deprecated Use latexBlockItemMarkup from `@gravity-ui/markdown-editor-latex-extension` */
export const mathBlockItemMarkup: ToolbarItemMarkup = {
    exec: (e) => wrapToMathBlock(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const yfmHtmlBlockItemMarkup: ToolbarItemMarkup = {
    exec: (e) => insertYfmHtmlBlock(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const mermaidItemMarkup: ToolbarItemMarkup = {
    exec: (e) => insertMermaidDiagram(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const codeBlockItemMarkup: ToolbarItemMarkup = {
    exec: (e) => wrapToCodeBlock(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const hruleItemMarkup: ToolbarItemMarkup = {
    exec: (e) => insertHRule(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const emojiItemMarkup: ToolbarItemMarkup = {
    exec: (e) => openEmojiSuggest(e.cm),
    isActive: inactive,
    isEnable: (e) => !e.cm.state.readOnly && e.cm.state.selection.main.empty,
};

export const heading1ItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toH1(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const heading2ItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toH2(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const heading3ItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toH3(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const heading4ItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toH4(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const heading5ItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toH5(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const heading6ItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toH6(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const bulletListItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toBulletList(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const orderedListItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toOrderedList(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const sinkListItemMarkup: ToolbarItemMarkup = {
    exec: (e) => sinkListItemCommand(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const liftListItemMarkup: ToolbarItemMarkup = {
    exec: (e) => liftListItemCommand(e.cm),
    isActive: inactive,
    isEnable: enable,
};

export const paragraphItemMarkup: ToolbarItemMarkup = {
    exec: noop,
    isActive: inactive,
    isEnable: enable,
};

export const colorifyItemMarkup: ToolbarItemMarkup<ToolbarDataType.ReactComponent> = {
    component: MToolbarColors,
    noRerenderOnUpdate: true, // static state in markup mode
    width: 42,
};

export const gptItemMarkup: ToolbarItemMarkup = {
    exec: (e) => showMarkupGpt(e.cm),
    isActive: inactive,
    isEnable: enable,
};
