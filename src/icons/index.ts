import TabsIcon from './Tabs';
import MonoIcon from './Mono';
import {
    ArrowUturnCcwLeft as UndoIcon,
    ArrowUturnCwRight as RedoIcon,
    //
    Bold as BoldIcon,
    Italic as ItalicIcon,
    Underline as UnderlineIcon,
    Strikethrough as StrikethroughIcon,
    FontCursor as MarkIcon,
    //
    Heading as HeadingIcon,
    Heading1 as Heading1Icon,
    Heading2 as Heading2Icon,
    Heading3 as Heading3Icon,
    Heading4 as Heading4Icon,
    Heading5 as Heading5Icon,
    Heading6 as Heading6Icon,
    //
    ListUl as ListBlIcon,
    ListOl as ListOlIcon,
    //
    TextOutdent as LiftIcon,
    TextIndent as SinkIcon,
    //
    Font as TextColorIcon,
    //
    Link as LinkIcon,
    QuoteClose as QuoteIcon,
    Scissors as CutIcon,
    Sticker as NoteIcon,
    Minus as HRuleIcon,
    //
    LayoutList as TableIcon,
    //
    ChevronsExpandHorizontal as IframeIcon,
    SquareCheck as CheckListIcon,
    Picture as ImageIcon,
    //
    Code as CodeInlineIcon,
    FileCode as CodeBlockIcon,
    //
    Function as FunctionInlineIcon,
    CurlyBracketsFunction as FunctionBlockIcon,
} from '@gravity-ui/icons';
import {ToolbarIconData} from '../toolbar';

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
    | 'iframe'
    | 'table'
    | 'quote'
    | 'checklist'
    | 'horizontalRule'
    | 'functionInline'
    | 'functionBlock'
    | 'tabs';

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
    iframe: {data: IframeIcon},

    table: {data: TableIcon},
    quote: {data: QuoteIcon},
    checklist: {data: CheckListIcon},
    horizontalRule: {data: HRuleIcon},

    functionInline: {data: FunctionInlineIcon},
    functionBlock: {data: FunctionBlockIcon},

    tabs: {data: TabsIcon},
};
