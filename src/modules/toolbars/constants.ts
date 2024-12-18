const lists = ['heading', 'lists', 'code'] as const;

type ListsType<L extends readonly string[]> = L extends readonly (infer T)[] ? T : never;

const listsObj = lists.reduce<Record<ListsType<typeof lists>, string>>(
    (obj, val) => {
        obj[val] = val;
        return obj;
    },
    {} as Record<ListsType<typeof lists>, string>,
);

export const ListName: Readonly<typeof listsObj> = listsObj;

const toolbars = [
    'markupHidden',
    'markupMain',
    'wysiwygHidden',
    'wysiwygMain',
    'wysiwygSelection',
    'wysiwygSlash',
] as const;

type ToolbarType<L extends readonly string[]> = L extends readonly (infer T)[] ? T : never;

const toolbarsObj = toolbars.reduce<Record<ToolbarType<typeof toolbars>, string>>(
    (obj, val) => {
        obj[val] = val;
        return obj;
    },
    {} as Record<ToolbarType<typeof toolbars>, string>,
);

export const ToolbarName: Readonly<typeof toolbarsObj> = toolbarsObj;
