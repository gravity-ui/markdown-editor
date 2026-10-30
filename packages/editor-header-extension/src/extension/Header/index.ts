import type {Action, ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import type {HeaderDimensions} from '@gravity-ui/markdown-plugin-header';

import {headerSettingsPlugin} from './Settings';
import {insertHeader, setHeaderDimensions} from './commands';
import {headerNodeView} from './node-view';
import {HeaderSpecs, headerNodeName} from './specs';

import '@gravity-ui/markdown-plugin-header/styles.css';

export const Header: ExtensionAuto = (builder) => {
    builder
        .use(HeaderSpecs)
        .addNodeView(headerNodeName, () => headerNodeView)
        .addAction('insertHeader', () => ({isEnable: insertHeader, run: insertHeader}))
        .addAction('setHeaderDimensions', () => ({
            isEnable: setHeaderDimensions,
            run: setHeaderDimensions,
        }))
        .addPlugin(headerSettingsPlugin);
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            insertHeader: Action;
            setHeaderDimensions: Action<Partial<HeaderDimensions>>;
        }
    }
}
