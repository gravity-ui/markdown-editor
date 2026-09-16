import {chainCommands} from 'prosemirror-commands';

import type {Action, ExtensionAuto} from '#core';
import {withLogAction} from 'src/utils/keymap';
import type {FileUploadHandler} from 'src/utils/upload';

import {HeaderSpecs} from './HeaderSpecs';
import {
    exitHeaderForward,
    nextHeaderSlot,
    previousHeaderSlot,
    removeEmptyAction,
    toHeader,
    unwrapHeader,
} from './commands';
import {headerTooltipPlugin} from './plugins/HeaderTooltipPlugin';
import {headerActivePlugin} from './plugins/active';
import {headerImageUploadPlugin} from './plugins/imageUpload';

import './index.scss';

export * from './HeaderSpecs';
export * from './commands';

const headerAction = 'toHeader';

export type HeaderOptions = {
    /** Uploads background images; URLs can also be entered directly. */
    fileUploadHandler?: FileUploadHandler;
    headerKey?: string | null;
};

export const Header: ExtensionAuto<HeaderOptions> = (builder, opts = {}) => {
    builder.use(HeaderSpecs);

    builder
        .addPlugin(headerImageUploadPlugin)
        .addPlugin(() => headerTooltipPlugin({fileUploadHandler: opts.fileUploadHandler}))
        .addPlugin(headerActivePlugin)
        .addAction(headerAction, () => ({
            isEnable: toHeader,
            isActive: () => false,
            run: toHeader,
        }))
        .addKeymap(
            () => ({
                Enter: nextHeaderSlot,
                Tab: nextHeaderSlot,
                'Shift-Tab': previousHeaderSlot,
                Backspace: chainCommands(removeEmptyAction, unwrapHeader),
                'Mod-Enter': exitHeaderForward,
            }),
            builder.Priority.VeryHigh,
        );

    if (opts.headerKey) {
        const {headerKey} = opts;
        builder.addKeymap(() => ({[headerKey]: withLogAction('header', toHeader)}));
    }
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [headerAction]: Action;
        }
    }
}
