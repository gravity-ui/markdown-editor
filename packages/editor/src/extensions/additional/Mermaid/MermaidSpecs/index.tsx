import {transform} from '@diplodoc/mermaid-extension';

import type {ExtensionAuto, ExtensionNodeSpec} from '#core';
import {generateEntityId} from 'src/utils/entity-id';

import {MermaidConsts, defaultMermaidEntityId, mermaidNodeName} from './const';
export {mermaidNodeName, MermaidConsts} from './const';

export type MermaidSpecsOptions = {
    /** @deprecated Register the view with builder.addNodeView() after the specs. */
    nodeView?: ExtensionNodeSpec['view'];
};

const MermaidSpecsExtension: ExtensionAuto<MermaidSpecsOptions> = (builder, {nodeView}) => {
    builder
        .configureMd((md) => md.use(transform({runtime: 'mermaid', bundle: false}), {}))
        .addNodeSpec(mermaidNodeName, () => ({
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
        }))
        .addMarkdownTokenParserSpec('mermaid', () => ({
            name: mermaidNodeName,
            type: 'node',
            getAttrs: ({content}) => ({
                [MermaidConsts.NodeAttrs.content]: content,
                [MermaidConsts.NodeAttrs.EntityId]: generateEntityId(mermaidNodeName),
            }),
        }))
        .addNodeSerializerSpec(mermaidNodeName, () => (state, node) => {
            const content: string = node.attrs[MermaidConsts.NodeAttrs.content] || '';

            state.write('```mermaid');
            state.ensureNewLine();
            state.text(content.trim(), false);
            state.ensureNewLine();
            state.write('```');
            state.ensureNewLine();
        });

    if (nodeView) {
        builder.addNodeView(mermaidNodeName, nodeView);
    }
};

export const MermaidSpecs = Object.assign(MermaidSpecsExtension, MermaidConsts);
