// eslint-disable-next-line import/no-extraneous-dependencies
import {transform} from '@diplodoc/mermaid-extension';

import type {ExtensionAuto, ExtensionNodeSpec} from '#core';
import {generateEntityId} from 'src/utils/entity-id';

import {MermaidConsts, defaultMermaidEntityId, mermaidNodeName} from './const';
export {mermaidNodeName, MermaidConsts} from './const';

export type MermaidSpecsOptions = {
    nodeView?: ExtensionNodeSpec['view'];
};

const MermaidSpecsExtension: ExtensionAuto<MermaidSpecsOptions> = (builder, {nodeView}) => {
    builder
        .configureMd((md) => md.use(transform({runtime: 'mermaid', bundle: false}), {}))
        .addNode(mermaidNodeName, () => ({
            fromMd: {
                tokenSpec: {
                    name: mermaidNodeName,
                    type: 'node',
                    getAttrs: ({content}) => ({
                        [MermaidConsts.NodeAttrs.content]: content,
                        [MermaidConsts.NodeAttrs.EntityId]: generateEntityId(mermaidNodeName),
                    }),
                },
            },
            spec: {
                selectable: true,
                atom: true,
                group: 'block',
                attrs: {
                    [MermaidConsts.NodeAttrs.content]: {default: ''},
                    [MermaidConsts.NodeAttrs.class]: {default: 'mermaid'},
                    [MermaidConsts.NodeAttrs.EntityId]: {default: defaultMermaidEntityId},
                    [MermaidConsts.NodeAttrs.newCreated]: {default: null},
                },
                parseDOM: [],
                toDOM(node) {
                    return ['div', node.attrs];
                },
                dnd: {props: {offset: [8, 1]}},
            },
            toMd: (state, node) => {
                const content: string = node.attrs[MermaidConsts.NodeAttrs.content] || '';

                state.write('```mermaid');
                state.ensureNewLine();
                state.text(content.trim(), false);
                state.ensureNewLine();
                state.write('```');
                state.ensureNewLine();
            },
            view: nodeView,
        }));
};

export const MermaidSpecs = Object.assign(MermaidSpecsExtension, MermaidConsts);
