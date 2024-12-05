import Token from 'markdown-it/lib/token';

export const emptyRow = (line: number): Token[] => [
    {
        attrs: null,
        block: true,
        children: null,
        content: '',
        hidden: false,
        info: '',
        level: 0,
        map: [line, line + 1],
        markup: '',
        meta: null,
        nesting: 1,
        tag: 'p',
        type: 'paragraph_open',
        attrIndex: function (): number {
            throw new Error('Function not implemented.');
        },
        attrPush: function (): void {
            throw new Error('Function not implemented.');
        },
        attrSet: function (): void {
            throw new Error('Function not implemented.');
        },
        attrGet: function (): string | null {
            throw new Error('Function not implemented.');
        },
        attrJoin: function (): void {
            throw new Error('Function not implemented.');
        },
    },
    {
        attrs: null,
        block: true,
        children: null,
        content: '',
        hidden: false,
        info: '',
        level: 0,
        map: null,
        markup: '',
        meta: null,
        nesting: -1,
        tag: 'p',
        type: 'paragraph_close',
        attrIndex: function (): number {
            throw new Error('Function not implemented.');
        },
        attrPush: function (): void {
            throw new Error('Function not implemented.');
        },
        attrSet: function (): void {
            throw new Error('Function not implemented.');
        },
        attrGet: function (): string | null {
            throw new Error('Function not implemented.');
        },
        attrJoin: function (): void {
            throw new Error('Function not implemented.');
        },
    },
];

export const blackList: string[] = ['yfm_tbody', 'tab', 'tab-list', 'yfm_cut_content', 'yfm_block'];

export const previosBlockRatio: {[key: string]: number} = {
    yfm_table: -1,
    yfm_cut_content: -1,
    tabs: 1,
    yfm_td: 1,
    mermaid: -1,
};

export const blockRatio: Record<string, number> = {
    tabs: -1,
    table: -1,
};
