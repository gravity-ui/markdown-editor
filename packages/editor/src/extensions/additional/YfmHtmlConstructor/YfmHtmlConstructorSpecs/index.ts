import type {Node} from 'prosemirror-model';

import type {ExtensionAuto, ExtensionNodeSpec} from '#core';

import {
    blockClass,
    blockSelector,
    hashToScopeId,
    htmlConstructorBlockClass,
    htmlConstructorScopeClassName,
    htmlConstructorStructureClass,
    replaceCssAnchor,
    scopeCss,
    structureClass,
    structureSelector,
    templateCssToRules,
} from '../css';
import {HTML_CONSTRUCTOR_VARIABLES_CSS} from '../cssVariables';
import {emptyHtmlConstructorStructure, readBlocks, readStructure} from '../model';
import {htmlConstructorQuickStyleToCss} from '../quickStyle';
import type {HtmlConstructorBlock, HtmlConstructorStructure} from '../types';

import {
    YfmHtmlConstructorConsts,
    defaultYfmHtmlConstructorEntityId,
    yfmHtmlConstructorNodeName,
} from './const';

export {
    yfmHtmlConstructorNodeName,
    yfmHtmlConstructorNodeType,
    YfmHtmlConstructorAttrs,
    YfmHtmlConstructorConsts,
} from './const';

export type YfmHtmlConstructorSpecsOptions = {
    nodeView?: ExtensionNodeSpec['view'];
    /** Experimental: scope each instance's generated CSS. @see YfmHtmlConstructorExtensionOptions */
    scopeStyles?: boolean;
};

export {emptyHtmlConstructorStructure} from '../model';

const escapeHtmlAttr = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

const styleAttr = (style: string) => (style ? ` style="${escapeHtmlAttr(style)}"` : '');

const indent = (text: string, by = '  ') =>
    text
        .split('\n')
        .map((line) => (line ? by + line : line))
        .join('\n');

const buildCss = (
    structure: HtmlConstructorStructure,
    blocks: HtmlConstructorBlock[],
    scopeSelector?: string,
) => {
    const rules = [
        structure.css.trim() &&
            replaceCssAnchor(templateCssToRules(structure.css), structureSelector()).trim(),
        ...blocks.map(
            (block, index) =>
                block.css.trim() &&
                replaceCssAnchor(templateCssToRules(block.css), blockSelector(index)).trim(),
        ),
    ].filter(Boolean);

    const usesVariables =
        Boolean(structure.quickStyle) || blocks.some((block) => Boolean(block.quickStyle));

    // Nothing to style and no quick-style variables to resolve — skip the
    // contract stylesheet entirely so plain blocks stay markup-only.
    if (!rules.length && !usesVariables) return '';

    let ruleCss = rules.join('\n').replace(/\n{2,}/g, '\n');
    // The generic contract stylesheet stays unscoped (it's identical for every
    // instance); only the per-instance rules are isolated.
    if (scopeSelector && ruleCss) ruleCss = scopeCss(ruleCss, scopeSelector);

    // The contract stylesheet comes first so block/theme rules (higher
    // specificity) and inline quick-style variables can override it.
    return [HTML_CONSTRUCTOR_VARIABLES_CSS, ruleCss].filter(Boolean).join('\n');
};

const buildStructureContent = (
    structure: HtmlConstructorStructure,
    blocks: HtmlConstructorBlock[],
) => {
    const structureStyle = styleAttr(htmlConstructorQuickStyleToCss(structure.quickStyle));
    const children = [
        structure.content.trim(),
        ...blocks.map((block, index) => {
            const blockStyle = styleAttr(htmlConstructorQuickStyleToCss(block.quickStyle));

            return `<div id="${blockClass(index)}" class="${htmlConstructorBlockClass} ${blockClass(
                index,
            )}"${blockStyle}>${block.content ?? ''}</div>`;
        }),
    ].filter(Boolean);

    return `<div id="${structureClass()}" class="${htmlConstructorStructureClass} ${structureClass()}"${structureStyle}>${
        children.length ? `\n${indent(children.join('\n'))}\n` : ''
    }</div>`;
};

const readScopeId = (node: Node): string =>
    hashToScopeId(String(node.attrs[YfmHtmlConstructorConsts.NodeAttrs.EntityId] ?? ''));

/** Assembles the static HTML written into a YFM HTML block. */
export const buildYfmHtmlConstructorHtml = (
    node: Node,
    {scopeStyles}: {scopeStyles?: boolean} = {},
): string => {
    const structure = readStructure(node);
    const blocks = readBlocks(node);

    const scopeClass = scopeStyles ? htmlConstructorScopeClassName(readScopeId(node)) : undefined;
    const css = buildCss(structure, blocks, scopeClass && `.${scopeClass}`);
    const styleTag = css ? `<style>\n${indent(css.trim())}\n</style>\n` : '';
    const html = buildStructureContent(structure, blocks);
    const body = `${styleTag}${html}`.trim();

    // Wrap in the instance scope so the scoped CSS selectors have an ancestor to
    // match against, isolating this constructor from others on the same page.
    return scopeClass ? `<div class="${scopeClass}">\n${indent(body)}\n</div>` : body;
};

const YfmHtmlConstructorSpecsExtension: ExtensionAuto<YfmHtmlConstructorSpecsOptions> = (
    builder,
    {nodeView, scopeStyles},
) => {
    builder.addNode(yfmHtmlConstructorNodeName, () => ({
        // The node is created via the toolbar action; no markdown token is emitted for it.
        fromMd: {
            tokenSpec: {name: yfmHtmlConstructorNodeName, type: 'node', noCloseToken: true},
        },
        spec: {
            atom: true,
            selectable: true,
            group: 'block',
            attrs: {
                [YfmHtmlConstructorConsts.NodeAttrs.structure]: {
                    default: emptyHtmlConstructorStructure(),
                },
                [YfmHtmlConstructorConsts.NodeAttrs.blocks]: {default: []},
                [YfmHtmlConstructorConsts.NodeAttrs.EntityId]: {
                    default: defaultYfmHtmlConstructorEntityId,
                },
            },
            parseDOM: [],
            toDOM(node) {
                return [
                    'div',
                    {
                        class: 'yfm-html-constructor',
                        [YfmHtmlConstructorConsts.NodeAttrs.EntityId]:
                            node.attrs[YfmHtmlConstructorConsts.NodeAttrs.EntityId],
                    },
                ];
            },
            dnd: {props: {offset: [8, 1]}},
        },
        toMd: (state, node) => {
            state.write('::: html');
            state.write('\n');
            state.write(buildYfmHtmlConstructorHtml(node, {scopeStyles}));
            state.ensureNewLine();
            state.write(':::');
            state.closeBlock(node);
        },
        view: nodeView,
    }));
};

export const YfmHtmlConstructorSpecs = Object.assign(
    YfmHtmlConstructorSpecsExtension,
    YfmHtmlConstructorConsts,
);
