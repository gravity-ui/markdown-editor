import type { Action, ExtensionAuto, ExtensionDeps, NodeViewConstructor } from '../../../core';

import { WMermaidNodeView } from './MermaidNodeView';
import { MermaidSpecs } from './MermaidSpecs';
import { MermaidAction } from './MermaidSpecs/const';
import { addMermaid } from './actions';

export type MermaidOptions = {
    loadRuntimeScript: () => void;
    autoSave?: {
        enabled: boolean;
        delay?: number;
    };
};

export const Mermaid: ExtensionAuto<MermaidOptions> = (builder, options) => {
    builder.use(MermaidSpecs, {
        nodeView: MermaidNodeViewFactory(options),
    });

    builder.addAction(MermaidAction, () => addMermaid);
};

const MermaidNodeViewFactory: (
    opts: MermaidOptions,
) => (deps: ExtensionDeps) => NodeViewConstructor =
    (options) =>
        () =>
            (node, view, getPos) => {
                return new WMermaidNodeView(node, view, getPos, options);
            };

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [MermaidAction]: Action;
        }
    }
    interface Window {
        mermaidJsonp: Function[];
    }
}
