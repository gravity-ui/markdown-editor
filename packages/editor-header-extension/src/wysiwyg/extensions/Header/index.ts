import type {FileUploadHandler} from '@gravity-ui/markdown-editor';
import type {Action, ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {type HeaderUploadLimits, headerUploadPlugin} from '../../plugins/HeaderUploadPlugin';
import {HeaderContent} from '../HeaderContent';
import {HeaderTitle} from '../HeaderTitle';

import {WHeaderNodeView} from './HeaderNodeView';
import {HeaderSpecs, headerNodeName} from './HeaderSpecs';
import {insertHeader} from './commands';
import {insertHeaderAction} from './const';
import {headerKeymap, headerTooltipPlugin} from './plugins/HeaderTooltipPlugin';

import '@gravity-ui/markdown-plugin-header/styles.css';

export type HeaderOptions = HeaderUploadLimits & {
    /** Uploads background images; without it, the background image is set by a link only. */
    fileUploadHandler?: FileUploadHandler;
};

export const Header: ExtensionAuto<HeaderOptions> = (builder, options) => {
    builder
        .use(HeaderSpecs)
        .use(HeaderTitle)
        .use(HeaderContent)
        .addNodeView(headerNodeName, () => (node) => new WHeaderNodeView(node))
        .addPlugin((deps) => headerTooltipPlugin(deps, options))
        .addPlugin(headerUploadPlugin)
        .addAction(insertHeaderAction, () => ({isEnable: insertHeader, run: insertHeader}))
        // Blocks inside the header handle Tab first.
        .addKeymap(headerKeymap, builder.Priority.Low);
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [insertHeaderAction]: Action;
        }
    }
}
