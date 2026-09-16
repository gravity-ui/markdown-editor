import {
    blockClass,
    htmlConstructorBlockClass,
    htmlConstructorStructureClass,
    structureClass,
} from '../css';
import {buildPreviewCss} from '../document';
import type {
    HtmlConstructorBlockTemplate,
    HtmlConstructorStructure,
    HtmlConstructorStructureTemplate,
    HtmlConstructorTemplate,
    HtmlConstructorThemeTemplate,
} from '../types';

import {blockTemplateToBlock, structureTemplateToAttrs} from './state';

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
