export enum ListNode {
    ListItem = 'list_item',
    BulletList = 'bullet_list',
    OrderedList = 'ordered_list',
}

export enum ListAction {
    ToBulletList = 'toBulletList',
    ToOrderedList = 'toOrderedList',
    SinkListItem = 'sinkListItem',
    LiftListItem = 'liftListItem',
}
