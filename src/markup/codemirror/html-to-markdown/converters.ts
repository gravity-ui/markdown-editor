import {
    CodeHandler,
    FormattingHandler,
    HeaderHandler,
    LinkHandler,
    NodeHandler,
    ParagraphHandler,
    TextNodeHandler,
    GenericHandler,
} from './handlers';
import {FormattingHelper} from './helpers';

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
}

/**
 * Main converter class that implements the visitor interface to convert HTML to Markdown.
 * Uses the Chain of Responsibility pattern for handling different node types.
 */
export class MarkdownConverter implements HTMLNodeVisitor {
    private formatHelper: FormattingHelper;
    private handler: NodeHandler;

    constructor() {
        this.formatHelper = new FormattingHelper();
        // Set up the chain of responsibility for handling different node types
        this.handler = this.setupHandlerChain();
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

        // Chain handlers together in priority order
        textHandler
            .setNext(linkHandler)
            .setNext(headerHandler)
            .setNext(paragraphHandler)
            .setNext(formattingHandler)
            .setNext(codeHandler)
            .setNext(genericHandler);

        return textHandler;
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
                ? this.formatHelper.applyFormatting(linkText, node) // Plain text link
                : Array.from(node.childNodes)
                      .map((child) => {
                          if (child.nodeType === Node.ELEMENT_NODE) {
                              return this.formatHelper.applyFormatting(
                                  child.textContent || '',
                                  child as HTMLElement,
                              );
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
            return this.formatHelper.applyFormatting(text, node);
        }
        return this.formatHelper.applyFormatting(this.visitGeneric(node), node);
    }

    /**
     * Converts HTML code elements to Markdown inline code syntax.
     */
    visitCode(node: HTMLElement): string {
        return `\`${this.collectCodeContent(node)}\``;
    }

    /**
     * Handles generic HTML elements by processing their children.
     */
    visitGeneric(node: HTMLElement): string {
        return this.processChildren(node);
    }

    /**
     * Recursively collects and processes text content from a node and its children.
     */
    private collectTextContent(node: Node): string {
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
     * Processes a single node using the handler chain.
     */
    processNode(node: Node): string {
        const result = this.getHandler().handle(node, this);
        return result;
    }

    /**
     * Gets the first handler in the chain.
     */
    private getHandler(): NodeHandler {
        return this.handler;
    }
}
