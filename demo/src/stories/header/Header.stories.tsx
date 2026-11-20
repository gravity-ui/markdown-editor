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

export const Image: StoryObj<typeof HeaderExample> = {
    args: {
        initial: [
            ':::header{height="s" width="s"}',
            '::header-image{src="assets/header-image-landscape.svg" alt="Team"}',
            'Everything the team needs in one place: the handbook and the release calendar.',
            ':::',
            ':::header{height="s" width="s"}',
            '::header-image',
            'A placeholder of an image without an address.',
            ':::',
            'After',
        ].join('\n\n'),
    },
};

const layoutBanner = (attrs: string, ...blocks: string[]) =>
    [`:::header{height="s" width="full"${attrs}}`, ...blocks, ':::'].join('\n\n');

const layoutImage = '::header-image{src="assets/header-image-landscape.svg" alt="Team"}';
const layoutTitle = '::header-title[Team portal]';
const layoutDescription = [
    ':::header-content',
    'Everything the team needs in one place: the handbook and the release calendar.',
    ':::',
].join('\n\n');

export const Layout: StoryObj<typeof HeaderExample> = {
    args: {
        initial: [
            layoutBanner('', layoutImage, layoutTitle, layoutDescription),
            layoutBanner(' align="center" vertical="top"', layoutTitle, layoutDescription),
            layoutBanner(
                ' align="right" vertical="bottom"',
                layoutImage,
                layoutTitle,
                layoutDescription,
            ),
            layoutBanner(' align="right"', layoutDescription, layoutTitle, layoutImage),
            layoutBanner('', layoutImage),
            'After',
        ].join('\n\n'),
    },
};
