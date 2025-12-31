export type SearchState = {
    search: string;
    replace: string;
    caseSensitive: boolean;
    wholeWord: boolean;
};

export type SearchCounter = {
    current: number;
    total: number;
};
