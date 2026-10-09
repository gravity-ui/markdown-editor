export const getTextNodes = (root: HTMLElement) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            return node.nodeValue?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
    });
    const textNodes: Text[] = [];

    while (walker.nextNode()) {
        textNodes.push(walker.currentNode as Text);
    }

    return textNodes;
};

/** Immediate (non-descendant) child text nodes that contain non-whitespace text. */
export const getDirectTextNodes = (element: Element): Text[] => {
    const textNodes: Text[] = [];

    for (const child of Array.from(element.childNodes)) {
        if (child.nodeType === window.Node.TEXT_NODE && child.nodeValue?.trim()) {
            textNodes.push(child as Text);
        }
    }

    return textNodes;
};

export const setTextNodeValue = (textNode: Text, value: string): void => {
    textNode.replaceData(0, textNode.length, value);
};

export const setLinkValues = (link: HTMLAnchorElement, text: string, href: string): void => {
    link.replaceChildren(text);
    link.setAttribute('href', href);
};

export const setImageSrc = (image: HTMLImageElement, src: string): void => {
    image.setAttribute('src', src);
};

/** Sets `value` on `textNode` when present, otherwise replaces the element's text. */
export const setElementText = (element: Element, textNode: Text | null, value: string): void => {
    if (textNode) {
        setTextNodeValue(textNode, value);
        return;
    }
    element.replaceChildren(value);
};

export interface EditableAttribute {
    name: string;
    value: string;
}

/** All attributes of an element as an ordered name/value list. */
export const getElementAttributes = (element: Element): EditableAttribute[] =>
    element.getAttributeNames().map((name) => ({name, value: element.getAttribute(name) ?? ''}));

/** Reject invalid attribute names before changing the element. */
export const applyElementAttributes = (
    element: Element,
    attributes: EditableAttribute[],
): boolean => {
    const next = element.cloneNode(false) as Element;
    for (const name of next.getAttributeNames()) next.removeAttribute(name);

    try {
        for (const {name, value} of attributes) {
            if (name.trim()) next.setAttribute(name.trim(), value);
        }
    } catch {
        return false;
    }

    for (const name of element.getAttributeNames()) {
        if (!next.hasAttribute(name)) element.removeAttribute(name);
    }

    for (const name of next.getAttributeNames()) {
        element.setAttribute(name, next.getAttribute(name)!);
    }

    return true;
};

export interface ElementEdit {
    text?: string;
    attributes: EditableAttribute[];
    icon?: string;
}

/** Serialize a staged edit without mutating the preview or its popup anchor. */
export const editElementHtml = (
    root: HTMLElement,
    target: Element,
    edit: ElementEdit,
): string | null => {
    const index = Array.from(root.querySelectorAll('*')).indexOf(target);
    if (index < 0) return null;

    const draft = root.cloneNode(true) as HTMLElement;
    let element = draft.querySelectorAll('*')[index];
    if (edit.icon && element instanceof SVGSVGElement) {
        const icon = setSvgIcon(element, edit.icon);
        if (!icon) return null;
        element = icon;
    } else {
        if (!applyElementAttributes(element, edit.attributes)) return null;
        if (edit.text !== undefined) {
            const {node, canEdit} = getEditableTextNode(element);
            if (canEdit) setElementText(element, node, edit.text);
        }
    }

    return draft.innerHTML;
};

// Elements that hold no editable text of their own (replaced/void/media/controls).
const TEXTLESS_TAGS = new Set([
    'IMG',
    'VIDEO',
    'AUDIO',
    'SVG',
    'CANVAS',
    'IFRAME',
    'EMBED',
    'OBJECT',
    'SOURCE',
    'TRACK',
    'PICTURE',
    'INPUT',
    'BR',
    'HR',
    'SELECT',
    'TEXTAREA',
]);

/**
 * Decides whether an element exposes an editable text value and, if so, which
 * text node to mutate:
 * - a direct text node -> edit it in place;
 * - an empty leaf element (no children, not a replaced/void tag) -> allow
 *   authoring text (a node is created on commit);
 * - anything else (media, or a wrapper of other elements) -> no editable text.
 */
export const getEditableTextNode = (element: Element): {node: Text | null; canEdit: boolean} => {
    const direct = getDirectTextNodes(element);
    if (direct.length) return {node: direct[0], canEdit: true};

    if (TEXTLESS_TAGS.has(element.tagName.toUpperCase())) return {node: null, canEdit: false};

    if (element.children.length === 0) return {node: null, canEdit: true};

    return {node: null, canEdit: false};
};

export const getFirstEditableElement = (root: HTMLElement): Element | null => {
    const elements = Array.from(root.querySelectorAll('*')).filter(
        (element) => !element.closest('script, style, template, noscript, [hidden]'),
    );
    return elements.find((element) => getEditableTextNode(element).canEdit) ?? elements[0] ?? null;
};

/** Inline SVGs at or below this rendered size are treated as icons (glyph picker). */
export const ICON_SVG_MAX_SIZE = 50;

/**
 * An inline SVG is an "icon" (and thus offers the glyph picker) when it renders
 * no larger than {@link ICON_SVG_MAX_SIZE} in both dimensions. Larger SVGs are
 * treated as illustrations/images and only expose attribute editing. Falls back
 * to the `width`/`height` attributes when layout metrics are unavailable (e.g.
 * in tests), and defaults to "icon" when the size is unknown.
 */
export const isIconSizedSvg = (svg: SVGSVGElement, maxSize = ICON_SVG_MAX_SIZE): boolean => {
    const rect = svg.getBoundingClientRect();
    const width = rect.width || parseFloat(svg.getAttribute('width') ?? '') || 0;
    const height = rect.height || parseFloat(svg.getAttribute('height') ?? '') || 0;

    if (!width && !height) return true;

    return width <= maxSize && height <= maxSize;
};

const PRESERVED_SVG_ATTRS = ['class', 'style', 'width', 'height'] as const;

/** Replaces an inline SVG glyph in place, returning the new element (or null). */
export const setSvgIcon = (svg: SVGSVGElement, iconSvgMarkup: string): SVGSVGElement | null => {
    const holder = document.createElement('div');
    holder.innerHTML = iconSvgMarkup.trim();
    const next = holder.querySelector('svg');
    if (!next) return null;

    for (const name of PRESERVED_SVG_ATTRS) {
        const value = svg.getAttribute(name);
        if (value === null) {
            next.removeAttribute(name);
        } else {
            next.setAttribute(name, value);
        }
    }

    for (const name of svg.getAttributeNames()) {
        if (name === 'id' || name === 'role' || name === 'focusable' || name.startsWith('aria-')) {
            next.setAttribute(name, svg.getAttribute(name)!);
        }
    }

    svg.replaceWith(next);

    return next;
};
