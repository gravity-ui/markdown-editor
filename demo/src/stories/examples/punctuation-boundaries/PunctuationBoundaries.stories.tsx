import type {StoryObj} from '@storybook/react';

import {PlaygroundMini as component} from '../../../components/PlaygroundMini';
import {args} from '../../../defaults/args';
import {markup} from '../../markdown/markup';

export const Story: StoryObj<typeof component> = {
    args: {
        ...args,
        initial: markup.punctuationBoundaries,
        initialEditor: 'markup',
        initialSplitModeEnabled: true,
        splitModeOrientation: 'horizontal',
        stickyToolbar: false,
    },
};
Story.storyName = 'Punctuation boundaries';

export default {
    title: 'Examples / Punctuation boundaries',
    component,
};
