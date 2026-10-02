import type {ensureSyntaxTree} from '@codemirror/language';
import type {ChangeSpec, SelectionRange} from '@codemirror/state';

export type SyntaxTree = NonNullable<ReturnType<typeof ensureSyntaxTree>>;
export type SyntaxNode = SyntaxTree['topNode'];
export type TextRange = {from: number; to: number};
export type MarkupWrapper = {open: TextRange; close: TextRange};
export type SourceEdit = TextRange & {insert: string};
/** An editable source range; wrapper points to one existing pair to keep or remove. */
export type FormattingPart = TextRange & {
    wrapper?: MarkupWrapper;
    /** Local source edit: skip URL normalization and syntax-based italic marker choice. */
    literal?: boolean;
    /** One unpaired block-edge marker that add mode can complete. */
    existingMarker?: 'open' | 'close';
};
/** Styles and code toggle one layer; wrap always adds markers (color and math). */
export type InlineCommandSpec = {kind: 'wrap' | 'style' | 'code'; before: string; after: string};
/** Edits and selection bounds use old document positions until the transaction maps them. */
export type FormattingPlan = {
    edits: ChangeSpec[];
    selections: {
        range: SelectionRange;
        bounds: TextRange;
        cursorOffset: number;
        openingLength: number;
        closingLength: number;
    }[];
};
