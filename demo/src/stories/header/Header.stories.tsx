import type {Meta, StoryObj} from '@storybook/react';

import {HeaderExample} from './Header';

export default {
    title: 'Extensions / Landing / Header',
    component: HeaderExample,
} satisfies Meta<typeof HeaderExample>;
export const Header: StoryObj<typeof HeaderExample> = {
    args: {
        initial: [
            ':::header{height="m" width="m"}',
            '',
            ':::header-title',
            'Team portal',
            ':::',
            '',
            ':::header-content',
            'Everything the team needs to start working: guides, contacts and schedules.',
            '',
            'Updated **every week**.',
            ':::',
            '',
            ':::',
            '',
            'After',
        ].join('\n'),
    },
};
