export interface LineRange {
    from: number;
    to: number;
}

export interface MarkupLineNumbersConfig {
    /** Show line numbers in the gutter. Default: false */
    enabled?: boolean;
    /** Enable line highlighting (clickable line numbers + highlight decoration). Default: false */
    highlightLines?: boolean;
    /** Initial line range to highlight on mount (0-based, inclusive) */
    initialSelectedLines?: LineRange;
    /** Called when user clicks on a line number (only when highlightLines is true). 0-based line number. */
    onLineClick?: (line: number) => void;
    /** 0-based line number to scroll to on mount in markup mode */
    scrollToLine?: number;
}
