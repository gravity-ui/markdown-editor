import {
    Bold as BoldIcon,
    SquareCheck as CheckListIcon,
    FileCode as CodeBlockIcon,
    Code as CodeInlineIcon,
    Scissors as CutIcon,
    CurlyBracketsFunction as FunctionBlockIcon,
    Function as FunctionInlineIcon,
    Minus as HRuleIcon,
    Heading1 as Heading1Icon,
    Heading2 as Heading2Icon,
    Heading3 as Heading3Icon,
    Heading4 as Heading4Icon,
    Heading5 as Heading5Icon,
    Heading6 as Heading6Icon,
    Heading as HeadingIcon,
    ChevronsExpandHorizontal as IframeIcon,
    Picture as ImageIcon,
    Italic as ItalicIcon,
    TextOutdent as LiftIcon,
    Link as LinkIcon,
    ListUl as ListBlIcon,
    ListOl as ListOlIcon,
    FontCursor as MarkIcon,
    Sticker as NoteIcon,
    QuoteClose as QuoteIcon,
    ArrowUturnCwRight as RedoIcon,
    TextIndent as SinkIcon,
    Strikethrough as StrikethroughIcon,
    LayoutList as TableIcon,
    Font as TextColorIcon,
    Underline as UnderlineIcon,
    ArrowUturnCcwLeft as UndoIcon,
} from '@gravity-ui/icons';

import {ToolbarIconData} from '../toolbar';

import MonoIcon from './Mono';
import TabsIcon from './Tabs';

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
