import type {
    Action,
    ExtensionAuto,
    ExtensionDeps,
    NodeViewConstructor,
} from '@gravity-ui/markdown-editor';
import type {MermaidConfig} from 'mermaid' with {'resolution-mode': 'import'};

import {WMermaidNodeView} from './MermaidNodeView';
import {MermaidSpecsExtension, mermaidNodeName} from './MermaidSpecs';
import {MermaidAction} from './MermaidSpecs/const';
import {addMermaid} from './actions';

export type MermaidExtensionOptions = {
    loadRuntimeScript: () => void;
    autoSave?: {
        enabled: boolean;
        delay?: number;
    };
    theme?: {
        dark: MermaidConfig['theme'];
        light: MermaidConfig['theme'];
    };
};

export const MermaidExtension: ExtensionAuto<MermaidExtensionOptions> = (builder, options) => {
    builder
        .use(MermaidSpecsExtension, {})
        .addNodeView(mermaidNodeName, MermaidNodeViewFactory(options));

    builder.addAction(MermaidAction, () => addMermaid);
};

const MermaidNodeViewFactory: (
    opts: MermaidExtensionOptions,
) => (deps: ExtensionDeps) => NodeViewConstructor = (options) => () => (node, view, getPos) => {
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
