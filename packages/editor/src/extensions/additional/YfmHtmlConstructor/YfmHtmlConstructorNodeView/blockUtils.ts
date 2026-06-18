import {blockSelector, replaceCssAnchor, structureSelector, templateCssToRules} from '../css';
import type {
    HtmlConstructorBlock,
    HtmlConstructorBlockTemplate,
    HtmlConstructorStructure,
    HtmlConstructorStructureTemplate,
    HtmlConstructorTemplate,
    HtmlConstructorTemplateBlock,
    HtmlConstructorThemeTemplate,
} from '../types';

export const createHtmlConstructorBlockId = () => Math.random().toString(36).slice(2, 10);

const mergeStyles = (...styles: string[][]) =>
    styles
        .flat()
        .map((style) => style.trim())
        .filter(Boolean)
        .join('\n\n');

const withThemeStyles = (styles: string[], theme: HtmlConstructorThemeTemplate | undefined) =>
    mergeStyles(styles, theme?.styles ?? []);

export const structureTemplateToState = (
    template: HtmlConstructorStructureTemplate,
    theme?: HtmlConstructorThemeTemplate,
): HtmlConstructorStructure => ({
    templateId: template.id,
    css: withThemeStyles(template.styles, theme),
    content: template.content,
    themeIds: theme ? [theme.id] : [],
});

export const blockTemplateToBlock = (
    template: HtmlConstructorBlockTemplate,
    theme?: HtmlConstructorThemeTemplate,
): HtmlConstructorBlock => ({
    id: createHtmlConstructorBlockId(),
    templateId: template.id,
    css: withThemeStyles(template.styles, theme),
    content: template.content,
    themeIds: theme ? [theme.id] : [],
});

export const rawTemplateBlockToBlock = (
    block: HtmlConstructorTemplateBlock,
): HtmlConstructorBlock => ({
    id: createHtmlConstructorBlockId(),
    css: block.css,
    content: block.content,
    themeIds: [],
});

const isDirectStructureBlock = (
    template: HtmlConstructorTemplate,
    structureId: string,
): template is HtmlConstructorBlockTemplate =>
    template.type === 'block' && template.structure === structureId && !template.block;

export const getDirectStructureBlocks = (
    templates: HtmlConstructorTemplate[],
    structureId: string,
) => templates.filter((template) => isDirectStructureBlock(template, structureId));

export const structureTemplateToAttrs = (
    templates: HtmlConstructorTemplate[],
    structure: HtmlConstructorStructureTemplate,
    theme?: HtmlConstructorThemeTemplate,
) => ({
    structure: structureTemplateToState(structure, theme),
    blocks: getDirectStructureBlocks(templates, structure.id).map((block) =>
        blockTemplateToBlock(block),
    ),
});

const prepareCss = (css: string, selector: string) =>
    replaceCssAnchor(templateCssToRules(css), selector).trim();

export const buildPreviewCss = ({
    structure,
    blocks,
}: {
    structure: HtmlConstructorStructure;
    blocks: HtmlConstructorBlock[];
}) => {
    const rules = [
        structure.css.trim() && prepareCss(structure.css, structureSelector()),
        ...blocks.map(
            (block, index) => block.css.trim() && prepareCss(block.css, blockSelector(index)),
        ),
    ].filter(Boolean);

    return rules.join('\n').replace(/\n{2,}/g, '\n');
};

export const getActiveStructureTemplateId = (structure: HtmlConstructorStructure) =>
    structure.templateId;
