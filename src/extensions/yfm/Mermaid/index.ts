import {Action, ExtensionAuto, ExtensionDeps, NodeViewConstructor} from '../../../core';

import {WMermaidNodeView} from './MermaidNodeView';
import {MermaidSpecs} from './MermaidSpecs';
import {MermaidAction} from './MermaidSpecs/const';
import {addMermaid} from './actions';

export type MermaidOptions = {loadRuntimeScript: () => void};

export const Mermaid: ExtensionAuto<MermaidOptions> = (builder, {loadRuntimeScript}) => {
    builder.use(MermaidSpecs, {
        nodeView: MermaidNodeViewFactory({loadRuntimeScript}),
    });

    builder.addAction(MermaidAction, () => addMermaid);
};

const MermaidNodeViewFactory: (
    opts: MermaidOptions,
) => (deps: ExtensionDeps) => NodeViewConstructor =
    ({loadRuntimeScript}) =>
    () =>
    (node, view, getPos) => {
        return new WMermaidNodeView(node, view, getPos, {loadRuntimeScript});
    };

declare global {
    namespace YfmEditor {
        interface Actions {
            [MermaidAction]: Action;
        }
    }
    interface Window {
        mermaidJsonp: Function[];
    }
}
