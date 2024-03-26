// eslint-disable-next-line import/no-extraneous-dependencies
import {transform} from '@diplodoc/mermaid-extension';

import {ExtensionAuto, YENodeSpec} from '../../../../core';

import {MermaidConsts, mermaidNodeName as mermaidNodeName} from './const';
export {mermaidNodeName} from './const';

export type MermaidSpecsOptions = {
    nodeView?: YENodeSpec['view'];
};

const MermaidSpecsExtension: ExtensionAuto<MermaidSpecsOptions> = (builder, {nodeView}) => {
    builder
        .configureMd((md) => md.use(transform({runtime: 'mermaid', bundle: false}), {}))
        .addNode(mermaidNodeName, () => ({
            fromYfm: {
                tokenSpec: {
                    name: mermaidNodeName,
                    type: 'node',
                    getAttrs: ({content}) => ({content}),
                },
            },
            spec: {
                selectable: true,
                atom: true,
                group: 'block',
                attrs: {
                    [MermaidConsts.NodeAttrs.content]: {default: ''},
                    [MermaidConsts.NodeAttrs.class]: {default: 'mermaid'},
                    [MermaidConsts.NodeAttrs.newCreated]: {default: null},
                },
                parseDOM: [],
                toDOM(node) {
                    return ['div', node.attrs];
                },
                dnd: {props: {offset: [8, 1]}},
            },
            toYfm: (state, node) => {
                state.write('```mermaid\n');
                state.ensureNewLine();
                state.write(node.attrs.content);
                state.ensureNewLine();
                state.write('```');
                state.ensureNewLine();
            },
            view: nodeView,
        }));
};

export const MermaidSpecs = Object.assign(MermaidSpecsExtension, MermaidConsts);
