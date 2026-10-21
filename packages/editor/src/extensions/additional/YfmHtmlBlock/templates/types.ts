export interface HtmlTemplate {
    id: string;
    title: string;
    /** HTML inserted into the block's srcdoc */
    content: string;
}

export interface YfmHtmlBlockTemplatesOptions {
    /** Templates provided via plugin options; read-only source */
    items?: HtmlTemplate[];
    /** Show the templates button inside the block */
    showButton?: boolean;
    /** Show the "add template" button (writes to localStorage) */
    allowAdd?: boolean;
}
