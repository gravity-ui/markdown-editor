import type {Node} from 'prosemirror-model';

import type {ExtensionAuto, ExtensionNodeSpec} from '#core';

import {blockClass, gridScopeClass, scopeCss} from '../css';
import type {GridBlock} from '../types';

import {
    GridBlockTemplatesConsts,
    defaultGridBlockTemplatesEntityId,
    gridBlockTemplatesNodeName,
} from './const';

export {gridBlockTemplatesNodeName, GridBlockTemplatesConsts} from './const';

export type GridBlockTemplatesSpecsOptions = {
    nodeView?: ExtensionNodeSpec['view'];
};

const readBlocks = (node: Node): GridBlock[] => {
    const value = node.attrs[GridBlockTemplatesConsts.NodeAttrs.blocks];
    return Array.isArray(value) ? value : [];
};

const indent = (text: string, by = '  ') =>
    text
        .split('\n')
        .map((line) => (line ? by + line : line))
        .join('\n');

/** Assembles the static HTML written into a YFM HTML block. */
export const buildGridHtml = (node: Node): string => {
    const customCss: string = node.attrs[GridBlockTemplatesConsts.NodeAttrs.customCss] || '';
    const entityId: string = node.attrs[GridBlockTemplatesConsts.NodeAttrs.EntityId];
    const scopeClass = gridScopeClass(entityId);
    const gridBlocks = readBlocks(node);

    const blocks = gridBlocks
        .map((block, i) => indent(`<div class="${blockClass(i)}">${block.content ?? ''}</div>`))
        .join('\n');

    const rules = [
        customCss.trim() && scopeCss(customCss, `.${scopeClass}`).trim(),
        ...gridBlocks.map(
            (block, i) =>
                block.css.trim() && scopeCss(block.css, `.${scopeClass} .${blockClass(i)}`).trim(),
        ),
    ]
        .filter(Boolean)
        .join('\n');

    const styleTag = rules ? `<style>\n${indent(rules.trim())}\n</style>\n` : '';
    const grid = `<div class="grid">\n${blocks}\n</div>`;

    return `<div class="${scopeClass}">\n${styleTag ? indent(styleTag.trimEnd()) + '\n' : ''}${indent(grid)}\n</div>`;
};

const GridBlockTemplatesSpecsExtension: ExtensionAuto<GridBlockTemplatesSpecsOptions> = (
    builder,
    {nodeView},
) => {
    builder.addNode(gridBlockTemplatesNodeName, () => ({
        // The node is created via the toolbar action; no markdown token is emitted for it.
        fromMd: {
            tokenSpec: {name: gridBlockTemplatesNodeName, type: 'node', noCloseToken: true},
        },
        spec: {
            atom: true,
            selectable: true,
            group: 'block',
            attrs: {
                [GridBlockTemplatesConsts.NodeAttrs.blocks]: {default: []},
                [GridBlockTemplatesConsts.NodeAttrs.customCss]: {default: ''},
                [GridBlockTemplatesConsts.NodeAttrs.EntityId]: {
                    default: defaultGridBlockTemplatesEntityId,
                },
            },
            parseDOM: [],
            toDOM(node) {
                return [
                    'div',
                    {
                        class: 'grid-block-templates',
                        [GridBlockTemplatesConsts.NodeAttrs.EntityId]:
                            node.attrs[GridBlockTemplatesConsts.NodeAttrs.EntityId],
                    },
                ];
            },
            dnd: {props: {offset: [8, 1]}},
        },
        toMd: (state, node) => {
            state.write('::: html');
            state.write('\n');
            state.write(buildGridHtml(node));
            state.ensureNewLine();
            state.write(':::');
            state.closeBlock(node);
        },
        view: nodeView,
    }));
};

export const GridBlockTemplatesSpecs = Object.assign(
    GridBlockTemplatesSpecsExtension,
    GridBlockTemplatesConsts,
);
