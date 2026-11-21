import {createHtmlConstructorBlockId} from '../model';
import type {
    HtmlConstructorBlock,
    HtmlConstructorBlockTemplate,
    HtmlConstructorStructure,
    HtmlConstructorStructureTemplate,
    HtmlConstructorTemplate,
    HtmlConstructorTemplateBlock,
    HtmlConstructorThemeTemplate,
} from '../types';

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
    // Structures hold no markup of their own; their blocks provide all content.
    content: '',
    themeIds: theme ? [theme.id] : [],
    settings: template.settings,
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
    settings: template.settings,
});

export const applyStructureThemeToState = (
    structure: HtmlConstructorStructure,
    template: HtmlConstructorStructureTemplate,
    theme?: HtmlConstructorThemeTemplate,
): HtmlConstructorStructure => ({
    ...structure,
    templateId: template.id,
    css: withThemeStyles(template.styles, theme),
    themeIds: theme ? [theme.id] : [],
});

export const applyBlockTemplateToBlock = (
    block: HtmlConstructorBlock,
    template: HtmlConstructorBlockTemplate,
    theme?: HtmlConstructorThemeTemplate,
): HtmlConstructorBlock => ({
    ...block,
    templateId: template.id,
    css: withThemeStyles(template.styles, theme),
    content: template.content,
    themeIds: theme ? [theme.id] : [],
    settings: template.settings,
});

export const applyBlockThemeToBlock = (
    block: HtmlConstructorBlock,
    template: HtmlConstructorBlockTemplate,
    theme?: HtmlConstructorThemeTemplate,
): HtmlConstructorBlock => ({
    ...block,
    templateId: template.id,
    css: withThemeStyles(template.styles, theme),
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

const isStructureTemplate = (
    template: HtmlConstructorTemplate,
): template is HtmlConstructorStructureTemplate => template.type === 'structure';

const isBlockTemplate = (
    template: HtmlConstructorTemplate,
): template is HtmlConstructorBlockTemplate => template.type === 'block';

const isThemeTemplate = (
    template: HtmlConstructorTemplate,
): template is HtmlConstructorThemeTemplate => template.type === 'theme';

const isCompatibleWithStructure = (
    template: HtmlConstructorBlockTemplate | HtmlConstructorThemeTemplate,
    activeStructureId: string | undefined,
) => !activeStructureId || !template.structure || template.structure === activeStructureId;

export const getStructureTemplateById = (
    templates: HtmlConstructorTemplate[],
    templateId: string | undefined,
) =>
    templates.find(
        (template): template is HtmlConstructorStructureTemplate =>
            isStructureTemplate(template) && template.id === templateId,
    );

export const getStructureThemeTemplates = (
    templates: HtmlConstructorTemplate[],
    structureId: string | undefined,
) => {
    if (!structureId) return [];

    return templates.filter(
        (template): template is HtmlConstructorThemeTemplate =>
            isThemeTemplate(template) &&
            !template.block &&
            (!template.structure || template.structure === structureId),
    );
};

export const getBlockTemplateById = (
    templates: HtmlConstructorTemplate[],
    templateId: string | undefined,
) =>
    templates.find(
        (template): template is HtmlConstructorBlockTemplate =>
            isBlockTemplate(template) && template.id === templateId,
    );

export const getBlockTemplateStateGroup = (
    templates: HtmlConstructorTemplate[],
    templateId: string | undefined,
    activeStructureId: string | undefined,
) => {
    const currentTemplate = getBlockTemplateById(templates, templateId);
    if (!currentTemplate) {
        return {states: [], themesByBlockId: {} as Record<string, HtmlConstructorThemeTemplate[]>};
    }

    const baseTemplateId = currentTemplate.block ?? currentTemplate.id;
    const blocks = templates.filter(isBlockTemplate);
    const themes = templates.filter(isThemeTemplate);
    const baseTemplate = blocks.find((template) => template.id === baseTemplateId);
    const states = [
        ...(baseTemplate ? [baseTemplate] : []),
        ...blocks.filter((template) => template.block === baseTemplateId),
    ].filter((template) => isCompatibleWithStructure(template, activeStructureId));

    return {
        states,
        themesByBlockId: Object.fromEntries(
            states.map((state) => [
                state.id,
                themes.filter(
                    (theme) =>
                        theme.block === state.id &&
                        isCompatibleWithStructure(theme, activeStructureId),
                ),
            ]),
        ) as Record<string, HtmlConstructorThemeTemplate[]>,
    };
};
