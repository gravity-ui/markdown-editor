export type MarkupString = string & {};

export interface CommonEditor extends ContentHandler {
    focus(): void;
    hasFocus(): boolean;
    getValue(): MarkupString;
    isEmpty(): boolean;
}

export interface ContentHandler {
    clear(): void;
    replace(newMarkup: MarkupString): void;
    prepend(markup: MarkupString): void;
    append(markup: MarkupString): void;
    moveCursor(position: 'start' | 'end'): void;
}
