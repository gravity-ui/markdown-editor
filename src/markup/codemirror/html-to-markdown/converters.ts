import {
    BrHandler,
    CodeHandler,
    DivHandler,
    FormattingHandler,
    GenericHandler,
    HeaderHandler,
    ImageHandler,
    LinkHandler,
    type NodeHandler,
    OrderedListHandler,
    ParagraphHandler,
    TableHandler,
    TableRowHandler,
    TextNodeHandler,
    UnorderedListHandler,
} from './handlers';
import {applyFormatting} from './helpers';

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

/**
 * Main converter class that implements the visitor interface to convert HTML to Markdown.
 * Uses the Chain of Responsibility pattern for handling different node types.
 */
export class MarkdownConverter implements HTMLNodeVisitor {
    private handler: NodeHandler;

    constructor() {
        // Set up the chain of responsibility for handling different node types
        this.handler = this.setupHandlerChain();
    }

    /**
     * Converts a text node to Markdown, escaping special characters.
     */
    visitText(node: Text): string {
        return (node.textContent || '').replace(/\n+/g, '').replace(/([<>])/g, '\\$1');
    }

    /**
     * Converts an HTML anchor element to Markdown link syntax.
     */
    visitLink(node: HTMLAnchorElement): string {
        const linkText = this.collectTextContent(node);
        const url = node.href || '';
        // Handle links with formatted content vs plain text differently
        const formattedText =
            node.childNodes.length === 1 && node.firstChild?.nodeType === Node.TEXT_NODE
                ? applyFormatting(linkText, node) // Plain text link
                : Array.from(node.childNodes)
                      .map((child) => {
                          if (child.nodeType === Node.ELEMENT_NODE) {
                              return applyFormatting(child.textContent || '', child as HTMLElement);
                          }
                          return child.textContent || '';
                      })
                      .join(''); // Apply formatting for each formatted child node
        return `[${formattedText}](${url} "${linkText.replace(/"/g, '\\"')}")`;
    }

    /**
     * Converts an HTML heading element to Markdown heading syntax.
     */
    visitHeader(node: HTMLElement, level: number): string {
        const headerContent = this.collectTextContent(node);
        return '#'.repeat(level) + ' ' + headerContent + '\n';
    }

    /**
     * Converts an HTML paragraph to Markdown format.
     */
    visitParagraph(node: HTMLElement): string {
        const content = this.processChildren(node);
        return content.trim() + '\n\n';
    }

    /**
     * Applies Markdown formatting (bold, italic, etc.) to text content.
     */
    visitFormatting(node: HTMLElement): string {
        if (node.childNodes.length === 1 && node.firstChild?.nodeType === Node.TEXT_NODE) {
            const text = this.collectTextContent(node);
            return applyFormatting(text, node);
        }
        return applyFormatting(this.visitGeneric(node), node);
    }

    /**
     * Converts HTML code elements to Markdown inline code syntax.
     */
    visitCode(node: HTMLElement): string {
        const codeContent = this.collectCodeContent(node);
        if (codeContent.includes('\n')) {
            return '```\n' + codeContent + '\n```\n';
        } else if (codeContent.includes('`')) {
            return '`` ' + codeContent + ' ``';
        } else {
            return `\`${codeContent}\``;
        }
    }

    /**
     * Handles generic HTML elements by processing their children.
     */
    visitGeneric(node: HTMLElement): string {
        return this.processChildren(node);
    }

    /**
     * Converts an HTML div element to Markdown format, adding a single newline.
     */
    visitDiv(node: HTMLElement): string {
        const content = this.processChildren(node);
        return content + '\n'; // Add a single newline for <div>
    }

    /**
     * Converts an HTML br element to a newline in Markdown.
     */
    visitBr(): string {
        return '\n'; // Single newline for <br>
    }

    /**
     * Converts an HTML table row element to Markdown table row format.
     */
    visitTableRow(node: HTMLTableRowElement): string {
        const cells = Array.from(node.children).map((cell) => {
            return this.visitGeneric(cell as HTMLElement).trim() || '';
        });
        return '||\n' + cells.join('\n|\n') + '\n||';
    }

    /**
     * Converts an HTML table element to Markdown table format.
     */
    visitTable(node: HTMLTableElement): string {
        const rows: string[] = [];

        const tableRows = Array.from(node.querySelectorAll('tr'));
        tableRows.forEach((row) => {
            rows.push(this.visitTableRow(row as HTMLTableRowElement));
        });

        return '\n\n#|\n' + rows.join('\n') + '\n|#\n\n';
    }

    /**
     * Converts img tag to Markdown image format
     */
    visitImage(node: HTMLImageElement): string {
        const imgElement = node as HTMLImageElement;
        const altText = imgElement.alt || '';
        const src = imgElement.src || '';
        return `![${altText}](${src})`;
    }

    /**
     * Processes a single node using the handler chain.
     */
    processNode(node: Node): string {
        const result = this.getHandler().handle(node, this as HTMLNodeVisitor);
        return result;
    }

    /**
     * Creates and links together handlers in a specific order implementing the Chain of Responsibility pattern.
     * @returns The first handler in the chain
     */
    private setupHandlerChain(): NodeHandler {
        // Create handlers for each type of node
        const textHandler = new TextNodeHandler();
        const linkHandler = new LinkHandler();
        const headerHandler = new HeaderHandler();
        const paragraphHandler = new ParagraphHandler();
        const formattingHandler = new FormattingHandler();
        const codeHandler = new CodeHandler();
        const genericHandler = new GenericHandler();
        const orderedListHandler = new OrderedListHandler();
        const unorderedListHandler = new UnorderedListHandler();
        const divHandler = new DivHandler();
        const brHandler = new BrHandler();
        const tableRowHandler = new TableRowHandler();
        const tableHandler = new TableHandler();
        const imageHandler = new ImageHandler(); // New handler for <img>

        // Chain handlers together in priority order
        textHandler
            .setNext(linkHandler)
            .setNext(headerHandler)
            .setNext(paragraphHandler)
            .setNext(divHandler)
            .setNext(brHandler)
            .setNext(orderedListHandler)
            .setNext(unorderedListHandler)
            .setNext(formattingHandler)
            .setNext(codeHandler)
            .setNext(imageHandler) // Add image handler
            .setNext(tableHandler)
            .setNext(tableRowHandler)
            .setNext(genericHandler);

        return textHandler;
    }

    /**
     * Recursively collects and processes text content from a node and its children.
     */
    private collectTextContent(node: Node): string {
        // handle seo elements (hide it's content)
        if ((node as HTMLElement).className === 'visually-hidden') {
            return '';
        }
        if (node.nodeType === Node.TEXT_NODE) {
            return this.visitText(node as Text);
        }
        return Array.from(node.childNodes)
            .map((child) => this.collectTextContent(child))
            .join('');
    }

    /**
     * Collects raw text content from code elements.
     */
    private collectCodeContent(node: Node): string {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent || '';
        }
        return Array.from(node.childNodes)
            .map((child) => this.collectCodeContent(child))
            .join('');
    }

    /**
     * Processes all child nodes of a given node.
     */
    private processChildren(node: Node): string {
        return Array.from(node.childNodes)
            .map((child) => this.processNode(child))
            .join('');
    }

    /**
     * Gets the first handler in the chain.
     */
    private getHandler(): NodeHandler {
        return this.handler;
    }
}
