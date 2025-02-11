import type {PluginOptions} from '@diplodoc/html-extension';
import type {IHTMLIFrameElementConfig} from '@diplodoc/html-extension/runtime';

import type {Action, ExtensionAuto, ExtensionDeps, NodeViewConstructor} from '../../../core';

import {WYfmHtmlBlockNodeView} from './YfmHtmlBlockNodeView';
import {YfmHtmlBlockSpecs} from './YfmHtmlBlockSpecs';
import {YfmHtmlBlockAction} from './YfmHtmlBlockSpecs/const';
import {addYfmHtmlBlock} from './actions';

export interface YfmHtmlBlockOptions
    extends Omit<PluginOptions, 'runtimeJsPath' | 'containerClasses' | 'bundle' | 'embeddingMode'> {
    useConfig?: () => IHTMLIFrameElementConfig | undefined;
}

export const YfmHtmlBlock: ExtensionAuto<YfmHtmlBlockOptions> = (
    builder,
    {useConfig: _, ...options},
) => {
    builder.use(YfmHtmlBlockSpecs, {
        nodeView: YfmHtmlBlockNodeViewFactory(options),
        ...options,
    });

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
