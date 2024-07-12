import {Action, ExtensionAuto, ExtensionDeps, NodeViewConstructor} from '../../../core';

import {WYfmHtmlNodeView} from './YfmHtmlNodeView';
import {YfmHtmlSpecs} from './YfmHtmlSpecs';
import {YfmHtmlAction} from './YfmHtmlSpecs/const';
import {addYfmHtml} from './actions';

export type YfmHtmlOptions = {};

export const YfmHtml: ExtensionAuto<YfmHtmlOptions> = (builder) => {
    builder.use(YfmHtmlSpecs, {
        nodeView: YfmHtmlNodeViewFactory({
            onCreate: () => ({
                innerClassName: 'yfm-html',
                style: {},
            }),
        }),
    });

    builder.addAction(YfmHtmlAction, () => addYfmHtml);
};

const YfmHtmlNodeViewFactory: (
    opts: YfmHtmlOptions,
) => (deps: ExtensionDeps) => NodeViewConstructor = () => () => (node, view, getPos) => {
    return new WYfmHtmlNodeView(node, view, getPos);
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
