import type {ActionSpec, ExtensionDeps} from '../../../../core';
import type {FileUploadHandler} from '../../../../utils/upload';

import {addWidget} from './widget';

export const addFileWidget: (deps: ExtensionDeps, uploadFiles?: FileUploadHandler) => ActionSpec = (
    deps,
    uploadFiles,
) => ({
    isEnable: (state) => state.selection.empty,
    run(state, dispatch) {
        dispatch(addWidget(state.tr, deps, uploadFiles));
    },
});
