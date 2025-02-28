export enum ListNode {
    ListItem = 'list_item',
    BulletList = 'bullet_list',
    OrderedList = 'ordered_list',
}

export enum ListsAttr {
    Tight = 'tight',
    /** used in ordered list only */
    Order = 'order',
    Markup = 'markup',
}

export const Markup = {
    bullet: {
        values: ['-', '+', '*'],
        default: '*',
    },
    ordered: {
        values: ['.', ')'],
        default: '.',
    },
};
