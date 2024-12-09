import {StoryObj} from '@storybook/react';

import {ActionName as Action} from '../../../src/bundle/config/action-names';
import {markupUndoAction, undoItem, wysiwygUndoAction} from '../../../src/modules/toolbars/items';
import {zero} from '../../../src/modules/toolbars/presets';

import {Toolbars as component} from './Toolbars';

export const Zero: StoryObj<typeof component> = {
    args: {preset: 'zero'},
};

export const CommonMark: StoryObj<typeof component> = {
    args: {preset: 'commonmark'},
};

// TODO: @makhnatkin
// export const Default: StoryObj<typeof component> = {
//     args: {preset: 'default'},
// };
//
// export const YFM: StoryObj<typeof component> = {
//     args: {preset: 'yfm'},
// };
//
// export const Full: StoryObj<typeof component> = {
//     args: {preset: 'full'},
// };

export const Custom: StoryObj<typeof component> = {
    args: {
        preset: {
            toolbarsNodes: {
                [Action.undo]: {
                    view: undoItem,
                    wysiwygAction: wysiwygUndoAction,
                    markupAction: markupUndoAction,
                },
            },
            toolbarsOrders: {
                wysiwygMain: [['undo']],
                markupMain: [['undo']],
            },
        },
    },
};

export const ComplecatedCustom: StoryObj<typeof component> = {
    args: {
        preset: {
            toolbarsNodes: {
                ...zero.toolbarsNodes,
            },
            toolbarsOrders: {
                wysiwygMain: [['undo']],
                markupMain: [['undo']],
            },
        },
    },
};

export const Additional: StoryObj<typeof component> = {
    args: {
        preset: 'zero',
    },
};

export default {
    component,
    title: 'Experiments / Toolbars',
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
