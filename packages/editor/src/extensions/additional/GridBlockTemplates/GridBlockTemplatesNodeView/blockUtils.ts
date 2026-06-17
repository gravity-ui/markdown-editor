import {blockClass, gridScopeClass, inlineToRule, scopeCss} from '../css';
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
    css: inlineToRule(template.block.css),
    content: template.block.content,
});

export const rawTemplateBlockToBlock = (block: GridBlockTemplateBlock): GridBlock => ({
    id: createGridBlockId(),
    css: block.css,
    content: block.content,
});

export const containerTemplateToAttrs = (template: GridBlockContainerTemplate) => ({
    customCss: inlineToRule(template.containerCss, '.grid'),
    blocks: template.blocks.map((block) => ({
        id: createGridBlockId(),
        css: inlineToRule(block.css),
        content: block.content,
    })),
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

export const isContainerTemplate = (
    template: GridBlockTemplate,
): template is GridBlockContainerTemplate => template.type === 'container';

export const isBlockTemplate = (
    template: GridBlockTemplate,
): template is GridBlockBlockTemplate => template.type === 'block';
