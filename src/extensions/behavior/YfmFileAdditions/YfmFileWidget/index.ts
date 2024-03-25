import {Action, ExtensionAuto} from '../../../../core';
import {FileUploadHandler} from '../../../../utils/upload';

import {addFileWidget} from './actions';

const addFileAction = 'addFile';

export type YfmFileWidgetOptions = {
    fileUploadHandler?: FileUploadHandler;
};

export const YfmFileWidget: ExtensionAuto<YfmFileWidgetOptions> = (builder, opts) => {
    builder.addAction(addFileAction, (deps) => addFileWidget(deps, opts.fileUploadHandler));
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [addFileAction]: Action;
        }
    }
}
