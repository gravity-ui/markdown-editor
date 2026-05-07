export type MarkdownEditorMode = 'wysiwyg' | 'markup';
export type MarkdownEditorPreset = 'zero' | 'commonmark' | 'default' | 'yfm' | 'full';
export type MarkdownEditorSplitMode = false | 'horizontal' | 'vertical';

export type WysiwygPlaceholderOptions = {
    value?: string | (() => string);
    /**
     * Default – empty-doc.
     *
     * Values:
     * - 'empty-doc' – The placeholder will only be shown when the document is completely empty;
     * - 'empty-row-top-level' – The placeholder will be displayed in an empty line that is at the top level of the document structure;
     * - 'empty-row' – The placeholder will be shown in any empty line within the document, regardless of its nesting level.
     */
    behavior?: 'empty-doc' | 'empty-row-top-level' | 'empty-row';
};
