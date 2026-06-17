import type {
    GridBlockBlockTemplate,
    GridBlockContainerTemplate,
    GridBlockTemplateBlock,
} from '../types';

const BLOCK_CLASS_RE = /\.block-\d+(?![\w-])/;

const normalizeHtml = (html: string) => html.trim().replace(/>\s+</g, '><').replace(/\s+/g, ' ');

const createDocument = (html: string): Document | null => {
    if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') return null;

    return new DOMParser().parseFromString(html, 'text/html');
};

const getText = (element: Element | null) => element?.textContent?.trim().replace(/\s+/g, ' ');

const getDerivedTitle = (html: string, index: number) => {
    const doc = createDocument(`<div>${html}</div>`);

    if (doc) {
        const textElement = doc.querySelector('h1, h2, h3, strong');
        const text = getText(textElement);
        if (text) return text;

        const labelled = doc.querySelector('[aria-label]');
        const label = labelled?.getAttribute('aria-label')?.trim();
        if (label) return label;

        const image = doc.querySelector('img[alt]');
        const alt = image?.getAttribute('alt')?.trim();
        if (alt) return alt;
    }

    return `Block ${index + 1}`;
};

const splitSelectorList = (selectorList: string) => {
    const selectors: string[] = [];
    let current = '';
    let depth = 0;

    for (const char of selectorList) {
        if (char === '(' || char === '[') depth += 1;
        if (char === ')' || char === ']') depth = Math.max(0, depth - 1);

        if (char === ',' && depth === 0) {
            selectors.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    if (current.trim()) selectors.push(current.trim());

    return selectors;
};

const hasNestedRules = (body: string) => body.includes('{') && body.includes('}');

const splitTopLevelRules = (css: string) => {
    const rules: Array<{prelude: string; body: string}> = [];
    let index = 0;

    while (index < css.length) {
        const start = css.indexOf('{', index);
        if (start === -1) break;

        const prelude = css.slice(index, start).trim();
        let depth = 1;
        let end = start + 1;

        while (end < css.length && depth > 0) {
            const char = css[end];
            if (char === '{') depth += 1;
            if (char === '}') depth -= 1;
            end += 1;
        }

        const body = css.slice(start + 1, end - 1).trim();
        if (prelude && body) rules.push({prelude, body});

        index = end;
    }

    return rules;
};

const rewriteSelector = (selector: string, blockNumber: number) => {
    const currentBlockRe = new RegExp(`\\.block-${blockNumber}(?![\\w-])`, 'g');

    if (currentBlockRe.test(selector)) return selector.replace(currentBlockRe, '&').trim();
    if (BLOCK_CLASS_RE.test(selector)) return null;

    return selector.replace(/\.grid(?![\w-])/g, '&').trim();
};

const rewriteSelectorList = (selectorList: string, blockNumber: number) => {
    const selectors = splitSelectorList(selectorList)
        .map((selector) => rewriteSelector(selector, blockNumber))
        .filter(Boolean);

    return selectors.join(', ');
};

const indentCss = (css: string) =>
    css
        .split('\n')
        .map((line) => (line.trim() ? `  ${line}` : line))
        .join('\n');

export const deriveBlockCss = (css: string, blockNumber: number): string => {
    const rules = splitTopLevelRules(css);

    return rules
        .map(({prelude, body}) => {
            if (prelude.startsWith('@')) {
                if (/^@(?:media|supports|container)\b/.test(prelude) && hasNestedRules(body)) {
                    const nested = deriveBlockCss(body, blockNumber);
                    return nested ? `${prelude} {\n${indentCss(nested)}\n}` : '';
                }

                return `${prelude} {\n${indentCss(body)}\n}`;
            }

            const selectorList = rewriteSelectorList(prelude, blockNumber);
            return selectorList ? `${selectorList} {\n${indentCss(body)}\n}` : '';
        })
        .filter(Boolean)
        .join('\n\n');
};

const mergeBlockCss = (containerCss: string, block: GridBlockTemplateBlock, blockNumber: number) =>
    [deriveBlockCss(containerCss, blockNumber), block.css.trim()].filter(Boolean).join('\n\n');

export const getBlockTemplatesForMenu = ({
    blockTemplates,
    containerTemplates,
}: {
    blockTemplates: GridBlockBlockTemplate[];
    containerTemplates: GridBlockContainerTemplate[];
}): GridBlockBlockTemplate[] => {
    const seenHtml = new Set(
        blockTemplates.map((template) => normalizeHtml(template.block.content)),
    );
    const derivedTemplates: GridBlockBlockTemplate[] = [];

    for (const template of containerTemplates) {
        template.blocks.forEach((block, index) => {
            const normalized = normalizeHtml(block.content);
            if (!normalized || seenHtml.has(normalized)) return;

            seenHtml.add(normalized);
            derivedTemplates.push({
                id: `${template.id}__block-${index + 1}`,
                title: getDerivedTitle(block.content, index),
                group: template.group,
                type: 'block',
                content: block.content,
                block: {
                    css: mergeBlockCss(template.containerCss, block, index + 1),
                    content: block.content,
                },
            });
        });
    }

    return [...blockTemplates, ...derivedTemplates];
};
