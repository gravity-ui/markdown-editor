import type {
    Action,
    ExtensionAuto,
    ExtensionDeps,
    NodeViewConstructor,
} from '@gravity-ui/markdown-editor/core';
import type {MermaidConfig} from 'mermaid' with {'resolution-mode': 'import'};

import {WMermaidNodeView} from './MermaidNodeView';
import {MermaidSpecs, mermaidNodeName} from './MermaidSpecs';
import {addMermaid} from './actions';
import {MermaidAction} from './const';

export type MermaidOptions = {
    /** Runtime loader called for each diagram; the runtime must register via window.mermaidJsonp. */
    loadRuntimeScript: () => void;
    /** Automatic saving of diagram edits; enabled with a 500 ms delay when omitted. */
    autoSave?: {
        /** Whether edits are saved automatically instead of through the Save button. */
        enabled: boolean;
        /** Debounce delay in milliseconds; defaults to 500. */
        delay?: number;
    };
    /** Mermaid theme overrides; the runtime configuration is preserved when omitted. */
    theme?: {
        /** Mermaid theme used when the editor theme is dark. */
        dark: MermaidConfig['theme'];
        /** Mermaid theme used when the editor theme is light. */
        light: MermaidConfig['theme'];
    };
};

export const Mermaid: ExtensionAuto<MermaidOptions> = (builder, options) => {
    builder.use(MermaidSpecs, {}).addNodeView(mermaidNodeName, MermaidNodeViewFactory(options));

    builder.addAction(MermaidAction, () => addMermaid);
};

const MermaidNodeViewFactory: (
    opts: MermaidOptions,
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
