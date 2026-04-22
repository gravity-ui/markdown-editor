import type {
    Action,
    ExtensionAuto,
    ExtensionDeps,
    NodeViewConstructor,
} from '@gravity-ui/markdown-editor';

import {WYfmPageConstructorNodeView} from './YfmPageConstructorNodeView';
import type {TransformerOptions} from './YfmPageConstructorNodeView/YfmPageConstructorPreview';
export type {TransformerOptions as YfmPageConstructorTransformerOptions};
import {YfmPageConstructorSpecs} from './YfmPageConstructorSpecs';
import {YfmPageConstructorAction} from './YfmPageConstructorSpecs/const';
import {addYfmPageConstructor} from './actions';

export type YfmPageConstructorOptions = {
    canEdit?: boolean;
    autoSave?: {
        enabled: boolean;
        delay?: number;
    };
    transformerOptions?: TransformerOptions;
};

function createNodeViewFactory(
    options: YfmPageConstructorOptions,
): (deps: ExtensionDeps) => NodeViewConstructor {
    return () => (node, view, getPos) => {
        return new WYfmPageConstructorNodeView(node, view, getPos, options);
    };
}

export const YfmPageConstructor: ExtensionAuto<YfmPageConstructorOptions> = (builder, options) => {
    builder.use(YfmPageConstructorSpecs, {
        nodeView: createNodeViewFactory(options),
    });

    builder.addAction(YfmPageConstructorAction, () => addYfmPageConstructor);
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [YfmPageConstructorAction]: Action;
        }
    }
}
