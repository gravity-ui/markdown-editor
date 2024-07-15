import type {IHTMLIFrameElementConfig} from '@diplodoc/html-extension/runtime';

import {Action, ExtensionAuto, ExtensionDeps, NodeViewConstructor} from '../../../core';

import {WYfmHtmlBlockNodeView} from './YfmHtmlBlockNodeView';
import {YfmHtmlBlockSpecs} from './YfmHtmlBlockSpecs';
import {YfmHtmlBlockAction} from './YfmHtmlBlockSpecs/const';
import {addYfmHtmlBlock} from './actions';

export type YfmHtmlBlockOptions = {
    useConfig?: () => IHTMLIFrameElementConfig | undefined;
};

export const YfmHtmlBlock: ExtensionAuto<YfmHtmlBlockOptions> = (builder, options) => {
    builder.use(YfmHtmlBlockSpecs, {
        nodeView: YfmHtmlBlockNodeViewFactory(options),
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
