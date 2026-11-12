import {icons} from 'src/bundle/config/icons';
import {HeadingPreview} from 'src/bundle/config/previews/HeadingPreview';
import {TextPreview} from 'src/bundle/config/previews/TextPreview';
import {gptHotKeys} from 'src/extensions/additional/GPT/constants';
import {i18n as i18nGpt} from 'src/i18n/gpt/extension';
import {i18n as i18nHint} from 'src/i18n/hints';
import {i18n} from 'src/i18n/menubar';
import {i18n as i18nStatus} from 'src/i18n/status';
import {Action as A, formatter as f} from 'src/shortcuts';
import {ToolbarDataType} from 'src/toolbar/types';

import type {ToolbarItemView} from '../types';

// ---- Undo ----
export const undoItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'undo'),
    icon: icons.undo,
    hotkey: f.toView(A.Undo),
};

// ---- Redo ----
export const redoItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'redo'),
    icon: icons.redo,
    hotkey: f.toView(A.Redo),
};

// ---- Bold ----
export const boldItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'bold'),
    icon: icons.bold,
    hotkey: f.toView(A.Bold),
};

// ---- Italic ----
export const italicItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'italic'),
    icon: icons.italic,
    hotkey: f.toView(A.Italic),
};

// ---- Underline ----
export const underlineItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'underline'),
    icon: icons.underline,
    hotkey: f.toView(A.Underline),
};

// ---- Strikethrough ----
export const strikethroughItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'strike'),
    icon: icons.strikethrough,
    hotkey: f.toView(A.Strike),
};

// ---- Monospace ----
export const monospaceItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'mono'),
    icon: icons.mono,
};

// ---- Marked ----
export const markedItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'mark'),
    icon: icons.mark,
};

// ---- Checkbox ----
export const checkboxItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'checkbox'),
    icon: icons.checklist,
};

// ---- Link ----
export const linkItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'link'),
    icon: icons.link,
    hotkey: f.toView(A.Link),
};

// ---- Quote ----
export const quoteItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'quote'),
    icon: icons.quote,
    hotkey: f.toView(A.Quote),
};

// ---- Quote Link ----
export const quoteLinkItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'quotelink'),
    icon: icons.quoteLink,
};

// ---- Cut ----
export const cutItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'cut'),
    icon: icons.cut,
    hotkey: f.toView(A.Cut),
};

// ---- Note ----
export const noteItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'note'),
    icon: icons.note,
    hotkey: f.toView(A.Note),
};

// ---- Table ----
export const tableItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'table'),
    icon: icons.table,
};

// ---- Code ----
export const codeItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'code_inline'),
    icon: icons.code,
    hotkey: f.toView(A.Code),
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

// ---- Tabs ----
export const tabsItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'tabs'),
    icon: icons.tabs,
};

// ---- Math Inline ----
/** @deprecated Use latexInlineItemView from `@gravity-ui/markdown-editor-latex-extension` */
export const mathInlineItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'math_inline'),
    icon: icons.functionInline,
    hint: () => `${i18nHint.bind(null, 'math_hint')()} ${i18nHint.bind(null, 'math_hint_katex')()}`,
};

// ---- Math Block ----
/** @deprecated Use latexBlockItemView from `@gravity-ui/markdown-editor-latex-extension` */
export const mathBlockItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'math_block'),
    icon: icons.functionBlock,
    hint: () => `${i18nHint.bind(null, 'math_hint')()} ${i18nHint.bind(null, 'math_hint_katex')()}`,
};

// ---- Yfm Html Block ----
export const yfmHtmlBlockItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'html'),
    icon: icons.html,
};

// ---- Mermaid ----
export const mermaidItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'mermaid'),
    icon: icons.mermaid,
};

// ---- Code Block ----
export const codeBlockItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'codeblock'),
    icon: icons.codeBlock,
    hotkey: f.toView(A.CodeBlock),
};

// ---- Horizontal Rule ----
export const hruleItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'hrule'),
    icon: icons.horizontalRule,
};

// ---- Emoji ----
export const emojiItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'emoji'),
    icon: icons.emoji,
};

// ---- Heading 1 ----
export const heading1ItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'heading1'),
    icon: icons.h1,
    hotkey: f.toView(A.Heading1),
    aliases: ['h1'],
    preview: <HeadingPreview level={1} />,
};

// ---- Heading 2 ----
export const heading2ItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'heading2'),
    icon: icons.h2,
    hotkey: f.toView(A.Heading2),
    aliases: ['h2'],
    preview: <HeadingPreview level={2} />,
};

// ---- Heading 3 ----
export const heading3ItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'heading3'),
    icon: icons.h3,
    hotkey: f.toView(A.Heading3),
    aliases: ['h3'],
    preview: <HeadingPreview level={3} />,
};

// ---- Heading 4 ----
export const heading4ItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'heading4'),
    icon: icons.h4,
    hotkey: f.toView(A.Heading4),
    aliases: ['h4'],
    preview: <HeadingPreview level={4} />,
};

// ---- Heading 5 ----
export const heading5ItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'heading5'),
    icon: icons.h5,
    hotkey: f.toView(A.Heading5),
    aliases: ['h5'],
    preview: <HeadingPreview level={5} />,
};

// ---- Heading 6 ----
export const heading6ItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'heading6'),
    icon: icons.h6,
    hotkey: f.toView(A.Heading6),
    aliases: ['h6'],
    preview: <HeadingPreview level={6} />,
};

// ---- Bullet List ----
export const bulletListItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'ulist'),
    icon: icons.bulletList,
    hotkey: f.toView(A.BulletList),
};

// ---- Ordered List ----
export const orderedListItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'olist'),
    icon: icons.orderedList,
    hotkey: f.toView(A.OrderedList),
};

// ---- Sink List ----
export const sinkListItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'list__action_sink'),
    icon: icons.sink,
    hotkey: f.toView(A.SinkListItem),
};

// ---- Lift List ----
export const liftListItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'list__action_lift'),
    icon: icons.lift,
    hotkey: f.toView(A.LiftListItem),
};

// ---- Status ----
export const statusItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18nStatus.bind(null, 'button'),
    icon: icons.status,
    aliases: ['badge', 'label'],
};

// ---- Toggle Heading Folding ----
export const toggleHeadingFoldingItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    icon: icons.foldingHeading,
    title: () => i18n('folding-heading'),
    hint: () => i18n('folding-heading__hint'),
};

// ---- Text Context ----
export const textContextItemView: ToolbarItemView<ToolbarDataType.ReactComponent> = {
    type: ToolbarDataType.ReactComponent,
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

// --- Colorify ----
export const colorifyItemView: ToolbarItemView<ToolbarDataType.ReactComponent> = {
    type: ToolbarDataType.ReactComponent,
};

// ---- GPT ----
export const gptItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18nGpt.bind(null, 'help-with-text'),
    hotkey: gptHotKeys.openGptKeyTooltip,
    icon: icons.gpt,
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
/** @deprecated Use latexListItemView from `@gravity-ui/markdown-editor-latex-extension` */
export const mathListItemView: ToolbarItemView<ToolbarDataType.ListButton> = {
    type: ToolbarDataType.ListButton,
    icon: icons.functionInline,
    withArrow: true,
    title: i18n.bind(null, 'math'),
};
