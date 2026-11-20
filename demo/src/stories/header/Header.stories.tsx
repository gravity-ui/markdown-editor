import type {Meta, StoryObj} from '@storybook/react';

import {HeaderExample} from './Header';
import {headerDescriptionMarkup} from './markup';

export default {
    title: 'Extensions / Landing / Header',
    component: HeaderExample,
} satisfies Meta<typeof HeaderExample>;
export const Header: StoryObj<typeof HeaderExample> = {};
export const Description: StoryObj<typeof HeaderExample> = {
    args: {initial: headerDescriptionMarkup},
};
