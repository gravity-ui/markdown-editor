/**
 * Interface defining methods for visiting different types of HTML nodes.
 * Each method corresponds to a specific HTML element type and returns its Markdown representation.
 */
export interface HTMLNodeVisitor {
    /** Converts a text node to Markdown */
    visitText(node: Text): string;
    /** Converts an anchor element to Markdown link syntax */
    visitLink(node: HTMLAnchorElement): string;
    /** Converts a header element to Markdown heading syntax */
    visitHeader(node: HTMLElement, level: number): string;
    /** Converts a paragraph element to Markdown */
    visitParagraph(node: HTMLElement): string;
    /** Converts formatting elements (bold, italic, etc.) to Markdown */
    visitFormatting(node: HTMLElement): string;
    /** Converts code elements to Markdown inline code syntax */
    visitCode(node: HTMLElement): string;
    /** Handles generic HTML elements with no specific Markdown conversion */
    visitGeneric(node: HTMLElement): string;
    /** Converts an HTML div element to Markdown format, adding a single newline */
    visitDiv(node: HTMLElement): string;
    /** Converts an HTML br element to a newline in Markdown */
    visitBr(): string;
    /** Converts a table row element to Markdown */
    visitTableRow(node: HTMLTableRowElement): string;
    /** Converts an HTML table element to Markdown table format */
    visitTable(node: HTMLTableElement): string;
    /** Convert img tag to Markdown image format */
    visitImage(node: HTMLImageElement): string;
}
