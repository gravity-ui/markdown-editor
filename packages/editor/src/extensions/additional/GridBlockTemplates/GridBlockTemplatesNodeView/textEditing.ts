import {STOP_EVENT_CLASSNAME, cnGridBlockTemplates} from './const';

const b = cnGridBlockTemplates;
const stop = STOP_EVENT_CLASSNAME;

const INLINE_TEXT_EDITOR_ATTR = 'data-grid-block-inline-text-editor';
const INLINE_TEXT_EDITOR_SELECTOR = `[${INLINE_TEXT_EDITOR_ATTR}="true"]`;

interface InlineTextEditorOptions {
    root: HTMLElement;
    event?: Pick<MouseEvent, 'clientX' | 'clientY'>;
    textNodeIndex?: number;
    textNode?: Text;
    onCommit: (html: string) => void;
}

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

export const getRangeFromPoint = (clientX: number, clientY: number) => {
    const doc = document as Document & {
        caretRangeFromPoint?: (x: number, y: number) => Range | null;
        caretPositionFromPoint?: (
            x: number,
            y: number,
        ) => {offsetNode: Node; offset: number} | null;
    };

    const range = doc.caretRangeFromPoint?.(clientX, clientY);
    if (range) return range;

    const position = doc.caretPositionFromPoint?.(clientX, clientY);
    if (!position) return null;

    const nextRange = document.createRange();
    nextRange.setStart(position.offsetNode, position.offset);
    return nextRange;
};

export const getTextNodeFromEvent = (
    root: HTMLElement,
    event: Pick<MouseEvent, 'clientX' | 'clientY'>,
) => {
    const range = getRangeFromPoint(event.clientX, event.clientY);
    const node = range?.startContainer;

    if (node?.nodeType === Node.TEXT_NODE && root.contains(node)) return node as Text;

    return null;
};

function openTextNodeEditor({
    root,
    textNode,
    textNodeIndex,
    onCommit,
}: InlineTextEditorOptions & {textNode: Text; textNodeIndex: number}) {
    root.querySelector(INLINE_TEXT_EDITOR_SELECTOR)?.remove();

    const originalValue = textNode.nodeValue ?? '';
    const textarea = document.createElement('textarea');
    textarea.setAttribute(INLINE_TEXT_EDITOR_ATTR, 'true');
    textarea.className = `${b('inline-text-editor')} ${stop}`;
    textarea.value = originalValue;
    textarea.rows = 1;

    let finished = false;

    const commit = () => {
        if (finished) return;
        finished = true;
        textarea.replaceWith(document.createTextNode(textarea.value));
        onCommit(root.innerHTML);
    };

    const cancel = () => {
        if (finished) return;
        finished = true;
        textarea.replaceWith(document.createTextNode(originalValue));
    };

    const navigate = (direction: 1 | -1) => {
        const nextIndex = textNodeIndex + direction;

        commit();

        const hasNextTextNode = nextIndex >= 0 && nextIndex < getTextNodes(root).length;

        if (hasNextTextNode) {
            setTimeout(() => {
                openInlineTextEditor({root, textNodeIndex: nextIndex, onCommit});
            });
        }
    };

    textarea.addEventListener('keydown', (event) => {
        if (event.key === 'Tab') {
            event.preventDefault();
            navigate(event.shiftKey ? -1 : 1);
            return;
        }

        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            commit();
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            cancel();
        }
    });
    textarea.addEventListener('blur', commit);

    textNode.replaceWith(textarea);

    textarea.focus();
    textarea.select();
}

export function openInlineTextEditor({
    root,
    event,
    textNodeIndex,
    textNode: directTextNode,
    onCommit,
}: InlineTextEditorOptions) {
    const textNodes = getTextNodes(root);
    const textNode =
        directTextNode ??
        (textNodeIndex === undefined
            ? event && getTextNodeFromEvent(root, event)
            : textNodes[textNodeIndex]);

    if (!textNode) return false;

    const index = textNodeIndex ?? textNodes.indexOf(textNode);
    if (index === -1) return false;

    openTextNodeEditor({root, event, textNodeIndex: index, textNode, onCommit});

    return true;
}

export function openInlineImageSrcEditor({
    root,
    image,
    onCommit,
}: {
    root: HTMLElement;
    image: HTMLImageElement;
    onCommit: (html: string) => void;
}) {
    root.querySelector(INLINE_TEXT_EDITOR_SELECTOR)?.remove();

    const originalImage = image.cloneNode(false) as HTMLImageElement;
    const input = document.createElement('input');
    input.setAttribute(INLINE_TEXT_EDITOR_ATTR, 'true');
    input.className = `${b('inline-text-editor', {src: true})} ${stop}`;
    input.value = image.getAttribute('src') ?? '';

    let finished = false;

    const commit = () => {
        if (finished) return;
        finished = true;
        const nextImage = originalImage.cloneNode(false) as HTMLImageElement;
        nextImage.setAttribute('src', input.value);
        input.replaceWith(nextImage);
        onCommit(root.innerHTML);
    };

    const cancel = () => {
        if (finished) return;
        finished = true;
        input.replaceWith(originalImage);
    };

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            commit();
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            cancel();
        }
    });
    input.addEventListener('blur', commit);

    image.replaceWith(input);

    input.focus();
    input.select();

    return true;
}
