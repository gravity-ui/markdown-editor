export type SuggestItem = {
    id: string;
    priority?: number;
    view: {
        icon: any;
        title: string | (() => string);
        hint?: string | (() => string);
    };
    testUrl: (url: string) => boolean;
    run: () => void;
};
