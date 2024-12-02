import {icons} from '../../bundle/config/icons';
import {gptHotKeys} from '../../extensions/additional/GPT/constants';
import {i18n as i18nHint} from '../../i18n/hints';
import {i18n} from '../../i18n/menubar';
import {
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

const noop = () => {};
const inactive = () => false;
const enable = () => true;
const disable = () => false;

import {MarkupEditorCommand, ToolbarItem, WysiwygEditorCommand} from './types';

// ---- Undo ----
export const undoItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'undo'),
    icon: icons.undo,
    hotkey: f.toView(A.Undo),
};
export const wysiwygUndoAction: WysiwygEditorCommand = {
    hintWhenDisabled: false,
    exec: (e) => e.actions.undo.run(),
    isActive: (e) => e.actions.undo.isActive(),
    isEnable: (e) => e.actions.undo.isEnable(),
};
export const markupUndoAction: MarkupEditorCommand = {
    exec: (e) => undo(e.cm),
    isActive: inactive,
    isEnable: (e) => undoDepth(e.cm.state) > 0,
};

// ---- Redo ----
export const redoItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'redo'),
    icon: icons.redo,
    hotkey: f.toView(A.Redo),
};
export const wysiwygRedoAction: WysiwygEditorCommand = {
    hintWhenDisabled: false,
    exec: (e) => e.actions.redo.run(),
    isActive: (e) => e.actions.redo.isActive(),
    isEnable: (e) => e.actions.redo.isEnable(),
};
export const markupRedoAction: MarkupEditorCommand = {
    exec: (e) => redo(e.cm),
    isActive: inactive,
    isEnable: (e) => redoDepth(e.cm.state) > 0,
};

// ---- Bold ----
export const boldItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'bold'),
    icon: icons.bold,
    hotkey: f.toView(A.Bold),
};
export const wysiwygBoldAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.bold.run(),
    isActive: (e) => e.actions.bold.isActive(),
    isEnable: (e) => e.actions.bold.isEnable(),
};
export const markupBoldAction: MarkupEditorCommand = {
    exec: (e) => toggleBold(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Italic ----
export const italicItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'italic'),
    icon: icons.italic,
    hotkey: f.toView(A.Italic),
};
export const wysiwygItalicAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.italic.run(),
    isActive: (e) => e.actions.italic.isActive(),
    isEnable: (e) => e.actions.italic.isEnable(),
};
export const markupItalicAction: MarkupEditorCommand = {
    exec: (e) => toggleItalic(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Underline ----
export const underlineItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'underline'),
    icon: icons.underline,
    hotkey: f.toView(A.Underline),
};
export const wysiwygUnderlineAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.underline.run(),
    isActive: (e) => e.actions.underline.isActive(),
    isEnable: (e) => e.actions.underline.isEnable(),
};
export const markupUnderlineAction: MarkupEditorCommand = {
    exec: (e) => toggleUnderline(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Strikethrough ----
export const strikethroughItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'strike'),
    icon: icons.strikethrough,
    hotkey: f.toView(A.Strike),
};
export const wysiwygStrikethroughAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.strike.run(),
    isActive: (e) => e.actions.strike.isActive(),
    isEnable: (e) => e.actions.strike.isEnable(),
};
export const markupStrikethroughAction: MarkupEditorCommand = {
    exec: (e) => toggleStrikethrough(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Monospace ----
export const monospaceItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'mono'),
    icon: icons.mono,
};
export const wysiwygMonospaceAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.mono.run(),
    isActive: (e) => e.actions.mono.isActive(),
    isEnable: (e) => e.actions.mono.isEnable(),
};
export const markupMonospaceAction: MarkupEditorCommand = {
    exec: (e) => toggleMonospace(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Marked ----
export const markedItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'mark'),
    icon: icons.mark,
};
export const wysiwygMarkedAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.mark.run(),
    isActive: (e) => e.actions.mark.isActive(),
    isEnable: (e) => e.actions.mark.isEnable(),
};
export const markupMarkedAction: MarkupEditorCommand = {
    exec: (e) => toggleMarked(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Checkbox ----
export const checkboxItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'checkbox'),
    icon: icons.checklist,
};
export const wysiwygCheckboxAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.addCheckbox.run(),
    isActive: (e) => e.actions.addCheckbox.isActive(),
    isEnable: (e) => e.actions.addCheckbox.isEnable(),
};
export const markupCheckboxAction: MarkupEditorCommand = {
    exec: (e) => wrapToCheckbox(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Link ----
export const linkItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'link'),
    icon: icons.link,
    hotkey: f.toView(A.Link),
};
export const wysiwygLinkAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.addLink.run(),
    isActive: (e) => e.actions.addLink.isActive(),
    isEnable: (e) => e.actions.addLink.isEnable(),
};
export const markupLinkAction: MarkupEditorCommand = {
    exec: (e) => insertLink(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Quote ----
export const quoteItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'quote'),
    icon: icons.quote,
    hotkey: f.toView(A.Quote),
};
export const wysiwygQuoteAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.quote.run(),
    isActive: (e) => e.actions.quote.isActive(),
    isEnable: (e) => e.actions.quote.isEnable(),
};
export const markupQuoteAction: MarkupEditorCommand = {
    exec: (e) => wrapToBlockquote(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Cut ----
export const cutItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'cut'),
    icon: icons.cut,
    hotkey: f.toView(A.Cut),
};
export const wysiwygCutAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.toYfmCut.run(),
    isActive: (e) => e.actions.toYfmCut.isActive(),
    isEnable: (e) => e.actions.toYfmCut.isEnable(),
};
export const markupCutAction: MarkupEditorCommand = {
    exec: (e) => wrapToYfmCut(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Note ----
export const noteItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'note'),
    icon: icons.note,
    hotkey: f.toView(A.Note),
};
export const wysiwygNoteAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.toYfmNote.run(),
    isActive: (e) => e.actions.toYfmNote.isActive(),
    isEnable: (e) => e.actions.toYfmNote.isEnable(),
};
export const markupNoteAction: MarkupEditorCommand = {
    exec: (e) => wrapToYfmNote(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Table ----
export const tableItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'table'),
    icon: icons.table,
};
export const wysiwygTableAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.createYfmTable.run(),
    isActive: (e) => e.actions.createYfmTable.isActive(),
    isEnable: (e) => e.actions.createYfmTable.isEnable(),
};
export const markupTableAction: MarkupEditorCommand = {
    exec: (e) => insertYfmTable(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Code ----
export const codeItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'code_inline'),
    icon: icons.code,
    hotkey: f.toView(A.Code),
};
export const wysiwygCodeAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.code.run(),
    isActive: (e) => e.actions.code.isActive(),
    isEnable: (e) => e.actions.code.isEnable(),
};
export const markupCodeAction: MarkupEditorCommand = {
    exec: (e) => wrapToInlineCode(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Image ----
export const imageItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'image'),
    icon: icons.image,
};
export const wysiwygImageAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.addImageWidget.run(),
    isActive: (e) => e.actions.addImageWidget.isActive(),
    isEnable: (e) => e.actions.addImageWidget.isEnable(),
};
export const markupImageAction: MarkupEditorCommand = {
    exec: noop,
    isActive: inactive,
    isEnable: enable,
    // renderPopup: (props) => <MToolbarImagePopup {...props} />,
};

// ---- File ----
export const fileItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'file'),
    icon: icons.file,
};
export const wysiwygFileAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.addFile.run(),
    isActive: (e) => e.actions.addFile.isActive(),
    isEnable: (e) => e.actions.addFile.isEnable(),
};
export const markupFileAction: MarkupEditorCommand = {
    exec: noop,
    isActive: inactive,
    isEnable: enable,
    // renderPopup: (props) => <MToolbarFilePopup {...props} />,
};

// ---- Tabs ----
export const tabsItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'tabs'),
    icon: icons.tabs,
};
export const wysiwygTabsAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.toYfmTabs.run(),
    isActive: (e) => e.actions.toYfmTabs.isActive(),
    isEnable: (e) => e.actions.toYfmTabs.isEnable(),
};
export const markupTabsAction: MarkupEditorCommand = {
    exec: (e) => insertYfmTabs(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Math Inline ----
export const mathInlineItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'math_inline'),
    icon: icons.functionInline,
    hint: () => `${i18nHint.bind(null, 'math_hint')()} ${i18nHint.bind(null, 'math_hint_katex')()}`,
};
export const wysiwygMathInlineAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.addMathInline.run(),
    isActive: (e) => e.actions.addMathInline.isActive(),
    isEnable: (e) => e.actions.addMathInline.isEnable(),
};
export const markupMathInlineAction: MarkupEditorCommand = {
    exec: (e) => wrapToMathInline(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Math Block ----
export const mathBlockItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'math_block'),
    icon: icons.functionBlock,
    hint: () => `${i18nHint.bind(null, 'math_hint')()} ${i18nHint.bind(null, 'math_hint_katex')()}`,
};
export const wysiwygMathBlockAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.toMathBlock.run(),
    isActive: (e) => e.actions.toMathBlock.isActive(),
    isEnable: (e) => e.actions.toMathBlock.isEnable(),
};
export const markupMathBlockAction: MarkupEditorCommand = {
    exec: (e) => wrapToMathBlock(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Yfm Html Block ----
export const yfmHtmlBlockItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'html'),
    icon: icons.html,
};
export const wysiwygYfmHtmlBlockAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.createYfmHtmlBlock.run(),
    isActive: (e) => e.actions.createYfmHtmlBlock.isActive(),
    isEnable: (e) => e.actions.createYfmHtmlBlock.isEnable(),
};
export const markupYfmHtmlBlockAction: MarkupEditorCommand = {
    exec: (e) => insertYfmHtmlBlock(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- GPT ----
export const gptItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'gpt'),
    hotkey: gptHotKeys.openGptKeyTooltip,
    icon: icons.gpt,
};
export const wysiwygGptAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.addGptWidget.run({}),
    isActive: (e) => e.actions.addGptWidget.isActive(),
    isEnable: (e) => e.actions.addGptWidget.isEnable(),
};
export const markupGptAction: MarkupEditorCommand = {
    exec: (e) => insertMermaidDiagram(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Mermaid ----
export const mermaidItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'mermaid'),
    icon: icons.mermaid,
};
export const wysiwygMermaidAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.createMermaid.run(),
    isActive: (e) => e.actions.createMermaid.isActive(),
    isEnable: (e) => e.actions.createMermaid.isEnable(),
};
export const markupMermaidAction: MarkupEditorCommand = {
    exec: (e) => insertMermaidDiagram(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Code Block ----
export const codeBlockItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'codeblock'),
    icon: icons.codeBlock,
    hotkey: f.toView(A.CodeBlock),
};
export const wysiwygCodeBlockAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.toCodeBlock.run(),
    isActive: (e) => e.actions.toCodeBlock.isActive(),
    isEnable: (e) => e.actions.toCodeBlock.isEnable(),
};
export const markupCodeBlockAction: MarkupEditorCommand = {
    exec: (e) => wrapToCodeBlock(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Horizontal Rule ----
export const hruleItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'hrule'),
    icon: icons.horizontalRule,
};
export const wysiwygHruleAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.hRule.run(),
    isActive: (e) => e.actions.hRule.isActive(),
    isEnable: (e) => e.actions.hRule.isEnable(),
};
export const markupHruleAction: MarkupEditorCommand = {
    exec: (e) => insertHRule(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Emoji ----
export const emojiItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'emoji'),
    icon: icons.emoji,
};
export const wysiwygEmojiAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.openEmojiSuggest.run({}),
    isActive: (e) => e.actions.openEmojiSuggest.isActive(),
    isEnable: (e) => e.actions.openEmojiSuggest.isEnable(),
};
export const markupEmojiAction: MarkupEditorCommand = {
    exec: noop,
    hintWhenDisabled: i18n.bind(null, 'emoji__hint'),
    isActive: inactive,
    isEnable: disable,
};

// ---- Toggle Heading Folding ----
export const toggleHeadingFoldingItem: ToolbarItem = {
    // type: ToolbarDataType.SingleButton,
    icon: icons.foldingHeading,
    title: () => i18n('folding-heading'),
    hint: () => i18n('folding-heading__hint'),
};
export const wysiwygToggleHeadingFoldingAction: WysiwygEditorCommand = {
    exec: (editor) => editor.actions.toggleHeadingFolding.run(),
    isActive: (editor) => editor.actions.toggleHeadingFolding?.isActive() ?? false,
    isEnable: (editor) => editor.actions.toggleHeadingFolding?.isEnable() ?? false,
};

// export const textContextItem: ToolbarItem = {
//     id: 'text',
//     // type: ToolbarDataType.ReactComponent,
//     // component: WToolbarTextSelect,
//     // width: 0,
//     // condition: ({selection: {$from, $to}, schema}) => {
//     //     if (!$from.sameParent($to)) return false;
//     //     const {parent} = $from;
//     //     return parent.type === pType(schema) || parent.type === headingType(schema);
//     // },
// };

// export const mathListItem: ToolbarItem = {
//     // type: ToolbarDataType.ListButton,
//     icon: icons.functionInline,
//     // withArrow: true,
//     title: i18n.bind(null, 'math'),
//     // data: [mathInlineItem, mathBlockItem],
// };

// ---- Text ----
export const textItem: ToolbarItem = {
    title: i18n.bind(null, 'text'),
    icon: icons.text,
    hotkey: f.toView(A.Text),
};
export const wysiwygTextAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.toParagraph.run(),
    isActive: (e) => e.actions.toParagraph.isActive(),
    isEnable: (e) => e.actions.toParagraph.isEnable(),
};
export const markupTextAction: MarkupEditorCommand = {
    exec: noop,
    isActive: inactive,
    isEnable: enable,
};

// ---- Heading 1 ----
export const heading1Item: ToolbarItem = {
    title: i18n.bind(null, 'heading1'),
    icon: icons.h1,
    hotkey: f.toView(A.Heading1),
};
export const wysiwygHeading1Action: WysiwygEditorCommand = {
    exec: (e) => e.actions.toH1.run(),
    isActive: (e) => e.actions.toH1.isActive(),
    isEnable: (e) => e.actions.toH1.isEnable(),
};
export const markupHeading1Action: MarkupEditorCommand = {
    exec: (e) => toH1(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Heading 2 ----
export const heading2Item: ToolbarItem = {
    title: i18n.bind(null, 'heading2'),
    icon: icons.h2,
    hotkey: f.toView(A.Heading2),
};
export const wysiwygHeading2Action: WysiwygEditorCommand = {
    exec: (e) => e.actions.toH2.run(),
    isActive: (e) => e.actions.toH2.isActive(),
    isEnable: (e) => e.actions.toH2.isEnable(),
};
export const markupHeading2Action: MarkupEditorCommand = {
    exec: (e) => toH2(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Heading 3 ----
export const heading3Item: ToolbarItem = {
    title: i18n.bind(null, 'heading3'),
    icon: icons.h3,
    hotkey: f.toView(A.Heading3),
};
export const wysiwygHeading3Action: WysiwygEditorCommand = {
    exec: (e) => e.actions.toH3.run(),
    isActive: (e) => e.actions.toH3.isActive(),
    isEnable: (e) => e.actions.toH3.isEnable(),
};
export const markupHeading3Action: MarkupEditorCommand = {
    exec: (e) => toH3(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Heading 4 ----
export const heading4Item: ToolbarItem = {
    title: i18n.bind(null, 'heading4'),
    icon: icons.h4,
    hotkey: f.toView(A.Heading4),
};
export const wysiwygHeading4Action: WysiwygEditorCommand = {
    exec: (e) => e.actions.toH4.run(),
    isActive: (e) => e.actions.toH4.isActive(),
    isEnable: (e) => e.actions.toH4.isEnable(),
};
export const markupHeading4Action: MarkupEditorCommand = {
    exec: (e) => toH4(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Heading 5 ----
export const heading5Item: ToolbarItem = {
    title: i18n.bind(null, 'heading5'),
    icon: icons.h5,
    hotkey: f.toView(A.Heading5),
};
export const wysiwygHeading5Action: WysiwygEditorCommand = {
    exec: (e) => e.actions.toH5.run(),
    isActive: (e) => e.actions.toH5.isActive(),
    isEnable: (e) => e.actions.toH5.isEnable(),
};
export const markupHeading5Action: MarkupEditorCommand = {
    exec: (e) => toH5(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Heading 6 ----
export const heading6Item: ToolbarItem = {
    title: i18n.bind(null, 'heading6'),
    icon: icons.h6,
    hotkey: f.toView(A.Heading6),
};
export const wysiwygHeading6Action: WysiwygEditorCommand = {
    exec: (e) => e.actions.toH6.run(),
    isActive: (e) => e.actions.toH6.isActive(),
    isEnable: (e) => e.actions.toH6.isEnable(),
};
export const markupHeading6Action: MarkupEditorCommand = {
    exec: (e) => toH6(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Bullet List ----
export const bulletListItem: ToolbarItem = {
    title: i18n.bind(null, 'ulist'),
    icon: icons.bulletList,
    hotkey: f.toView(A.BulletList),
};
export const wysiwygBulletListAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.toBulletList.run(),
    isActive: (e) => e.actions.toBulletList.isActive(),
    isEnable: (e) => e.actions.toBulletList.isEnable(),
};
export const markupBulletListAction: MarkupEditorCommand = {
    exec: (e) => toBulletList(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Ordered List ----
export const orderedListItem: ToolbarItem = {
    title: i18n.bind(null, 'olist'),
    icon: icons.orderedList,
    hotkey: f.toView(A.OrderedList),
};
export const wysiwygOrderedListAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.toOrderedList.run(),
    isActive: (e) => e.actions.toOrderedList.isActive(),
    isEnable: (e) => e.actions.toOrderedList.isEnable(),
};
export const markupOrderedListAction: MarkupEditorCommand = {
    exec: (e) => toOrderedList(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Sink List ----
export const sinkListItem: ToolbarItem = {
    title: i18n.bind(null, 'list__action_sink'),
    icon: icons.sink,
    hotkey: f.toView(A.SinkListItem),
};
export const wysiwygSinkListAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.sinkListItem.run(),
    hintWhenDisabled: () => i18n('list_action_disabled'),
    isActive: (e) => e.actions.sinkListItem.isActive(),
    isEnable: (e) => e.actions.sinkListItem.isEnable(),
};
export const markupSinkListAction: MarkupEditorCommand = {
    exec: (e) => sinkListItemCommand(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// ---- Lift List ----
export const liftListItem: ToolbarItem = {
    title: i18n.bind(null, 'list__action_lift'),
    icon: icons.lift,
    hotkey: f.toView(A.LiftListItem),
};
export const wysiwygLiftListAction: WysiwygEditorCommand = {
    exec: (e) => e.actions.liftListItem.run(),
    hintWhenDisabled: () => i18n('list_action_disabled'),
    isActive: (e) => e.actions.liftListItem.isActive(),
    isEnable: (e) => e.actions.liftListItem.isEnable(),
};
export const markupLiftListAction: MarkupEditorCommand = {
    exec: (e) => liftListItemCommand(e.cm),
    isActive: inactive,
    isEnable: enable,
};

// TODO: @makhnatkin add lists and others
// ---- Math List ----
// export const mathListItem: ToolbarItem = {
//     // type: ToolbarDataType.ListButton,
//     icon: icons.functionInline,
//     // withArrow: true,
//     title: i18n.bind(null, 'math'),
//     // data: [mathInlineItem, mathBlockItem],
// };
