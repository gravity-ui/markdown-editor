import type {Action, ExtensionAuto, ExtensionDeps, NodeViewConstructor} from '../../../core';

import {WYfmHtmlConstructorNodeView} from './YfmHtmlConstructorNodeView';
import {YfmHtmlConstructorSpecs} from './YfmHtmlConstructorSpecs';
import {YfmHtmlConstructorAction} from './YfmHtmlConstructorSpecs/const';
import {addYfmHtmlConstructor} from './actions';
import type {YfmHtmlConstructorExtensionOptions} from './types';

export const YfmHtmlConstructor: ExtensionAuto<YfmHtmlConstructorExtensionOptions> = (
    builder,
    options = {},
) => {
    builder.use(YfmHtmlConstructorSpecs, {
        nodeView: yfmHtmlConstructorNodeViewFactory(options),
        scopeStyles: options.scopeStyles,
    });
    builder.addAction(YfmHtmlConstructorAction, () => addYfmHtmlConstructor);
};

const yfmHtmlConstructorNodeViewFactory: (
    options: YfmHtmlConstructorExtensionOptions,
) => (deps: ExtensionDeps) => NodeViewConstructor = (options) => () => (node, view, getPos) =>
    new WYfmHtmlConstructorNodeView({node, view, getPos, options});

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [YfmHtmlConstructorAction]: Action;
        }
    }
}
