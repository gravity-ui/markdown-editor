import type {StoryObj} from '@storybook/react';

import {PlaygroundMini as component} from '../../../components/PlaygroundMini';
import {args} from '../../../defaults/args';

export const Footnotes: StoryObj<typeof component> = {
    args: {
        ...args,
        initial:
            'The rate is 15%[*](*rate).\n\nA [selected phrase](*source) with a note.\n\nAnother reference[*](*rate).\n\n[*rate]: From 2026: **18%**, see [the report](https://example.com).\n\n[*source]: Source: `report-2025`.',
        settingsVisible: false,
        stickyToolbar: false,
    },
};

export default {title: 'Examples / Footnote', component};
