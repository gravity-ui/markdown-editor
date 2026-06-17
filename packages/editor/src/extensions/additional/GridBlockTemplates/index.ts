import type {Action, ExtensionAuto, ExtensionDeps, NodeViewConstructor} from '../../../core';

import {WGridBlockTemplatesNodeView} from './GridBlockTemplatesNodeView';
import {GridBlockTemplatesSpecs} from './GridBlockTemplatesSpecs';
import {GridBlockTemplatesAction} from './GridBlockTemplatesSpecs/const';
import {addGridBlockTemplates} from './actions';
import type {GridBlockTemplatesOptions} from './types';

export const GridBlockTemplates: ExtensionAuto<{
    templates?: GridBlockTemplatesOptions;
}> = (builder, options = {}) => {
    builder.use(GridBlockTemplatesSpecs, {
        nodeView: gridBlockTemplatesNodeViewFactory(options),
    });
    builder.addAction(GridBlockTemplatesAction, () => addGridBlockTemplates);
};

const gridBlockTemplatesNodeViewFactory: (options: {
    templates?: GridBlockTemplatesOptions;
}) => (deps: ExtensionDeps) => NodeViewConstructor = (options) => () => (node, view, getPos) =>
    new WGridBlockTemplatesNodeView({node, view, getPos, options});

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [GridBlockTemplatesAction]: Action;
        }
    }
}
