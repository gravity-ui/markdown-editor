import {
    textContextItemData,
    wBoldItemData,
    wHeading1ItemData,
    wHeading2ItemData,
    wItalicItemData,
    wTextItemData,
    wToggleHeadingFoldingItemData,
} from '@gravity-ui/markdown-editor';
import type {StoryObj} from '@storybook/react';

import {Preset as component} from './Preset';
import {toolbarPresets} from './presets';

const {custom} = toolbarPresets;

export const Zero: StoryObj<typeof component> = {
    args: {preset: 'zero'},
};

export const CommonMark: StoryObj<typeof component> = {
    args: {preset: 'commonmark'},
};

export const Default: StoryObj<typeof component> = {
    args: {preset: 'default'},
};

export const YFM: StoryObj<typeof component> = {
    args: {preset: 'yfm'},
};

export const Full: StoryObj<typeof component> = {
    args: {preset: 'full'},
};

export const Custom: StoryObj<typeof component> = {
    args: {
        toolbarsPreset: custom,
        wysiwygConfig: {
            extensionOptions: {
                commandMenu: {
                    actions: [wTextItemData, wHeading1ItemData, wHeading2ItemData],
                },
                selectionContext: {
                    config: [
                        [wToggleHeadingFoldingItemData, textContextItemData],
                        [wBoldItemData, wItalicItemData],
                    ],
                },
            },
        },
    },
};

export default {
    component,
    title: 'Extensions / Presets',
    args: {
        settingsVisible: true,
        allowHTML: true,
        breaks: true,
        linkify: true,
        linkifyTlds: [],
        splitModeOrientation: 'horizontal',
        stickyToolbar: true,
        height: 'initial',
    },
    parameters: {controls: {exclude: ['preset']}},
};
