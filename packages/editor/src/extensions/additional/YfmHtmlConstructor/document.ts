import {
    blockClass,
    blockSelector,
    htmlConstructorBlockClass,
    htmlConstructorStructureClass,
    replaceCssAnchor,
    scopeCss,
    structureClass,
    structureSelector,
    templateCssToRules,
} from './css';
import {HTML_CONSTRUCTOR_VARIABLES_CSS} from './cssVariables';
import {createHtmlConstructorBlockId} from './model';
import type {HtmlConstructorBlock, HtmlConstructorStructure} from './types';

export type CodeChange = {html?: string; css?: string};
export type ConstructorDocument = {
    structure: HtmlConstructorStructure;
    blocks: HtmlConstructorBlock[];
};

export const applyCodeChange = (
    {structure, blocks}: ConstructorDocument,
    change: CodeChange,
): ConstructorDocument => {
    const parsed =
        change.html === undefined
            ? {content: structure.content, blocks}
            : parseStructureHtml(change.html, structure, blocks);
    return {
        structure: {...structure, content: parsed.content, css: change.css ?? structure.css},
        // The combined stylesheet replaces individual block rules only when CSS was edited.
        blocks:
            change.css === undefined
                ? parsed.blocks
                : parsed.blocks.map((block) => ({...block, css: ''})),
    };
};

const prepareCss = (css: string, selector: string) =>
    replaceCssAnchor(templateCssToRules(css), selector).trim();

const prepareDocumentCss = (structure: HtmlConstructorStructure, blocks: HtmlConstructorBlock[]) =>
    [
        structure.css.trim() && prepareCss(structure.css, structureSelector()),
        ...blocks.map(
            (block, index) => block.css.trim() && prepareCss(block.css, blockSelector(index)),
        ),
    ].filter(Boolean);

export const buildPreviewCss = ({
    structure,
    blocks,
    scopeSelector,
    exclude,
}: ConstructorDocument & {
    scopeSelector?: string;
    exclude?: string;
}) =>
    prepareDocumentCss(structure, blocks)
        .map((css) => scopeCss(css, scopeSelector, exclude))
        .filter(Boolean)
        .join('\n')
        .replace(/\n{2,}/g, '\n');

/** The locked wrapper lines shown around the structure's editable inner markup. */
export const getStructureHtmlFrame = () => ({
    top: `<div class="${htmlConstructorStructureClass} ${structureClass()}">`,
    bottom: '</div>',
});

/** Show shared theme variables above the editable instance styles. */
export const getStructureCssFrame = () => ({
    top: HTML_CONSTRUCTOR_VARIABLES_CSS,
    bottom: '',
});

const indentLines = (value: string, pad = '  ') =>
    value
        .split('\n')
        .map((line) => (line.trim() ? `${pad}${line}` : line))
        .join('\n');

/** Editable structure markup, with numbered wrappers preserving block identity. */
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

/** Match generated wrapper classes to their original blocks before applying edits. */
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

    const contentHost = document.createElement('div');
    const nextBlocks: HtmlConstructorBlock[] = [];
    const blocksByClass = new Map(blocks.map((block, index) => [blockClass(index), block]));
    const usedBlockIds = new Set<string>();

    for (const node of Array.from(template.content.childNodes)) {
        if (node instanceof HTMLElement && node.classList.contains(htmlConstructorBlockClass)) {
            const existing = Array.from(node.classList)
                .map((className) => blocksByClass.get(className))
                .find(Boolean);
            const content = node.innerHTML.trim();
            const id =
                existing && !usedBlockIds.has(existing.id)
                    ? existing.id
                    : createHtmlConstructorBlockId();
            nextBlocks.push(
                existing ? {...existing, id, content} : {id, css: '', content, themeIds: []},
            );
            usedBlockIds.add(id);
            continue;
        }

        contentHost.append(node);
    }

    return {content: contentHost.innerHTML.trim(), blocks: nextBlocks};
};

/** Preserve blank lines and invalid CSS while editing the combined stylesheet. */
export const assembleStructureCss = (
    structure: HtmlConstructorStructure,
    blocks: HtmlConstructorBlock[],
): string => prepareDocumentCss(structure, blocks).join('\n\n');
