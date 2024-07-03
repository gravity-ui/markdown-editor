import {Action, ExtensionAuto, ExtensionDeps, NodeViewConstructor} from '../../../core';

import {YfmHtmlSpecs} from './YfmHtmlSpecs';
import {YfmHtml as YfmHtmlConst} from './YfmHtmlSpecs/const';
import {YfmHtmlAction} from './const';
import {addYfmHtml} from './actions';
import {YfmHtmlNodeView} from './YfmHtmlNodeView/YfmHtmlNodeView';
import {yfmHtmlTooltipPlugin} from './plugins/YfmHtmlTooltip';
import {NodeType} from 'prosemirror-model';
import {textblockTypeInputRule} from '../../../utils';

export type YfmHtmlOptions = {loadRuntimeScript?: () => void};

export const YfmHtml: ExtensionAuto<YfmHtmlOptions> = (builder, {loadRuntimeScript}) => {
    builder.use(YfmHtmlSpecs, {
        view: YfmHtmlNodeViewFactory({loadRuntimeScript}),
    });

    builder.addAction(YfmHtmlAction, () => addYfmHtml);
    builder.addPlugin(yfmHtmlTooltipPlugin);

    builder.addInputRules(({schema}) => ({rules: [codeBlockRule(YfmHtmlConst.nodeType(schema))]}));
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

// Given a code block node type, returns an input rule that turns a
// textblock starting with ::: html into a code block.
function codeBlockRule(nodeType: NodeType) {
    return textblockTypeInputRule(/^::: html$/, nodeType);
}
