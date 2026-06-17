import {STOP_EVENT_CLASSNAME, cnGridBlockTemplates} from './const';

const b = cnGridBlockTemplates;
const stop = STOP_EVENT_CLASSNAME;

const INLINE_TEXT_EDITOR_ATTR = 'data-grid-block-inline-text-editor';
const INLINE_TEXT_EDITOR_SELECTOR = `[${INLINE_TEXT_EDITOR_ATTR}="true"]`;

interface InlineTextEditorOptions {
    root: HTMLElement;
    event?: Pick<MouseEvent, 'clientX' | 'clientY'>;
    textNodeIndex?: number;
    onCommit: (html: string) => void;
}

const getTextNodes = (root: HTMLElement) => {
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

const getRangeFromPoint = (clientX: number, clientY: number) => {
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

const getTextNodeFromEvent = (
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

    const textarea = document.createElement('textarea');
    textarea.setAttribute(INLINE_TEXT_EDITOR_ATTR, 'true');
    textarea.className = `${b('inline-text-editor')} ${stop}`;
    textarea.value = textNode.nodeValue ?? '';
    textarea.rows = 1;

    let committed = false;

    const commit = () => {
        if (committed) return;
        committed = true;
        textarea.replaceWith(document.createTextNode(textarea.value));
        onCommit(root.innerHTML);
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
        if (event.key !== 'Tab') return;

        event.preventDefault();
        navigate(event.shiftKey ? -1 : 1);
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
    onCommit,
}: InlineTextEditorOptions) {
    const textNodes = getTextNodes(root);
    const textNode =
        textNodeIndex === undefined
            ? event && getTextNodeFromEvent(root, event)
            : textNodes[textNodeIndex];

    if (!textNode) return false;

    const index = textNodeIndex ?? textNodes.indexOf(textNode);
    if (index === -1) return false;

    openTextNodeEditor({root, event, textNodeIndex: index, textNode, onCommit});

    return true;
}
