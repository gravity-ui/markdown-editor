import {STOP_EVENT_CLASSNAME, cnGridBlockTemplates} from './const';

const b = cnGridBlockTemplates;
const stop = STOP_EVENT_CLASSNAME;

const EDITABLE_TEXT_NODE_ATTR = 'data-grid-block-editable-text';
const EDITABLE_TEXT_NODE_SELECTOR = `[${EDITABLE_TEXT_NODE_ATTR}="true"]`;

const focusEditableTextNode = (element: HTMLElement) => {
    element.focus();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
};

const getEditableTextNodes = (root: HTMLElement) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];

    while (walker.nextNode()) {
        const current = walker.currentNode as Text;
        if (current.nodeValue?.trim()) textNodes.push(current);
    }

    return textNodes;
};

const wrapEditableTextNode = (textNode: Text) => {
    const span = document.createElement('span');
    span.setAttribute(EDITABLE_TEXT_NODE_ATTR, 'true');
    span.className = `${b('editable-text')} ${stop}`;
    span.contentEditable = 'true';
    span.textContent = textNode.nodeValue;
    textNode.replaceWith(span);
};

export const enableTextNodeEditing = (root: HTMLElement) => {
    const existingTextNode = root.querySelector<HTMLElement>(EDITABLE_TEXT_NODE_SELECTOR);
    if (existingTextNode) {
        focusEditableTextNode(existingTextNode);
        return;
    }

    getEditableTextNodes(root).forEach(wrapEditableTextNode);

    const firstTextNode = root.querySelector<HTMLElement>(EDITABLE_TEXT_NODE_SELECTOR);
    if (firstTextNode) focusEditableTextNode(firstTextNode);
};

export const readTextOnlyEditedHtml = (root: HTMLElement) => {
    const clone = root.cloneNode(true) as HTMLElement;
    for (const wrapper of clone.querySelectorAll(EDITABLE_TEXT_NODE_SELECTOR)) {
        wrapper.replaceWith(document.createTextNode(wrapper.textContent ?? ''));
    }
    return clone.innerHTML;
};

export const insertPlainTextAtSelection = (text: string) => {
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    if (!selection || !range) return;

    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
};
