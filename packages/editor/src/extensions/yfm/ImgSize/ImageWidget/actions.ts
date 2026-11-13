import type {ActionSpec, ExtensionDeps} from '../../../../core';

import {type ImageWidgetDescriptorOpts, addWidget} from './widget';

export const addImageWidget: (
    deps: ExtensionDeps,
    opts: ImageWidgetDescriptorOpts,
) => ActionSpec = (deps, opts) => ({
    isEnable: (state) => state.selection.empty,
    run(state, dispatch) {
        if (!state.selection.empty) return;

        dispatch(addWidget(state.tr, deps, opts));
    },
});
