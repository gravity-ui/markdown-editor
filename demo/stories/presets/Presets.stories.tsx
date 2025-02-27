import type {StoryObj} from '@storybook/react';

import {ActionName as Action} from 'src/bundle/config/action-names';
import {ToolbarName as Toolbar} from 'src/modules/toolbars/constants';
import {
    boldItemView,
    boldItemWysiwyg,
    colorifyItemMarkup,
    colorifyItemView,
    colorifyItemWysiwyg,
    italicItemMarkup,
    italicItemView,
    redoItemMarkup,
    redoItemView,
    redoItemWysiwyg,
    undoItemMarkup,
    undoItemView,
    undoItemWysiwyg,
} from 'src/modules/toolbars/items';

import {Preset as component} from './Preset';

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
        toolbarsPreset: {
            items: {
                [Action.undo]: {
                    view: undoItemView,
                    wysiwyg: undoItemWysiwyg,
                    markup: undoItemMarkup,
                },
                [Action.redo]: {
                    view: redoItemView,
                    wysiwyg: redoItemWysiwyg,
                    markup: redoItemMarkup,
                },
                [Action.bold]: {
                    view: boldItemView,
                    wysiwyg: boldItemWysiwyg,
                },
                [Action.italic]: {
                    view: italicItemView,
                    markup: italicItemMarkup,
                },
                [Action.colorify]: {
                    view: colorifyItemView,
                    wysiwyg: colorifyItemWysiwyg,
                    markup: colorifyItemMarkup,
                },
            },
            orders: {
                [Toolbar.wysiwygMain]: [
                    [Action.colorify],
                    [Action.bold],
                    [Action.undo, Action.redo],
                ],
                [Toolbar.markupMain]: [
                    [Action.colorify],
                    [Action.italic],
                    [Action.undo, Action.redo],
                ],
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
