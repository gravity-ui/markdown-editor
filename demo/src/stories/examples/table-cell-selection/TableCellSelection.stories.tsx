import type {StoryObj} from '@storybook/react';

import {TableCellSelectionDemo as component} from './TableCellSelection';
import {clipboardMarkup, mergedAndNestedMarkup} from './markup';

export const BothTables: StoryObj<typeof component> = {};

export const WithoutYfmControls: StoryObj<typeof component> = {
    args: {controls: false},
};

export const WithoutCellBackground: StoryObj<typeof component> = {
    args: {cellBackground: false},
};

export const ScrollContainer: StoryObj<typeof component> = {
    args: {scrollHeight: 300, viewWidth: 640},
};

export const MergedAndNested: StoryObj<typeof component> = {
    args: {initialMarkup: mergedAndNestedMarkup},
};

export const Clipboard: StoryObj<typeof component> = {
    args: {initialMarkup: clipboardMarkup},
};

export default {
    title: 'Examples / Table cell selection',
    component,
    args: {controls: true, cellBackground: true, enabled: true},
    parameters: {controls: {include: ['controls', 'cellBackground']}},
};
