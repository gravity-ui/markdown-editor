import {Action, ExtensionAuto, ExtensionDeps, NodeViewConstructor} from '../../../core';

import {WYfmHtmlNodeView} from './YfmHtmlNodeView';
import {YfmHtmlSpecs} from './YfmHtmlSpecs';
import {YfmHtmlAction} from './YfmHtmlSpecs/const';
import {addYfmHtml} from './actions';

// TODO: import type from @diplodoc/html-extension
export interface IHTMLIFrameElementConfig {
    classNames?: string[];
    resizeDelay?: number;
    resizePadding?: number;
    styles?: Record<string, string>;
}

export type YfmHtmlOptions = {
    onCreate?: () => IHTMLIFrameElementConfig;
};

export const YfmHtml: ExtensionAuto<YfmHtmlOptions> = (builder, options) => {
    builder.use(YfmHtmlSpecs, {
        nodeView: YfmHtmlNodeViewFactory(options),
    });

    builder.addAction(YfmHtmlAction, () => addYfmHtml);
};

const YfmHtmlNodeViewFactory: (
    options: YfmHtmlOptions,
) => (deps: ExtensionDeps) => NodeViewConstructor = (options) => () => (node, view, getPos) => {
    return new WYfmHtmlNodeView({node, view, getPos, options});
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [YfmHtmlAction]: Action;
        }
    }
    interface Window {
        yfmHtmlJsonp: Function[];
    }
}
