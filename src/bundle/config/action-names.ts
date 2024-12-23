const names = [
    'anchor',
    'bold',
    'bulletList',
    'checkbox',
    /** @deprecated use codeBlock */
    'code_block',
    'codeBlock',
    /** @deprecated use codeInline */
    'code_inline',
    'codeInline',
    'colorify',
    'emoji',
    'file',
    'filePopup',
    'gpt',
    'heading1',
    'heading2',
    'heading3',
    'heading4',
    'heading5',
    'heading6',
    'emptyRow',
    /** @deprecated use horizontalRule */
    'horizontalrule',
    'horizontalRule',
    'image',
    'imagePopup',
    'italic',
    'liftListItem',
    'link',
    'mark',
    /** @deprecated use mathBlock */
    'math_block',
    'mathBlock',
    /** @deprecated use mathInline */
    'math_inline',
    'mathInline',
    'mermaid',
    'mono',
    'orderedList',
    'paragraph',
    'quote',
    'redo',
    'sinkListItem',
    'strike',
    'table',
    'tabs',
    'underline',
    'undo',
    /** @deprecated use block */
    'yfm_block',
    'block',
    /** @deprecated use cut */
    'yfm_cut',
    'cut',
    /** @deprecated use htmlBlock */
    'yfm_html_block',
    'htmlBlock',
    /** @deprecated use layout */
    'yfm_layout',
    'layout',
    /** @deprecated use note */
    'yfm_note',
    'note',
] as const;

type ItemsType<L extends readonly string[]> = L extends readonly (infer T)[] ? T : never;

const namesObj = names.reduce<Record<ItemsType<typeof names>, string>>(
    (obj, val) => {
        obj[val] = val;
        return obj;
    },
    {} as Record<ItemsType<typeof names>, string>,
);

export const ActionName: Readonly<typeof namesObj> = namesObj;
