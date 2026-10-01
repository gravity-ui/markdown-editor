export interface EditableAttribute {
    name: string;
    value: string;
}

export const getElementAttributes = (element: Element): EditableAttribute[] =>
    element.getAttributeNames().map((name) => ({name, value: element.getAttribute(name) ?? ''}));

const textlessTags = new Set([
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

export const getEditableTextNode = (element: Element): {node: Text | null; canEdit: boolean} => {
    const direct = Array.from(element.childNodes).find(
        (child) => child.nodeType === 3 && child.nodeValue?.trim(),
    ) as Text | undefined;
    if (direct) return {node: direct, canEdit: true};
    if (textlessTags.has(element.tagName.toUpperCase())) return {node: null, canEdit: false};
    return {node: null, canEdit: element.children.length === 0};
};

const nonRenderedTags = new Set([
    'BASE',
    'LINK',
    'META',
    'NOSCRIPT',
    'SCRIPT',
    'STYLE',
    'TEMPLATE',
    'TITLE',
]);

const getRenderedElements = (root: ParentNode): Element[] =>
    Array.from(root.querySelectorAll('*')).filter(
        (element) => !nonRenderedTags.has(element.tagName.toUpperCase()),
    );

export const getMatchingElements = (
    sourceHtml: string,
    previewRoot: HTMLElement,
): {source: HTMLTemplateElement; previewElements: Element[]; sourceElements: Element[]} | null => {
    const source = document.createElement('template');
    source.innerHTML = sourceHtml;
    const previewElements = getRenderedElements(previewRoot);
    const sourceElements = getRenderedElements(source.content);

    if (
        sourceElements.length !== previewElements.length ||
        sourceElements.some((element, index) => element.tagName !== previewElements[index].tagName)
    ) {
        return null;
    }

    return {source, previewElements, sourceElements};
};

export const editElementHtml = (
    sourceHtml: string,
    previewRoot: HTMLElement,
    target: Element,
    edit: {text?: string; attributes: EditableAttribute[]},
): string | null => {
    const matching = getMatchingElements(sourceHtml, previewRoot);
    if (!matching) return null;
    const index = matching.previewElements.indexOf(target);
    if (index < 0) return null;

    const element = matching.sourceElements[index];
    const attributes = element.cloneNode(false) as Element;
    for (const name of attributes.getAttributeNames()) attributes.removeAttribute(name);

    try {
        for (const {name, value} of edit.attributes) {
            if (name.trim()) attributes.setAttribute(name.trim(), value);
        }
    } catch {
        return null;
    }

    for (const name of element.getAttributeNames()) element.removeAttribute(name);
    for (const name of attributes.getAttributeNames()) {
        element.setAttribute(name, attributes.getAttribute(name) ?? '');
    }

    if (edit.text !== undefined) {
        const {node, canEdit} = getEditableTextNode(element);
        if (canEdit) {
            if (node) node.replaceData(0, node.length, edit.text);
            else element.replaceChildren(edit.text);
        }
    }

    return matching.source.innerHTML;
};
