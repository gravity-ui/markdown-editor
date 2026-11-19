import type {StoryObj} from '@storybook/react';

import {TableCellSelectionDemo as component} from './TableCellSelection';
import {clipboardMarkup, mergedAndNestedMarkup} from './markup';

export const BothTables: StoryObj<typeof component> = {
    args: {controls: true},
};

export const WithoutYfmControls: StoryObj<typeof component> = {
    args: {controls: false},
};

export const MergedAndNested: StoryObj<typeof component> = {
    args: {controls: true, initialMarkup: mergedAndNestedMarkup},
};

export const Clipboard: StoryObj<typeof component> = {
    args: {controls: true, initialMarkup: clipboardMarkup},
};

export default {
    title: 'Examples / Table cell selection',
    component,
};
