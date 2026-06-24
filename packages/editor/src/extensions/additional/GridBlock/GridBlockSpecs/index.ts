import type {Node} from 'prosemirror-model';

import type {ExtensionAuto, ExtensionNodeSpec} from '#core';

import type {GridBlock} from '../types';

import {GridBlockConsts, defaultGridBlockEntityId, gridBlockNodeName} from './const';

export {gridBlockNodeName, GridBlockConsts} from './const';

export type GridBlockSpecsOptions = {
    nodeView?: ExtensionNodeSpec['view'];
};

const readBlocks = (node: Node): GridBlock[] => {
    const value = node.attrs[GridBlockConsts.NodeAttrs.blocks];
    return Array.isArray(value) ? value : [];
};

const indent = (text: string, by = '  ') =>
    text
        .split('\n')
        .map((line) => (line ? by + line : line))
        .join('\n');

/** Assembles the static HTML the prototype writes into a YFM HTML block. */
export const buildGridHtml = (node: Node): string => {
    const containerCss: string = node.attrs[GridBlockConsts.NodeAttrs.containerCss] || '';
    const containerStyle = containerCss.trim() ? ` style="${containerCss.trim()}"` : '';

    const blocks = readBlocks(node)
        .map((block, i) => {
            const style = block.css.trim() ? ` style="${block.css.trim()}"` : '';
            const text = block.text ?? '';
            return indent(`<div class="block-${i + 1}"${style}>${text}</div>`);
        })
        .join('\n');

    return `<div class="grid"${containerStyle}>\n${blocks}\n</div>`;
};

const GridBlockSpecsExtension: ExtensionAuto<GridBlockSpecsOptions> = (builder, {nodeView}) => {
    builder.addNode(gridBlockNodeName, () => ({
        // PROTOTYPE: the node is created only via the toolbar action; no markdown
        // token is emitted for it, so this token spec is inert (kept to satisfy the type).
        fromMd: {
            tokenSpec: {name: gridBlockNodeName, type: 'node', noCloseToken: true},
        },
        spec: {
            atom: true,
            selectable: true,
            group: 'block',
            attrs: {
                [GridBlockConsts.NodeAttrs.blocks]: {default: []},
                [GridBlockConsts.NodeAttrs.containerCss]: {default: ''},
                [GridBlockConsts.NodeAttrs.EntityId]: {default: defaultGridBlockEntityId},
            },
            parseDOM: [],
            toDOM(node) {
                return [
                    'div',
                    {
                        class: 'grid-block',
                        [GridBlockConsts.NodeAttrs.EntityId]:
                            node.attrs[GridBlockConsts.NodeAttrs.EntityId],
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

export const GridBlockSpecs = Object.assign(GridBlockSpecsExtension, GridBlockConsts);
