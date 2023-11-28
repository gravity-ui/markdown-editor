const names = [
    'undo',
    'redo',
    'bold',
    'italic',
    'underline',
    'strike',
    'mono',
    'mark',
    'heading1',
    'heading2',
    'heading3',
    'heading4',
    'heading5',
    'heading6',
    'bulletList',
    'orderedList',
    'liftListItem',
    'sinkListItem',
    'checkbox',
    'quote',
    'yfm_cut',
    'yfm_note',
    'table',
    'code_inline',
    'code_block',
    'horizontalrule',
    'math_inline',
    'math_block',
    'tabs',
] as const;

type ItemsType<L extends readonly string[]> = L extends readonly (infer T)[] ? T : never;

const namesObj = names.reduce<Record<ItemsType<typeof names>, string>>((obj, val) => {
    obj[val] = val;
    return obj;
}, {} as Record<ItemsType<typeof names>, string>);

export const ActionName: Readonly<typeof namesObj> = namesObj;
