import type {Meta, StoryObj} from '@storybook/react';

import {HeaderExample} from '../header/Header';
import {headerContentPreviewMarkup} from '../header/markup';

export default {
    title: 'Extensions / Landing / Header content',
    component: HeaderExample,
} satisfies Meta<typeof HeaderExample>;

/** Every size of the description in the text, then the descriptions inside headers. */
export const Preview: StoryObj<typeof HeaderExample> = {
    args: {mode: 'markup', preview: true, width: 1000, initial: headerContentPreviewMarkup},
};
