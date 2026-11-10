import {getMatchingElements} from './textEditing';

export interface PreviewCaret {
    node: Node;
    offset: number;
}

export const getPreviewCaret = (event: MouseEvent): PreviewCaret | null => {
    const doc = (event.target as Node).ownerDocument;
    if (!doc) return null;
    const position = doc.caretPositionFromPoint?.(event.clientX, event.clientY);
    if (position) return {node: position.offsetNode, offset: position.offset};
    const range = doc.caretRangeFromPoint?.(event.clientX, event.clientY);
    return range ? {node: range.startContainer, offset: range.startOffset} : null;
};

export const getElementSource = (
    sourceHtml: string,
    previewRoot: HTMLElement,
    target: Element,
    caret: PreviewCaret | null,
) => {
    const matching = getMatchingElements(sourceHtml, previewRoot);
    if (!matching) return null;
    const sourceTarget = matching.sourceElements[matching.previewElements.indexOf(target)];
    if (!sourceTarget) return null;
    const html = sourceTarget.outerHTML;
    let offset = sourceTarget.tagName.length + 1;

    if (caret && target.contains(caret.node)) {
        const path: number[] = [];
        let node = caret.node;
        while (node !== target && node.parentNode) {
            path.unshift(Array.prototype.indexOf.call(node.parentNode.childNodes, node));
            node = node.parentNode;
        }
        const clone = sourceTarget.cloneNode(true) as Element;
        let sourceNode: Node | undefined = clone;
        for (const index of path) sourceNode = sourceNode?.childNodes[index];
        if (sourceNode && sourceNode.nodeType === caret.node.nodeType) {
            let marker = '__html_caret__';
            while (html.includes(marker)) marker += '_';
            if (sourceNode.nodeType === 3 && sourceNode.nodeValue === caret.node.nodeValue) {
                (sourceNode as Text).insertData(caret.offset, marker);
                offset = clone.outerHTML.indexOf(marker);
            } else if (sourceNode.nodeType === 1) {
                sourceNode.insertBefore(
                    document.createTextNode(marker),
                    sourceNode.childNodes[caret.offset] ?? null,
                );
                offset = clone.outerHTML.indexOf(marker);
            }
        }
    }

    return {
        html,
        offset,
        replace: (value: string): string => {
            const range = document.createRange();
            range.selectNode(sourceTarget);
            sourceTarget.replaceWith(range.createContextualFragment(value));
            return matching.source.innerHTML;
        },
    };
};

export type ElementSource = NonNullable<ReturnType<typeof getElementSource>>;
