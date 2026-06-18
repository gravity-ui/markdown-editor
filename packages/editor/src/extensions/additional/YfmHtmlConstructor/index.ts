import type {Action, ExtensionAuto, ExtensionDeps, NodeViewConstructor} from '../../../core';

import {WYfmHtmlConstructorNodeView} from './YfmHtmlConstructorNodeView';
import {YfmHtmlConstructorSpecs} from './YfmHtmlConstructorSpecs';
import {YfmHtmlConstructorAction} from './YfmHtmlConstructorSpecs/const';
import {addYfmHtmlConstructor} from './actions';
import type {YfmHtmlConstructorOptions} from './types';

export const YfmHtmlConstructor: ExtensionAuto<{
    templates?: YfmHtmlConstructorOptions;
}> = (builder, options = {}) => {
    builder.use(YfmHtmlConstructorSpecs, {
        nodeView: yfmHtmlConstructorNodeViewFactory(options),
    });
    builder.addAction(YfmHtmlConstructorAction, () => addYfmHtmlConstructor);
};

const yfmHtmlConstructorNodeViewFactory: (options: {
    templates?: YfmHtmlConstructorOptions;
}) => (deps: ExtensionDeps) => NodeViewConstructor = (options) => () => (node, view, getPos) =>
    new WYfmHtmlConstructorNodeView({node, view, getPos, options});

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [YfmHtmlConstructorAction]: Action;
        }
    }
}
