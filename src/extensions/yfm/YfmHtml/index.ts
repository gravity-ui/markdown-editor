import {Action, ExtensionAuto, ExtensionDeps, NodeViewConstructor} from '../../../core';

import {YfmHtmlSpecs} from './YfmHtmlSpecs';
import {YfmHtmlAction} from './const';
import {addYfmHtml} from './actions';
import {YfmHtmlNodeView} from './YfmHtmlNodeView/YfmHtmlNodeView';

export type YfmHtmlOptions = {loadRuntimeScript?: () => void};

export const YfmHtml: ExtensionAuto<YfmHtmlOptions> = (builder, {loadRuntimeScript}) => {
    builder.use(YfmHtmlSpecs, {
        view: YfmHtmlNodeViewFactory({loadRuntimeScript}),
    });

    builder.addAction(YfmHtmlAction, () => addYfmHtml);
};

const YfmHtmlNodeViewFactory: (
    opts: YfmHtmlOptions,
) => (deps: ExtensionDeps) => NodeViewConstructor =
    ({loadRuntimeScript}) => () =>
        (node, view) => new YfmHtmlNodeView({
            view,
            node,
            options: {loadRuntimeScript}
        });

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [YfmHtmlAction]: Action;
        }
    }
}
