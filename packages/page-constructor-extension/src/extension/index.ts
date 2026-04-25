import type {Action, ExtensionAuto} from '@gravity-ui/markdown-editor';
import {Plugin} from '@gravity-ui/markdown-editor/pm/state';

import {WYfmPageConstructorNodeView} from './YfmPageConstructorNodeView';
import type {TransformerOptions} from './YfmPageConstructorNodeView/YfmPageConstructorPreview';
export type {TransformerOptions as YfmPageConstructorTransformerOptions};
import {YfmPageConstructorSpecsExtension} from './YfmPageConstructorSpecs';
import {yfmPageConstructorNodeName} from './YfmPageConstructorSpecs/const';
import {addYfmPageConstructor} from './actions';
import {YfmPageConstructorAction} from './const';

export type YfmPageConstructorExtensionOptions = {
    /** Whether the user can edit page-constructor blocks in WYSIWYG mode. @default true */
    canEdit?: boolean;
    /** Auto-save configuration for the YAML editor inside the node view. */
    autoSave?: {
        /** Enable auto-save. When true, changes are saved automatically after a delay. */
        enabled: boolean;
        /** Delay in milliseconds before auto-saving after the last edit. */
        delay?: number;
    };
    /** Options for server-side content transformation, or `false` to disable it. */
    transformerOptions?: TransformerOptions;
};

export const YfmPageConstructorExtension: ExtensionAuto<YfmPageConstructorExtensionOptions> = (
    builder,
    options,
) => {
    builder.use(YfmPageConstructorSpecsExtension);

    builder.addPlugin(() => {
        return new Plugin({
            props: {
                nodeViews: {
                    [yfmPageConstructorNodeName]: (node, view, getPos) => {
                        return new WYfmPageConstructorNodeView(node, view, getPos, options);
                    },
                },
            },
        });
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
