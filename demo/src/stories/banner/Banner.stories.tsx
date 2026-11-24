import type {Meta, StoryObj} from '@storybook/react';

import {BannerExample} from './Banner';
import {bannerDescriptionMarkup} from './markup';

export default {
    title: 'Extensions / Landing / Banner',
    component: BannerExample,
} satisfies Meta<typeof BannerExample>;
export const Banner: StoryObj<typeof BannerExample> = {};

export const Title: StoryObj<typeof BannerExample> = {
    args: {
        initial: [
            ':::banner{height="s" width="m"}',
            '::banner-title[Team portal]',
            'Everything the team needs in one place.',
            ':::',
            ':::banner{height="s" width="m"}',
            '::banner-title[Release notes]{size="1" color="blue"}',
            ':::',
            ':::banner{height="s" width="m"}',
            '::banner-title[]',
            ':::',
        ].join('\n\n'),
    },
};

export const Description: StoryObj<typeof BannerExample> = {
    args: {initial: bannerDescriptionMarkup},
};

export const Image: StoryObj<typeof BannerExample> = {
    args: {
        initial: [
            ':::banner{height="s" width="s"}',
            '::banner-image{src="assets/banner-image-landscape.svg" alt="Team"}',
            'Everything the team needs in one place: the handbook and the release calendar.',
            ':::',
            ':::banner{height="s" width="s"}',
            '::banner-image',
            'A placeholder of an image without an address.',
            ':::',
            'After',
        ].join('\n\n'),
    },
};

const layoutBanner = (attrs: string, ...blocks: string[]) =>
    [`:::banner{height="s" width="full"${attrs}}`, ...blocks, ':::'].join('\n\n');

const layoutImage = '::banner-image{src="assets/banner-image-landscape.svg" alt="Team"}';
const layoutTitle = '::banner-title[Team portal]';
const layoutDescription = [
    ':::banner-content',
    'Everything the team needs in one place: the handbook and the release calendar.',
    ':::',
].join('\n\n');

export const Layout: StoryObj<typeof BannerExample> = {
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
