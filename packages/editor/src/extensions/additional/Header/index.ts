import type {Action, ExtensionAuto} from '#core';
import type {FileUploadHandler} from 'src/utils/upload';

import {HeaderSpecs} from './HeaderSpecs';
import {backspaceInHeader, enterHeaderContent, exitHeaderForward, toHeader} from './commands';
import {headerTooltipPlugin} from './plugins/HeaderTooltipPlugin';

import './index.scss';

export * from './HeaderSpecs';
export * from './commands';
export {wHeaderItemData} from './toolbar';

export type HeaderOptions = {
    fileUploadHandler?: FileUploadHandler;
    headerKey?: string | null;
};

const headerAction = 'toHeader';

export const Header: ExtensionAuto<HeaderOptions> = (builder, opts) => {
    builder.use(HeaderSpecs);

    builder.addPlugin(() => headerTooltipPlugin(opts.fileUploadHandler));

    builder.addAction(headerAction, () => ({
        isActive: () => false,
        isEnable: toHeader,
        run: toHeader,
    }));

    builder.addKeymap(
        () => ({
            Enter: enterHeaderContent,
            'Mod-Enter': exitHeaderForward,
            Backspace: backspaceInHeader,
            ...(opts.headerKey ? {[opts.headerKey]: toHeader} : {}),
        }),
        builder.Priority.VeryHigh,
    );
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [headerAction]: Action;
        }
    }
}
