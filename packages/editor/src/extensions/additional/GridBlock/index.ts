import type {Action, ExtensionAuto, ExtensionDeps, NodeViewConstructor} from '../../../core';

import {WGridBlockNodeView} from './GridBlockNodeView';
import {GridBlockSpecs} from './GridBlockSpecs';
import {GridBlockAction} from './GridBlockSpecs/const';
import {addGridBlock} from './actions';

export const GridBlock: ExtensionAuto = (builder) => {
    builder.use(GridBlockSpecs, {nodeView: gridBlockNodeViewFactory()});
    builder.addAction(GridBlockAction, () => addGridBlock);
};

const gridBlockNodeViewFactory: () => (deps: ExtensionDeps) => NodeViewConstructor =
    () => () => (node, view, getPos) =>
        new WGridBlockNodeView({node, view, getPos});

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [GridBlockAction]: Action;
        }
    }
}
