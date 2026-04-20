import type {Action, ExtensionAuto, ExtensionDeps, NodeViewConstructor} from '../../../core';

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

export const YfmPageConstructor: ExtensionAuto<YfmPageConstructorOptions> = (builder, options) => {
    builder.use(YfmPageConstructorSpecs, {
        nodeView: YfmPageConstructorNodeViewFactory(options),
    });

    builder.addAction(YfmPageConstructorAction, () => addYfmPageConstructor);
};

const YfmPageConstructorNodeViewFactory: (
    opts: YfmPageConstructorOptions,
) => (deps: ExtensionDeps) => NodeViewConstructor = (options) => () => (node, view, getPos) => {
    return new WYfmPageConstructorNodeView(node, view, getPos, options);
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [YfmPageConstructorAction]: Action;
        }
    }
}
