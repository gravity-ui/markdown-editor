import type {Action, ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import type {HeaderTextColor, HeaderTitleSize} from '@gravity-ui/markdown-plugin-header';

import {
    type HeaderTextToggle,
    headerTitleSizeKeymap,
    setHeaderTitleColor,
    setHeaderTitleSize,
    toggleHeaderText,
} from './commands';

export const HeaderText: ExtensionAuto = (builder) => {
    builder
        .addAction('setHeaderTitleSize', () => ({
            isEnable: setHeaderTitleSize,
            run: setHeaderTitleSize,
        }))
        .addAction('setHeaderTitleColor', () => ({
            isEnable: setHeaderTitleColor,
            run: setHeaderTitleColor,
        }))
        .addAction('toggleHeaderText', () => ({isEnable: toggleHeaderText, run: toggleHeaderText}))
        .addKeymap(() => headerTitleSizeKeymap, builder.Priority.High);
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            setHeaderTitleSize: Action<{size: HeaderTitleSize}>;
            setHeaderTitleColor: Action<{color: HeaderTextColor}>;
            toggleHeaderText: Action<HeaderTextToggle>;
        }
    }
}
