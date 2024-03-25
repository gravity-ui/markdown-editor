import {
    BoldIcon,
    CheckListIcon,
    CodeBlockIcon,
    CodeInlineIcon,
    CutIcon,
    EmojiIcon,
    FileIcon,
    FunctionBlockIcon,
    FunctionInlineIcon,
    HRuleIcon,
    Heading1Icon,
    Heading2Icon,
    Heading3Icon,
    Heading4Icon,
    Heading5Icon,
    Heading6Icon,
    HeadingIcon,
    ImageIcon,
    ItalicIcon,
    LiftIcon,
    LinkIcon,
    ListBlIcon,
    ListOlIcon,
    MarkIcon,
    MermaidIcon,
    MonoIcon,
    NoteIcon,
    QuoteIcon,
    RedoIcon,
    SinkIcon,
    StrikethroughIcon,
    TableIcon,
    TabsIcon,
    TextColorIcon,
    TextIcon,
    UnderlineIcon,
    UndoIcon,
} from '../../icons';
import {ToolbarIconData} from '../../toolbar/types';

type Icon =
    | 'undo'
    | 'redo'
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strikethrough'
    | 'mono'
    | 'mark'
    | 'textColor'
    | 'text'
    | 'headline'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'bulletList'
    | 'orderedList'
    | 'sink'
    | 'lift'
    | 'cut'
    | 'note'
    | 'code'
    | 'codeBlock'
    | 'link'
    | 'image'
    | 'table'
    | 'quote'
    | 'checklist'
    | 'horizontalRule'
    | 'file'
    | 'functionInline'
    | 'functionBlock'
    | 'emoji'
    | 'tabs'
    | 'mermaid';

type Icons = Record<Icon, ToolbarIconData>;

export const icons: Icons = {
    undo: {data: UndoIcon},
    redo: {data: RedoIcon},

    bold: {data: BoldIcon},
    italic: {data: ItalicIcon},
    underline: {data: UnderlineIcon},
    strikethrough: {data: StrikethroughIcon},
    mono: {data: MonoIcon},
    mark: {data: MarkIcon},

    textColor: {data: TextColorIcon},

    text: {data: TextIcon},
    headline: {data: HeadingIcon},
    h1: {data: Heading1Icon},
    h2: {data: Heading2Icon},
    h3: {data: Heading3Icon},
    h4: {data: Heading4Icon},
    h5: {data: Heading5Icon},
    h6: {data: Heading6Icon},

    bulletList: {data: ListBlIcon},
    orderedList: {data: ListOlIcon},

    sink: {data: SinkIcon},
    lift: {data: LiftIcon},

    cut: {data: CutIcon},
    note: {data: NoteIcon},

    code: {data: CodeInlineIcon},
    codeBlock: {data: CodeBlockIcon},

    link: {data: LinkIcon},
    image: {data: ImageIcon},

    table: {data: TableIcon},
    quote: {data: QuoteIcon},
    checklist: {data: CheckListIcon},
    horizontalRule: {data: HRuleIcon},

    file: {data: FileIcon},

    functionInline: {data: FunctionInlineIcon},
    functionBlock: {data: FunctionBlockIcon},

    emoji: {data: EmojiIcon},

    tabs: {data: TabsIcon},
    mermaid: {data: MermaidIcon},
};
