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

/**
 * In-place editors below mutate the existing rendered nodes (instead of replacing
 * them with form controls), so the editing UI can live in a floating popup and the
 * content never shifts while typing. Editing existing nodes also preserves all of
 * their attributes for free.
 */

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
