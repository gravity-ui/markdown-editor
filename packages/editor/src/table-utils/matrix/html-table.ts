export function findHtmlTable(html: string): {table: HTMLTableElement; standalone: boolean} | null {
    if (!/<table[\s/>]/i.test(html)) return null;
    const container = document.createElement('template');
    container.innerHTML = html;
    const table = container.content.querySelector('table');
    if (!table) return null;
    const nodes = Array.from(container.content.childNodes).filter(
        (node) =>
            node.nodeType !== Node.COMMENT_NODE &&
            !(node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) &&
            node.nodeName !== 'META',
    );
    return {table, standalone: nodes.length === 1 && nodes[0] === table};
}
