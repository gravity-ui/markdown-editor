import type {Meta, StoryObj} from '@storybook/react';

import {HeaderExample} from '../header/Header';
import {headerImagePreviewMarkup} from '../header/markup';

export default {
    title: 'Extensions / Landing / Header image',
    component: HeaderExample,
} satisfies Meta<typeof HeaderExample>;

/** The image in the text, then the images beside the text of headers. */
export const Preview: StoryObj<typeof HeaderExample> = {
    args: {mode: 'markup', preview: true, width: 1000, initial: headerImagePreviewMarkup},
};
