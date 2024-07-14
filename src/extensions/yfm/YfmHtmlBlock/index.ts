import {Action, ExtensionAuto, ExtensionDeps, NodeViewConstructor} from '../../../core';

import {WYfmHtmlBlockNodeView} from './YfmHtmlBlockNodeView';
import {YfmHtmlBlockSpecs} from './YfmHtmlBlockSpecs';
import {YfmHtmlBlockAction} from './YfmHtmlBlockSpecs/const';
import {addYfmHtmlBlock} from './actions';

// TODO: import type from @diplodoc/html-extension
export interface IHTMLIFrameElementConfig {
    classNames?: string[];
    resizeDelay?: number;
    resizePadding?: number;
    styles?: Record<string, string>;
}

export type YfmHtmlBlockOptions = {
    onCreate?: () => IHTMLIFrameElementConfig | undefined;
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
