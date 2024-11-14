import { HTMLNodeVisitor } from "./converters";

/**
 * Base handler class implementing the Chain of Responsibility pattern for HTML node processing.
 * Each concrete handler decides whether it can process a node or should pass it to the next handler.
 */
export abstract class NodeHandler {
    protected next: NodeHandler | null = null;

    /**
     * Sets up the next handler in the chain
     * @param handler - The next handler to process nodes
     * @returns The handler that was set as next
     */
    setNext(handler: NodeHandler): NodeHandler {
        this.next = handler;
        return handler;
    }

    /**
     * Process the given node or delegate to the next handler
     * @param node - The DOM node to process
     * @param visitor - The visitor containing node processing logic
     * @returns Processed markdown string
     */
    abstract handle(node: Node, visitor: HTMLNodeVisitor): string;

    /**
     * Delegates processing to the next handler in the chain
     * @param node - The DOM node to process
     * @param visitor - The visitor containing node processing logic
     * @returns Processed markdown string or empty string if no next handler
     */
    protected handleNext(node: Node, visitor: HTMLNodeVisitor): string {
        if (this.next) {
            return this.next.handle(node, visitor);
        }
        return '';
    }
}

/**
 * Handles text nodes, converting them to markdown text
 */
export class TextNodeHandler extends NodeHandler {
    /**
     * @param node - The DOM node to process
     * @param visitor - The visitor containing node processing logic
     * @returns Processed markdown string
     */
    handle(node: Node, visitor: HTMLNodeVisitor): string {
        if (node.nodeType === Node.TEXT_NODE) {
            return visitor.visitText(node as Text);
        }
        return this.handleNext(node, visitor);
    }
}

/**
 * Handles anchor elements, converting them to markdown links
 */
export class LinkHandler extends NodeHandler {
    handle(node: Node, visitor: HTMLNodeVisitor): string {
        if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName.toLowerCase() === 'a') {
            return visitor.visitLink(node as HTMLAnchorElement);
        }
        return this.handleNext(node, visitor);
    }
}

/**
 * Handles header elements (h1-h6), converting them to markdown headers
 */
export class HeaderHandler extends NodeHandler {
    /**
     * @param node - The DOM node to process
     * @param visitor - The visitor containing node processing logic
     * @returns Processed markdown string
     */
    handle(node: Node, visitor: HTMLNodeVisitor): string {
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return this.handleNext(node, visitor);
        }
        const tagName = (node as Element).tagName.toLowerCase();
        const headerMatch = tagName.match(/^h([1-6])$/);
        if (headerMatch) {
            const headerLevel = parseInt(headerMatch[1], 10);
            return visitor.visitHeader(node as HTMLElement, headerLevel);
        }
        return this.handleNext(node, visitor);
    }
}

/**
 * Handles paragraph elements, converting them to markdown paragraphs
 */
export class ParagraphHandler extends NodeHandler {
    handle(node: Node, visitor: HTMLNodeVisitor): string {
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return this.handleNext(node, visitor);
        }
        if ((node as Element).tagName.toLowerCase() === 'p') {
            return visitor.visitParagraph(node as HTMLElement);
        }
        return this.handleNext(node, visitor);
    }
}

/**
 * Handles text formatting elements (b, strong, i, em), converting them to markdown formatting
 */
export class FormattingHandler extends NodeHandler {
    /**
     * @param node - The DOM node to process
     * @param visitor - The visitor containing node processing logic
     * @returns Processed markdown string
     */
    handle(node: Node, visitor: HTMLNodeVisitor): string {
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return this.handleNext(node, visitor);
        }
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        const formattingTags = ['b', 'strong', 'i', 'em', 'span'];
        if (formattingTags.includes(tagName) &&
            !['a', 'code'].includes(element.parentElement?.tagName.toLowerCase() || '')) {
            return visitor.visitFormatting(element as HTMLElement);
        }
        return this.handleNext(node, visitor);
    }
}

/**
 * Handles code elements, converting them to markdown code blocks or inline code
 */
export class CodeHandler extends NodeHandler {
    handle(node: Node, visitor: HTMLNodeVisitor): string {
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return this.handleNext(node, visitor);
        }
        if ((node as HTMLElement).tagName.toLowerCase() === 'code') {
            return visitor.visitCode(node as HTMLElement);
        }
        return this.handleNext(node, visitor);
    }
}

/**
 * Fallback handler for any HTML elements not handled by other specific handlers
 */
export class GenericHandler extends NodeHandler {
    handle(node: Node, visitor: HTMLNodeVisitor): string {
        return visitor.visitGeneric(node as HTMLElement);
    }
}
