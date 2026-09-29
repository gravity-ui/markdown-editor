import type {StoryObj} from '@storybook/react';

import {TableCellSelectionDemo as component} from './TableCellSelection';
import {mergedAndNestedMarkup} from './markup';

export const BothTables: StoryObj<typeof component> = {
    args: {theme: 'light', controls: true},
};

export const WithoutYfmControls: StoryObj<typeof component> = {
    args: {theme: 'light', controls: false},
};

export const MergedAndNested: StoryObj<typeof component> = {
    args: {theme: 'light', controls: true, initialMarkup: mergedAndNestedMarkup},
};

export default {
    title: 'Examples / Table cell selection',
    component,
};
