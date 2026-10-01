import type {PluginOptions} from '@diplodoc/html-extension';
import type {IHTMLIFrameElementConfig} from '@diplodoc/html-extension/runtime';

import type {Action, ExtensionAuto, ExtensionDeps, NodeViewConstructor} from '#core';

import {WYfmHtmlBlockNodeView} from './YfmHtmlBlockNodeView';
import {YfmHtmlBlockSpecs, yfmHtmlBlockNodeName} from './YfmHtmlBlockSpecs';
import {YfmHtmlBlockAction} from './YfmHtmlBlockSpecs/const';
import {addYfmHtmlBlock} from './actions';

export interface YfmHtmlBlockOptions extends Omit<
    PluginOptions,
    'runtimeJsPath' | 'containerClasses' | 'bundle' | 'embeddingMode'
> {
    useConfig?: () => IHTMLIFrameElementConfig | undefined;
    autoSave?: {
        enabled: boolean;
        delay?: number; // по умолчанию 1000ms
    };
    /** Opens HTML source editing on double-click. Disabled by default. */
    openCodeOnDoubleClick?: boolean;
}

export const YfmHtmlBlock: ExtensionAuto<YfmHtmlBlockOptions> = (builder, options) => {
    const {useConfig: _, autoSave: __, openCodeOnDoubleClick: ___, ...specOptions} = options;
    builder
        .use(YfmHtmlBlockSpecs, specOptions)
        .addNodeView(yfmHtmlBlockNodeName, YfmHtmlBlockNodeViewFactory(options));

    builder.addAction(YfmHtmlBlockAction, () => addYfmHtmlBlock);
};

const YfmHtmlBlockNodeViewFactory: (
    options: YfmHtmlBlockOptions,
) => (deps: ExtensionDeps) => NodeViewConstructor = (options) => () => (node, view, getPos) => {
    return new WYfmHtmlBlockNodeView({node, view, getPos, options});
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [YfmHtmlBlockAction]: Action;
        }
    }
}
