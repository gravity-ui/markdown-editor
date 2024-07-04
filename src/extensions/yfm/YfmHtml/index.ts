import {Action, ExtensionAuto, ExtensionDeps, NodeViewConstructor} from '../../../core';

import {WYfmHtmlNodeView} from './YfmHtmlNodeView';
import {YfmHtmlSpecs} from './YfmHtmlSpecs';
import {YfmHtmlAction} from './YfmHtmlSpecs/const';
import {addYfmHtml} from './actions';

export type YfmHtmlOptions = {loadRuntimeScript: () => void};

export const YfmHtml: ExtensionAuto<YfmHtmlOptions> = (builder, {loadRuntimeScript}) => {
    builder.use(YfmHtmlSpecs, {
        nodeView: YfmHtmlNodeViewFactory({loadRuntimeScript}),
    });

    builder.addAction(YfmHtmlAction, () => addYfmHtml);
};

const YfmHtmlNodeViewFactory: (
    opts: YfmHtmlOptions,
) => (deps: ExtensionDeps) => NodeViewConstructor =
    ({loadRuntimeScript}) =>
    () =>
    (node, view, getPos) => {
        return new WYfmHtmlNodeView(node, view, getPos, {loadRuntimeScript});
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
