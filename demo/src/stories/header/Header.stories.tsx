import type {Meta, StoryObj} from '@storybook/react';

import {HeaderExample} from './Header';
import {headerDescriptionMarkup} from './markup';

export default {
    title: 'Extensions / Landing / Header',
    component: HeaderExample,
} satisfies Meta<typeof HeaderExample>;
export const Header: StoryObj<typeof HeaderExample> = {};

export const Title: StoryObj<typeof HeaderExample> = {
    args: {
        initial: [
            ':::header{height="s" width="m"}',
            '::header-title[Team portal]',
            'Everything the team needs in one place.',
            ':::',
            ':::header{height="s" width="m"}',
            '::header-title[Release notes]{size="1" color="blue"}',
            ':::',
            ':::header{height="s" width="m"}',
            '::header-title[]',
            ':::',
        ].join('\n\n'),
    },
};

export const Description: StoryObj<typeof HeaderExample> = {
    args: {initial: headerDescriptionMarkup},
};
