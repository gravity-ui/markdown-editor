import type {Action, ExtensionAuto} from '#core';
import {i18n} from 'src/i18n/header';
import type {FileUploadHandler} from 'src/utils/upload';

import {Button} from '../Button';

import {HeaderImageView} from './HeaderImageView';
import {HeaderSpecs} from './HeaderSpecs';
import {
    backspaceInHeader,
    createHeaderCommand,
    enterHeaderContent,
    exitHeaderForward,
} from './commands';
import {headerTooltipPlugin} from './plugins/HeaderTooltipPlugin';
import {headerEditingPlugin} from './plugins/editing';
import {headerImageUploadPlugin} from './plugins/imageUpload';

import './index.scss';

export * from './HeaderSpecs';
export * from './commands';
export {wHeaderItemData, headerItemView, headerItemWysiwyg} from './toolbar';

export type HeaderOptions = {
    fileUploadHandler?: FileUploadHandler;
    headerKey?: string | null;
};

const headerAction = 'toHeader';

export const Header: ExtensionAuto<HeaderOptions> = (builder, opts) => {
    builder.use(HeaderSpecs, {
        titlePlaceholder: () => i18n('placeholder'),
        contentPlaceholder: () => i18n('description_placeholder'),
    });
    builder.use(Button);
    builder.addNodeView(
        'header_image',
        () => (node, view, getPos) =>
            new HeaderImageView(node, view, getPos, opts.fileUploadHandler),
    );
    builder.addPlugin(headerImageUploadPlugin);
    builder.addPlugin(headerEditingPlugin);
    const toHeader = createHeaderCommand(() => i18n('action'));

    builder.addPlugin(({serializer}) => headerTooltipPlugin(opts.fileUploadHandler, serializer));

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
