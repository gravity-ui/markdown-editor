import {chainCommands} from 'prosemirror-commands';

import type {Action, ExtensionAuto} from '#core';
import {withLogAction} from 'src/utils/keymap';
import type {FileUploadHandler} from 'src/utils/upload';

import {HeaderSpecs} from './HeaderSpecs';
import {
    exitHeaderForward,
    nextHeaderSlot,
    removeEmptyAction,
    toHeader,
    unwrapHeader,
} from './commands';
import {headerTooltipPlugin} from './plugins/HeaderTooltipPlugin';
import {headerActivePlugin} from './plugins/active';

import './index.scss';

export * from './HeaderSpecs';
export * from './commands';

const headerAction = 'toHeader';

export type HeaderOptions = {
    /**
     * Загрузчик картинки фона. Без него в тулбаре нет пункта загрузки, но ссылку в атрибуте
     * `image` по-прежнему можно задать из markdown.
     */
    fileUploadHandler?: FileUploadHandler;
    headerKey?: string | null;
};

export const Header: ExtensionAuto<HeaderOptions> = (builder, opts = {}) => {
    builder.use(HeaderSpecs);

    builder
        .addPlugin((deps) => headerTooltipPlugin(deps, {fileUploadHandler: opts.fileUploadHandler}))
        .addPlugin(headerActivePlugin)
        .addAction(headerAction, () => ({
            isEnable: toHeader,
            isActive: () => false,
            run: toHeader,
        }))
        // Высокий приоритет: Tab и Backspace иначе перехватывают списки, а Enter — базовый keymap
        .addKeymap(
            () => ({
                Enter: nextHeaderSlot,
                Tab: nextHeaderSlot,
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
