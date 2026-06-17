import {blockClass, gridScopeClass, inlineToRule, scopeCss, templateCssToRules} from '../css';
import type {
    GridBlock,
    GridBlockBlockTemplate,
    GridBlockContainerTemplate,
    GridBlockTemplate,
    GridBlockTemplateBlock,
} from '../types';

export const createGridBlockId = () => Math.random().toString(36).slice(2, 10);

export const templateToBlock = (template: GridBlockBlockTemplate): GridBlock => ({
    id: createGridBlockId(),
    css: templateCssToRules(template.block.css),
    content: template.block.content,
});

export const rawTemplateBlockToBlock = (block: GridBlockTemplateBlock): GridBlock => ({
    id: createGridBlockId(),
    css: block.css,
    content: block.content,
});

export const containerTemplateToAttrs = (
    template: GridBlockContainerTemplate,
    previousBlocks?: GridBlock[],
) => ({
    customCss: templateCssToRules(template.containerCss, '.grid'),
    blocks: template.blocks.length
        ? template.blocks.map((block) => ({
              id: createGridBlockId(),
              css: templateCssToRules(block.css),
              content: block.content,
          }))
        : (previousBlocks ?? []),
});

export const buildScopedCss = ({
    blocks,
    customCss,
    scopeClass,
}: {
    blocks: GridBlock[];
    customCss: string;
    scopeClass: string;
}) => {
    const rules = [
        customCss.trim() && scopeCss(customCss, `.${scopeClass}`).trim(),
        ...blocks.map(
            (block, i) =>
                block.css.trim() && scopeCss(block.css, `.${scopeClass} .${blockClass(i)}`).trim(),
        ),
    ].filter(Boolean);

    return rules.join('\n');
};

export const getGridScopeClass = (entityId: string) => gridScopeClass(entityId);

export const buildContainerHtml = (blocks: GridBlock[]) => {
    const children = blocks
        .map((block, index) => `  <div class="${blockClass(index)}">${block.content ?? ''}</div>`)
        .join('\n');

    return children ? `<div class="grid">\n${children}\n</div>` : '<div class="grid">\n</div>';
};

const parseHtml = (value: string): Document | null => {
    if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') return null;

    return new DOMParser().parseFromString(value, 'text/html');
};

const getInlineCss = (element: Element) =>
    element instanceof HTMLElement ? (element.getAttribute('style')?.trim() ?? '') : '';

export const parseContainerHtml = (
    value: string,
    previousBlocks: GridBlock[],
): GridBlock[] | null => {
    const html = value.trim();
    if (!html) return [];

    const doc = parseHtml(html);
    const root = doc?.body.firstElementChild;
    if (!root?.classList.contains('grid')) return null;

    return Array.from(root.children).map((child, index) => {
        const previousBlock = previousBlocks[index];
        const inlineCss = getInlineCss(child);

        return {
            id: previousBlock?.id ?? createGridBlockId(),
            css: inlineCss ? inlineToRule(inlineCss) : (previousBlock?.css ?? ''),
            content: child.innerHTML.trim(),
        };
    });
};

export const isContainerTemplate = (
    template: GridBlockTemplate,
): template is GridBlockContainerTemplate => template.type === 'container';

export const isBlockTemplate = (template: GridBlockTemplate): template is GridBlockBlockTemplate =>
    template.type === 'block';
