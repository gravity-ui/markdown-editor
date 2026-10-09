import type {StoryObj} from '@storybook/react';

import {PlaygroundMini as component} from '../../../components/PlaygroundMini';
import {args} from '../../../defaults/args';

export const Footnotes: StoryObj<typeof component> = {
    args: {
        ...args,
        initial:
            'The rate is 15%:footnote[From 2026: **18%**, see [the report](https://example.com).].\n\nA custom marker:footnote[Source: `report-2025`]{marker="*"}.\n\nAnother note:footnote[Automatically numbered.].',
        settingsVisible: false,
        stickyToolbar: false,
    },
};

export default {title: 'Examples / Footnote', component};
