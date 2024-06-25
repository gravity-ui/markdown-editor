export enum ListNode {
    ListItem = 'list_item',
    BulletList = 'bullet_list',
    OrderedList = 'ordered_list',
}

export enum ListsAttr {
    Tight = 'tight',
    /** used in bullet list only */
    Bullet = 'bullet',
    /** used in ordered list only */
    Order = 'order',
    /** used in list item only */
    Markup = 'markup',
}
