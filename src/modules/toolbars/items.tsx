import {icons} from '../../bundle/config/icons';
import {HeadingPreview} from '../../bundle/config/previews/HeadingPreview';
import {TextPreview} from '../../bundle/config/previews/TextPreview';
import {MToolbarColors} from '../../bundle/toolbar/markup/MToolbarColors';
import {MToolbarFilePopup} from '../../bundle/toolbar/markup/MToolbarFilePopup';
import {MToolbarImagePopup} from '../../bundle/toolbar/markup/MToolbarImagePopup';
import {WToolbarColors} from '../../bundle/toolbar/wysiwyg/WToolbarColors';
import {WToolbarTextSelect} from '../../bundle/toolbar/wysiwyg/WToolbarTextSelect';
import {showMarkupGpt} from '../../extensions/additional/GPT';
import {gptHotKeys} from '../../extensions/additional/GPT/constants';
import {headingType, pType} from '../../extensions/specs';
import {i18n as i18nHint} from '../../i18n/hints';
import {i18n} from '../../i18n/menubar';
import {
    insertBlockquoteLink,
    insertHRule,
    insertLink,
    insertMermaidDiagram,
    insertYfmHtmlBlock,
    insertYfmTable,
    insertYfmTabs,
    liftListItem as liftListItemCommand,
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
} from '../../markup/commands';
import {Action as A, formatter as f} from '../../shortcuts';
import {ToolbarDataType} from '../../toolbar';

import type {ToolbarItemMarkup, ToolbarItemView, ToolbarItemWysiwyg} from './types';

const noop = () => {};
const inactive = () => false;
const enable = () => true;
const disable = () => false;

// ---- Undo ----
export const undoItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'undo'),
    icon: icons.undo,
    hotkey: f.toView(A.Undo),
};
export const undoItemWysiwyg: ToolbarItemWysiwyg = {
    hintWhenDisabled: false,
    exec: (e) => e.actions.undo.run(),
    isActive: (e) => e.actions.undo.isActive(),
    isEnable: (e) => e.actions.undo.isEnable(),
};
export const undoItemMarkup: ToolbarItemMarkup = {
    hintWhenDisabled: false,
    exec: (e) => undo(e.cm),
    isActive: inactive,
    isEnable: (e) => undoDepth(e.cm.state) > 0,
};

// ---- Redo ----
export const redoItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'redo'),
    icon: icons.redo,
    hotkey: f.toView(A.Redo),
};
export const redoItemWysiwyg: ToolbarItemWysiwyg = {
    hintWhenDisabled: false,
    exec: (e) => e.actions.redo.run(),
    isActive: (e) => e.actions.redo.isActive(),
    isEnable: (e) => e.actions.redo.isEnable(),
};
export const redoItemMarkup: ToolbarItemMarkup = {
    hintWhenDisabled: false,
    exec: (e) => redo(e.cm),
    isActive: inactive,
    isEnable: (e) => redoDepth(e.cm.state) > 0,
};

// ---- Bold ----
export const boldItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'bold'),
    icon: icons.bold,
    hotkey: f.toView(A.Bold),
};
export const boldItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.bold.run(),
    isActive: (e) => e.actions.bold.isActive(),
    isEnable: (e) => e.actions.bold.isEnable(),
};
export const boldItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toggleBold(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Italic ----
export const italicItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'italic'),
    icon: icons.italic,
    hotkey: f.toView(A.Italic),
};
export const italicItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.italic.run(),
    isActive: (e) => e.actions.italic.isActive(),
    isEnable: (e) => e.actions.italic.isEnable(),
};
export const italicItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toggleItalic(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Underline ----
export const underlineItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'underline'),
    icon: icons.underline,
    hotkey: f.toView(A.Underline),
};
export const underlineItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.underline.run(),
    isActive: (e) => e.actions.underline.isActive(),
    isEnable: (e) => e.actions.underline.isEnable(),
};
export const underlineItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toggleUnderline(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Strikethrough ----
export const strikethroughItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'strike'),
    icon: icons.strikethrough,
    hotkey: f.toView(A.Strike),
};
export const strikethroughItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.strike.run(),
    isActive: (e) => e.actions.strike.isActive(),
    isEnable: (e) => e.actions.strike.isEnable(),
};
export const strikethroughItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toggleStrikethrough(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Monospace ----
export const monospaceItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'mono'),
    icon: icons.mono,
};
export const monospaceItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.mono.run(),
    isActive: (e) => e.actions.mono.isActive(),
    isEnable: (e) => e.actions.mono.isEnable(),
};
export const monospaceItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toggleMonospace(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Marked ----
export const markedItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'mark'),
    icon: icons.mark,
};
export const markedItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.mark.run(),
    isActive: (e) => e.actions.mark.isActive(),
    isEnable: (e) => e.actions.mark.isEnable(),
};
export const markedItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toggleMarked(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Checkbox ----
export const checkboxItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'checkbox'),
    icon: icons.checklist,
};
export const checkboxItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.addCheckbox.run(),
    isActive: (e) => e.actions.addCheckbox.isActive(),
    isEnable: (e) => e.actions.addCheckbox.isEnable(),
};
export const checkboxItemMarkup: ToolbarItemMarkup = {
    exec: (e) => wrapToCheckbox(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Link ----
export const linkItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'link'),
    icon: icons.link,
    hotkey: f.toView(A.Link),
};
export const linkItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.addLink.run(),
    isActive: (e) => e.actions.addLink.isActive(),
    isEnable: (e) => e.actions.addLink.isEnable(),
};
export const linkItemMarkup: ToolbarItemMarkup = {
    exec: (e) => insertLink(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Quote ----
export const quoteItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'quote'),
    icon: icons.quote,
    hotkey: f.toView(A.Quote),
};
export const quoteItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.quote.run(),
    isActive: (e) => e.actions.quote.isActive(),
    isEnable: (e) => e.actions.quote.isEnable(),
};
export const quoteItemMarkup: ToolbarItemMarkup = {
    exec: (e) => wrapToBlockquote(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Quote Link ----
export const quoteLinkItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'quotelink'),
    icon: icons.quoteLink,
};
export const quoteLinkItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => {
        e.actions.quoteLink.run();
        e.actions.addLinkToQuoteLink.run();
    },
    isActive: (e) => e.actions.quoteLink.isActive(),
    isEnable: (e) => e.actions.quoteLink.isEnable(),
};
export const quoteLinkItemMarkup: ToolbarItemMarkup = {
    exec: (e) => insertBlockquoteLink(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Cut ----
export const cutItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'cut'),
    icon: icons.cut,
    hotkey: f.toView(A.Cut),
};
export const cutItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toYfmCut.run(),
    isActive: (e) => e.actions.toYfmCut.isActive(),
    isEnable: (e) => e.actions.toYfmCut.isEnable(),
};
export const cutItemMarkup: ToolbarItemMarkup = {
    exec: (e) => wrapToYfmCut(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Note ----
export const noteItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'note'),
    icon: icons.note,
    hotkey: f.toView(A.Note),
};
export const noteItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toYfmNote.run(),
    isActive: (e) => e.actions.toYfmNote.isActive(),
    isEnable: (e) => e.actions.toYfmNote.isEnable(),
};
export const noteItemMarkup: ToolbarItemMarkup = {
    exec: (e) => wrapToYfmNote(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Table ----
export const tableItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'table'),
    icon: icons.table,
};
export const tableItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.createYfmTable.run(),
    isActive: (e) => e.actions.createYfmTable.isActive(),
    isEnable: (e) => e.actions.createYfmTable.isEnable(),
};
export const tableItemMarkup: ToolbarItemMarkup = {
    exec: (e) => insertYfmTable(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Code ----
export const codeItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'code_inline'),
    icon: icons.code,
    hotkey: f.toView(A.Code),
};
export const codeItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.code.run(),
    isActive: (e) => e.actions.code.isActive(),
    isEnable: (e) => e.actions.code.isEnable(),
};
export const codeItemMarkup: ToolbarItemMarkup = {
    exec: (e) => wrapToInlineCode(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Image ----
export const imageItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'image'),
    icon: icons.image,
};
export const imagePopupItemView: ToolbarItemView = {
    type: ToolbarDataType.ButtonPopup,
    title: i18n.bind(null, 'image'),
    icon: icons.image,
};
export const imageItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.addImageWidget.run(),
    isActive: (e) => e.actions.addImageWidget.isActive(),
    isEnable: (e) => e.actions.addImageWidget.isEnable(),
};
export const imageItemMarkup: ToolbarItemMarkup<ToolbarDataType.ButtonPopup> = {
    exec: noop,
    isActive: inactive,
    isEnable: enable,
    renderPopup: (props) => <MToolbarImagePopup {...props} />,
};

// ---- File ----
export const fileItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'file'),
    icon: icons.file,
};
export const filePopupItemView: ToolbarItemView = {
    type: ToolbarDataType.ButtonPopup,
    title: i18n.bind(null, 'file'),
    icon: icons.file,
};
export const fileItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.addFile.run(),
    isActive: (e) => e.actions.addFile.isActive(),
    isEnable: (e) => e.actions.addFile.isEnable(),
};
export const fileItemMarkup: ToolbarItemMarkup<ToolbarDataType.ButtonPopup> = {
    exec: noop,
    isActive: inactive,
    isEnable: enable,
    renderPopup: (props) => <MToolbarFilePopup {...props} />,
};

// ---- Tabs ----
export const tabsItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'tabs'),
    icon: icons.tabs,
};
export const tabsItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toYfmTabs.run(),
    isActive: (e) => e.actions.toYfmTabs.isActive(),
    isEnable: (e) => e.actions.toYfmTabs.isEnable(),
};
export const tabsItemMarkup: ToolbarItemMarkup = {
    exec: (e) => insertYfmTabs(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Math Inline ----
export const mathInlineItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'math_inline'),
    icon: icons.functionInline,
    hint: () => `${i18nHint.bind(null, 'math_hint')()} ${i18nHint.bind(null, 'math_hint_katex')()}`,
};
export const mathInlineItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.addMathInline.run(),
    isActive: (e) => e.actions.addMathInline.isActive(),
    isEnable: (e) => e.actions.addMathInline.isEnable(),
};
export const mathInlineItemMarkup: ToolbarItemMarkup = {
    exec: (e) => wrapToMathInline(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Math Block ----
export const mathBlockItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'math_block'),
    icon: icons.functionBlock,
    hint: () => `${i18nHint.bind(null, 'math_hint')()} ${i18nHint.bind(null, 'math_hint_katex')()}`,
};
export const mathBlockItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toMathBlock.run(),
    isActive: (e) => e.actions.toMathBlock.isActive(),
    isEnable: (e) => e.actions.toMathBlock.isEnable(),
};
export const mathBlockItemMarkup: ToolbarItemMarkup = {
    exec: (e) => wrapToMathBlock(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Yfm Html Block ----
export const yfmHtmlBlockItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'html'),
    icon: icons.html,
};
export const yfmHtmlBlockItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.createYfmHtmlBlock.run(),
    isActive: (e) => e.actions.createYfmHtmlBlock.isActive(),
    isEnable: (e) => e.actions.createYfmHtmlBlock.isEnable(),
};
export const yfmHtmlBlockItemMarkup: ToolbarItemMarkup = {
    exec: (e) => insertYfmHtmlBlock(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Mermaid ----
export const mermaidItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'mermaid'),
    icon: icons.mermaid,
};
export const mermaidItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.createMermaid.run(),
    isActive: (e) => e.actions.createMermaid.isActive(),
    isEnable: (e) => e.actions.createMermaid.isEnable(),
};
export const mermaidItemMarkup: ToolbarItemMarkup = {
    exec: (e) => insertMermaidDiagram(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Code Block ----
export const codeBlockItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'codeblock'),
    icon: icons.codeBlock,
    hotkey: f.toView(A.CodeBlock),
};
export const codeBlockItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toCodeBlock.run(),
    isActive: (e) => e.actions.toCodeBlock.isActive(),
    isEnable: (e) => e.actions.toCodeBlock.isEnable(),
};
export const codeBlockItemMarkup: ToolbarItemMarkup = {
    exec: (e) => wrapToCodeBlock(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Horizontal Rule ----
export const hruleItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'hrule'),
    icon: icons.horizontalRule,
};
export const hruleItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.hRule.run(),
    isActive: (e) => e.actions.hRule.isActive(),
    isEnable: (e) => e.actions.hRule.isEnable(),
};
export const hruleItemMarkup: ToolbarItemMarkup = {
    exec: (e) => insertHRule(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Emoji ----
export const emojiItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'emoji'),
    icon: icons.emoji,
};
export const emojiItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.openEmojiSuggest.run({}),
    isActive: (e) => e.actions.openEmojiSuggest.isActive(),
    isEnable: (e) => e.actions.openEmojiSuggest.isEnable(),
};
export const emojiItemMarkup: ToolbarItemMarkup = {
    exec: noop,
    hintWhenDisabled: i18n.bind(null, 'emoji__hint'),
    isActive: inactive,
    isEnable: disable,
};

// ---- Heading 1 ----
export const heading1ItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'heading1'),
    icon: icons.h1,
    hotkey: f.toView(A.Heading1),
    preview: <HeadingPreview level={1} />,
};
export const heading1ItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toH1.run(),
    isActive: (e) => e.actions.toH1.isActive(),
    isEnable: (e) => e.actions.toH1.isEnable(),
};
export const heading1ItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toH1(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Heading 2 ----
export const heading2ItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'heading2'),
    icon: icons.h2,
    hotkey: f.toView(A.Heading2),
    preview: <HeadingPreview level={2} />,
};
export const heading2ItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toH2.run(),
    isActive: (e) => e.actions.toH2.isActive(),
    isEnable: (e) => e.actions.toH2.isEnable(),
};
export const heading2ItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toH2(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Heading 3 ----
export const heading3ItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'heading3'),
    icon: icons.h3,
    hotkey: f.toView(A.Heading3),
    preview: <HeadingPreview level={3} />,
};
export const heading3ItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toH3.run(),
    isActive: (e) => e.actions.toH3.isActive(),
    isEnable: (e) => e.actions.toH3.isEnable(),
};
export const heading3ItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toH3(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Heading 4 ----
export const heading4ItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'heading4'),
    icon: icons.h4,
    hotkey: f.toView(A.Heading4),
    preview: <HeadingPreview level={4} />,
};
export const heading4ItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toH4.run(),
    isActive: (e) => e.actions.toH4.isActive(),
    isEnable: (e) => e.actions.toH4.isEnable(),
};
export const heading4ItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toH4(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Heading 5 ----
export const heading5ItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'heading5'),
    icon: icons.h5,
    hotkey: f.toView(A.Heading5),
    preview: <HeadingPreview level={5} />,
};
export const heading5ItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toH5.run(),
    isActive: (e) => e.actions.toH5.isActive(),
    isEnable: (e) => e.actions.toH5.isEnable(),
};
export const heading5ItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toH5(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Heading 6 ----
export const heading6ItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'heading6'),
    icon: icons.h6,
    hotkey: f.toView(A.Heading6),
    preview: <HeadingPreview level={6} />,
};
export const heading6ItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toH6.run(),
    isActive: (e) => e.actions.toH6.isActive(),
    isEnable: (e) => e.actions.toH6.isEnable(),
};
export const heading6ItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toH6(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Bullet List ----
export const bulletListItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'ulist'),
    icon: icons.bulletList,
    hotkey: f.toView(A.BulletList),
};
export const bulletListItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toBulletList.run(),
    isActive: (e) => e.actions.toBulletList.isActive(),
    isEnable: (e) => e.actions.toBulletList.isEnable(),
};
export const bulletListItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toBulletList(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Ordered List ----
export const orderedListItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'olist'),
    icon: icons.orderedList,
    hotkey: f.toView(A.OrderedList),
};
export const orderedListItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toOrderedList.run(),
    isActive: (e) => e.actions.toOrderedList.isActive(),
    isEnable: (e) => e.actions.toOrderedList.isEnable(),
};
export const orderedListItemMarkup: ToolbarItemMarkup = {
    exec: (e) => toOrderedList(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Sink List ----
export const sinkListItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'list__action_sink'),
    icon: icons.sink,
    hotkey: f.toView(A.SinkListItem),
};
export const sinkListItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.sinkListItem.run(),
    hintWhenDisabled: () => i18n('list_action_disabled'),
    isActive: (e) => e.actions.sinkListItem.isActive(),
    isEnable: (e) => e.actions.sinkListItem.isEnable(),
};
export const sinkListItemMarkup: ToolbarItemMarkup = {
    exec: (e) => sinkListItemCommand(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Lift List ----
export const liftListItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'list__action_lift'),
    icon: icons.lift,
    hotkey: f.toView(A.LiftListItem),
};
export const liftListItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.liftListItem.run(),
    hintWhenDisabled: () => i18n('list_action_disabled'),
    isActive: (e) => e.actions.liftListItem.isActive(),
    isEnable: (e) => e.actions.liftListItem.isEnable(),
};
export const liftListItemMarkup: ToolbarItemMarkup = {
    exec: (e) => liftListItemCommand(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Toggle Heading Folding ----
export const toggleHeadingFoldingItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    icon: icons.foldingHeading,
    title: () => i18n('folding-heading'),
    hint: () => i18n('folding-heading__hint'),
};
export const toggleHeadingFoldingItemWysiwyg: ToolbarItemWysiwyg = {
    isActive: (editor) => editor.actions.toggleHeadingFolding?.isActive() ?? false,
    isEnable: (editor) => editor.actions.toggleHeadingFolding?.isEnable() ?? false,
    exec: (editor) => editor.actions.toggleHeadingFolding.run(),
    condition: 'enabled',
};

// ---- Text Context ----
export const textContextItemView: ToolbarItemView<ToolbarDataType.ReactComponent> = {
    type: ToolbarDataType.ReactComponent,
};
export const textContextItemWisywig: ToolbarItemWysiwyg<ToolbarDataType.ReactComponent> = {
    component: WToolbarTextSelect,
    width: 0,
    condition: ({selection: {$from, $to}, schema}) => {
        if (!$from.sameParent($to)) return false;
        const {parent} = $from;
        return parent.type === pType(schema) || parent.type === headingType(schema);
    },
};

// ---- Paragraph ----
export const paragraphItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'text'),
    icon: icons.text,
    hotkey: f.toView(A.Text),
    doNotActivateList: true,
    preview: <TextPreview />,
};
export const paragraphItemWisywig: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toParagraph.run(),
    isActive: (e) => e.actions.toParagraph.isActive(),
    isEnable: (e) => e.actions.toParagraph.isEnable(),
};
export const paragraphItemMarkup: ToolbarItemMarkup = {
    exec: noop,
    isActive: inactive,
    isEnable: enable,
};

// --- Colorify ----
export const colorifyItemView: ToolbarItemView<ToolbarDataType.ReactComponent> = {
    type: ToolbarDataType.ReactComponent,
};
export const colorifyItemWysiwyg: ToolbarItemWysiwyg<ToolbarDataType.ReactComponent> = {
    component: WToolbarColors,
    width: 42,
};
export const colorifyItemMarkup: ToolbarItemMarkup<ToolbarDataType.ReactComponent> = {
    component: MToolbarColors,
    width: 42,
};

// ---- GPT ----
export const gptItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'gpt'),
    hotkey: gptHotKeys.openGptKeyTooltip,
    icon: icons.gpt,
};
export const gptItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.addGptWidget.run({}),
    isActive: (e) => e.actions.addGptWidget.isActive(),
    isEnable: (e) => e.actions.addGptWidget.isEnable(),
};
export const gptItemMarkup: ToolbarItemMarkup = {
    exec: (e) => showMarkupGpt(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Heading list ----
export const headingListItemView: ToolbarItemView<ToolbarDataType.ListButton> = {
    type: ToolbarDataType.ListButton,
    icon: icons.headline,
    title: i18n.bind(null, 'heading'),
    withArrow: true,
    replaceActiveIcon: true,
};

// ---- Lists list ----
export const listsListItemView: ToolbarItemView<ToolbarDataType.ListButton> = {
    type: ToolbarDataType.ListButton,
    icon: icons.bulletList,
    withArrow: true,
    title: i18n.bind(null, 'list'),
};

// ---- Move list ----
export const moveListItemView: ToolbarItemView<ToolbarDataType.ListButton> = {
    type: ToolbarDataType.ListButton,
    icon: icons.lift,
    withArrow: true,
    title: i18n.bind(null, 'move_list'),
};

// ---- Code list ----
export const codeBlocksListItemView: ToolbarItemView<ToolbarDataType.ListButton> = {
    type: ToolbarDataType.ListButton,
    icon: icons.code,
    title: i18n.bind(null, 'code'),
    withArrow: true,
};

// ---- Math list ----
export const mathListItemView: ToolbarItemView<ToolbarDataType.ListButton> = {
    type: ToolbarDataType.ListButton,
    icon: icons.functionInline,
    withArrow: true,
    title: i18n.bind(null, 'math'),
};
