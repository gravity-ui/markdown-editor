export interface InitialLineSelection {
    /** 0-based line number */
    lineFrom: number;
    /** 0-based line number, optional. Defaults to `lineFrom`. */
    lineTo?: number;
}

export interface MarkupLineNumbersConfig {
    /** Show line numbers in the gutter. Default: false */
    enabled?: boolean;
    /** Initial line range to select and scroll to on mount (0-based, inclusive) */
    initialSelection?: InitialLineSelection;
}
