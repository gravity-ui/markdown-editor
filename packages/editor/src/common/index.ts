export type MarkupString = string & {};

export interface CommonEditor extends ContentHandler {
    focus(): void;
    hasFocus(): boolean;
    getValue(): MarkupString;
    isEmpty(): boolean; // TODO[major]: move isEmpty() to ContentHandler interface
}

export interface ContentHandler {
    clear(): void;
    replace(newMarkup: MarkupString): void;
    prepend(markup: MarkupString): void;
    append(markup: MarkupString): void;
    moveCursor(position: 'start' | 'end'): void;
    /**
     * Insert markup at the current cursor position.
     * If `index` is provided, insert at that position instead.
     */
    insertAt(markup: MarkupString, index?: number): void;
}
