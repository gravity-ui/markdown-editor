import {HTMLNodeVisitor} from './converters';

/**
 * Base handler class implementing the Chain of Responsibility pattern for HTML node processing.
 * Each concrete handler decides whether it can process a node or should pass it to the next handler.
 */
export abstract class NodeHandler {
    protected next: NodeHandler | null = null;

    /**
     * Sets up the next handler in the chain
     */
    setNext(handler: NodeHandler): NodeHandler {
        this.next = handler;
        return handler;
    }

    /**
     * Process the given node or delegate to the next handler
     */
    abstract handle(node: Node, visitor: HTMLNodeVisitor): string;

    /**
     * Delegates processing to the next handler in the chain
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
        if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node as Element).tagName.toLowerCase() === 'a'
        ) {
            return visitor.visitLink(node as HTMLAnchorElement);
        }
        return this.handleNext(node, visitor);
    }
}

/**
 * Handles header elements (h1-h6), converting them to markdown headers
 */
export class HeaderHandler extends NodeHandler {
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
    handle(node: Node, visitor: HTMLNodeVisitor): string {
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return this.handleNext(node, visitor);
        }
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        const formattingTags = ['b', 'strong', 'i', 'em', 'span'];
        if (
            formattingTags.includes(tagName) &&
            !['a', 'code', 'pre'].includes(element.parentElement?.tagName.toLowerCase() || '')
        ) {
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
        if (
            (node as HTMLElement).tagName.toLowerCase() === 'code' ||
            (node as HTMLElement).tagName.toLowerCase() === 'pre'
        ) {
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

/**
 * Handles ordered list elements, converting them to markdown ordered lists
 */
export class OrderedListHandler extends NodeHandler {
    handle(node: Node, visitor: HTMLNodeVisitor): string {
        if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node as Element).tagName.toLowerCase() === 'ol'
        ) {
            const items = Array.from(node.childNodes)
                .filter(
                    (child) =>
                        child.nodeType === Node.ELEMENT_NODE &&
                        (child as Element).tagName.toLowerCase() === 'li',
                )
                .map((item, index) => `${index + 1}. ${visitor.visitGeneric(item as HTMLElement)}`)
                .join('\n');
            return items + '\n';
        }
        return this.handleNext(node, visitor);
    }
}

/**
 * Handles unordered list elements, converting them to markdown unordered lists
 */
export class UnorderedListHandler extends NodeHandler {
    handle(node: Node, visitor: HTMLNodeVisitor): string {
        if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node as Element).tagName.toLowerCase() === 'ul'
        ) {
            const items = Array.from(node.childNodes)
                .filter(
                    (child) =>
                        child.nodeType === Node.ELEMENT_NODE &&
                        (child as Element).tagName.toLowerCase() === 'li',
                )
                .map((item) => `- ${visitor.visitGeneric(item as HTMLElement)}`)
                .join('\n');
            return items + '\n';
        }
        return this.handleNext(node, visitor);
    }
}

/**
 * Handles div elements, converting them to markdown paragraphs
 */
export class DivHandler extends NodeHandler {
    handle(node: Node, visitor: HTMLNodeVisitor): string {
        if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node as Element).tagName.toLowerCase() === 'div'
        ) {
            return visitor.visitDiv(node as HTMLElement);
        }
        return this.handleNext(node, visitor);
    }
}

/**
 * Handles br elements, converting them to markdown newlines
 */
export class BrHandler extends NodeHandler {
    handle(node: Node, visitor: HTMLNodeVisitor): string {
        if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node as Element).tagName.toLowerCase() === 'br'
        ) {
            return visitor.visitBr();
        }
        return this.handleNext(node, visitor);
    }
}

/**
 * Handles table row elements, converting them to markdown table rows
 */
export class TableRowHandler extends NodeHandler {
    handle(node: Node, visitor: HTMLNodeVisitor): string {
        if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node as Element).tagName.toLowerCase() === 'tr'
        ) {
            return visitor.visitTableRow(node as HTMLTableRowElement);
        }
        return this.handleNext(node, visitor);
    }
}

/**
 * Handles table elements, converting them to markdown tables
 */
export class TableHandler extends NodeHandler {
    handle(node: Node, visitor: HTMLNodeVisitor): string {
        if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node as Element).tagName.toLowerCase() === 'table'
        ) {
            return visitor.visitTable(node as HTMLTableElement);
        }
        return this.handleNext(node, visitor);
    }
}

/**
 * Handles image elements, converting them to markdown images
 */
export class ImageHandler extends NodeHandler {
    handle(node: Node, visitor: HTMLNodeVisitor): string {
        if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node as Element).tagName.toLowerCase() === 'img'
        ) {
            return visitor.visitImage(node as HTMLImageElement);
        }
        return this.handleNext(node, visitor);
    }
}
