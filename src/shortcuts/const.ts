export enum ModKey {
    Mod = 'mod',
    Alt = 'alt',
    Option = 'alt',
    Cmd = 'cmd',
    Ctrl = 'ctrl',
    Control = 'ctrl',
    Shift = 'shift',
    Tab = 'tab',
}

export enum Key {
    Enter = 'Enter',
    Esc = 'Escape',
}

export enum Action {
    __debug = '__debug__',

    Cancel = 'cancel',
    Submit = 'submit',

    Undo = 'undo',
    Redo = 'redo',

    Bold = 'bold',
    Italic = 'italic',
    Underline = 'underline',
    Strike = 'strike',
    Code = 'code',
    Link = 'link',

    Text = 'text',
    Heading1 = 'h1',
    Heading2 = 'h2',
    Heading3 = 'h3',
    Heading4 = 'h4',
    Heading5 = 'h5',
    Heading6 = 'h6',

    BulletList = 'ulist',
    OrderedList = 'olist',

    LiftListItem = 'list__action_lift',
    SinkListItem = 'list__action_sink',

    Quote = 'quote',
    CodeBlock = 'codeblock',

    Cut = 'cut',
    Note = 'note',
}
