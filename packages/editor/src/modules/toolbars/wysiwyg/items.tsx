import {WToolbarColors} from 'src/bundle/toolbar/wysiwyg/WToolbarColors';
import {WToolbarTextSelect} from 'src/bundle/toolbar/wysiwyg/WToolbarTextSelect';
import {headingType, pType} from 'src/extensions/specs';
import {i18n} from 'src/i18n/menubar';
import type {ToolbarDataType} from 'src/toolbar/types';

import type {ToolbarItemWysiwyg} from '../types';

export const undoItemWysiwyg: ToolbarItemWysiwyg = {
    hintWhenDisabled: false,
    exec: (e) => e.actions.undo.run(),
    isActive: (e) => e.actions.undo.isActive(),
    isEnable: (e) => e.actions.undo.isEnable(),
};

export const redoItemWysiwyg: ToolbarItemWysiwyg = {
    hintWhenDisabled: false,
    exec: (e) => e.actions.redo.run(),
    isActive: (e) => e.actions.redo.isActive(),
    isEnable: (e) => e.actions.redo.isEnable(),
};

export const boldItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.bold.run(),
    isActive: (e) => e.actions.bold.isActive(),
    isEnable: (e) => e.actions.bold.isEnable(),
};

export const italicItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.italic.run(),
    isActive: (e) => e.actions.italic.isActive(),
    isEnable: (e) => e.actions.italic.isEnable(),
};

export const underlineItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.underline.run(),
    isActive: (e) => e.actions.underline.isActive(),
    isEnable: (e) => e.actions.underline.isEnable(),
};

export const strikethroughItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.strike.run(),
    isActive: (e) => e.actions.strike.isActive(),
    isEnable: (e) => e.actions.strike.isEnable(),
};

export const monospaceItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.mono.run(),
    isActive: (e) => e.actions.mono.isActive(),
    isEnable: (e) => e.actions.mono.isEnable(),
};

export const markedItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.mark.run(),
    isActive: (e) => e.actions.mark.isActive(),
    isEnable: (e) => e.actions.mark.isEnable(),
};

export const checkboxItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.addCheckbox.run(),
    isActive: (e) => e.actions.addCheckbox.isActive(),
    isEnable: (e) => e.actions.addCheckbox.isEnable(),
};

export const linkItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.addLink.run(),
    isActive: (e) => e.actions.addLink.isActive(),
    isEnable: (e) => e.actions.addLink.isEnable(),
};

export const quoteItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.quote.run(),
    isActive: (e) => e.actions.quote.isActive(),
    isEnable: (e) => e.actions.quote.isEnable(),
};

export const quoteLinkItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => {
        e.actions.quoteLink.run();
        e.actions.addLinkToQuoteLink.run();
    },
    isActive: (e) => e.actions.quoteLink.isActive(),
    isEnable: (e) => e.actions.quoteLink.isEnable(),
};

export const cutItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toYfmCut.run(),
    isActive: (e) => e.actions.toYfmCut.isActive(),
    isEnable: (e) => e.actions.toYfmCut.isEnable(),
};

export const noteItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toYfmNote.run(),
    isActive: (e) => e.actions.toYfmNote.isActive(),
    isEnable: (e) => e.actions.toYfmNote.isEnable(),
};

export const tableItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.createYfmTable.run(),
    isActive: (e) => e.actions.createYfmTable.isActive(),
    isEnable: (e) => e.actions.createYfmTable.isEnable(),
};

export const codeItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.code.run(),
    isActive: (e) => e.actions.code.isActive(),
    isEnable: (e) => e.actions.code.isEnable(),
};

export const imageItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.addImageWidget.run(),
    isActive: (e) => e.actions.addImageWidget.isActive(),
    isEnable: (e) => e.actions.addImageWidget.isEnable(),
};

export const fileItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.addFile.run(),
    isActive: (e) => e.actions.addFile.isActive(),
    isEnable: (e) => e.actions.addFile.isEnable(),
};

export const tabsItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toYfmTabs.run(),
    isActive: (e) => e.actions.toYfmTabs.isActive(),
    isEnable: (e) => e.actions.toYfmTabs.isEnable(),
};

/** @deprecated Use latexInlineItemWysiwyg from `@gravity-ui/markdown-editor-latex-extension` */
export const mathInlineItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.addMathInline.run(),
    isActive: (e) => e.actions.addMathInline.isActive(),
    isEnable: (e) => e.actions.addMathInline.isEnable(),
};

/** @deprecated Use latexBlockItemWysiwyg from `@gravity-ui/markdown-editor-latex-extension` */
export const mathBlockItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toMathBlock.run(),
    isActive: (e) => e.actions.toMathBlock.isActive(),
    isEnable: (e) => e.actions.toMathBlock.isEnable(),
};

export const yfmHtmlBlockItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.createYfmHtmlBlock.run(),
    isActive: (e) => e.actions.createYfmHtmlBlock.isActive(),
    isEnable: (e) => e.actions.createYfmHtmlBlock.isEnable(),
};

export const mermaidItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.createMermaid.run(),
    isActive: (e) => e.actions.createMermaid.isActive(),
    isEnable: (e) => e.actions.createMermaid.isEnable(),
};

export const codeBlockItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toCodeBlock.run(),
    isActive: (e) => e.actions.toCodeBlock.isActive(),
    isEnable: (e) => e.actions.toCodeBlock.isEnable(),
};

export const hruleItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.hRule.run(),
    isActive: (e) => e.actions.hRule.isActive(),
    isEnable: (e) => e.actions.hRule.isEnable(),
};

export const emojiItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.openEmojiSuggest.run({}),
    isActive: (e) => e.actions.openEmojiSuggest.isActive(),
    isEnable: (e) => e.actions.openEmojiSuggest.isEnable(),
};

export const heading1ItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toH1.run(),
    isActive: (e) => e.actions.toH1.isActive(),
    isEnable: (e) => e.actions.toH1.isEnable(),
};

export const heading2ItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toH2.run(),
    isActive: (e) => e.actions.toH2.isActive(),
    isEnable: (e) => e.actions.toH2.isEnable(),
};

export const heading3ItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toH3.run(),
    isActive: (e) => e.actions.toH3.isActive(),
    isEnable: (e) => e.actions.toH3.isEnable(),
};

export const heading4ItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toH4.run(),
    isActive: (e) => e.actions.toH4.isActive(),
    isEnable: (e) => e.actions.toH4.isEnable(),
};

export const heading5ItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toH5.run(),
    isActive: (e) => e.actions.toH5.isActive(),
    isEnable: (e) => e.actions.toH5.isEnable(),
};

export const heading6ItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toH6.run(),
    isActive: (e) => e.actions.toH6.isActive(),
    isEnable: (e) => e.actions.toH6.isEnable(),
};

export const bulletListItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toBulletList.run(),
    isActive: (e) => e.actions.toBulletList.isActive(),
    isEnable: (e) => e.actions.toBulletList.isEnable(),
};

export const orderedListItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toOrderedList.run(),
    isActive: (e) => e.actions.toOrderedList.isActive(),
    isEnable: (e) => e.actions.toOrderedList.isEnable(),
};

export const sinkListItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.sinkListItem.run(),
    hintWhenDisabled: () => i18n('list_action_disabled'),
    isActive: (e) => e.actions.sinkListItem.isActive(),
    isEnable: (e) => e.actions.sinkListItem.isEnable(),
};

export const liftListItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.liftListItem.run(),
    hintWhenDisabled: () => i18n('list_action_disabled'),
    isActive: (e) => e.actions.liftListItem.isActive(),
    isEnable: (e) => e.actions.liftListItem.isEnable(),
};

export const statusItemWysiwyg: ToolbarItemWysiwyg = {
    isActive: (editor) => editor.actions.addStatus?.isActive() ?? false,
    isEnable: (editor) => editor.actions.addStatus?.isEnable() ?? false,
    exec: (editor) => editor.actions.addStatus.run(),
};

export const toggleHeadingFoldingItemWysiwyg: ToolbarItemWysiwyg = {
    isActive: (editor) => editor.actions.toggleHeadingFolding?.isActive() ?? false,
    isEnable: (editor) => editor.actions.toggleHeadingFolding?.isEnable() ?? false,
    exec: (editor) => editor.actions.toggleHeadingFolding.run(),
    condition: 'enabled',
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

export const paragraphItemWisywig: ToolbarItemWysiwyg = {
    exec: (e) => e.actions.toParagraph.run(),
    isActive: (e) => e.actions.toParagraph.isActive(),
    isEnable: (e) => e.actions.toParagraph.isEnable(),
};

export const colorifyItemWysiwyg: ToolbarItemWysiwyg<ToolbarDataType.ReactComponent> = {
    component: WToolbarColors,
    noRerenderOnUpdate: true, // WToolbarColors uses toolbar context to update its own state
    width: 42,
};

export const gptItemWysiwyg: ToolbarItemWysiwyg = {
    hintWhenDisabled: false,
    exec: (e) => e.actions.addGptWidget.run({}),
    isActive: (e) => e.actions.addGptWidget.isActive(),
    isEnable: (e) => e.actions.addGptWidget.isEnable(),
};
