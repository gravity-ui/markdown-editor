import {
    blockClass,
    blockSelector,
    htmlConstructorBlockClass,
    htmlConstructorStructureClass,
    replaceCssAnchor,
    structureClass,
    structureSelector,
    templateCssToRules,
} from '../css';
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

export const cloneHtmlConstructorBlock = (block: HtmlConstructorBlock): HtmlConstructorBlock => ({
    ...block,
    id: createHtmlConstructorBlockId(),
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

const PREVIEW_STRUCTURE: HtmlConstructorStructure = {css: '', content: '', themeIds: []};

/** Markup + CSS for previewing a single block template (optionally themed). */
export const buildBlockPreviewParts = (
    template: HtmlConstructorBlockTemplate,
    theme?: HtmlConstructorThemeTemplate,
) => {
    const block = blockTemplateToBlock(template, theme);

    return {
        markup: `<div class="${htmlConstructorBlockClass} ${blockClass(0)}">${block.content}</div>`,
        css: buildPreviewCss({structure: PREVIEW_STRUCTURE, blocks: [block]}),
    };
};

/** Markup + CSS for previewing a whole structure template with its blocks (optionally themed). */
export const buildStructurePreviewParts = (
    templates: HtmlConstructorTemplate[],
    structure: HtmlConstructorStructureTemplate,
    theme?: HtmlConstructorThemeTemplate,
) => {
    const {structure: state, blocks} = structureTemplateToAttrs(templates, structure, theme);
    const blocksHtml = blocks
        .map(
            (block, index) =>
                `<div class="${htmlConstructorBlockClass} ${blockClass(index)}">${block.content}</div>`,
        )
        .join('');

    return {
        markup: `<div class="${htmlConstructorStructureClass} ${structureClass()}">${state.content}${blocksHtml}</div>`,
        css: buildPreviewCss({structure: state, blocks}),
    };
};

/** The locked wrapper lines shown around the structure's editable inner markup. */
export const getStructureHtmlFrame = () => ({
    top: `<div class="${htmlConstructorStructureClass} ${structureClass()}">`,
    bottom: '</div>',
});

const indentLines = (value: string, pad = '  ') =>
    value
        .split('\n')
        .map((line) => (line.trim() ? `${pad}${line}` : line))
        .join('\n');

/**
 * Builds the full editable inner markup of a structure: its own content followed by
 * every block wrapped in its `g-md-hc-block` div, mirroring the serialized output.
 */
export const assembleStructureHtml = (
    structure: HtmlConstructorStructure,
    blocks: HtmlConstructorBlock[],
): string => {
    const parts: string[] = [];

    const content = structure.content.trim();
    if (content) parts.push(content);

    blocks.forEach((block, index) => {
        const inner = block.content.trim();
        const body = inner ? `\n${indentLines(inner)}\n` : '';
        parts.push(`<div class="${htmlConstructorBlockClass} ${blockClass(index)}">${body}</div>`);
    });

    return parts.join('\n\n');
};

/**
 * Reconstructs the structure content + blocks from edited inner markup. Top-level
 * `g-md-hc-block` wrappers map back to blocks (preserving existing block metadata by
 * position); anything else becomes the structure's own content. Mangled wrappers
 * simply fall back into the structure content — editing may break blocks, and that's ok.
 */
export const parseStructureHtml = (
    html: string,
    structure: HtmlConstructorStructure,
    blocks: HtmlConstructorBlock[],
): {content: string; blocks: HtmlConstructorBlock[]} => {
    if (typeof document === 'undefined') {
        return {content: structure.content, blocks};
    }

    const template = document.createElement('template');
    template.innerHTML = html;

    const contentParts: string[] = [];
    const nextBlocks: HtmlConstructorBlock[] = [];

    for (const node of Array.from(template.content.childNodes)) {
        if (node instanceof HTMLElement && node.classList.contains(htmlConstructorBlockClass)) {
            const existing = blocks[nextBlocks.length];
            const content = node.innerHTML.trim();
            nextBlocks.push(
                existing
                    ? {...existing, content}
                    : {id: createHtmlConstructorBlockId(), css: '', content, themeIds: []},
            );
            continue;
        }

        if (node instanceof HTMLElement) {
            contentParts.push(node.outerHTML);
        } else if (node.textContent && node.textContent.trim()) {
            contentParts.push(node.textContent.trim());
        }
    }

    return {content: contentParts.join('\n'), blocks: nextBlocks};
};

/**
 * Builds the full combined stylesheet of a structure for the code editor: structure
 * rules followed by every block's rules, each resolved to its real selector. Unlike
 * {@link buildPreviewCss} it keeps blank lines between rules for readability.
 */
export const assembleStructureCss = (
    structure: HtmlConstructorStructure,
    blocks: HtmlConstructorBlock[],
): string =>
    [
        structure.css.trim() && prepareCss(structure.css, structureSelector()),
        ...blocks.map(
            (block, index) => block.css.trim() && prepareCss(block.css, blockSelector(index)),
        ),
    ]
        .filter(Boolean)
        .join('\n\n');

export const getActiveStructureTemplateId = (structure: HtmlConstructorStructure) =>
    structure.templateId;

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
