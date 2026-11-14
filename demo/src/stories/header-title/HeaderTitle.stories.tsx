import type {Meta, StoryObj} from '@storybook/react';

import {HeaderExample} from '../header/Header';
import {headerTitlePreviewMarkup} from '../header/markup';

export default {
    title: 'Extensions / Landing / Header title',
    component: HeaderExample,
} satisfies Meta<typeof HeaderExample>;

/** Every size and color of the title in the text, then the titles inside headers. */
export const Preview: StoryObj<typeof HeaderExample> = {
    args: {mode: 'markup', preview: true, width: 1000, initial: headerTitlePreviewMarkup},
};
